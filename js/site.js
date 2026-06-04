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
    const inspirationPieces = veil
      ? gsap.utils.toArray(veil.querySelectorAll(".inspiration-piece"))
      : [];
    const inspirationPrev = veil?.querySelector("[data-inspiration-prev]");
    const inspirationNext = veil?.querySelector("[data-inspiration-next]");
    const pushLayers = main ? [main] : [];
    let inspirationTl;
    let inspirationCtx;
    let isInspirationOpen = false;
    let inspirationIndex = 0;
    let inspirationVideosReady = false;

    function getActivePiece() {
      return inspirationPieces[inspirationIndex];
    }

    function setInspirationSlide(nextIndex, options = {}) {
      const count = inspirationPieces.length;
      if (!count) return;

      const { animate = false } = options;
      inspirationIndex = ((nextIndex % count) + count) % count;

      inspirationPieces.forEach((piece, i) => {
        const active = i === inspirationIndex;
        piece.classList.toggle("is-active", active);
        piece.hidden = !active;
        if (!active && typeof gsap !== "undefined") {
          gsap.set(piece, { autoAlpha: 0, y: 0 });
        }
      });

      const navDisabled = count <= 1;
      if (inspirationPrev) inspirationPrev.disabled = navDisabled;
      if (inspirationNext) inspirationNext.disabled = navDisabled;

      if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const active = getActivePiece();
      if (!active) return;
      gsap.fromTo(
        active,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.26, ease: "power2.out" },
      );
    }

    function goInspirationPrev() {
      setInspirationSlide(inspirationIndex - 1, { animate: true });
    }

    function goInspirationNext() {
      setInspirationSlide(inspirationIndex + 1, { animate: true });
    }

    function buildYtEmbedUrl(videoId) {
      const url = new URL(`https://www.youtube.com/embed/${videoId}`);
      url.searchParams.set("rel", "0");
      url.searchParams.set("modestbranding", "1");
      if (location.origin && location.protocol !== "file:") {
        url.searchParams.set("origin", location.origin);
      }
      return url.toString();
    }

    function buildYtWatchUrl(videoId) {
      const url = new URL("https://www.youtube.com/watch");
      url.searchParams.set("v", videoId);
      return url.toString();
    }

    function replaceWithVideoFallback(iframe, videoId) {
      const fallback = document.createElement("a");
      const title = iframe.getAttribute("title") || "YouTube video";
      const icon = document.createElement("span");
      const kicker = document.createElement("span");
      const label = document.createElement("span");

      fallback.className = "inspiration-media inspiration-video-fallback";
      fallback.href = buildYtWatchUrl(videoId);
      fallback.target = "_blank";
      fallback.rel = "noopener";
      fallback.setAttribute("aria-label", `Open ${title} on YouTube`);

      icon.className = "inspiration-video-fallback-icon";
      icon.setAttribute("aria-hidden", "true");
      kicker.className = "inspiration-video-fallback-kicker";
      kicker.textContent = "Watch on YouTube";
      label.className = "inspiration-video-fallback-title";
      label.textContent = title;

      fallback.append(icon, kicker, label);
      iframe.replaceWith(fallback);
    }

    function loadInspirationVideos() {
      if (!veil || inspirationVideosReady) return;
      veil.querySelectorAll("iframe[data-yt-id]").forEach((iframe) => {
        const videoId = iframe.dataset.ytId;
        if (!videoId || iframe.getAttribute("src")) return;
        if (location.protocol === "file:") {
          replaceWithVideoFallback(iframe, videoId);
          return;
        }
        iframe.setAttribute("src", buildYtEmbedUrl(videoId));
        iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      });
      inspirationVideosReady = true;
    }

    function unloadInspirationVideos() {
      if (!veil) return;
      veil.querySelectorAll("iframe[data-yt-id]").forEach((iframe) => {
        iframe.removeAttribute("src");
      });
      inspirationVideosReady = false;
    }

    function resetInspirationPieces() {
      if (!inspirationPieces.length) return;
      gsap.set(inspirationPieces, { clearProps: "opacity,visibility,transform" });
      setInspirationSlide(0);
    }

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
        loadInspirationVideos();
        resetInspirationPieces();
        return;
      }

      gsap.set(pushLayers, { y: 0, clearProps: "transform" });
      gsap.set(veil, { autoAlpha: 0 });
      gsap.set(document.body, { backgroundColor: "" });
      unloadInspirationVideos();
      resetInspirationPieces();
    }

    function openInspiration() {
      isInspirationOpen = true;
      document.body.classList.add("inspiration-active");
      setInspirationA11y(true);
      setInspirationSlide(0);
      loadInspirationVideos();
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

    function onInspirationKeydown(event) {
      if (!isInspirationOpen) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goInspirationPrev();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goInspirationNext();
        return;
      }

      if (event.key !== "Escape") return;

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
      setInspirationSlide(0);
      inspirationBtn.addEventListener("click", onReducedMotionClick);
      inspirationPrev?.addEventListener("click", goInspirationPrev);
      inspirationNext?.addEventListener("click", goInspirationNext);
      document.addEventListener("keydown", onInspirationKeydown);

      return () => {
        inspirationBtn.removeEventListener("click", onReducedMotionClick);
        inspirationPrev?.removeEventListener("click", goInspirationPrev);
        inspirationNext?.removeEventListener("click", goInspirationNext);
        document.removeEventListener("keydown", onInspirationKeydown);
        applyInspirationInstant(false);
      };
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      inspirationCtx = gsap.context(() => {
        gsap.set(veil, { autoAlpha: 0 });
        gsap.set(pushLayers, { y: 0, force3D: true });
        gsap.set(inspirationLabel, { autoAlpha: 1, y: 0 });
        gsap.set(inspirationDown, { autoAlpha: 0, y: 8, pointerEvents: "none" });
        if (inspirationPieces.length) {
          gsap.set(inspirationPieces, { autoAlpha: 0, force3D: true });
          const activePiece = getActivePiece();
          if (activePiece) {
            gsap.set(activePiece, { y: 14, force3D: true });
          }
        }

        setInspirationSlide(0);

        inspirationTl = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.inOut" },
          onReverseComplete: () => {
            isInspirationOpen = false;
            document.body.classList.remove("inspiration-active");
            setInspirationA11y(false);
            unloadInspirationVideos();
            setInspirationSlide(0);
            if (inspirationPieces.length) {
              gsap.set(inspirationPieces, { autoAlpha: 0, y: 14 });
            }
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

        const activePiece = getActivePiece();
        if (activePiece) {
          inspirationTl.to(
            activePiece,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.38,
              ease: "power2.out",
            },
            0.22,
          );
        }
      });

      inspirationBtn.addEventListener("click", toggleInspiration);
      inspirationPrev?.addEventListener("click", goInspirationPrev);
      inspirationNext?.addEventListener("click", goInspirationNext);
      document.addEventListener("keydown", onInspirationKeydown);

      return () => {
        inspirationBtn.removeEventListener("click", toggleInspiration);
        inspirationPrev?.removeEventListener("click", goInspirationPrev);
        inspirationNext?.removeEventListener("click", goInspirationNext);
        document.removeEventListener("keydown", onInspirationKeydown);
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
