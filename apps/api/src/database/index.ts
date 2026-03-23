import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  accountTableRelations,
  activityTableRelations,
  eventRoomTableRelations,
  gastronomicServiceTableRelations,
  githubIntegrationTableRelations,
  labelTableRelations,
  notificationTableRelations,
  projectTableRelations,
  reservationServiceTableRelations,
  reservationTableRelations,
  roomTariffTableRelations,
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
  eventRoomTable,
  gastronomicServiceTable,
  githubIntegrationTable,
  labelTable,
  notificationTable,
  projectTable,
  reservationServiceTable,
  reservationTable,
  roomTariffTable,
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
    "postgresql://kaneo_user:kaneo_password@localhost:5432/kaneo",
});

export const schema = {
  accountTable,
  activityTable,
  eventRoomTable,
  gastronomicServiceTable,
  githubIntegrationTable,
  labelTable,
  notificationTable,
  projectTable,
  reservationServiceTable,
  reservationTable,
  roomTariffTable,
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
  gastronomicServiceTableRelations,
  reservationServiceTableRelations,
  reservationTableRelations,
  roomTariffTableRelations,
};

const db = drizzle(pool, {
  schema: schema,
});

export default db;
