import * as Dialog from "@radix-ui/react-dialog";
import React from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod/v4";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useChangePassword from "@/hooks/mutations/user/use-change-password";
import { toast } from "sonner";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Please enter your current password"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const mutation = useChangePassword();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await mutation.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success("Password changed successfully");
      form.reset();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={resetAndClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Change Password</Dialog.Title>
              <Dialog.Close asChild>
                <X size={20} />
              </Dialog.Close>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-4">
                <div className="space-y-4">
                  <FormField control={form.control} name="currentPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-1">Current password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoFocus autoComplete="current-password" className="bg-white dark:bg-zinc-800/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-1">New password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="new-password" className="bg-white dark:bg-zinc-800/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-1">Confirm password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="new-password" className="bg-white dark:bg-zinc-800/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Dialog.Close asChild>
                    <Button type="button" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">Cancel</Button>
                  </Dialog.Close>
                  <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Change password"}</Button>
                </div>
              </form>
            </Form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ChangePasswordModal;