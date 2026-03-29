import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  accountTableRelations,
  activityTableRelations,
  eventRoomTableRelations,
  githubIntegrationTableRelations,
  labelTableRelations,
  notificationTableRelations,
  projectTableRelations,
  reservationDayTariffTableRelations,
  reservationServiceTableRelations,
  reservationTableRelations,
  roomTariffTableRelations,
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
  eventRoomTable,
  githubIntegrationTable,
  labelTable,
  notificationTable,
  projectTable,
  reservationDayTariffTable,
  reservationServiceTable,
  reservationTable,
  roomTariffTable,
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
    "postgresql://kaneo_user:kaneo_password@localhost:5432/kaneo",
});

export const schema = {
  accountTable,
  activityTable,
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
};

const db = drizzle(pool, {
  schema: schema,
});

export default db;
