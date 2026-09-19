import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type UseApiWithFallbackOptions<T> = {
  initialData: T;
  fallbackData?: T;
  onErrorMessage?: string;
};

export function useApiWithFallback<T>(
  load: () => Promise<T>,
  options: UseApiWithFallbackOptions<T>,
) {
  const [data, setData] = useState<T>(options.initialData);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await load();
      setData(next);
    } catch {
      if (options.fallbackData !== undefined) {
        setData(options.fallbackData);
      }
      if (options.onErrorMessage) {
        toast.info(options.onErrorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [load, options.fallbackData, options.onErrorMessage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, setData, loading, refresh };
}
