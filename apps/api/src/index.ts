import { serve } from "@hono/node-server";
import type { Session, User } from "better-auth/types";
import { Cron } from "croner";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import activity from "./activity";
import analytics from "./analytics/route";
import { auth } from "./auth";
import config from "./config";
import db from "./database";
import eventRoom from "./event-room";
import {
  checkAndNotifyUnpaidReservations,
  formatCurrency,
  getDateRangeFromString,
} from "./event-room/services/check-unpaid-reservations";
import { publishEvent } from "./events";
import githubIntegration from "./github-integration";
import label from "./label";
import notification from "./notification";
import createNotification from "./notification/controllers/create-notification";
import project from "./project";
import { getPublicProject } from "./project/controllers/get-public-project";
import search from "./search";
import task from "./task";
import timeEntry from "./time-entry";
import user from "./user";
import getSettings from "./utils/get-settings";
import purgeDemoData from "./utils/purge-demo-data";
import workspace from "./workspace";
import workspaceUser from "./workspace-user";
import activatePendingWorkspaceUsers from "./workspace-user/controllers/activate-pending-workspace-users";
import getActiveWorkspaceUsers from "./workspace-user/controllers/get-active-workspace-users";

const app = new Hono<{
  Variables: {
    user: User | null;
    session: Session | null;
    userId: string;
  };
}>();

const { isDemoMode } = getSettings();

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : undefined;

app.use(
  "*",
  cors({
    credentials: true,
    origin: (origin) => {
      if (!corsOrigins) {
        return origin || "*";
      }

      if (!origin) {
        return null;
      }

      return corsOrigins.includes(origin) ? origin : null;
    },
  }),
);

const configRoute = app.route("/config", config);

const githubIntegrationRoute = app.route(
  "/github-integration",
  githubIntegration,
);

const publicProjectRoute = app.get("/public-project/:id", async (c) => {
  const { id } = c.req.param();
  const project = await getPublicProject(id);

  return c.json(project);
});

app.on(["POST", "GET", "PUT", "DELETE"], "/api/auth/*", async (c) => {
  const resp = await auth.handler(c.req.raw);

  // If this was a signup request and the auth handler succeeded, try to publish a signup event
  try {
    if (c.req.method === "POST" && resp && resp.ok) {
      const body = await resp
        .clone()
        .json()
        .catch(() => null);
      const email = body?.user?.email || body?.email || body?.data?.email;

      if (email) {
        // notify other parts of the system that a user signed up or signed in
        if (c.req.path.endsWith("/signup")) {
          publishEvent("user.signed_up", { email }).catch((err) => {
            console.error("Failed to publish user.signed_up event:", err);
          });
        } else if (c.req.path.includes("/signin")) {
          publishEvent("user.signed_in", { email }).catch((err) => {
            console.error("Failed to publish user.signed_in event:", err);
          });
        }
      }
    }
  } catch (err) {
    console.error("Error while handling signup event publishing:", err);
  }

  return resp;
});

// Cache para evitar activar múltiples veces en la misma sesión
const activatedUsers = new Set<string>();

