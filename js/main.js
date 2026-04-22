/* =========================
   js/main.js (FULL FILE)
   Safe across all pages:
   - Theme toggle (defaults to light unless saved dark)
   - Theme-aware preview video swap (.js-theme-video only)
   - Footer year
   - Featured section ONLY if featured markup exists
   - Client hero: tap-to-reveal ONLY if tiles exist + touch device
========================= */

(() => {
  /* -------------------------
     THEME TOGGLE
  ------------------------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById("themeToggle");

  const getIsLight = () => root.getAttribute("data-theme") === "light";

  const setThemeIcon = () => {
    if (!themeBtn) return;
    const iconSpan = themeBtn.querySelector(".theme-switch__icon");
    if (!iconSpan) return;

    iconSpan.innerHTML = getIsLight()
      ? '<i class="bi bi-moon-stars"></i>'
      : '<i class="bi bi-sun"></i>';
  };

  const setThemeVideos = () => {
    const isLight = getIsLight();
    const videos = document.querySelectorAll(".js-theme-video");
    if (!videos.length) return;

    videos.forEach((v) => {
      const dark = v.dataset.srcDark;
      const light = v.dataset.srcLight;

      const nextSrc = isLight ? (light || dark) : (dark || light);
      if (!nextSrc) return;

      // If a <source> exists, update that (best practice)
      const source = v.querySelector("source");
      if (source) {
        if (source.getAttribute("src") !== nextSrc) {
          source.setAttribute("src", nextSrc);
          v.load();
          v.play().catch(() => {});
        }
        return;
      }

      // Otherwise set video.src directly
      const absoluteNext = new URL(nextSrc, window.location.href).href;
      if (v.src !== absoluteNext) {
        v.src = nextSrc;
        v.load();
        v.play().catch(() => {});
      }
    });
  };

// Default to DARK theme unless user chose light
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
  root.setAttribute("data-theme", "light");
} else {
  // Default = dark
  root.removeAttribute("data-theme");
}

  // Initial paint
  setThemeIcon();
  setThemeVideos();

  // Toggle theme
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      if (getIsLight()) {
        root.removeAttribute("data-theme");
        localStorage.setItem("theme", "dark");
      } else {
        root.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      }

      setThemeIcon();
      setThemeVideos();
    });
  }

  /* -------------------------
     FOOTER YEAR (safe on all pages)
  ------------------------- */
  const footerYear = document.getElementById("footerYear");
  if (footerYear) footerYear.textContent = new Date().getFullYear();


  /* -------------------------
     CLIENT HERO: TAP TO REVEAL (touch only)
  ------------------------- */
  (() => {
    const tiles = document.querySelectorAll(".client-tile");
    if (!tiles.length) return;

    const isTouch =
      window.matchMedia("(hover: none)").matches ||
      navigator.maxTouchPoints > 0;

    if (!isTouch) return;

    tiles.forEach((tile) => {
      tile.addEventListener("click", (e) => {
        if (!tile.classList.contains("is-revealed")) {
          e.preventDefault();
          tiles.forEach((t) => t.classList.remove("is-revealed"));
          tile.classList.add("is-revealed");
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".client-tile")) {
        tiles.forEach((t) => t.classList.remove("is-revealed"));
      }
    });
  })();

    /* -------------------------
     HOMEPAGE SCROLLYTELLING
  ------------------------- */
  (() => {
    const scrollyVisual = document.querySelector(".scrolly-visual");
    const scrollyImage = document.getElementById("scrollyImage");
    const scrollyParallax = document.querySelector(".scrolly-preview__parallax");
    const scrollySteps = document.querySelector(".scrolly-steps");
    const steps = document.querySelectorAll(".scrolly-step");
    const eyebrow = document.getElementById("scrollyEyebrow");
    const heading = document.getElementById("scrollyHeading");
    const text = document.getElementById("scrollyText");

    if (!scrollyVisual || !scrollyImage || !scrollyParallax || !scrollySteps || !steps.length || !eyebrow || !heading || !text) return;

    const initialStep = document.querySelector(".scrolly-step.is-active") || steps[0];
    const desktopScrolly = window.matchMedia("(min-width: 992px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeStep = null;
    const centeredSteps = new Set();
    let visualAnimationFrame = null;
    let visualAnimationTimeout = null;
    let observer = null;
    let parallaxFrame = null;

    const updateParallax = () => {
      parallaxFrame = null;

      if (!desktopScrolly.matches || reducedMotion.matches) {
        scrollyVisual.style.setProperty("--scrolly-parallax-offset", "0px");
        return;
      }

      const visualRect = scrollyVisual.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const visualCenter = visualRect.top + visualRect.height / 2;
      const distanceFromCenter = visualCenter - viewportCenter;
      const clampedOffset = Math.max(-12, Math.min(12, distanceFromCenter * -0.04));

      scrollyVisual.style.setProperty("--scrolly-parallax-offset", `${clampedOffset.toFixed(2)}px`);
    };

    const requestParallaxUpdate = () => {
      if (parallaxFrame) return;
      parallaxFrame = requestAnimationFrame(updateParallax);
    };

    const updateProgressIndicator = (step) => {
      if (!step) return;

      const progressOffset = step.offsetTop + 37;
      scrollySteps.style.setProperty("--scrolly-progress-height", `${progressOffset}px`);
    };

    const updateVisualConnection = (step) => {
      if (!step) return;

      scrollyVisual.style.setProperty("--scrolly-active-step", step.dataset.step || "1");
    };

    const updateVisualImage = (step) => {
      if (!step) return;

      const nextImage = step.dataset.image || "";
      const nextAlt = step.dataset.imageAlt || step.dataset.title || "";

      if (nextImage && scrollyImage.getAttribute("src") !== nextImage) {
        scrollyImage.setAttribute("src", nextImage);
      }

      scrollyImage.setAttribute("alt", nextAlt);
    };

    const triggerVisualRefresh = () => {
      if (visualAnimationFrame) cancelAnimationFrame(visualAnimationFrame);
      if (visualAnimationTimeout) clearTimeout(visualAnimationTimeout);

      scrollyVisual.classList.remove("is-animating");

      visualAnimationFrame = requestAnimationFrame(() => {
        scrollyVisual.classList.add("is-animating");
        visualAnimationTimeout = window.setTimeout(() => {
          scrollyVisual.classList.remove("is-animating");
        }, 400);
      });
    };

    const setActiveStep = (step, options = {}) => {
      const { animate = true } = options;

      if (!step || step === activeStep) return;

      steps.forEach((s) => s.classList.remove("is-active"));
      step.classList.add("is-active");
      activeStep = step;
      updateProgressIndicator(step);
      updateVisualConnection(step);
      updateVisualImage(step);

      const nextEyebrow = step.dataset.eyebrow || "";
      const nextTitle = step.dataset.title || "";
      const nextText = step.dataset.text || "";
      const nextStep = step.dataset.step || "1";

      eyebrow.textContent = nextEyebrow;
      heading.textContent = nextTitle;
      text.textContent = nextText;
      scrollyVisual.setAttribute("data-step", nextStep);

      if (animate) {
        triggerVisualRefresh();
      }
    };

    const getClosestStepToViewportCenter = (candidates) => {
      const viewportCenter = window.innerHeight / 2;

      return candidates.reduce((closestStep, step) => {
        if (!closestStep) return step;

        const stepRect = step.getBoundingClientRect();
        const stepCenter = stepRect.top + stepRect.height / 2;
        const closestRect = closestStep.getBoundingClientRect();
        const closestCenter = closestRect.top + closestRect.height / 2;

        return Math.abs(stepCenter - viewportCenter) < Math.abs(closestCenter - viewportCenter)
          ? step
          : closestStep;
      }, null);
    };

    const handleDesktopChange = () => {
      centeredSteps.clear();

      if (observer) {
        observer.disconnect();
        observer = null;
      }

      if (!desktopScrolly.matches) {
        scrollyVisual.style.setProperty("--scrolly-parallax-offset", "0px");
      }

      setActiveStep(activeStep || initialStep, { animate: false });

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              centeredSteps.add(entry.target);
            } else {
              centeredSteps.delete(entry.target);
            }
          });

          if (centeredSteps.size) {
            setActiveStep(getClosestStepToViewportCenter([...centeredSteps]));
          }
        },
        {
          rootMargin: "-40% 0px -40% 0px",
          threshold: 0
        }
      );

      steps.forEach((step) => observer.observe(step));
      requestParallaxUpdate();
    };

    handleDesktopChange();
    desktopScrolly.addEventListener("change", handleDesktopChange);
    reducedMotion.addEventListener("change", handleDesktopChange);
    window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
    window.addEventListener("resize", () => {
      requestParallaxUpdate();
      updateProgressIndicator(activeStep || initialStep);
    });
  })();

})();
