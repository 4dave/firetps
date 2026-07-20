# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Firebase setup

This app is set up to read Firebase web config from Vite environment variables so the values stay out of git.

Create a local `.env.local` file with values like this:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
```

Then initialize Hosting and deploy the Vite build output:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
pnpm run build
firebase deploy
```

For Vite, the hosting public directory should be `dist` and the app should be configured as a single-page app.

Note: the Firebase web config is safe to keep out of git, but it is still public in the browser bundle after build. If you need real secrets, keep them on the server or in Cloud Functions.

## GitHub Actions Deployment

This repo includes four workflows:

- `.github/workflows/ci.yml`: runs `pnpm build` on pull requests to `main`
- `.github/workflows/hosting-preview.yml`: deploys pull requests to the stable staging Hosting site
- `.github/workflows/hosting-production.yml`: deploys Hosting to `live` on push to `main`
- `.github/workflows/firestore-deploy.yml`: deploys Firestore rules/indexes when related files change on `main`

### Required GitHub configuration

1. Add repository secret `FIREBASE_SERVICE_ACCOUNT_FIRETPSAPP`

- Firebase Console -> Project Settings -> Service accounts -> Generate new private key
- Paste the full JSON into the secret value

2. Create GitHub environment `production` (used by production Hosting and Firestore workflows)
3. Optional but recommended: require manual approval for `production` environment
4. Optional but recommended: protect `main` branch and require CI checks

### Repository-level Firebase web config for workflow builds

Add these values at the repository level in GitHub Actions (Settings -> Secrets and variables -> Actions):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Use repository-level variables/secrets for these values, not only environment-scoped values, because PR/staging workflows may not run in the `production` environment context.

### Stable staging site for auth testing

Firebase Auth authorized domains do not support wildcards, so PR preview channels are a poor fit for Google sign-in. This repo is configured to use a dedicated staging Hosting site instead.

Create the staging site once:

```bash
firebase hosting:sites:create firetpsapp-staging
```

Then add the staging domain to Firebase Authentication -> Settings -> Authorized domains:

- `firetpsapp-staging.web.app`
- `firetpsapp-staging.firebaseapp.com`

The checked-in `.firebaserc` maps:

- `production` -> `firetpsapp`
- `staging` -> `firetpsapp-staging`

If you choose a different staging site id, update `.firebaserc` to match.

Once configured, merges to `main` will deploy Hosting automatically, and Firestore rules/index changes will deploy via the Firestore workflow.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x"
import reactDom from "eslint-plugin-react-dom"

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
