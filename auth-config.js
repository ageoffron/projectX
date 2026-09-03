/**
 * Firebase web config for Google + X (Twitter) sign-in.
 *
 * 1. Create a project at https://console.firebase.google.com
 * 2. Add a Web app and paste its config below
 * 3. Authentication → Sign-in method → enable Google and Twitter
 * 4. Authentication → Settings → Authorized domains → add ageoffron.github.io
 * 5. For Twitter/X: create an app at https://developer.x.com and paste
 *    API Key + API Secret into the Firebase Twitter provider settings.
 *    Callback URL (from Firebase): https://<project>.firebaseapp.com/__/auth/handler
 *
 * Leave apiKey empty until configured — the login UI will show setup help.
 */
window.AUTH_CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: "",
  },
};