app.use("*", async (c, next) => {
  // Excluir rutas públicas del middleware de autenticación
  if (
    c.req.path.startsWith("/api/auth") ||
    c.req.path.startsWith("/config") ||
    c.req.path.startsWith("/public-project")
  ) {
    return next();
  }

  // Log request path for debugging activation on login
  console.log("auth middleware: path=", c.req.path, "method=", c.req.method);

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  console.log(
    "auth middleware: session present=",
    !!session,
    "user=",
    session?.user,
  );

  c.set("user", session?.user || null);
  c.set("session", session?.session || null);
  c.set("userId", session?.user?.id || "");

  if (!session?.user) {
    console.log("auth middleware: no session user, throwing 401");
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  // Activar todos los workspace users pendientes cuando el usuario inicia sesión
  // Solo se ejecuta una vez por sesión
  const userId = session.user.id;
  if (userId) {
    if (activatedUsers.has(userId)) {
      console.log(
        "auth middleware: skip activation, already activated in cache for userId=",
        userId,
      );
    } else {
      console.log("auth middleware: scheduling activation for userId=", userId);
      activatedUsers.add(userId);
      // Ejecutar de forma asíncrona para no bloquear la respuesta
      activatePendingWorkspaceUsers(userId)
        .then((res) => {
          console.log(
            "auth middleware: activation finished for userId=",
            userId,
            "resultCount=",
            Array.isArray(res) ? res.length : String(res),
          );
          // Remover del cache después de 5 minutos para permitir reactivación si es necesario
          setTimeout(
            () => {
              activatedUsers.delete(userId);
              console.log(
                "auth middleware: removed user from activation cache userId=",
                userId,
              );
            },
            5 * 60 * 1000,
          );
        })
        .catch((error) => {
          activatedUsers.delete(userId);
          console.error("Error activating pending workspace users:", error);
        });
    }
  } else {
    console.log("auth middleware: session user has no id");
  }

  return next();
});

if (isDemoMode) {
  new Cron("0 * * * *", async () => {
    await purgeDemoData();
  });
}

new Cron("0 9 * * *", async () => {
  console.log("[CRON] Checking unpaid reservations at 9:00 AM...");
  try {
    const unpaidReservations = await checkAndNotifyUnpaidReservations();

    const uniqueById = Array.from(
      new Map(unpaidReservations.map((r) => [r.id, r])).values(),
    );

    for (const reservation of uniqueById) {
      const dateRange = getDateRangeFromString(reservation.dateRange);
      const dateFormatted =
        dateRange.from === dateRange.to
          ? dateRange.from
          : dateRange.from + " - " + dateRange.to;

      const workspaceUsers = await getActiveWorkspaceUsers(
        reservation.workspaceId,
      );

      const daysUntilStart = reservation.daysUntilStart;
      const currentDay = reservation.currentDay;
      const totalDays = reservation.totalEventDays;

      let dayDescription: string;
      if (daysUntilStart > 0) {
        dayDescription =
          "Faltan " + daysUntilStart + " día" + (daysUntilStart > 1 ? "s" : "");
      } else if (daysUntilStart === 0) {
        dayDescription = "Hoy inicia";
      } else {
        dayDescription = "Día " + currentDay + " de " + totalDays;
      }

      const titlePrefix = reservation.title ? reservation.title + " - " : "";

      const notificationTitle =
        "Reserva sin pagar: " + titlePrefix + dayDescription;

      const companyPart = reservation.companyName
        ? " (" + reservation.companyName + ")"
        : "";
      const notificationContent =
        "Cliente: " +
        reservation.clientName +
        companyPart +
        "\nFecha: " +
        dateFormatted +
        "\nMonto: " +
        formatCurrency(reservation.grandTotal) +
        "\nEspacio: " +
        reservation.eventRoomName;

      const promises = workspaceUsers.map((user) =>
        createNotification({
          userId: user.userId,
          title: notificationTitle,
          content: notificationContent,
          type: "reservation_unpaid_reminder",
          resourceId: reservation.id,
          resourceType: "reservation",
        }),
      );
      await Promise.all(promises);

      console.log(
        "[CRON] Notified " +
          workspaceUsers.length +
          " users about unpaid reservation " +
          reservation.id,
      );
    }

    console.log(
      "[CRON] Processed " + uniqueById.length + " unpaid reservations",
    );
  } catch (error) {
    console.error("[CRON] Error checking unpaid reservations:", error);
  }
});

new Cron("0 12 * * *", async () => {
  console.log("[CRON] TEST - Checking unpaid reservations at 12:00 PM...");
  try {
    const unpaidReservations = await checkAndNotifyUnpaidReservations();

    const uniqueById = Array.from(
      new Map(unpaidReservations.map((r) => [r.id, r])).values(),
    );

    console.log(
      "[CRON] TEST - Found " + uniqueById.length + " unpaid reservations",
    );

    for (const reservation of uniqueById) {
      const dateRange = getDateRangeFromString(reservation.dateRange);
      const dateFormatted =
        dateRange.from === dateRange.to
          ? dateRange.from
          : dateRange.from + " - " + dateRange.to;

      const workspaceUsers = await getActiveWorkspaceUsers(
        reservation.workspaceId,
      );

      const daysUntilStart = reservation.daysUntilStart;
      const currentDay = reservation.currentDay;
      const totalDays = reservation.totalEventDays;

      let dayDescription: string;
      if (daysUntilStart > 0) {
        dayDescription =
          "Faltan " + daysUntilStart + " día" + (daysUntilStart > 1 ? "s" : "");
      } else if (daysUntilStart === 0) {
        dayDescription = "Hoy inicia";
      } else {
        dayDescription = "Día " + currentDay + " de " + totalDays;
      }

      const titlePrefix = reservation.title ? reservation.title + " - " : "";

      const notificationTitle =
        "Reserva sin pagar: " + titlePrefix + dayDescription;

      const companyPart = reservation.companyName
        ? " (" + reservation.companyName + ")"
        : "";
      const notificationContent =
        "Cliente: " +
        reservation.clientName +
        companyPart +
        "\nFecha: " +
        dateFormatted +
        "\nMonto: " +
        formatCurrency(reservation.grandTotal) +
        "\nEspacio: " +
        reservation.eventRoomName;

      const promises = workspaceUsers.map((user) =>
        createNotification({
          userId: user.userId,
          title: notificationTitle,
          content: notificationContent,
          type: "reservation_unpaid_reminder",
          resourceId: reservation.id,
          resourceType: "reservation",
        }),
      );
      await Promise.all(promises);

      console.log(
        "[CRON] TEST - Notified " +
          workspaceUsers.length +
          " users about unpaid reservation " +
          reservation.id,
      );
    }

    console.log(
      "[CRON] TEST - Processed " + uniqueById.length + " unpaid reservations",
    );
  } catch (error) {
    console.error("[CRON] TEST - Error checking unpaid reservations:", error);
  }
});

new Cron("0 16 * * *", async () => {
  console.log("[CRON] Checking unpaid reservations at 4:00 PM...");
  try {
    const unpaidReservations = await checkAndNotifyUnpaidReservations();

    const uniqueById = Array.from(
      new Map(unpaidReservations.map((r) => [r.id, r])).values(),
    );

    for (const reservation of uniqueById) {
      const dateRange = getDateRangeFromString(reservation.dateRange);
      const dateFormatted =
        dateRange.from === dateRange.to
          ? dateRange.from
          : dateRange.from + " - " + dateRange.to;

      const workspaceUsers = await getActiveWorkspaceUsers(
        reservation.workspaceId,
      );

      const daysUntilStart = reservation.daysUntilStart;
      const currentDay = reservation.currentDay;
      const totalDays = reservation.totalEventDays;

      let dayDescription: string;
      if (daysUntilStart > 0) {
        dayDescription =
          "Faltan " + daysUntilStart + " día" + (daysUntilStart > 1 ? "s" : "");
      } else if (daysUntilStart === 0) {
        dayDescription = "Hoy inicia";
      } else {
        dayDescription = "Día " + currentDay + " de " + totalDays;
      }

      const titlePrefix = reservation.title ? reservation.title + " - " : "";

      const notificationTitle =
        "Reserva sin pagar: " + titlePrefix + dayDescription;

      const companyPart = reservation.companyName
        ? " (" + reservation.companyName + ")"
        : "";
      const notificationContent =
        "Cliente: " +
        reservation.clientName +
        companyPart +
        "\nFecha: " +
        dateFormatted +
        "\nMonto: " +
        formatCurrency(reservation.grandTotal) +
        "\nEspacio: " +
        reservation.eventRoomName;

      const promises = workspaceUsers.map((user) =>
        createNotification({
          userId: user.userId,
          title: notificationTitle,
          content: notificationContent,
          type: "reservation_unpaid_reminder",
          resourceId: reservation.id,
          resourceType: "reservation",
        }),
      );
      await Promise.all(promises);

      console.log(
        "[CRON] Notified " +
          workspaceUsers.length +
          " users about unpaid reservation " +
          reservation.id,
      );
    }

    console.log(
      "[CRON] Processed " + uniqueById.length + " unpaid reservations",
    );
  } catch (error) {
    console.error("[CRON] Error checking unpaid reservations:", error);
  }
});

const workspaceRoute = app.route("/workspace", workspace);
const workspaceUserRoute = app.route("/workspace-user", workspaceUser);
const userRoute = app.route("/user", user);
const projectRoute = app.route("/project", project);
const taskRoute = app.route("/task", task);
const activityRoute = app.route("/activity", activity);
const timeEntryRoute = app.route("/time-entry", timeEntry);
const labelRoute = app.route("/label", label);
const notificationRoute = app.route("/notification", notification);
const searchRoute = app.route("/search", search);
const analyticsRoute = app.route("/analytics", analytics);
const eventRoomRoute = app.route("/event-room", eventRoom);

try {
  console.log("Migrating database...");
  migrate(db, {
    migrationsFolder: `${process.cwd()}/drizzle`,
  });
} catch (error) {
  console.error(error);
}

serve(
  {
    fetch: app.fetch,
    port: 1337,
  },
  (info) => {
    console.log(`🏃 Hono API is running at http://localhost:${info.port}`);
  },
);

export type AppType =
  | typeof workspaceRoute
  | typeof workspaceUserRoute
  | typeof projectRoute
  | typeof taskRoute
  | typeof activityRoute
  | typeof timeEntryRoute
  | typeof labelRoute
  | typeof notificationRoute
  | typeof searchRoute
  | typeof publicProjectRoute
  | typeof githubIntegrationRoute
  | typeof configRoute
  | typeof userRoute
  | typeof analyticsRoute
  | typeof eventRoomRoute;

export default app;
