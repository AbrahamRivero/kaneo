import {
  type DateRange,
  ReservationForm,
} from "@/components/calendar/reservation-form";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { useGetEventRooms } from "@/hooks/queries/event-room";
import queryClient from "@/query-client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/reservations/new",
)({
  validateSearch: searchSchema,
  component: CreateReservationPage,
});

function CreateReservationPage() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const search = Route.useSearch() as { from?: string; to?: string };

  const initialDateRange: DateRange | undefined = search.from
    ? (() => {
        const [year, month, day] = search.from.split("-").map(Number);
        const from = new Date(year, month - 1, day);
        return { from };
      })()
    : undefined;

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
            initialDateRange={initialDateRange}
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
