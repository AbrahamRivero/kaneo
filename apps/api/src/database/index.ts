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
  reservationAgeGroupTariffTableRelations,
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
} from "./relations.js";
import {
  accountTable,
  activityTable,
  ageGroupTariffTable,
  eventRoomTable,
  githubIntegrationTable,
  labelTable,
  notificationTable,
  projectTable,
  reservationAgeGroupTariffTable,
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
} from "./schema.js";

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
  reservationAgeGroupTariffTable,
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
  reservationAgeGroupTariffTableRelations,
  roomTariffTableRelations,
  scheduledPermissionTableRelations,
  ageGroupTariffTableRelations,
};

const db = drizzle(pool, {
  schema: schema,
});

export default db;
