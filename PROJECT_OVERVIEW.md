# Project Overview: Win11 React Gemini Clone

This document provides a high-level overview of the project, its architecture, guiding principles, and current status.

## 1. Project Purpose

This project is a sophisticated desktop environment simulator that mimics the look and feel of Windows 11. It is built using React and Tailwind CSS for the user interface and is packaged as a cross-platform desktop application with Electron.

A core feature is an integrated chat application powered by the Google Gemini API, demonstrating advanced AI integration within a familiar desktop metaphor.

## 2. Architecture

The system features an innovative **hybrid architecture** that allows it to run both as a standard desktop application and as a headless backend accessible remotely from a web browser.

-   **Backend**: The core logic runs in the Electron main process, which includes an embedded Express.js server. This server exposes all functionality—such as filesystem operations and AI service calls—through a REST API.
-   **Frontend**: The user interface is a completely decoupled React application. It communicates with the backend exclusively through the REST API.
-   **Dual-Mode Operation**:
    1.  **Desktop Mode**: Runs as a standard Electron app. The React UI loads in an Electron window and communicates with the backend API on `localhost`.
    2.  **Headless Server Mode**: The backend can be run on a server without a graphical interface. Users can then access the full application frontend from a standard web browser on a separate machine.

This design enables a single codebase to serve two distinct use cases, providing both a rich native experience and flexible remote accessibility.

For a more detailed technical breakdown, please see the [**Architecture Document**](./ARCHITECTURE.md).

## 3. Guiding Philosophy

Our development philosophy is centered on three key principles:

-   **Versatility**: Build once, deploy anywhere. The hybrid architecture is a core tenet, ensuring the application is not tied to a single environment.
-   **Decoupling**: Maintain a strict separation between the frontend (UI) and the backend (core logic). This makes the application easier to develop, test, and maintain.
-   **Extensibility**: By exposing core functions through a clear API, we make it easier to add new features and integrate other services in the future.

## 4. Coding Style

To ensure code quality, consistency, and readability, this project adheres to the **Google JavaScript Style Guide**. All new contributions should follow these guidelines.

You can find the style guide here: [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)

## 5. Development Progress

The project is currently in a stable, feature-rich state. The core hybrid architecture is fully implemented, and key features like the Gemini-powered chat, remote filesystem access, and the dynamic windowing system are operational.

Future work will focus on refining existing features, improving performance, and expanding the suite of available applications.
