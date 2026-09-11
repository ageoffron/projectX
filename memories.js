(function () {
  const rail = document.getElementById("memory-photos");
  if (!rail) return;

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

  fetch("assets/memories/manifest.json")
    .then((res) => {
      if (!res.ok) throw new Error("Could not load photo list");
      return res.json();
    })
    .then((photos) => {
      const frag = document.createDocumentFragment();
      photos.forEach((photo, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "photo-tile";
        button.setAttribute(
          "aria-label",
          `Open memory photo ${index + 1}`
        );

        const img = document.createElement("img");
        img.src = photo.thumb;
        img.alt = photo.alt || `Memory photo ${index + 1}`;
        img.loading = "lazy";
        img.decoding = "async";
        img.width = 480;
        img.height = 480;

        button.appendChild(img);
        button.addEventListener("click", () => {
          lightImg.src = photo.src;
          lightImg.alt = photo.alt || `Memory photo ${index + 1}`;
          if (typeof dialog.showModal === "function") {
            dialog.showModal();
          }
        });
        frag.appendChild(button);
      });
      rail.appendChild(frag);
    })
    .catch(() => {
      rail.innerHTML =
        '<p class="gallery-fallback">Photos could not be loaded.</p>';
    });
})();
