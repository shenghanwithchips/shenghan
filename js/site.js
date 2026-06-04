(function () {
  sessionStorage.removeItem("portfolio-work-enter");

  function prefetchAsset(href, as, type) {
    if (!href || document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
    const prefetch = document.createElement("link");
    prefetch.rel = "prefetch";
    prefetch.href = href;
    if (as) prefetch.as = as;
    if (type) prefetch.type = type;
    if (as === "font" && location.protocol !== "file:") {
      prefetch.crossOrigin = "anonymous";
    }
    document.head.appendChild(prefetch);
  }

  function prefetchPage(href) {
    prefetchAsset(href);
  }

  function isModifiedNavClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
  }

  const fontPreloadRoot = document.querySelector(
    'link[rel="preload"][href*="instrument-serif.woff2"]',
  );
  const fontsBase = fontPreloadRoot
    ? fontPreloadRoot.getAttribute("href")?.replace(/instrument-serif\.woff2$/, "") ?? ""
    : "";

  document.querySelectorAll('.index-link[href*="work/"]').forEach((link) => {
    link.addEventListener(
      "mouseenter",
      () => {
        prefetchPage(link.getAttribute("href"));
        if (fontsBase) {
          prefetchAsset(`${fontsBase}instrument-serif.woff2`, "font", "font/woff2");
          prefetchAsset(`${fontsBase}geist-400.woff2`, "font", "font/woff2");
        }
      },
      { once: true },
    );
  });

  const caseBack = document.querySelector(".case-back");
  if (caseBack) {
    const backHref = caseBack.getAttribute("href");
    caseBack.addEventListener("mouseenter", () => prefetchPage(backHref), { once: true });
    caseBack.addEventListener("click", (event) => {
      if (!backHref || isModifiedNavClick(event)) return;
      event.preventDefault();
      try {
        sessionStorage.setItem("portfolio-scroll-work", "1");
      } catch (_) {
        /* ignore */
      }
      window.location.assign(backHref);
    });
  }

  const inspirationBtn = document.querySelector("[data-inspiration]");
  const copyBtn = document.querySelector("[data-copy-email]");
  const toast = document.querySelector("[data-toast]");
  const email = copyBtn?.dataset.email;

  if (inspirationBtn && typeof gsap !== "undefined") {
    const shell = document.querySelector("[data-shell]");
    const main = shell?.querySelector(".main");
    const veil = document.querySelector("[data-inspiration-veil]");
    const pushLayers = main ? [main] : [];
    let inspirationTl;
    let inspirationCtx;
    let isInspirationOpen = false;

    /** 推动距离 = 主内容区（.main）高度，向上为负值 */
    function getContentPushY() {
      if (!main) return 0;
      return -main.offsetHeight;
    }

    const inspirationLabel = inspirationBtn.querySelector(".inspiration-btn-label");
    const inspirationDown = inspirationBtn.querySelector(".inspiration-btn-down");

    function setInspirationA11y(active) {
      inspirationBtn.setAttribute("aria-pressed", String(active));
      inspirationBtn.setAttribute(
        "aria-label",
        active ? "Pull down to return" : "Inspirations",
      );
      veil?.setAttribute("aria-hidden", String(!active));
      inspirationLabel?.setAttribute("aria-hidden", String(active));
      inspirationDown?.setAttribute("aria-hidden", String(!active));
    }

    function setInspirationButtonVisual(active) {
      gsap.set(inspirationLabel, {
        autoAlpha: active ? 0 : 1,
        y: active ? -6 : 0,
        pointerEvents: "none",
      });
      gsap.set(inspirationDown, {
        autoAlpha: active ? 1 : 0,
        y: active ? 0 : 8,
        pointerEvents: active ? "auto" : "none",
      });
    }

    function applyInspirationInstant(active) {
      isInspirationOpen = active;
      document.body.classList.toggle("inspiration-active", active);
      setInspirationA11y(active);
      setInspirationButtonVisual(active);

      if (active) {
        gsap.set(main, { y: getContentPushY() });
        gsap.set(veil, { autoAlpha: 1 });
        gsap.set(document.body, { backgroundColor: "#000000" });
        return;
      }

      gsap.set(pushLayers, { y: 0, clearProps: "transform" });
      gsap.set(veil, { autoAlpha: 0 });
      gsap.set(document.body, { backgroundColor: "" });
    }

    function openInspiration() {
      isInspirationOpen = true;
      document.body.classList.add("inspiration-active");
      setInspirationA11y(true);
      inspirationTl.play(0);
    }

    function closeInspiration() {
      inspirationTl?.reverse();
    }

    function toggleInspiration() {
      if (inspirationTl.isActive()) return;
      if (isInspirationOpen) {
        closeInspiration();
        return;
      }
      openInspiration();
    }

    const mm = gsap.matchMedia();

    function onInspirationEscape(event) {
      if (event.key !== "Escape" || !isInspirationOpen) return;
      if (inspirationTl) {
        closeInspiration();
      } else {
        applyInspirationInstant(false);
      }
      inspirationBtn.focus();
    }

    function onReducedMotionClick() {
      applyInspirationInstant(!isInspirationOpen);
    }

    mm.add("(prefers-reduced-motion: reduce)", () => {
      inspirationBtn.addEventListener("click", onReducedMotionClick);
      document.addEventListener("keydown", onInspirationEscape);

      return () => {
        inspirationBtn.removeEventListener("click", onReducedMotionClick);
        document.removeEventListener("keydown", onInspirationEscape);
        applyInspirationInstant(false);
      };
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      inspirationCtx = gsap.context(() => {
        gsap.set(veil, { autoAlpha: 0 });
        gsap.set(pushLayers, { y: 0, force3D: true });
        gsap.set(inspirationLabel, { autoAlpha: 1, y: 0 });
        gsap.set(inspirationDown, { autoAlpha: 0, y: 8, pointerEvents: "none" });

        inspirationTl = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.inOut" },
          onReverseComplete: () => {
            isInspirationOpen = false;
            document.body.classList.remove("inspiration-active");
            setInspirationA11y(false);
          },
        })
          .to(main, { y: getContentPushY, duration: 0.4 }, 0)
          .to(veil, { autoAlpha: 1, duration: 0.34 }, "<0.12")
          .to(document.body, { backgroundColor: "#000000", duration: 0.34 }, "<")
          .to(
            inspirationLabel,
            { autoAlpha: 0, y: -6, duration: 0.22, ease: "power2.in" },
            "<0.1",
          )
          .to(
            inspirationDown,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.3,
              ease: "power2.out",
              pointerEvents: "auto",
            },
            "<0.06",
          );
      });

      inspirationBtn.addEventListener("click", toggleInspiration);
      document.addEventListener("keydown", onInspirationEscape);

      return () => {
        inspirationBtn.removeEventListener("click", toggleInspiration);
        document.removeEventListener("keydown", onInspirationEscape);
        inspirationCtx?.revert();
        inspirationCtx = null;
        inspirationTl = null;
        isInspirationOpen = false;
        document.body.classList.remove("inspiration-active");
        setInspirationA11y(false);
      };
    });
  }

  const proseImages = document.querySelectorAll(".prose-figure img");
  if (proseImages.length) {
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Enlarged image");
    lightbox.innerHTML = `
      <button type="button" class="lightbox-backdrop" aria-label="Close"></button>
      <figure class="lightbox-panel">
        <img class="lightbox-img" alt="">
        <figcaption class="lightbox-caption"></figcaption>
      </figure>
      <button type="button" class="lightbox-close" aria-label="Close">Close</button>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector(".lightbox-img");
    const lightboxCaption = lightbox.querySelector(".lightbox-caption");
    const closeBtn = lightbox.querySelector(".lightbox-close");
    const backdrop = lightbox.querySelector(".lightbox-backdrop");
    let lastFocus = null;

    function openLightbox(source) {
      lastFocus = document.activeElement;
      lightboxImg.src = source.currentSrc || source.src;
      lightboxImg.alt = source.alt;
      lightboxCaption.textContent =
        source.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || "";
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.classList.remove("lightbox-open");
      lightboxImg.removeAttribute("src");
      lightboxCaption.textContent = "";
      lastFocus?.focus();
    }

    proseImages.forEach((img) => {
      img.tabIndex = 0;
      img.addEventListener("click", () => openLightbox(img));
      img.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openLightbox(img);
      });
    });

    closeBtn.addEventListener("click", closeLightbox);
    backdrop.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }

  if (copyBtn && email && toast) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email);
        toast.textContent = "Copied to clipboard";
      } catch {
        window.location.href = `mailto:${email}`;
        toast.textContent = "Opening mail…";
      }
      window.setTimeout(() => {
        toast.textContent = "";
      }, 2200);
    });
  }
})();
