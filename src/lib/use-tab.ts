import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Sub-tab state that can also be addressed from a link (?tab=notes) — used by
 * global search and cross-module links so one module can point at another.
 */
export function useTab(defaultTab: string) {
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    const value = new URLSearchParams(search.replace(/^\?/, "")).get("tab");
    if (value) setTab(value);
  }, [search]);

  return [tab, setTab] as const;
}
