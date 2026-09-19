import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error";

type AsyncActionOptions = {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage: string;
};

export function useAsyncAction() {
  const [running, setRunning] = useState(false);

  const run = useCallback(
    async <T>(action: () => Promise<T>, options: AsyncActionOptions): Promise<T | null> => {
      setRunning(true);
      try {
        const data = await action();
        if (options.successMessage) toast.success(options.successMessage);
        return data;
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, options.errorMessage));
        return null;
      } finally {
        setRunning(false);
      }
    },
    [],
  );

  return { run, running };
}
