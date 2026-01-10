import resetMemberPassword, {
  type ResetMemberPasswordRequest,
} from "@/fetchers/workspace-user/reset-member-password";
import { useMutation } from "@tanstack/react-query";

export default function useResetMemberPassword() {
  return useMutation({
    mutationFn: (body: ResetMemberPasswordRequest) => resetMemberPassword(body),
  });
}
