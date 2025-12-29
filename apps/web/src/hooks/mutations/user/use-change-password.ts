import { useMutation } from "@tanstack/react-query";
import changePassword, { type ChangePasswordRequest } from "@/fetchers/user/change-password";

export default function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => changePassword(body),
  });
}
