import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useResetMemberPassword from "@/hooks/mutations/workspace-user/use-reset-member-password";
import React from "react";

function ResetMemberPasswordModal({
  open,
  onClose,
  workspaceId,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  userId: string;
}) {
  const mutation = useResetMemberPassword();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirmPassword("");
    }
  }, [open]);

  const handleReset = async () => {
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      await mutation.mutateAsync({ workspaceId, userId, password });
      toast.success("Password updated");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={() => onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Set member password</Dialog.Title>
              <Dialog.Close asChild>
                <X size={20} />
              </Dialog.Close>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Set a new password for this member. The member will use this password to sign in.</p>

                <div className="grid gap-2">
                  <label className="text-xs">New password</label>
                  <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
                  <label className="text-xs">Confirm password</label>
                  <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Dialog.Close asChild>
                    <Button type="button" className="bg-zinc-100">Cancel</Button>
                  </Dialog.Close>
                  <Button onClick={handleReset} className="bg-indigo-600 text-white" disabled={isSubmitting}>{isSubmitting ? "Setting..." : "Set password"}</Button>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ResetMemberPasswordModal;