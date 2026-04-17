import { and, count, eq, ilike, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import {
  serviceTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema.js";
import db from "../../database/index.js";
import { hasScheduledPermission } from "../../utils/permissions.js";
import { getUserName } from "../utils/get-user-name.js";
import getActiveWorkspaceUsers from "../../workspace-user/controllers/get-active-workspace-users.js";
import createNotification from "../../notification/controllers/create-notification.js";

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
): ServiceWithMaskedPrice {
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
  _userId?: string,
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedServices> {
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
    db.select({ count: count() }).from(serviceTable).where(baseCondition),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    data: services.map((service) => maskPrice(service)),
    total,
    page,
    limit,
  };
}

export async function getServiceById(serviceId: string) {
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

  return maskPrice(service);
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
    const hasPermission = await hasScheduledPermission(
      userId,
      payload.workspaceId,
      "create_services",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot create services",
      });
    }
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

  if (!service) {
    throw new HTTPException(500, { message: "Failed to create service" });
  }

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(payload.workspaceId);
  const priceFormatted = service.pricePerPax
    ? `€${(service.pricePerPax / 100).toFixed(2)}`
    : "N/A";

  const notificationTitle = `Service Created: ${service.name}`;
  const notificationContent =
    `User "${userName}" created a service\n` +
    `- Name: ${service.name}\n` +
    `- Price per Pax: ${priceFormatted}\n` +
    `- Description: ${service.description || "N/A"}\n` +
    `- Active: ${service.isActive ? "Yes" : "No"}`;

  await Promise.all(
    workspaceUsers.map((wu: { userId: string }) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "service_created",
        resourceId: service.id,
        resourceType: "service",
      }),
    ),
  );

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
    const hasPermission = await hasScheduledPermission(
      userId,
      service.workspaceId,
      "edit_services",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot update services",
      });
    }
  }

  const [updated] = await db
    .update(serviceTable)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(serviceTable.id, serviceId))
    .returning();

  if (!updated) {
    throw new HTTPException(500, { message: "Failed to update service" });
  }

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(service.workspaceId);
  const priceFormatted = updated.pricePerPax
    ? `€${(updated.pricePerPax / 100).toFixed(2)}`
    : "N/A";
  const changedFields = Object.keys(payload).join(", ");

  const notificationTitle = `Service Updated: ${updated.name}`;
  const notificationContent =
    `User "${userName}" updated a service\n` +
    `- Name: ${updated.name}\n` +
    `- Changed fields: ${changedFields}\n` +
    `- New Price per Pax: ${priceFormatted}\n` +
    `- Description: ${updated.description || "N/A"}\n` +
    `- Active: ${updated.isActive ? "Yes" : "No"}`;

  await Promise.all(
    workspaceUsers.map((wu: { userId: string }) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "service_updated",
        resourceId: updated.id,
        resourceType: "service",
      }),
    ),
  );

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
    const hasPermission = await hasScheduledPermission(
      userId,
      service.workspaceId,
      "delete_services",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot delete services",
      });
    }
  }

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(service.workspaceId);
  const priceFormatted = service.pricePerPax
    ? `€${(service.pricePerPax / 100).toFixed(2)}`
    : "N/A";

  const notificationTitle = `Service Deleted: ${service.name}`;
  const notificationContent =
    `User "${userName}" deleted a service\n` +
    `- Name: ${service.name}\n` +
    `- Previous Price per Pax: ${priceFormatted}\n` +
    `- Previous Description: ${service.description || "N/A"}`;

  await Promise.all(
    workspaceUsers.map((wu: { userId: string }) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "service_deleted",
        resourceId: service.id,
        resourceType: "service",
      }),
    ),
  );

  await db.delete(serviceTable).where(eq(serviceTable.id, serviceId));

  return { success: true };
}
