import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  accountTableRelations,
  activityTableRelations,
  ageGroupTariffTableRelations,
  eventRoomTableRelations,
  githubIntegrationTableRelations,
  labelTableRelations,
  notificationTableRelations,
  projectTableRelations,
  reservationDayTariffTableRelations,
  reservationServiceTableRelations,
  reservationTableRelations,
  roomTariffTableRelations,
  scheduledPermissionTableRelations,
  serviceTableRelations,
  sessionTableRelations,
  taskTableRelations,
  timeEntryTableRelations,
  userTableRelations,
  verificationTableRelations,
  workspaceTableRelations,
  workspaceUserTableRelations,
} from "./relations";
import {
  accountTable,
  activityTable,
  ageGroupTariffTable,
  eventRoomTable,
  githubIntegrationTable,
  labelTable,
  notificationTable,
  projectTable,
  reservationDayTariffTable,
  reservationServiceTable,
  reservationTable,
  roomTariffTable,
  scheduledPermissionTable,
  serviceTable,
  sessionTable,
  taskTable,
  timeEntryTable,
  userTable,
  verificationTable,
  workspaceTable,
  workspaceUserTable,
} from "./schema";

dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://palcodesk_user:palcodesk_password@localhost:5432/palcodesk",
});

export const schema = {
  accountTable,
  activityTable,
  ageGroupTariffTable,
  eventRoomTable,
  serviceTable,
  githubIntegrationTable,
  labelTable,
  notificationTable,
  projectTable,
  reservationServiceTable,
  reservationTable,
  reservationDayTariffTable,
  roomTariffTable,
  scheduledPermissionTable,
  sessionTable,
  taskTable,
  timeEntryTable,
  userTable,
  verificationTable,
  workspaceTable,
  workspaceUserTable,
  userTableRelations,
  sessionTableRelations,
  accountTableRelations,
  verificationTableRelations,
  workspaceTableRelations,
  workspaceUserTableRelations,
  projectTableRelations,
  taskTableRelations,
  timeEntryTableRelations,
  activityTableRelations,
  labelTableRelations,
  notificationTableRelations,
  githubIntegrationTableRelations,
  eventRoomTableRelations,
  serviceTableRelations,
  reservationServiceTableRelations,
  reservationTableRelations,
  reservationDayTariffTableRelations,
  roomTariffTableRelations,
  scheduledPermissionTableRelations,
  ageGroupTariffTableRelations,
};

const db = drizzle(pool, {
  schema: schema,
});

export default db;
