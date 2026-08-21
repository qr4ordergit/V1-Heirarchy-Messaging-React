import { useEffect } from "react";

export function useDisableBackButton(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled]);
}
