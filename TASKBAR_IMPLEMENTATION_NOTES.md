# Taskbar Feature Overview

This document provides an overview of the new taskbar functionality, including its features, the files involved, and key technical details.

## 1. Functionality Implemented

The following features have been added to the application's taskbar:

-   **Dynamic Icons:** The taskbar now displays an icon for every application that is currently open.
-   **App Pinning:**
    -   Users can pin applications to the taskbar for quick access.
    -   The set of pinned applications is saved and persists across browser sessions.
    -   Default-pinned apps can be unpinned by the user.
-   **Right-Click Context Menu:** Right-clicking on any taskbar icon (for both pinned and running apps) opens a context menu with the following actions:
    -   **Maximize:** Maximizes the application window.
    -   **Minimize:** Minimizes the application window.
    -   **Close:** Closes the application.
    -   **Pin/Unpin to taskbar:** Toggles the pinned state of the application.

## 2. Key Files Involved

This feature involved changes to several key files and the creation of a new module for the context menu logic.

### Modified Files:

-   `window/hooks/useWindowManager.ts`: The core hook for managing window state. It was updated to handle the logic and state for pinned applications.
-   `window/components/Taskbar.tsx`: The main React component for the taskbar. It was heavily refactored to render the dynamic icons and integrate the new context menu.
-   `window/App.tsx`: The top-level application component. It was updated to pass the necessary state and handlers from the `useWindowManager` hook down to the `Taskbar`.
-   `window/contexts/AppContext.tsx`: The React context was updated to use a more consistent `AppDefinition` type.
-   `window/components/StartMenu.tsx`: Updated to align with the type changes in `AppContext`.

### New Files:

-   `window/components/taskbar/right-click/`: A new directory was created to hold the modular logic for the context menu actions.
    -   `index.ts`: Contains the builder function that assembles the context menu.
    -   `pin.ts`, `close.ts`, `minimize.ts`, `maximize.ts`: Contain the individual logic for each menu action.

## 3. Points to Note (Technical Details)

-   **Persistence:** The list of pinned application IDs is stored in the browser's **`localStorage`** under the key `win11-clone-pinned-apps`. Clearing the browser's site data will reset the pinned apps to the default set.
-   **State Management:** The core logic for what is open and what is pinned resides entirely within the `useWindowManager` hook. This hook is the single source of truth for all window-related state.
-   **Stale State Bug:** A critical bug was fixed where the `openApp` function had a stale closure over the list of open apps, preventing apps from being reopened. This was resolved by adding `openApps` to the `useCallback` dependency array for `openApp`, ensuring the function is always recreated with the latest state.
-   **Directory Structure:** The context menu logic was placed in a `taskbar/` subdirectory to keep it logically separate from the filesystem-related context menu actions found in the adjacent `file/` directory.
