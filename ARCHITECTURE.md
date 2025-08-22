# Win11 Clone: Hybrid Architecture Overview

## 1. Goal

The primary goal of this architecture is to create a **hybrid application** that satisfies two distinct use cases with a single codebase:

1.  **A Full-Featured Desktop App**: When run locally on a machine with a graphical interface (Windows, macOS, Linux Desktop), it behaves like a standard, high-performance Electron application.
2.  **A Remotely Accessible Web App**: The backend can be run on a "headless" server (like a Linux server with no GUI) and be fully controlled by a standard web browser from another machine.

This design solves the core challenge of deploying a GUI-centric application on a server that lacks a display, while still leveraging the powerful native capabilities (like filesystem access) that Electron provides.

## 2. Core Components

The architecture is composed of four main parts that work together.

### a. Electron Main Process (`main.js`) - The "App-Server"

The `main.js` file is the heart of the entire system. It serves a dual role:

-   **Desktop Application Host**: It performs the traditional Electron function of creating a `BrowserWindow` to display the user interface. It also manages Electron-specific features that a browser cannot access, such as launching external applications.
-   **Backend API Server**: This is the key to the hybrid architecture. **An Express.js web server is embedded directly within the Electron main process.** This server exposes all core logic (filesystem operations, API key retrieval, etc.) as a standard REST API on a local port (e.g., `http://localhost:3001`).

### b. Web Frontend (React UI)

The user interface is a standard React application built with Vite. It is designed to be completely decoupled from its backend.

-   It can be loaded and run in two different environments:
    1.  **Inside the Electron `BrowserWindow`** during desktop mode.
    2.  **In a standard web browser** (like Chrome or Firefox) when accessing the application remotely.

### c. Unified API Services (`services/*.ts`)

The `filesystemService.ts` and `geminiService.ts` files act as the bridge between the frontend and the backend.

-   **Environment-Agnostic**: These services are written to work identically in both Electron and browser environments.
-   **HTTP-Based**: They exclusively use the standard `fetch` API to communicate with the backend Express server running inside Electron. All `window.electronAPI` calls for filesystem or API keys have been removed, ensuring consistency.

### d. Minimal Electron Bridge (`preload.js`)

The `preload.js` script is now extremely lightweight. Its only remaining purpose is to expose functionalities that are **physically impossible** for a web API to handle, such as launching a separate external process from the user's machine (`launchExternalApp`). The frontend code gracefully handles the absence of this API when running in a browser.

## 3. How It Works: Two Execution Modes

### Mode 1: Desktop Application (`npm start`)

This is the standard way to run the app on a personal computer.

1.  The `electron .` command starts the `main.js` process.
2.  `main.js` immediately launches the embedded Express API server on `localhost:3001`.
3.  `main.js` then creates the `BrowserWindow`.
4.  The `BrowserWindow` loads the React frontend UI (from the Vite dev server or the `dist` folder).
5.  When the user interacts with the UI (e.g., saves a file), the React app's `filesystemService` makes a `fetch` call to `http://localhost:3001/api/fs/save`.
6.  The Express server inside `main.js` receives the request and uses Node.js's `fs` module to write the file to disk.

```plaintext
+-------------------------------------------------+
| Electron Shell (Your PC)                        |
| +---------------------------------------------+ |
| | BrowserWindow (Loads React UI)              | |
| |   - UI Components (App.tsx, etc.)           | |
| |   - Services -> fetch() -> localhost:3001   | |
| +---------------------------------------------+ |
|                                                 |
| +---------------------------------------------+ |
| | Main Process (main.js)                      | |
| |   - Runs Express API Server on port 3001    | |
| |   - Accesses Filesystem (fs) & API Keys     | |
| +---------------------------------------------+ |
+-------------------------------------------------+
```

### Mode 2: Headless Server (`xvfb-run npm start`)

This is how you run the application on a server without a display.

1.  **On the Server**:
    -   You run the command `xvfb-run npm start`.
    -   `xvfb` creates a virtual, in-memory screen.
    -   The `electron .` command starts successfully, as it now has a virtual screen to attach to.
    -   `main.js` runs, starting the Express API server on `localhost:3001` (or `0.0.0.0:3001` to be accessible over the network).
    -   The `BrowserWindow` is created but remains invisible, rendering only to the virtual screen. The backend API is now live and waiting for requests.
2.  **On Your Local Machine**:
    -   You open a web browser.
    -   You navigate to the IP address of your server and the port of your web frontend (e.g., `http://<your_server_ip>:5173`).
    -   The React UI loads. Its services are configured to make `fetch` calls to `http://<your_server_ip>:3001`.
    -   All interactions in your browser are translated into API calls to the Electron backend running on the server, which then performs the requested actions.

```plaintext
+-----------------------+      Network      +---------------------------------+
| User's Browser        |       (HTTP)      | Server (Headless Linux)         |
| +-------------------+ | <---------------> | +-----------------------------+ |
| | React UI          | |      API Calls    | | xvfb (Virtual Screen)         | |
| | (from Vite/nginx) | |                   | | +-------------------------+ | |
| |                   | |                   | | | Electron App (Invisible)| | |
| | - Services ->     | |                   | | | +---------------------+ | | |
| |   fetch(server)   | |                   | | | | main.js             | | | |
| +-------------------+ |                   | | | | - Express Server    | | | |
|                       |                   | | | | - Filesystem Access | | | |
+-----------------------+                   | | | +---------------------+ | | |
                                            | | +-------------------------+ | |
                                            | +-----------------------------+ |
                                            +---------------------------------+
```

## 4. Benefits of this Architecture

-   **Single Codebase**: The exact same React frontend serves both the desktop and web versions. No duplication of effort.
-   **Full Native Power**: The backend *always* runs in a full Node.js/Electron environment, retaining 100% of its ability to interact with the server's operating system.
-   **Remote Accessibility**: The application's powerful features can be accessed from any device with a web browser.
-   **True Decoupling**: The clear separation between frontend and backend makes the application easier to develop, test, and maintain.
