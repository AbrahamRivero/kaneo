import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms",
)({
  component: EventRoomsLayout,
});

function EventRoomsLayout() {
  return <Outlet />;
}
