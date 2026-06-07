import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/surveys",
)({
  component: SurveysLayout,
});

function SurveysLayout() {
  return <Outlet />;
}
