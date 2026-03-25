import { and, count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  gastronomicServiceTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";

export type CreateGastronomicServicePayload = {
  workspaceId: string;
  name: string;
  pricePerPax: number;
  description?: string;
  isActive?: boolean;
};

export type UpdateGastronomicServicePayload = {
  name?: string;
  pricePerPax?: number;
  description?: string;
  isActive?: boolean;
};

export type GastronomicServiceWithMaskedPrice = {
  id: string;
  workspaceId: string;
  name: string;
  pricePerPax: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function maskPrice(
  service: typeof gastronomicServiceTable.$inferSelect,
  isViewer: boolean,
): GastronomicServiceWithMaskedPrice {
  if (isViewer) {
    return {
      ...service,
      pricePerPax: null,
    };
  }
  return {
    ...service,
    pricePerPax: service.pricePerPax,
  };
}

export interface PaginatedGastronomicServices {
  data: ReturnType<typeof maskPrice>[];
  total: number;
  page: number;
  limit: number;
}

export async function getGastronomicServices(
  workspaceId: string,
  userId?: string,
  page = 1,
  limit = 10,
): Promise<PaginatedGastronomicServices> {
  let isViewer = false;

  if (userId) {
    const [workspace] = await db
      .select({ ownerId: workspaceTable.ownerId })
      .from(workspaceTable)
      .where(eq(workspaceTable.id, workspaceId))
      .limit(1);

    if (workspace && workspace.ownerId !== userId) {
      const [member] = await db
        .select({ role: workspaceUserTable.role })
        .from(workspaceUserTable)
        .where(
          and(
            eq(workspaceUserTable.workspaceId, workspaceId),
            eq(workspaceUserTable.userId, userId),
            eq(workspaceUserTable.status, "active"),
          ),
        )
        .limit(1);

      isViewer = member?.role === "viewer";
    }
  }

  const offset = (page - 1) * limit;

  const [services, countResult] = await Promise.all([
    db
      .select()
      .from(gastronomicServiceTable)
      .where(eq(gastronomicServiceTable.workspaceId, workspaceId))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(gastronomicServiceTable)
      .where(eq(gastronomicServiceTable.workspaceId, workspaceId)),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    data: services.map((service) => maskPrice(service, isViewer)),
    total,
    page,
    limit,
  };
}

export async function getGastronomicServiceById(
  userId: string,
  serviceId: string,
) {
  const [service] = await db
    .select()
    .from(gastronomicServiceTable)
    .where(eq(gastronomicServiceTable.id, serviceId))
    .limit(1);

  if (!service) {
    throw new HTTPException(404, { message: "Service not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, service.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, service.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  const isViewer = !isOwner && member?.role === "viewer";

  return maskPrice(service, isViewer);
}

export async function createGastronomicService(
  userId: string,
  payload: CreateGastronomicServicePayload,
) {
  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, payload.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, payload.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  if (!isOwner && (!member || member.role === "viewer")) {
    throw new HTTPException(403, {
      message: "Viewers cannot create gastronomic services",
    });
  }

  const [service] = await db
    .insert(gastronomicServiceTable)
    .values({
      workspaceId: payload.workspaceId,
      name: payload.name,
      pricePerPax: payload.pricePerPax,
      description: payload.description,
      isActive: payload.isActive ?? true,
    })
    .returning();

  return service;
}

export async function updateGastronomicService(
  userId: string,
  serviceId: string,
  payload: UpdateGastronomicServicePayload,
) {
  const [service] = await db
    .select()
    .from(gastronomicServiceTable)
    .where(eq(gastronomicServiceTable.id, serviceId))
    .limit(1);

  if (!service) {
    throw new HTTPException(404, { message: "Service not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, service.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, service.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  if (!isOwner && (!member || member.role === "viewer")) {
    throw new HTTPException(403, {
      message: "Viewers cannot update gastronomic services",
    });
  }

  const [updated] = await db
    .update(gastronomicServiceTable)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(gastronomicServiceTable.id, serviceId))
    .returning();

  return updated;
}

export async function deleteGastronomicService(
  userId: string,
  serviceId: string,
) {
  const [service] = await db
    .select()
    .from(gastronomicServiceTable)
    .where(eq(gastronomicServiceTable.id, serviceId))
    .limit(1);

  if (!service) {
    throw new HTTPException(404, { message: "Service not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, service.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, service.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  if (!isOwner && (!member || member.role === "viewer")) {
    throw new HTTPException(403, {
      message: "Viewers cannot delete gastronomic services",
    });
  }

  await db
    .delete(gastronomicServiceTable)
    .where(eq(gastronomicServiceTable.id, serviceId));

  return { success: true };
}
