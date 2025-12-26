import updateLabel from "@/lib/fetchers/label/update-label";
import { useMutation } from "@tanstack/react-query";

function useUpdateLabel() {
  return useMutation({
    mutationFn: updateLabel,
  });
}

export default useUpdateLabel;
