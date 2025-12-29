import { useMutation } from "@tanstack/react-query";
import resetMemberPassword, { type ResetMemberPasswordRequest } from "@/fetchers/workspace-user/reset-member-password";

export default function useResetMemberPassword() {
  return useMutation({
    mutationFn: (body: ResetMemberPasswordRequest) => resetMemberPassword(body),
  });
}
