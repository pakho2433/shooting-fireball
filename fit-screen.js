"use strict";

(function fitGameToVisibleScreen() {
  let resizeFrame = 0;

  function applyViewportSize() {
    resizeFrame = 0;
    const viewport = window.visualViewport;
    const width = Math.max(1, Math.round(viewport ? viewport.width : window.innerWidth));
    const height = Math.max(1, Math.round(viewport ? viewport.height : window.innerHeight));

    document.documentElement.style.setProperty("--app-width", `${width}px`);
    document.documentElement.style.setProperty("--app-height", `${height}px`);
    document.documentElement.dataset.orientation = width >= height ? "landscape" : "portrait";

    // Mobile Safari sometimes keeps a small page offset after its address bar
    // or keyboard changes size. Return the fixed game shell to the top.
    if (document.activeElement?.tagName !== "INPUT") {
      window.scrollTo(0, 0);
    }
  }

  function scheduleViewportUpdate() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(applyViewportSize);
  }

  applyViewportSize();
  window.addEventListener("resize", scheduleViewportUpdate, { passive: true });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(scheduleViewportUpdate, 80);
    window.setTimeout(scheduleViewportUpdate, 350);
  }, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleViewportUpdate, { passive: true });
    window.visualViewport.addEventListener("scroll", scheduleViewportUpdate, { passive: true });
  }

  document.addEventListener("focusout", () => window.setTimeout(scheduleViewportUpdate, 60));
})();
