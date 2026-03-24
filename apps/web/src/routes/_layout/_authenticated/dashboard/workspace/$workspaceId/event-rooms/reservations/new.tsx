import { ReservationForm } from "@/components/calendar/reservation-form";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { useGetEventRooms } from "@/hooks/queries/event-room";
import queryClient from "@/query-client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/reservations/new",
)({
  component: CreateReservationPage,
});

function CreateReservationPage() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();

  const { data: eventRooms } = useGetEventRooms(workspaceId);

  const handleSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["reservations"] });
    await queryClient.invalidateQueries({ queryKey: ["event-rooms"] });
    navigate({
      to: "/dashboard/workspace/$workspaceId/event-rooms",
      params: { workspaceId },
    });
  };

  return (
    <WorkspaceLayout title="Create Reservation">
      <div className="p-6 max-w-7xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Create Reservation</h1>
            <p className="text-muted-foreground mt-1">
              Add a new reservation to your calendar.
            </p>
          </div>
          <ReservationForm
            workspaceId={workspaceId}
            eventRooms={eventRooms || []}
            onSuccess={handleSuccess}
            onCancel={() => {
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms",
                params: { workspaceId },
              });
            }}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
