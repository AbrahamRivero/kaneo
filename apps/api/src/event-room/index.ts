import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import eventRoomController from "./controllers/event-room";
import * as gastronomicServiceController from "./controllers/gastronomic-service";
import reservationController from "./controllers/reservation";
import * as roomTariffController from "./controllers/room-tariff";

const eventRoom = new Hono<{
  Variables: {
    userId: string;
  };
}>()

  .get("/:workspaceId/rooms", async (c) => {
    const workspaceId = c.req.param("workspaceId");
    const rooms = await eventRoomController.getEventRooms(workspaceId);
    return c.json(rooms);
  })

  .post(
    "/rooms",
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        name: z.string(),
        capacity: z.number(),
        description: z.string().optional(),
        allowsMultipleReservations: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const body = c.req.valid("json");
      const room = await eventRoomController.createEventRoom(userId, body);
      return c.json(room);
    },
  )

  .get("/rooms/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const room = await eventRoomController.getEventRoom(userId, id);
    return c.json(room);
  })

  .put(
    "/rooms/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        capacity: z.number().optional(),
        description: z.string().optional(),
        allowsMultipleReservations: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const room = await eventRoomController.updateEventRoom(userId, id, body);
      return c.json(room);
    },
  )

  .delete("/rooms/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const result = await eventRoomController.deleteEventRoom(userId, id);
    return c.json(result);
  })

  .get("/:workspaceId/reservations", async (c) => {
    const workspaceId = c.req.param("workspaceId");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");
    const eventRoomId = c.req.query("eventRoomId");

    const reservations = await reservationController.getReservations(
      workspaceId,
      startDate,
      endDate,
      eventRoomId,
    );
    return c.json(reservations);
  })

  .post(
    "/reservations",
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        eventRoomId: z.string(),
        title: z.string().optional(),
        clientName: z.string(),
        companyName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        dateRange: z.object({
          from: z.string(),
          to: z.string().optional(),
        }),
        notes: z.string().optional(),
        roomTariffId: z.string().optional(),
        totalRoomPrice: z.number().optional(),
        totalServicePrice: z.number().optional(),
        serviceChargeAmount: z.number().optional(),
        grandTotal: z.number().optional(),
        services: z
          .array(
            z.object({
              serviceId: z.string(),
              pax: z.number(),
              unitPrice: z.number(),
              totalPrice: z.number(),
            }),
          )
          .optional(),
        dayTariffs: z
          .array(
            z.object({
              date: z.string(),
              roomTariffId: z.string().optional(),
              price: z.number(),
            }),
          )
          .optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const body = c.req.valid("json");
      const reservation = await reservationController.createReservation(
        userId,
        body,
      );
      return c.json(reservation);
    },
  )

  .get("/reservations/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const reservation = await reservationController.getReservation(userId, id);
    return c.json(reservation);
  })

  .put(
    "/reservations/:id",
    zValidator(
      "json",
      z.object({
        eventRoomId: z.string().optional(),
        title: z.string().optional(),
        clientName: z.string().optional(),
        companyName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        dateRange: z
          .object({
            from: z.string(),
            to: z.string().optional(),
          })
          .optional(),
        notes: z.string().optional(),
        paymentConfirmed: z.boolean().optional(),
        roomTariffId: z.string().optional(),
        totalRoomPrice: z.number().optional(),
        totalServicePrice: z.number().optional(),
        serviceChargeAmount: z.number().optional(),
        grandTotal: z.number().optional(),
        services: z
          .array(
            z.object({
              serviceId: z.string(),
              pax: z.number(),
              unitPrice: z.number(),
              totalPrice: z.number(),
            }),
          )
          .optional(),
        dayTariffs: z
          .array(
            z.object({
              date: z.string(),
              roomTariffId: z.string().optional(),
              price: z.number(),
            }),
          )
          .optional(),
        status: z.enum(["pending", "confirmed", "completed"]).optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const reservation = await reservationController.updateReservation(
        userId,
        id,
        body,
      );
      return c.json(reservation);
    },
  )

  .delete("/reservations/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const result = await reservationController.deleteReservation(userId, id);
    return c.json(result);
  })

  .get("/:workspaceId/gastronomic-services", async (c) => {
    const workspaceId = c.req.param("workspaceId");
    const userId = c.get("userId");
    const page = c.req.query("page");
    const limit = c.req.query("limit");
    const services = await gastronomicServiceController.getGastronomicServices(
      workspaceId,
      userId,
      page ? Number.parseInt(page) : undefined,
      limit ? Number.parseInt(limit) : undefined,
    );
    return c.json(services);
  })

  .post(
    "/gastronomic-services",
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        name: z.string(),
        pricePerPax: z.number(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const body = c.req.valid("json");
      const service =
        await gastronomicServiceController.createGastronomicService(
          userId,
          body,
        );
      return c.json(service);
    },
  )

  .get("/gastronomic-services/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const service =
      await gastronomicServiceController.getGastronomicServiceById(userId, id);
    return c.json(service);
  })

  .put(
    "/gastronomic-services/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        pricePerPax: z.number().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const service =
        await gastronomicServiceController.updateGastronomicService(
          userId,
          id,
          body,
        );
      return c.json(service);
    },
  )

  .delete("/gastronomic-services/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const result = await gastronomicServiceController.deleteGastronomicService(
      userId,
      id,
    );
    return c.json(result);
  })

  .get("/:workspaceId/room-tariffs", async (c) => {
    const workspaceId = c.req.param("workspaceId");
    const userId = c.get("userId");
    const page = c.req.query("page");
    const limit = c.req.query("limit");
    const tariffs = await roomTariffController.getRoomTariffs(
      workspaceId,
      userId,
      page ? Number.parseInt(page) : undefined,
      limit ? Number.parseInt(limit) : undefined,
    );
    return c.json(tariffs);
  })

  .post(
    "/room-tariffs",
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        eventRoomId: z.string(),
        sessionType: z.enum([
          "half_session",
          "full_session",
          "social_event",
          "flat",
        ]),
        price: z.number(),
        serviceChargePercent: z.number().optional(),
        modificationCharge: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const body = c.req.valid("json");
      const tariff = await roomTariffController.createRoomTariff(userId, body);
      return c.json(tariff);
    },
  )

  .get("/room-tariffs/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const tariff = await roomTariffController.getRoomTariffById(userId, id);
    return c.json(tariff);
  })

  .put(
    "/room-tariffs/:id",
    zValidator(
      "json",
      z.object({
        eventRoomId: z.string().optional(),
        sessionType: z
          .enum(["half_session", "full_session", "social_event", "flat"])
          .optional(),
        price: z.number().optional(),
        serviceChargePercent: z.number().optional(),
        modificationCharge: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const tariff = await roomTariffController.updateRoomTariff(
        userId,
        id,
        body,
      );
      return c.json(tariff);
    },
  )

  .delete("/room-tariffs/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const result = await roomTariffController.deleteRoomTariff(userId, id);
    return c.json(result);
  });

export default eventRoom;
