(() => {
  const FIREBASE_VERSION = "11.6.0";
  const APP_BASE = (() => {
    const path = window.location.pathname;
    if (path.includes("/projectX")) return "/projectX/";
    return "/";
  })();

  function loginHref() {
    return `${APP_BASE}login.html`;
  }

  function homeHref() {
    return APP_BASE === "/" ? "/" : APP_BASE;
  }

  function isConfigured() {
    const cfg = window.AUTH_CONFIG && window.AUTH_CONFIG.firebase;
    return Boolean(cfg && cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
  }

  function ensureAuthSlot() {
    const nav = document.querySelector(".site-nav");
    if (!nav) return null;

    let slot = document.getElementById("auth-slot");
    if (slot) return slot;

    slot = document.createElement("div");
    slot.id = "auth-slot";
    slot.className = "auth-slot";
    nav.appendChild(slot);
    return slot;
  }

  function renderSignedOut(slot) {
    slot.replaceChildren();
    const link = document.createElement("a");
    link.className = "auth-link";
    link.href = loginHref();
    link.textContent = "Log in";
    slot.appendChild(link);
  }

  function renderSignedIn(slot, user, onSignOut) {
    const name = user.displayName || user.email || "Signed in";
    slot.replaceChildren();

    const userEl = document.createElement("div");
    userEl.className = "auth-user";
    userEl.title = name;

    if (user.photoURL) {
      const img = document.createElement("img");
      img.className = "auth-avatar";
      img.src = user.photoURL;
      img.alt = "";
      img.width = 28;
      img.height = 28;
      img.referrerPolicy = "no-referrer";
      userEl.appendChild(img);
    } else {
      const fallback = document.createElement("span");
      fallback.className = "auth-avatar auth-avatar-fallback";
      fallback.setAttribute("aria-hidden", "true");
      fallback.textContent = name.slice(0, 1).toUpperCase();
      userEl.appendChild(fallback);
    }

    const nameEl = document.createElement("span");
    nameEl.className = "auth-name";
    nameEl.textContent = name;
    userEl.appendChild(nameEl);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "auth-sign-out";
    btn.id = "auth-sign-out";
    btn.textContent = "Sign out";
    btn.addEventListener("click", onSignOut);

    slot.append(userEl, btn);
  }

  function setLoginStatus(message, tone) {
    const el = document.getElementById("login-status");
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
    el.dataset.tone = tone || "info";
  }

  function setProviderBusy(busy, activeProvider) {
    document.querySelectorAll("[data-provider]").forEach((btn) => {
      const label = btn.querySelector(".btn-label");
      const isActive = btn.getAttribute("data-provider") === activeProvider;
      btn.disabled = busy;
      if (!label) return;

      if (!btn.dataset.originalLabel) {
        btn.dataset.originalLabel = label.textContent.trim();
      }

      if (busy && isActive) {
        btn.setAttribute("aria-busy", "true");
        label.textContent = "Connecting…";
      } else {
        btn.removeAttribute("aria-busy");
        label.textContent = btn.dataset.originalLabel;
      }
    });
  }

  function showSetupPanel() {
    const panel = document.getElementById("login-setup");
    const actions = document.getElementById("login-actions");
    if (panel) panel.hidden = false;
    if (actions) actions.hidden = true;
    setLoginStatus(
      "Auth is not configured yet. Add your Firebase web config in auth-config.js.",
      "warn"
    );
  }

  async function loadFirebase() {
    const [{ initializeApp }, authMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
    ]);

    const app = initializeApp(window.AUTH_CONFIG.firebase);
    const auth = authMod.getAuth(app);
    return { auth, authMod };
  }

  function preferRedirect() {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 640px)").matches;
    return coarse || narrow;
  }

  async function startSignIn(providerName, auth, authMod) {
    const provider =
      providerName === "google"
        ? new authMod.GoogleAuthProvider()
        : new authMod.TwitterAuthProvider();

    setProviderBusy(true, providerName);
    setLoginStatus("", "info");

    try {
      if (preferRedirect()) {
        await authMod.signInWithRedirect(auth, provider);
        return;
      }
      await authMod.signInWithPopup(auth, provider);
      window.location.href = homeHref();
    } catch (err) {
      const code = err && err.code ? String(err.code) : "";
      const message = err && err.message ? String(err.message) : "Sign-in failed.";

      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
        try {
          await authMod.signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          setLoginStatus((redirectErr && redirectErr.message) || message, "error");
        }
      } else if (code === "auth/operation-not-allowed") {
        setLoginStatus(
          `${providerName === "google" ? "Google" : "X"} sign-in is disabled in Firebase. Enable it under Authentication → Sign-in method.`,
          "error"
        );
      } else if (code === "auth/unauthorized-domain") {
        setLoginStatus(
          "This domain is not authorized. Add ageoffron.github.io in Firebase Authentication → Settings → Authorized domains.",
          "error"
        );
      } else {
        setLoginStatus(message, "error");
      }
      setProviderBusy(false, null);
    }
  }

  function wireLoginPage(auth, authMod) {
    const googleBtn = document.querySelector('[data-provider="google"]');
    const xBtn = document.querySelector('[data-provider="x"]');

    if (googleBtn) {
      googleBtn.addEventListener("click", () => startSignIn("google", auth, authMod));
    }
    if (xBtn) {
      xBtn.addEventListener("click", () => startSignIn("x", auth, authMod));
    }
  }

  async function init() {
    const slot = ensureAuthSlot();
    const onLoginPage = Boolean(document.getElementById("login-actions"));

    if (!isConfigured()) {
      if (slot) renderSignedOut(slot);
      if (onLoginPage) showSetupPanel();
      return;
    }

    const { auth, authMod } = await loadFirebase();

    try {
      const result = await authMod.getRedirectResult(auth);
      if (result && result.user && onLoginPage) {
        window.location.replace(homeHref());
        return;
      }
    } catch (err) {
      if (onLoginPage) {
        setLoginStatus((err && err.message) || "Sign-in redirect failed.", "error");
      }
    }

    if (onLoginPage) wireLoginPage(auth, authMod);

    authMod.onAuthStateChanged(auth, (user) => {
      if (!slot) return;
      if (user) {
        renderSignedIn(slot, user, async () => {
          await authMod.signOut(auth);
          if (onLoginPage) window.location.href = loginHref();
        });
        if (onLoginPage) {
          setLoginStatus(`Signed in as ${user.displayName || user.email || "user"}.`, "ok");
        }
      } else {
        renderSignedOut(slot);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
