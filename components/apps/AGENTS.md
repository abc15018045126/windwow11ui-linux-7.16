# AI Guide: Application Architecture and Launch Logic

This document explains the different types of applications in this system and how they are launched.

## 1. Overview

There are three distinct types of "applications" in this operating system simulator. Understanding the difference is crucial for modification and extension.

1.  **Core Internal Apps:** React components rendered within a standard window.
2.  **Filesystem App Shortcuts:** `.app` files that act as pointers to Core Internal Apps, with potential for overriding properties.
3.  **External Standalone Apps:** True standalone applications that run in a separate OS process.

---

## 2. Type 1: Core Internal Apps

These are the standard applications of the OS.

-   **Description:** They are React components that get rendered inside a generic `AppWindow`. They are part of the main application bundle.
-   **Examples:** File Explorer, Notebook, Settings, About.
-   **Definition File:** Each app has a corresponding `...App.tsx` file (e.g., `FileExplorerApp.tsx`, `NotebookApp.tsx`). The single source of truth for the app's properties is the `appDefinition` object exported from the bottom of this file.
-   **Launch Logic:**
    1.  An action (e.g., clicking the Start Menu icon) calls the `openApp` function from the `useWindowManager` hook, passing the app's unique `id` string (e.g., `openApp('notebook')`).
    2.  The `useWindowManager` finds the corresponding `appDefinition` from its master list.
    3.  It then adds a new `OpenApp` object to its state, which causes the main `App.tsx` to render a new `<AppWindow />` containing the app's component.
-   **Associated Files:**
    -   `window/types.ts`: Defines the `AppDefinition` interface.
    -   `window/hooks/useWindowManager.ts`: Contains the `openApp` logic.
    -   `window/components/AppWindow.tsx`: The generic window frame that hosts the app component.
    -   `components/apps/index.ts`: This file aggregates all core app definitions into a single list for the window manager. **When adding a new core app, you must import its definition here.**

---

## 3. Type 2: Filesystem App Shortcuts (`.app` files)

These are filesystem-based shortcuts that can launch any Core Internal App.

-   **Description:** They are simple JSON files with a `.app` extension that live in the virtual filesystem (e.g., on the Desktop or in `/All Apps`). They primarily serve as pointers but can also be used to override default properties of an application for a specific shortcut.
-   **Example Content:**
    -   `{"appId": "notebook"}`
    -   `{"appId": "notebook", "allowMultipleInstances": false}` (This would launch Notebook as a single-instance app, overriding its default behavior).
-   **Launch Logic:**
    1.  A user double-clicks the `.app` file in the `FileExplorer` or on the `Desktop`.
    2.  The `openItem` (or `handleDoubleClick`) function in that component reads the JSON content of the file.
    3.  It passes the **entire parsed JSON object** to the `openApp` function in `useWindowManager.ts`.
    4.  `openApp` detects that it has been passed an object, not a string. It uses the `appId` from the object to find the base `AppDefinition`, and then **merges** the properties from the `.app` file object over the top of the base definition.
    5.  This final, merged `AppDefinition` is then used to launch the window. This is how the override system works.
-   **Associated Files:**
    -   `window/components/FileExplorerApp.tsx`: The `openItem` function contains this logic.
    -   `window/components/Desktop.tsx`: The `handleDoubleClick` function contains this logic.
    -   `window/hooks/useWindowManager.ts`: The `openApp` function contains the merging logic.

---

## 4. Type 3: External Standalone Apps

These are separate, self-contained applications that run in their own OS process.

-   **Description:** These are typically more complex applications that have their own backend or require isolation from the main OS shell. They are not just React components.
-   **Example:** `Chrome5`
-   **Definition File:** Located in their own subdirectories within `components/apps/`. They must have their own `package.json` and a `main.js` that serves as the entry point for the new Electron process.
-   **Launch Logic:**
    1.  The `appDefinition` for these apps must have `isExternal: true` and an `externalPath` property pointing to its entry script.
    2.  The `openApp` function in `useWindowManager.ts` detects the `isExternal` flag.
    3.  Instead of creating an `AppWindow`, it calls an API to launch a new process.
        -   In a full Electron environment, this is `window.electronAPI.launchExternalApp`.
        -   In a web-based environment, this is a `fetch` call to the `/api/launch` endpoint on the backend server.
    4.  The backend then spawns a new Electron process using the `externalPath`.
-   **Associated Files:**
    -   `main/launcher.js`: Contains the server-side logic for spawning the new Electron process.
    -   `main/api.js`: Exposes the `/api/launch` endpoint.
    -   `preload.js`: Exposes the `launchExternalApp` function to the Electron renderer process.
