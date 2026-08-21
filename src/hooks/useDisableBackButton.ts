import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";

export function useDisableBackNavigation(active: boolean = true) {
  const navigate = useNavigate();
  const location = useLocation();

  const guardedPathRef = useRef(location.pathname + location.search);

  useEffect(() => {
    guardedPathRef.current = location.pathname + location.search;
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!active) return;

    console.log(
      "[useDisableBackNavigation] armed, guarding",
      guardedPathRef.current,
    );

    const bufferEntries = () => {
      for (let i = 0; i < 6; i += 1) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    bufferEntries();

    let handled = false;

    const handleBackNavigation = (source: string) => {
      if (handled) return;
      handled = true;
      console.log(
        `[useDisableBackNavigation] back navigation detected via ${source} — staying on`,
        guardedPathRef.current,
      );

      navigate(guardedPathRef.current, { replace: true });
      bufferEntries();

      setTimeout(() => {
        handled = false;
      }, 300);
    };

    const handlePopState = () => handleBackNavigation("popstate");
    const handleHashChange = () => handleBackNavigation("hashchange");

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      console.log("[useDisableBackNavigation] disarmed");
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [active, navigate]);
}
