import { relations } from "drizzle-orm";
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
  surveyCategoryConfigTable,
  surveyRatingTable,
  surveySuggestionTable,
  surveyTable,
  taskTable,
  timeEntryTable,
  userTable,
  verificationTable,
  workspaceTable,
  workspaceUserTable,
} from "./schema.js";

export const userTableRelations = relations(userTable, ({ many }) => ({
  sessions: many(sessionTable),
  accounts: many(accountTable),
  workspaces: many(workspaceTable),
  workspaceMemberships: many(workspaceUserTable),
  assignedTasks: many(taskTable),
  timeEntries: many(timeEntryTable),
  activities: many(activityTable),
  notifications: many(notificationTable),
}));

export const sessionTableRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const accountTableRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id],
  }),
}));

export const verificationTableRelations = relations(
  verificationTable,
  () => ({}),
);

export const workspaceTableRelations = relations(
  workspaceTable,
  ({ one, many }) => ({
    owner: one(userTable, {
      fields: [workspaceTable.ownerId],
      references: [userTable.id],
    }),
    members: many(workspaceUserTable),
    projects: many(projectTable),
  }),
);

export const workspaceUserTableRelations = relations(
  workspaceUserTable,
  ({ one }) => ({
    workspace: one(workspaceTable, {
      fields: [workspaceUserTable.workspaceId],
      references: [workspaceTable.id],
    }),
    user: one(userTable, {
      fields: [workspaceUserTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const projectTableRelations = relations(
  projectTable,
  ({ one, many }) => ({
    workspace: one(workspaceTable, {
      fields: [projectTable.workspaceId],
      references: [workspaceTable.id],
    }),
    tasks: many(taskTable),
    githubIntegration: many(githubIntegrationTable),
  }),
);

export const taskTableRelations = relations(taskTable, ({ one, many }) => ({
  project: one(projectTable, {
    fields: [taskTable.projectId],
    references: [projectTable.id],
  }),
  assignee: one(userTable, {
    fields: [taskTable.userId],
    references: [userTable.id],
  }),
  timeEntries: many(timeEntryTable),
  activities: many(activityTable),
  labels: many(labelTable),
}));

export const timeEntryTableRelations = relations(timeEntryTable, ({ one }) => ({
  task: one(taskTable, {
    fields: [timeEntryTable.taskId],
    references: [taskTable.id],
  }),
  user: one(userTable, {
    fields: [timeEntryTable.userId],
    references: [userTable.id],
  }),
}));

export const activityTableRelations = relations(activityTable, ({ one }) => ({
  task: one(taskTable, {
    fields: [activityTable.taskId],
    references: [taskTable.id],
  }),
  user: one(userTable, {
    fields: [activityTable.userId],
    references: [userTable.id],
  }),
}));

export const labelTableRelations = relations(labelTable, ({ one }) => ({
  task: one(taskTable, {
    fields: [labelTable.taskId],
    references: [taskTable.id],
  }),
}));

export const notificationTableRelations = relations(
  notificationTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [notificationTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const githubIntegrationTableRelations = relations(
  githubIntegrationTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [githubIntegrationTable.projectId],
      references: [projectTable.id],
    }),
  }),
);

export const eventRoomTableRelations = relations(
  eventRoomTable,
  ({ one, many }) => ({
    workspace: one(workspaceTable, {
      fields: [eventRoomTable.workspaceId],
      references: [workspaceTable.id],
    }),
    reservations: many(reservationTable),
  }),
);

export const reservationTableRelations = relations(
  reservationTable,
  ({ one, many }) => ({
    workspace: one(workspaceTable, {
      fields: [reservationTable.workspaceId],
      references: [workspaceTable.id],
    }),
    eventRoom: one(eventRoomTable, {
      fields: [reservationTable.eventRoomId],
      references: [eventRoomTable.id],
    }),
    roomTariff: one(roomTariffTable, {
      fields: [reservationTable.roomTariffId],
      references: [roomTariffTable.id],
    }),
    services: many(reservationServiceTable),
    dayTariffs: many(reservationDayTariffTable),
    ageGroupTariffs: many(reservationAgeGroupTariffTable),
  }),
);

export const serviceTableRelations = relations(
  serviceTable,
  ({ one, many }) => ({
    workspace: one(workspaceTable, {
      fields: [serviceTable.workspaceId],
      references: [workspaceTable.id],
    }),
    reservationServices: many(reservationServiceTable),
  }),
);

export const roomTariffTableRelations = relations(
  roomTariffTable,
  ({ one, many }) => ({
    workspace: one(workspaceTable, {
      fields: [roomTariffTable.workspaceId],
      references: [workspaceTable.id],
    }),
    eventRoom: one(eventRoomTable, {
      fields: [roomTariffTable.eventRoomId],
      references: [eventRoomTable.id],
    }),
    reservations: many(reservationTable),
  }),
);

export const ageGroupTariffTableRelations = relations(
  ageGroupTariffTable,
  ({ one }) => ({
    workspace: one(workspaceTable, {
      fields: [ageGroupTariffTable.workspaceId],
      references: [workspaceTable.id],
    }),
    eventRoom: one(eventRoomTable, {
      fields: [ageGroupTariffTable.eventRoomId],
      references: [eventRoomTable.id],
    }),
  }),
);

export const reservationServiceTableRelations = relations(
  reservationServiceTable,
  ({ one }) => ({
    reservation: one(reservationTable, {
      fields: [reservationServiceTable.reservationId],
      references: [reservationTable.id],
    }),
    service: one(serviceTable, {
      fields: [reservationServiceTable.serviceId],
      references: [serviceTable.id],
    }),
  }),
);

export const reservationDayTariffTableRelations = relations(
  reservationDayTariffTable,
  ({ one }) => ({
    reservation: one(reservationTable, {
      fields: [reservationDayTariffTable.reservationId],
      references: [reservationTable.id],
    }),
    roomTariff: one(roomTariffTable, {
      fields: [reservationDayTariffTable.roomTariffId],
      references: [roomTariffTable.id],
    }),
  }),
);

export const reservationAgeGroupTariffTableRelations = relations(
  reservationAgeGroupTariffTable,
  ({ one }) => ({
    reservation: one(reservationTable, {
      fields: [reservationAgeGroupTariffTable.reservationId],
      references: [reservationTable.id],
    }),
    ageGroupTariff: one(ageGroupTariffTable, {
      fields: [reservationAgeGroupTariffTable.ageGroupTariffId],
      references: [ageGroupTariffTable.id],
    }),
  }),
);

export const scheduledPermissionTableRelations = relations(
  scheduledPermissionTable,
  ({ one }) => ({
    workspace: one(workspaceTable, {
      fields: [scheduledPermissionTable.workspaceId],
      references: [workspaceTable.id],
    }),
    user: one(userTable, {
      fields: [scheduledPermissionTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const surveyCategoryConfigTableRelations = relations(
  surveyCategoryConfigTable,
  ({ one, many }) => ({
    workspace: one(workspaceTable, {
      fields: [surveyCategoryConfigTable.workspaceId],
      references: [workspaceTable.id],
    }),
    ratings: many(surveyRatingTable),
  }),
);

export const surveyTableRelations = relations(surveyTable, ({ one, many }) => ({
  workspace: one(workspaceTable, {
    fields: [surveyTable.workspaceId],
    references: [workspaceTable.id],
  }),
  creator: one(userTable, {
    fields: [surveyTable.createdBy],
    references: [userTable.id],
  }),
  ratings: many(surveyRatingTable),
  suggestions: many(surveySuggestionTable),
}));

export const surveyRatingTableRelations = relations(
  surveyRatingTable,
  ({ one }) => ({
    survey: one(surveyTable, {
      fields: [surveyRatingTable.surveyId],
      references: [surveyTable.id],
    }),
    categoryConfig: one(surveyCategoryConfigTable, {
      fields: [surveyRatingTable.categoryConfigId],
      references: [surveyCategoryConfigTable.id],
    }),
  }),
);

export const surveySuggestionTableRelations = relations(
  surveySuggestionTable,
  ({ one }) => ({
    survey: one(surveyTable, {
      fields: [surveySuggestionTable.surveyId],
      references: [surveyTable.id],
    }),
  }),
);
