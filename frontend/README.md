# Corelign Frontend

React + Vite user interface for the Corelign document ingestion and retrieval workflow.

## Implemented UI
- `frontend/src/pages/Home.jsx` provides the landing view and feature overview.
- `frontend/src/pages/Workspace.jsx` combines the upload and query panels.
- `frontend/src/components/UploadPanel.jsx` handles file selection, upload submission, and job polling.
- `frontend/src/components/QueryPanel.jsx` handles chat-style question submission and response rendering.
- `frontend/src/components/ToastContainer.jsx` and `frontend/src/context/NotificationContext.jsx` provide notifications.

## Supporting Frontend Areas
- `frontend/src/context/AppContext.jsx` controls the active view.
- `frontend/src/lib/api.js` provides fetch helpers.
- `frontend/src/hooks/useApiBase.js` resolves the backend base URL.
- `frontend/src/pages/Insights.jsx` shows metrics-style charts and summary visuals.
- `frontend/src/pages/AboutUs.jsx` and `frontend/src/pages/ContactUs.jsx` provide static content pages.

## Current Integration
- The upload panel posts files to `POST /upload/upload`.
- The query panel posts questions to `POST /query`.
- Local chat history is persisted in `localStorage`.

## Notes
- This README only describes the implemented frontend code in the repository.
