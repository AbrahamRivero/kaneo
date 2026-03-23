import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const taskPriority = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
  "no-priority",
]);
export const taskStatus = pgEnum("task_status", [
  "backlog",
  "to-do",
  "in-progress",
  "technical-review",
  "archived",
  "completed",
]);
export const workspaceMemberRole = pgEnum("workspace_member_role", [
  "viewer",
  "owner",
  "member",
]);

export const sessionTypeEnum = pgEnum("session_type", [
  "half_session",
  "full_session",
  "social_event",
  "flat",
]);

export const userTable = pgTable("user", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  isAnonymous: boolean("is_anonymous"),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const accountTable = pgTable("account", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    mode: "date",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const verificationTable = pgTable("verification", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const workspaceTable = pgTable("workspace", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => userTable.id, {
      onDelete: "cascade",
    }),
  phoneBoardEnabled: boolean("phone_board_enabled").default(false).notNull(),
  phoneBoardData: jsonb("phone_board_data").$type<PhoneBoardCellMap>(),
  eventRoomsEnabled: boolean("event_rooms_enabled").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/** Map key: "row-col" (e.g. "5-3"). Blocked cells need no extension/type. */
export type PhoneBoardCellMap = Record<
  string,
  { extension?: string; type?: "digital" | "analog"; blocked?: boolean }
>;

export const workspaceUserTable = pgTable("workspace_member", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  workspaceId: text("workspace_id").references(() => workspaceTable.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, {
      onDelete: "cascade",
    }),
  role: workspaceMemberRole().default("member").notNull(),
  joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
  status: text("status").default("pending").notNull(),
});

export const projectTable = pgTable("project", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaceTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  slug: text("slug").notNull(),
  icon: text("icon").default("Layout"),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
});

export const taskTable = pgTable("task", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projectTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  position: integer("position").default(0),
  number: integer("number").default(1),
  userId: text("assignee_id").references(() => userTable.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatus().default("to-do").notNull(),
  priority: taskPriority().default("low").notNull(),
  commentsCount: integer("commentsCount").default(0),
  linksCount: integer("linksCount").default(0),
  dueDate: timestamp("due_date", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const timeEntryTable = pgTable("time_entry", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => taskTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  userId: text("user_id").references(() => userTable.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  description: text("description"),
  startTime: timestamp("start_time", { mode: "date" }).notNull(),
  endTime: timestamp("end_time", { mode: "date" }),
  duration: integer("duration").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const activityTable = pgTable("activity", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => taskTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  type: text("type").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  content: text("content"),
});

export const labelTable = pgTable("label", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  taskId: text("task_id")
    .notNull()
    .references(() => taskTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

export const notificationTable = pgTable("notification", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  title: text("title").notNull(),
  content: text("content"),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").default(false),
  resourceId: text("resource_id"),
  resourceType: text("resource_type"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const githubIntegrationTable = pgTable("github_integration", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projectTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .unique(),
  repositoryOwner: text("repository_owner").notNull(),
  repositoryName: text("repository_name").notNull(),
  installationId: integer("installation_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const eventRoomTable = pgTable("event_room", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaceTable.id, {
      onDelete: "cascade",
    }),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  description: text("description"),
  allowsMultipleReservations: boolean("allows_multiple_reservations").default(
    false,
  ),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const gastronomicServiceTable = pgTable("gastronomic_service", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaceTable.id, {
      onDelete: "cascade",
    }),
  name: text("name").notNull(),
  pricePerPax: integer("price_per_pax").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const roomTariffTable = pgTable("room_tariff", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaceTable.id, {
      onDelete: "cascade",
    }),
  eventRoomId: text("event_room_id")
    .notNull()
    .references(() => eventRoomTable.id, {
      onDelete: "cascade",
    }),
  sessionType: sessionTypeEnum("session_type").notNull(),
  price: integer("price").notNull(),
  serviceChargePercent: integer("service_charge_percent").default(10).notNull(),
  modificationCharge: integer("modification_charge").default(2000).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const reservationTable = pgTable("reservation", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaceTable.id, {
      onDelete: "cascade",
    }),
  eventRoomId: text("event_room_id")
    .notNull()
    .references(() => eventRoomTable.id, {
      onDelete: "cascade",
    }),
  userId: text("user_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
  title: text("title"),
  clientName: text("client_name").notNull(),
  companyName: text("company_name"),
  phone: text("phone"),
  email: text("email"),
  dateRange: text("date_range").notNull(),
  adultPax: integer("adult_pax").notNull().default(0),
  childrenPax: integer("children_pax").notNull().default(0),
  notes: text("notes"),
  paymentConfirmed: boolean("payment_confirmed").default(false),
  roomTariffId: text("room_tariff_id").references(() => roomTariffTable.id, {
    onDelete: "set null",
  }),
  totalRoomPrice: integer("total_room_price"),
  totalServicePrice: integer("total_service_price"),
  serviceChargeAmount: integer("service_charge_amount"),
  grandTotal: integer("grand_total"),
  totalPax: integer("total_pax"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const reservationServiceTable = pgTable("reservation_service", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  reservationId: text("reservation_id")
    .notNull()
    .references(() => reservationTable.id, {
      onDelete: "cascade",
    }),
  gastronomicServiceId: text("gastronomic_service_id")
    .notNull()
    .references(() => gastronomicServiceTable.id, {
      onDelete: "cascade",
    }),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
