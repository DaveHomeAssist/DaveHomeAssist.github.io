(() => {
  if (typeof window.__dhaTooltipCleanup === "function") {
    window.__dhaTooltipCleanup();
  }

  const root = document.body;

  if (!root) {
    window.__dhaTooltipCleanup = () => {};
    return;
  }

  const tooltipState = new WeakMap();
  let rafId = 0;

  const estimateTooltipMetrics = (element) => {
    const text = element.getAttribute("data-tooltip") || "";
    const isWide = element.hasAttribute("data-tooltip-wide");
    const charWidth = 7;
    const baseWidth = isWide ? 200 : 0;
    const measuredWidth = Math.min(280, Math.max(baseWidth, text.length * charWidth));
    const tooltipWidth = measuredWidth + 24;
    const tooltipHeight = isWide ? 64 : 36;
    return { tooltipWidth, tooltipHeight };
  };

  const cleanupElement = (element) => {
    element.classList.remove("tooltip-shift-left", "tooltip-shift-right", "tooltip-pos-bottom");
    const state = tooltipState.get(element);

    if (state && state.hadOriginalPos) {
      element.setAttribute("data-tooltip-pos", state.originalPos);
    } else if (state) {
      element.removeAttribute("data-tooltip-pos");
    }

    tooltipState.delete(element);
  };

  const updateElement = (element) => {
    rafId = 0;
    if (!element?.matches("[data-tooltip]")) return;

    cleanupElement(element);

    const rect = element.getBoundingClientRect();
    const { tooltipWidth, tooltipHeight } = estimateTooltipMetrics(element);
    const offset = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const originalPos = element.getAttribute("data-tooltip-pos");

    tooltipState.set(element, {
      hadOriginalPos: originalPos !== null,
      originalPos: originalPos || "",
    });

    const leftEdge = rect.left + rect.width / 2 - tooltipWidth / 2;
    const rightEdge = rect.left + rect.width / 2 + tooltipWidth / 2;
    const topEdge = rect.top - tooltipHeight - offset;

    if (rightEdge > viewportWidth - offset) {
      element.classList.add("tooltip-shift-left");
    } else if (leftEdge < offset) {
      element.classList.add("tooltip-shift-right");
    }

    if (topEdge < offset) {
      element.classList.add("tooltip-pos-bottom");
      element.setAttribute("data-tooltip-pos", "bottom");
    }

    if (rect.bottom + tooltipHeight + offset > viewportHeight && topEdge >= offset) {
      element.classList.remove("tooltip-pos-bottom");
      if (originalPos === null) {
        element.removeAttribute("data-tooltip-pos");
      } else {
        element.setAttribute("data-tooltip-pos", originalPos);
      }
    }
  };

  const requestUpdate = (element) => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(() => updateElement(element));
  };

  const getTooltipTarget = (event) => event.target.closest("[data-tooltip]");

  const onMouseEnter = (event) => {
    const element = getTooltipTarget(event);
    if (!element) return;
    requestUpdate(element);
  };

  const onFocusIn = (event) => {
    const element = getTooltipTarget(event);
    if (!element) return;
    requestUpdate(element);
  };

  const onMouseLeave = (event) => {
    const element = getTooltipTarget(event);
    if (!element) return;
    cleanupElement(element);
  };

  const onFocusOut = (event) => {
    const element = getTooltipTarget(event);
    if (!element) return;
    cleanupElement(element);
  };

  root.addEventListener("mouseenter", onMouseEnter, true);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("mouseleave", onMouseLeave, true);
  root.addEventListener("focusout", onFocusOut);

  window.__dhaTooltipCleanup = () => {
    root.removeEventListener("mouseenter", onMouseEnter, true);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("mouseleave", onMouseLeave, true);
    root.removeEventListener("focusout", onFocusOut);

    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
})();
