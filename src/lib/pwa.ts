/**
 * PWA & Service Worker Registration Foundation
 */

export type ServiceWorkerStatus = "unsupported" | "installing" | "installed" | "active" | "error";

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  // Register once window is ready to not delay initial critical rendering
  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.log("[PWA] New content is available; will update on next visit.");
            } else {
              console.log("[PWA] Content is cached for offline use.");
            }
          }
        });
      });
    } catch (error) {
      console.warn("[PWA] Service worker registration failed:", error);
    }
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register);
  }
}

/** Check if the application is currently running in standalone PWA mode */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}
