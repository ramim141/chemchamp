import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MAIN_TAB_PATHS = new Set([
  "/dashboard",
  "/study",
  "/exams",
  "/vault",
  "/leaderboard",
  "/profile",
]);

/**
 * ScrollToTop - Automatically scrolls to top on non-persistent route changes
 * Main tabs maintain their own seamless scroll memory inside AppLayout.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // If navigating between persistent main tabs, let AppLayout handle scroll memory
    if (MAIN_TAB_PATHS.has(pathname)) return;

    if (!window.location.hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  }, [pathname]);

  return null;
}

