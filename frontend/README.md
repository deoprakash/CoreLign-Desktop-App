# Corelign Desktop App

This folder is now the single app root for Corelign Desktop.
It contains:
- React + Vite renderer
- Electron main/preload process
- Electron Builder packaging config

## Run

Install dependencies:
- npm install

Development desktop run (no backend auto-start):
- npm run dev

Desktop run with backend auto-start:
- npm run start

## Build installer

- npm run dist

Output is generated in:
- frontend/dist-electron

## Backend requirements

The desktop app starts FastAPI from ../backend when running start/dist (unless CORELIGN_SKIP_BACKEND=1).
Install backend dependencies separately in your Python environment.
