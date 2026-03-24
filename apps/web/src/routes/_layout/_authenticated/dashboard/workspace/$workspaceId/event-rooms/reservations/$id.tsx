import { ReservationForm } from "@/components/calendar/reservation-form";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetEventRooms,
  useGetReservationById,
} from "@/hooks/queries/event-room";
import queryClient from "@/query-client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/reservations/$id",
)({
  component: EditReservationPage,
});

function EditReservationPage() {
  const { workspaceId, id } = Route.useParams();
  const navigate = useNavigate();

  const { data: reservation, isLoading } = useGetReservationById(id);
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
    <WorkspaceLayout title="Edit Reservation">
      <div className="p-6 max-w-7xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Edit Reservation</h1>
            <p className="text-muted-foreground mt-1">
              Update the reservation details below.
            </p>
          </div>
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <ReservationForm
              workspaceId={workspaceId}
              reservationId={id}
              eventRooms={eventRooms || []}
              initialData={reservation}
              onSuccess={handleSuccess}
              onCancel={() => {
                navigate({
                  to: "/dashboard/workspace/$workspaceId/event-rooms",
                  params: { workspaceId },
                });
              }}
            />
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
