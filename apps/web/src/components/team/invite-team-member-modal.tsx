import useInviteWorkspaceUser from "@/hooks/mutations/workspace-user/use-invite-workspace-user";
import { Route } from "@/routes/_layout/_authenticated/dashboard/workspace/$workspaceId/members";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  open: boolean;
  onClose: () => void;
};

const teamMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "viewer"]).optional(),
});

type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;

function InviteTeamMemberModal({ open, onClose }: Props) {
  const { mutateAsync } = useInviteWorkspaceUser();
  const queryClient = useQueryClient();
  const { workspaceId } = Route.useParams();

  const form = useForm<TeamMemberFormValues>({
    resolver: standardSchemaResolver(teamMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onSubmit = async ({ email, role }: TeamMemberFormValues) => {
    try {
      await mutateAsync({ email, workspaceId, role });
      await queryClient.refetchQueries({
        queryKey: ["workspace-users", workspaceId],
      });

      form.reset();
      onClose();
    } catch (error) {
      form.setError("email", {
        message: error instanceof Error ? error.message : "Failed to invite",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[320px] sm:max-w-[350px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-base">Invite Team Member</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="colleague@company.com"
                      className="h-10 w-full text-sm"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-10 text-sm">
              Send Invitation
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default InviteTeamMemberModal;
