import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateService,
  useUpdateService,
} from "@/hooks/mutations/event-room";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";

const serviceSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  pricePerPax: z.string().optional(),
  description: z.string().optional(),
});

export type ServiceFormData = {
  name: string;
  pricePerPax?: string;
  description?: string;
};

interface ServiceFormProps {
  workspaceId: string;
  serviceId?: string;
  initialData?: {
    id: string;
    name: string;
    pricePerPax: number | null;
    description?: string | null;
  } | null;
  isLoadingData?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceForm({
  workspaceId,
  serviceId,
  initialData,
  isLoadingData,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const createService = useCreateService();
  const updateService = useUpdateService();

  const form = useForm<ServiceFormData>({
    resolver: standardSchemaResolver(serviceSchema),
    defaultValues: {
      name: "",
      pricePerPax: "",
      description: "",
    },
    values: initialData
      ? {
          name: initialData.name,
          pricePerPax: initialData.pricePerPax?.toString() ?? "",
          description: initialData.description ?? "",
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const payload = {
      workspaceId,
      name: data.name,
      pricePerPax: data.pricePerPax ? Number(data.pricePerPax) : null,
      description: data.description?.trim() ? data.description : "",
      isActive: true,
    };

    try {
      if (serviceId) {
        await updateService.mutateAsync({ id: serviceId, payload });
      } else {
        await createService.mutateAsync(payload);
      }
      onSuccess?.();
    } catch (error) {
      console.error(error);
    }
  });

  const isEditing = Boolean(serviceId);
  const isPending = createService.isPending || updateService.isPending;

  if (isLoadingData) {
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g., Coffee Break"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message as string}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="pricePerPax">Price per Pax (CUP)</Label>
          <Input
            id="pricePerPax"
            type="number"
            placeholder="0.00"
            {...form.register("pricePerPax")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="Optional description"
            {...form.register("description")}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Service"}
        </Button>
      </div>
    </form>
  );
}
