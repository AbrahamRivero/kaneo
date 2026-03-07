import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import eventRoomController from "./controllers/event-room";
import reservationController from "./controllers/reservation";

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

    const reservations = await reservationController.getReservations(
      workspaceId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
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
        clientName: z.string(),
        companyName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        adultPax: z.number(),
        childrenPax: z.number(),
        notes: z.string().optional(),
        coffeeBreak: z.boolean().optional(),
        lunch: z.boolean().optional(),
        cocktail: z.boolean().optional(),
        canapes: z.boolean().optional(),
        openBar: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const body = c.req.valid("json");
      const reservation = await reservationController.createReservation(
        userId,
        {
          ...body,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
        },
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
        clientName: z.string().optional(),
        companyName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        adultPax: z.number().optional(),
        childrenPax: z.number().optional(),
        notes: z.string().optional(),
        paymentConfirmed: z.boolean().optional(),
        coffeeBreak: z.boolean().optional(),
        lunch: z.boolean().optional(),
        cocktail: z.boolean().optional(),
        canapes: z.boolean().optional(),
        openBar: z.boolean().optional(),
        status: z
          .enum(["pending", "confirmed", "cancelled", "completed"])
          .optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const body = c.req.valid("json");

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const payload: any = { ...body };
      if (body.startDate) payload.startDate = new Date(body.startDate);
      if (body.endDate) payload.endDate = new Date(body.endDate);

      const reservation = await reservationController.updateReservation(
        userId,
        id,
        payload,
      );
      return c.json(reservation);
    },
  )

  .delete("/reservations/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const result = await reservationController.deleteReservation(userId, id);
    return c.json(result);
  });

export default eventRoom;
