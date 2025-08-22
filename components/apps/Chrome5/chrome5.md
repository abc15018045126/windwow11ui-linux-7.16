# Chrome 5: Remote Browser Architecture

## 1. Core Concept

Chrome 5 implements a **remote browser** architecture. It separates the User Interface (the frontend that the user sees) from the browser engine (the backend that does the actual work).

-   **Frontend (The "Puppet"):** The UI that runs inside the main application window is simply a view screen. The user thinks they are interacting with a browser, but they are actually interacting with a real-time video stream on an HTML `<canvas>` element.

-   **Backend (The "Puppeteer"):** A separate, dedicated Electron process is launched in the background. This process contains the *actual* Chromium browser instance (`BrowserWindow`) that loads and renders websites. It is effectively a "headless" browser from the user's perspective.

This setup creates the powerful illusion of running a fully-featured, isolated browser instance directly within a web-based UI.

## 2. Components

The system is composed of three main parts:

1.  **Backend Electron App (`main.js`):**
    *   This is the core browser engine.
    *   It creates a `BrowserWindow` and loads the target websites (e.g., `google.com`).
    *   It runs an **Express + WebSocket server (`server.js`)** to communicate with the frontend.

2.  **Frontend Web UI (`public/index.html`):**
    *   This is the component rendered inside the Chrome 5 app window.
    *   It contains a `<canvas>` element which acts as the screen.
    *   It runs a WebSocket client to connect to the backend Electron app.

3.  **Communication Layer (WebSockets):**
    *   A WebSocket connection provides the real-time, two-way bridge between the frontend UI and the backend Electron browser.

## 3. How It Works: The Data Flow

The entire system relies on a continuous, two-way flow of information.

### a. Screen Streaming (Backend → Frontend)

This is how the user sees the web page.

1.  The backend Electron app (`server.js`) periodically takes a screenshot of its `BrowserWindow` content using `mainWindow.webContents.capturePage()`.
2.  This screenshot is converted into a PNG image buffer.
3.  The image buffer is sent over the WebSocket connection to the frontend.
4.  The frontend's JavaScript receives the image data, creates an `Image` object from it, and draws it onto the `<canvas>`.
5.  This process repeats rapidly (e.g., every 200ms), creating a live video stream of the browser running on the backend.

### b. Input Forwarding (Frontend → Backend)

This is how the user interacts with the web page.

1.  When the user clicks the mouse, moves the cursor, or presses a key on the keyboard, JavaScript event listeners on the frontend `<canvas>` capture these actions.
2.  The event details (e.g., `type: 'mouseDown'`, `x: 150`, `y: 300`, `keyCode: 'Enter'`) are packaged into a simple JSON object.
3.  This JSON object is sent over the WebSocket to the backend Electron app.
4.  The backend (`server.js`) receives the JSON object and uses the `mainWindow.webContents.sendInputEvent()` method.
5.  This injects the event directly into the backend's `BrowserWindow`, which processes it as if the user had interacted with it natively. The website inside the backend browser reacts accordingly (e.g., a button is clicked, text is typed).
6.  The result of this interaction is captured in the next screenshot and streamed back to the frontend, completing the loop.

### Simple Diagram

```plaintext
+------------------------------------+                        +------------------------------------+
| Frontend (UI in App Window)        |                        | Backend (Electron Process)         |
|------------------------------------|                        |------------------------------------|
|         <canvas>                   |                        |      BrowserWindow (Not visible)   |
|                                    |                        |      - Loads & renders websites    |
|   (Displays screenshots as video)  | -- Screenshots (PNG) -> |      - Takes screenshots           |
|                                    |                        |                                    |
|   (Captures mouse/keyboard input)  | <- User Input (JSON) -- |      (Injects input events)        |
|                                    |                        |                                    |
+------------------------------------+                        +------------------------------------+
                 ^                                                             ^
                 |                                                             |
                 +----------------------- WebSocket Bridge --------------------+
```

## 4. Summary

In essence, the user is remotely controlling a browser that is running elsewhere. The frontend is a "dumb terminal" that only displays images and forwards user input. The backend Electron process does all the heavy lifting of web rendering and processing, providing a sandboxed and powerful browsing experience accessible from a simple web interface.
