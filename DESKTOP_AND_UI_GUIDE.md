# AI Guide: Desktop, Taskbar, and Context Menus

This document explains the architecture of the core user interface shell components.

## 1. Overview

The main UI shell of the operating system is composed of three key components: the Desktop, the Taskbar, and the Context Menu system. These components work together to provide the core user experience. The primary logic for these is located in the `window/components/` directory.

---

## 2. The Desktop

The Desktop is the main background and icon grid area.

-   **Key File:** `window/components/Desktop.tsx`
-   **Purpose:**
    -   Renders the desktop wallpaper.
    -   Fetches and displays icons for files and folders located in the `/Desktop` directory of the virtual filesystem.
    -   Manages icon layout, drag-and-drop positioning, and selection.
-   **Core Logic:**
    -   **File Loading:** Uses `filesystemService.listDirectory('/Desktop')` to get the items to display.
    -   **Opening Items:** The `handleDoubleClick` function is called when an icon is double-clicked. It contains logic to open folders, `.app` files, and other file types.
    -   **Context Menu:** The `handleIconContextMenu` function is called on right-click. It uses the `buildContextMenu` utility to generate the appropriate menu.
-   **How to Modify:**
    -   To change the **appearance** or **layout** of desktop icons, edit the JSX within this file.
    -   To change the **behavior** of double-clicking or right-clicking icons, modify the `handleDoubleClick` and `handleIconContextMenu` functions respectively.

---

## 3. The Taskbar

The Taskbar displays the Start button and icons for pinned and currently running applications.

-   **Key File:** `window/components/Taskbar.tsx`
-   **Purpose:**
    -   Provide a persistent UI element for launching apps and managing open windows.
-   **Core Logic:**
    -   **Data Source:** The Taskbar is a "dumb" component that primarily renders data given to it. The logic for *which* applications to show is located in the `useWindowManager.ts` hook. This hook produces the `taskbarApps` array.
    -   **Rendering:** The `Taskbar.tsx` component maps over the `taskbarApps` array to render the individual buttons. It contains the logic for what happens when you click an icon (e.g., open, minimize, focus).
    -   **Multi-instance Display:** The `useWindowManager.ts` hook ensures that every open window gets its own entry in the `taskbarApps` array, so the taskbar will render a separate icon for each window.
-   **How to Modify:**
    -   To change the **look and feel** of the taskbar or its buttons, edit `Taskbar.tsx`.
    -   To change the **logic for what appears on the taskbar** (e.g., how apps are grouped or ordered), you must modify the `useMemo` hook that creates the `taskbarApps` array inside `window/hooks/useWindowManager.ts`.

---

## 4. The Context Menu (Right-Click) System

This is the system that generates right-click menus for files and folders.

-   **Key Directory:** `window/components/file/right-click/`
-   **Purpose:**
    -   To provide a consistent, dynamic context menu for filesystem items.
-   **Core Logic:**
    -   **Menu Builder:** The main function is `buildContextMenu` in `index.ts`. This function receives a "context" object (containing the clicked item, current path, and various handlers) and returns an array of menu items to be rendered.
    -   **Action Handlers:** The logic for what happens when a menu item is clicked (e.g., Delete, Rename, Create Shortcut) is separated into individual files within this directory. For example, `delete.ts` contains `handleDeleteItem`, and `shortcut.ts` contains `handleCreateShortcut`.
-   **How to Modify:**
    -   **To add a new option:**
        1.  Create a new handler file (e.g., `myNewAction.ts`) with a function that performs the desired action.
        2.  Import your new handler into `index.ts`.
        3.  Add a new `ContextMenuItem` object to the `menuItems` array inside the `buildContextMenu` function in `index.ts`. Set its `onClick` property to call your new handler.
