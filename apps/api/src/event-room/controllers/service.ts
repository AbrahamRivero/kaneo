import { and, count, eq, ilike, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  serviceTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";

export type CreateServicePayload = {
  workspaceId: string;
  name: string;
  pricePerPax: number;
  description?: string;
  isActive?: boolean;
};

export type UpdateServicePayload = {
  name?: string;
  pricePerPax?: number;
  description?: string;
  isActive?: boolean;
};

export type ServiceWithMaskedPrice = {
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
  service: typeof serviceTable.$inferSelect,
  isViewer: boolean,
): ServiceWithMaskedPrice {
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

export interface PaginatedServices {
  data: ReturnType<typeof maskPrice>[];
  total: number;
  page: number;
  limit: number;
}

export async function getServices(
  workspaceId: string,
  userId?: string,
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedServices> {
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

  const baseCondition = eq(serviceTable.workspaceId, workspaceId);
  const searchCondition = search
    ? and(
        baseCondition,
        or(
          ilike(serviceTable.name, `%${search}%`),
          ilike(serviceTable.description, `%${search}%`),
        ),
      )
    : baseCondition;

  const [services, countResult] = await Promise.all([
    db
      .select()
      .from(serviceTable)
      .where(searchCondition)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(serviceTable)
      .where(baseCondition),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    data: services.map((service) => maskPrice(service, isViewer)),
    total,
    page,
    limit,
  };
}

export async function getServiceById(userId: string, serviceId: string) {
  const [service] = await db
    .select()
    .from(serviceTable)
    .where(eq(serviceTable.id, serviceId))
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

export async function createService(
  userId: string,
  payload: CreateServicePayload,
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
      message: "Viewers cannot create services",
    });
  }

  const [service] = await db
    .insert(serviceTable)
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

export async function updateService(
  userId: string,
  serviceId: string,
  payload: UpdateServicePayload,
) {
  const [service] = await db
    .select()
    .from(serviceTable)
    .where(eq(serviceTable.id, serviceId))
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
      message: "Viewers cannot update services",
    });
  }

  const [updated] = await db
    .update(serviceTable)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(serviceTable.id, serviceId))
    .returning();

  return updated;
}

export async function deleteService(userId: string, serviceId: string) {
  const [service] = await db
    .select()
    .from(serviceTable)
    .where(eq(serviceTable.id, serviceId))
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
      message: "Viewers cannot delete services",
    });
  }

  await db.delete(serviceTable).where(eq(serviceTable.id, serviceId));

  return { success: true };
}
