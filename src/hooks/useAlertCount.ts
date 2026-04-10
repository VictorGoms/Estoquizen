import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";

/**
 * Returns the number of products that are zero or below minimum stock.
 * Re-fetches every 60 seconds so the badge stays fresh without a page reload.
 */
export function useAlertCount(): number {
  const [count, setCount] = useState(0);

  async function fetch() {
    const ws = getWorkspace();
    if (!ws) return;
    const { data } = await supabase
      .from("products")
      .select("qty, min_qty")
      .eq("workspace_id", ws.id);
    const n = (data ?? []).filter((p) => p.qty === 0 || p.qty <= p.min_qty).length;
    setCount(n);
  }

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return count;
}
