import changePassword, {
  type ChangePasswordRequest,
} from "@/fetchers/user/change-password";
import { useMutation } from "@tanstack/react-query";

export default function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => changePassword(body),
  });
}
