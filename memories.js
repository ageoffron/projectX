(function () {
  // SHA-256 of the shared Memories password. Change PASSWORD_HASH after updating.
  // Default password: gilda2026
  const PASSWORD_HASH =
    "9c4a5c67cd279a958fac540dea824b867f607ac29139e4a7045b082c67b8ea48";
  const UNLOCK_KEY = "memories-unlocked-v1";

  const gate = document.getElementById("memories-gate");
  const content = document.getElementById("memories-content");
  const form = document.getElementById("memories-unlock-form");
  const passwordInput = document.getElementById("memories-password");
  const unlockError = document.getElementById("memories-unlock-error");
  const rail = document.getElementById("memory-photos");

  const slideImage = document.getElementById("slideshow-image");
  const slideStatus = document.getElementById("slideshow-status");
  const slideCounter = document.getElementById("slideshow-counter");
  const playBtn = document.getElementById("slideshow-play");
  const prevBtn = document.getElementById("slideshow-prev");
  const nextBtn = document.getElementById("slideshow-next");
  const delayInput = document.getElementById("slideshow-delay");
  const delayValue = document.getElementById("slideshow-delay-value");
  const audioInput = document.getElementById("slideshow-audio-file");
  const audioEl = document.getElementById("slideshow-audio");

  if (!gate || !content || !form || !rail) return;

  let photos = [];
  let index = 0;
  let playing = false;
  let timer = null;
  let mediaReady = false;
  let audioObjectUrl = null;

  async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function setUnlocked(unlocked) {
    gate.hidden = unlocked;
    content.hidden = !unlocked;
    if (unlocked) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      if (!mediaReady) initMedia();
    } else {
      sessionStorage.removeItem(UNLOCK_KEY);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    unlockError.hidden = true;
    const guess = passwordInput.value || "";
    const hash = await sha256Hex(guess);
    if (hash === PASSWORD_HASH) {
      passwordInput.value = "";
      setUnlocked(true);
    } else {
      unlockError.hidden = false;
      passwordInput.select();
    }
  });

  if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
    setUnlocked(true);
  } else {
    setUnlocked(false);
  }

  function delayMs() {
    return Math.max(0.5, Number(delayInput.value) || 2.5) * 1000;
  }

  function updateDelayLabel() {
    delayValue.textContent = `${Number(delayInput.value).toFixed(1)}s`;
  }

  function showSlide(i) {
    if (!photos.length) return;
    index = (i + photos.length) % photos.length;
    const photo = photos[index];
    slideImage.src = photo.src;
    slideImage.alt = photo.alt || `Memory photo ${index + 1}`;
    slideCounter.textContent = `${index + 1} / ${photos.length}`;
    slideStatus.hidden = true;
  }

  function stopSlideshow() {
    playing = false;
    playBtn.textContent = "Play";
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (audioEl && !audioEl.paused) {
      audioEl.pause();
    }
  }

  function scheduleNext() {
    if (!playing) return;
    timer = setTimeout(() => {
      showSlide(index + 1);
      scheduleNext();
    }, delayMs());
  }

  function startSlideshow() {
    if (!photos.length) return;
    playing = true;
    playBtn.textContent = "Pause";
    if (audioEl && audioEl.src) {
      audioEl.play().catch(() => {});
    }
    scheduleNext();
  }

  function togglePlay() {
    if (playing) stopSlideshow();
    else startSlideshow();
  }

  function buildLightbox() {
    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close">Close</button>' +
      '<img alt="" />';
    document.body.appendChild(dialog);

    const lightImg = dialog.querySelector("img");
    const closeBtn = dialog.querySelector(".lightbox-close");

    function closeLightbox() {
      if (dialog.open) dialog.close();
    }

    closeBtn.addEventListener("click", closeLightbox);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeLightbox();
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeLightbox();
    });

    return { dialog, lightImg };
  }

  function renderGallery(lightbox) {
    rail.innerHTML = "";
    const frag = document.createDocumentFragment();
    photos.forEach((photo, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "photo-tile";
      button.setAttribute("aria-label", `Open memory photo ${i + 1}`);

      const img = document.createElement("img");
      img.src = photo.thumb;
      img.alt = photo.alt || `Memory photo ${i + 1}`;
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 480;
      img.height = 480;

      button.appendChild(img);
      button.addEventListener("click", () => {
        lightbox.lightImg.src = photo.src;
        lightbox.lightImg.alt = photo.alt || `Memory photo ${i + 1}`;
        if (typeof lightbox.dialog.showModal === "function") {
          lightbox.dialog.showModal();
        }
      });
      frag.appendChild(button);
    });
    rail.appendChild(frag);
  }

  function initMedia() {
    mediaReady = true;
    const lightbox = buildLightbox();

    fetch("assets/memories/manifest.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load photo list");
        return res.json();
      })
      .then((list) => {
        photos = Array.isArray(list) ? list : [];
        if (!photos.length) {
          slideStatus.textContent = "No photos found.";
          rail.innerHTML =
            '<p class="gallery-fallback">Photos could not be loaded.</p>';
          return;
        }
        showSlide(0);
        renderGallery(lightbox);
      })
      .catch(() => {
        slideStatus.textContent = "Photos could not be loaded.";
        rail.innerHTML =
          '<p class="gallery-fallback">Photos could not be loaded.</p>';
      });

    updateDelayLabel();
    delayInput.addEventListener("input", () => {
      updateDelayLabel();
      if (playing) {
        clearTimeout(timer);
        scheduleNext();
      }
    });

    playBtn.addEventListener("click", togglePlay);
    prevBtn.addEventListener("click", () => {
      showSlide(index - 1);
      if (playing) {
        clearTimeout(timer);
        scheduleNext();
      }
    });
    nextBtn.addEventListener("click", () => {
      showSlide(index + 1);
      if (playing) {
        clearTimeout(timer);
        scheduleNext();
      }
    });

    audioInput.addEventListener("change", () => {
      const file = audioInput.files && audioInput.files[0];
      if (audioObjectUrl) {
        URL.revokeObjectURL(audioObjectUrl);
        audioObjectUrl = null;
      }
      if (!file) {
        audioEl.removeAttribute("src");
        audioEl.hidden = true;
        audioEl.load();
        return;
      }
      audioObjectUrl = URL.createObjectURL(file);
      audioEl.src = audioObjectUrl;
      audioEl.hidden = false;
      audioEl.load();
      if (playing) {
        audioEl.play().catch(() => {});
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && playing) stopSlideshow();
    });
  }
})();
