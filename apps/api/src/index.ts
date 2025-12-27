import { serve } from "@hono/node-server";
import type { Session, User } from "better-auth/types";
import { Cron } from "croner";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import activity from "./activity";
import { auth } from "./auth";
import config from "./config";
import db from "./database";
import githubIntegration from "./github-integration";
import label from "./label";

import notification from "./notification";
import project from "./project";
import { getPublicProject } from "./project/controllers/get-public-project";
import search from "./search";
import task from "./task";
import timeEntry from "./time-entry";
import getSettings from "./utils/get-settings";
import purgeDemoData from "./utils/purge-demo-data";
import workspace from "./workspace";
import workspaceUser from "./workspace-user";
import activatePendingWorkspaceUsers from "./workspace-user/controllers/activate-pending-workspace-users";

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

app.on(["POST", "GET", "PUT", "DELETE"], "/api/auth/*", (c) =>
  auth.handler(c.req.raw),
);

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

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user || null);
  c.set("session", session?.session || null);
  c.set("userId", session?.user?.id || "");

  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  // Activar todos los workspace users pendientes cuando el usuario inicia sesión
  // Solo se ejecuta una vez por sesión
  if (session?.user?.id && !activatedUsers.has(session.user.id)) {
    activatedUsers.add(session.user.id);
    // Ejecutar de forma asíncrona para no bloquear la respuesta
    activatePendingWorkspaceUsers(session.user.id)
      .then(() => {
        // Remover del cache después de 5 minutos para permitir reactivación si es necesario
        setTimeout(() => {
          activatedUsers.delete(session.user.id);
        }, 5 * 60 * 1000);
      })
      .catch((error) => {
        activatedUsers.delete(session.user.id);
        console.error("Error activating pending workspace users:", error);
      });
  }

  return next();
});

if (isDemoMode) {
  new Cron("0 * * * *", async () => {
    await purgeDemoData();
  });
}

const workspaceRoute = app.route("/workspace", workspace);
const workspaceUserRoute = app.route("/workspace-user", workspaceUser);
const projectRoute = app.route("/project", project);
const taskRoute = app.route("/task", task);
const activityRoute = app.route("/activity", activity);
const timeEntryRoute = app.route("/time-entry", timeEntry);
const labelRoute = app.route("/label", label);
const notificationRoute = app.route("/notification", notification);
const searchRoute = app.route("/search", search);

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
  | typeof configRoute;

export default app;
