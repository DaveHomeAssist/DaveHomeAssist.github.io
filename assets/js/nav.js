(() => {
  if (typeof window.__dhaNavCleanup === "function") {
    window.__dhaNavCleanup();
  }

  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = Array.from(document.querySelectorAll(".nav-link, .nav-cta"));
  const sectionLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
  const sections = Array.from(document.querySelectorAll("section[id]"));

  if (!nav && !toggle && sectionLinks.length === 0) {
    window.__dhaNavCleanup = () => {};
    return;
  }

  const closeNav = () => {
    if (nav) nav.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  };

  const toggleNav = () => {
    if (!nav || !toggle) return;
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };

  const onToggleClick = () => {
    toggleNav();
  };

  const onLinkClick = () => {
    closeNav();
  };

  const onResize = () => {
    if (window.innerWidth >= 860) {
      closeNav();
    }
  };

  const onKeydown = (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  };

  let rafId = 0;
  let activeHref = "";

  const updateActiveSection = () => {
    rafId = 0;
    if (sectionLinks.length === 0 || sections.length === 0) return;

    const offset = 80;
    const targetLine = offset;
    let closestSection = sections[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const section of sections) {
      const distance = Math.abs(section.getBoundingClientRect().top - targetLine);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSection = section;
      }
    }

    const nextHref = closestSection ? `#${closestSection.id}` : "";
    if (nextHref === activeHref) return;
    activeHref = nextHref;

    for (const link of sectionLinks) {
      if (link.getAttribute("href") === activeHref) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  };

  const requestActiveSectionUpdate = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(updateActiveSection);
  };

  if (toggle) {
    toggle.addEventListener("click", onToggleClick);
  }

  for (const link of navLinks) {
    link.addEventListener("click", onLinkClick);
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", requestActiveSectionUpdate, { passive: true });
  document.addEventListener("keydown", onKeydown);

  requestActiveSectionUpdate();

  window.__dhaNavCleanup = () => {
    if (toggle) {
      toggle.removeEventListener("click", onToggleClick);
    }

    for (const link of navLinks) {
      link.removeEventListener("click", onLinkClick);
    }

    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", requestActiveSectionUpdate);
    document.removeEventListener("keydown", onKeydown);

    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
})();
