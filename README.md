# Observable Products App

A Vue and TypeScript SPA for the CIS3039 Week 8 observability lab. Run the app
locally with Vite to list synthetic Products from the
[Products Function API](https://github.com/tpdavison/cis3039-example-observability-svc).
The browser sends dependency telemetry to its own Application Insights resource.

The interface is read-only. It displays loading, empty and error states, with a
Retry button when a request fails. Use the worksheet for the ordered lab activities
and backend deployment instructions.

## Local setup

Start Docker, then open VS Code with the Dev Containers extension installed.

If you already have a private copy of this repository, open it and choose
**Dev Containers: Reopen in Container**, then continue with dependency installation.
Otherwise:

1. Use **Git: Clone** in VS Code to clone
   `https://github.com/tpdavison/cis3039-example-observability-app.git`.
2. Open the cloned folder and choose **Dev Containers: Reopen in Container**.
3. Create an empty **private** GitHub repository without an initial README,
   licence or `.gitignore`.
4. In the Dev Container terminal, enter your private repository's HTTPS URL:

```bash
PRIVATE_REPOSITORY_URL='YOUR_PRIVATE_REPOSITORY_HTTPS_URL'
git remote set-url origin "$PRIVATE_REPOSITORY_URL"
git remote -v
git branch --show-current
```

Check that both remote URLs point to your private repository and the branch is
`main`, then copy the existing history to it:

```bash
git push -u origin main
```

Run the remaining commands at the repository root in the course Dev Container.
It supplies Node.js 22 and npm. Install the versions recorded in the lockfile:

```bash
npm ci
```

## Backend and monitoring setup

Use the worksheet to configure:

- A deployed Products Function API with its **backend Application Insights**
  resource.
- A separate **frontend Application Insights** resource for this browser app.
- **One Log Analytics workspace**, linked to both Application Insights resources.

```text
Local Vue SPA --browser telemetry--> Frontend Application Insights --+
       |                                                           |
       +--GET /api/products--> Azure Function                      +--> Shared workspace
                                      |                            |
                                      +--> Backend App Insights ---+
```

The two Application Insights resources identify the frontend and backend
separately. Their shared workspace provides a common query scope. Distributed trace
correlation comes from trace context propagated with the HTTP request.

Configure the Function App's CORS policy to allow the exact browser origin used
for Vite, normally `http://localhost:5173`. The backend must also accept CORS
preflight requests for the `traceparent` header. If you use a different local
origin, allow that precise origin instead.

## Configure the app

Copy the public settings template, unless `.env.local` already exists:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```dotenv
VITE_API_BASE_URL=https://YOUR_ACTUAL_FUNCTION_HOSTNAME/api
VITE_APPINSIGHTS_CONNECTION_STRING=YOUR_FRONTEND_APP_INSIGHTS_CONNECTION_STRING
```

For `VITE_API_BASE_URL`, use the actual deployed Function hostname recorded during
backend setup. Include `/api`; the app appends `/products`. Both `/api` and `/api/`
resolve to `/api/products`. Use an absolute HTTP(S) URL without credentials, query
parameters or a fragment.

For `VITE_APPINSIGHTS_CONNECTION_STRING`, copy the connection string from the
**frontend** Application Insights resource. The deployed Function uses its separate
backend configuration. Leaving the frontend setting blank disables browser
telemetry and produces a browser-console warning; Product listing still works.

These settings are exposed to browser code. The browser connection string is
public ingestion configuration, not a secret. Never put service keys, client
secrets or other credentials in `VITE_*` variables. `.env.local` is ignored by Git.

[Vite loads environment settings at startup](https://vite.dev/guide/env-and-mode).
Restart Vite after editing `.env.local`. A production build embeds the settings,
so changing them also requires rebuilding.

## Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The app requests
`GET /api/products` and displays the returned Products and prices. Vite listens on
all interfaces for Dev Container access and requires port 5173 to be available.
Stop Vite with **Ctrl+C** when finished.

For an optional local backend, start the Products Function service using its
README and set:

```dotenv
VITE_API_BASE_URL=http://localhost:7071/api
```

Allow the same browser origin in the local Functions host's CORS configuration,
then restart Vite.

## Browser instrumentation

Application Insights is initialised once before the first Products request. Its
automatic Fetch tracking creates one dependency record per actual Fetch call;
there is no additional manual dependency record around the same request.

The SDK supplies W3C `traceparent` context to the configured API host. This allows
the frontend dependency to be associated with the backend request and its
invocation logs. Use the worksheet to inspect these records in the shared
workspace. See Microsoft's
[JavaScript SDK configuration reference](https://learn.microsoft.com/en-us/azure/azure-monitor/app/javascript-sdk-configuration)
for the tracing and collection settings.

The example disables request and response header capture, error response body
capture, automatic browser exception tracking, automatic route/page-visit tracking
and SDK cookies. It adds no custom Product events, metrics or explicit user
identities.

## Code structure

| File                                | Responsibility                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `src/domain/product.ts`             | Read-only Product list projection.                                                    |
| `src/app/product-service.ts`        | Product service port and dependency type.                                             |
| `src/app/list-products.ts`          | List Products use case.                                                               |
| `src/infra/http-product-service.ts` | Fetch adapter, HTTP status handling and validation of unknown response data.          |
| `src/config/composition-root.ts`    | Public configuration, URL validation, instrumentation setup and dependency assembly.  |
| `src/config/app-insights.ts`        | Shared SDK initialisation using the supplied connection string and allowed API hosts. |
| `src/composables/use-products.ts`   | Loading, Products, safe error messages and retry behaviour.                           |
| `src/views/Products.vue`            | Product display and UI states.                                                        |
| `src/main.ts`                       | Startup order: initialise instrumentation, provide dependencies and mount Vue.        |

## Build and type-check

```bash
npm run build
```

This checks TypeScript and creates `dist/`. To run the type-check separately, use
`npm run type-check`. `npm run format` formats files in `src/`.

## Troubleshooting

- **App cannot start:** check that `VITE_API_BASE_URL` is a valid absolute HTTP(S)
  URL. An explicitly blank value is invalid; omitting the setting defaults to
  `http://localhost:7071/api/`.
- **Products cannot load:** inspect the browser Network panel for the
  `/api/products` request. Check the backend URL, service availability and CORS
  policy, then select **Retry**.
- **CORS or preflight failure:** check the exact browser origin and permission for
  the `traceparent` header on the Function App.
- **No browser telemetry:** check the browser console, the frontend connection
  string and whether browser extensions block telemetry requests. Restart Vite
  after changing settings. In Azure, use the shared workspace and an appropriate
  time range, allowing time for telemetry ingestion.
- **Port 5173 is busy:** stop the other process using it, then run `npm run dev`
  again.
