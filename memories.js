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

  if (!gate || !content || !form || !rail) return;

  let mediaReady = false;

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

  function renderGallery(photos, lightbox) {
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
        const photos = Array.isArray(list) ? list : [];
        if (!photos.length) {
          rail.innerHTML =
            '<p class="gallery-fallback">Photos could not be loaded.</p>';
          return;
        }
        renderGallery(photos, lightbox);
      })
      .catch(() => {
        rail.innerHTML =
          '<p class="gallery-fallback">Photos could not be loaded.</p>';
      });
  }
})();
