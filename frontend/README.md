# SOSCOPE frontend

This folder is the deployable React/Vite application.

## Development

From the repository root, `npm run dev` starts the frontend through the workspace entrypoint. Start the Python API separately with `npm run dev:api`.

## Build

Run `npm run build` from the repository root. The static site output is written to `frontend/dist/`.

For a frontend deployment, install the workspace dependencies and run the build command from the repository root. Configure the production host to route `/api` to the backend service; the Vite proxy is only active during local development.
