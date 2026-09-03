# Anthony Geoffron

GitHub Pages site: **https://ageoffron.github.io/projectX/**

## Enable Pages

1. **Settings → Pages**
2. Build: **GitHub Actions**, or deploy `main` from `/ (root)`

## Login (Google + X)

Sign-in uses [Firebase Authentication](https://firebase.google.com/docs/auth) so the static Pages site can offer Google and X without a custom backend.

### 1. Firebase project

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Add a **Web** app and copy its config into `auth-config.js`.
3. Open **Authentication → Sign-in method** and enable:
   - **Google**
   - **Twitter** (this is X)
4. Under **Authentication → Settings → Authorized domains**, add `ageoffron.github.io`.

### 2. Google provider

Firebase can create the Google OAuth client for you when you enable Google sign-in. Confirm the authorized JavaScript origin includes your Pages host (`https://ageoffron.github.io`).

### 3. X (Twitter) provider

1. Create an app in the [X Developer Portal](https://developer.x.com/).
2. Copy the **API Key** and **API Secret Key**.
3. In Firebase, open the Twitter provider settings and paste those values.
4. Set the X app callback URL to the value Firebase shows, typically:

   `https://<your-project-id>.firebaseapp.com/__/auth/handler`

### 4. Deploy

Commit the filled-in `auth-config.js` (web API keys are expected to be public; protect the project with authorized domains and provider settings) and push to `main`.

Visit `/login.html` or use **Log in** in the header.
