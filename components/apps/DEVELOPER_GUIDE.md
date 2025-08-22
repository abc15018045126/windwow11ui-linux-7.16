# Developer Guide: Application Management System

This document explains the architecture and workflow for managing and launching applications within this simulated OS environment.

## 1. Core Philosophy (思路)

The application management system is designed to handle two distinct types of applications in a unified way:

-   **Internal Applications:** These are React components that run within the main application's context. They are part of the core codebase and are suitable for lightweight, integrated features (e.g., Settings, Notepad).

-   **External Applications:** These are completely separate, standalone Electron applications, each with their own `package.json` and dependencies. This allows for true modularity, where complex applications (like a browser or a terminal) can be developed and maintained independently.

The core challenge was to create a system where the App Store could discover and launch *any* generic external Electron app without needing special code for each one. The solution was to move away from a code-generation approach and towards a **data-driven registry system**.

A secondary goal is to ensure the installation process is robust. **Note:** After installing a new app, the main application must be restarted for the new app to appear.

## 2. Key Files & Modules (用到的文件和模块)

The application system is primarily managed by the following files:

-   **`main/data/external-apps.json`**: The **External App Registry**. This JSON file is the source of truth for all *installed* external applications.
-   **`main/api.js`**: The backend Express server contains API endpoints for app management:
    -   `GET /api/apps`: Discovers potential external apps by scanning the `components/apps` directory.
    -   `POST /api/install`: "Installs" a new external app by adding its metadata to the `external-apps.json` registry.
-   **`components/apps/index.ts`**: The central app loader on the frontend. Its `getAppDefinitions` function builds a unified list of all internal (from `.tsx` files) and external (from the JSON registry) applications.
-   **`window/hooks/useWindowManager.ts`**: This hook is the stateful owner of the application list. It loads the app definitions on startup.
-   **`window/components/AppStore/index.tsx`**: The App Store UI. It calls the installation API.
-   **`main/launcher.js`**: Contains the logic to launch an external Electron app as a separate OS process.

## 3. Implementation Details (成功实现的具体)

The workflow is as follows:

### App Discovery & Installation
1.  A developer places a new, self-contained Electron app folder into `components/apps/`.
2.  The user opens the **App Store**. It calls `GET /api/apps` to find all potential, not-yet-installed apps.
3.  The user clicks "Install".
4.  The App Store frontend calls `POST /api/install`. The backend adds a new entry to the `external-apps.json` registry file.
5.  The user is shown an alert that they may need to restart the application.

### App Launching
1.  When the main application starts (or is restarted), the `useWindowManager` hook calls `getAppDefinitions`.
2.  `getAppDefinitions` builds a complete list of all apps by reading the internal `.tsx` files and fetching the list of external apps from the `external-apps.json` registry.
3.  The user clicks the new app's icon.
4.  The `openApp` function in `useWindowManager` checks the `isExternal` flag and uses the `main/launcher.js` to execute it as a separate process.

## 4. Environment & Prerequisites (环境和模块)

-   **Node.js / npm:** The core runtime environment.
-   **Electron:** The host application and external applications are all Electron apps.
-   **Convention over Configuration:** External apps should have a valid `package.json` and a `main.js` entry point in their root directory.
