import {ReactNode} from 'react';

export interface IElectronAPI {
  // This is the only function left that is specific to the Electron environment.
  // All other filesystem/API key operations are now handled via a web API
  // to ensure consistency between the Electron app and a web browser client.
  launchExternalApp: (path: string, args?: string[]) => Promise<boolean>;
  setProxyForSession: (
    partition: string,
    proxyConfig: {proxyRules: string},
  ) => Promise<void>;
  clearProxyForSession: (partition: string) => Promise<void>;
  restartApp: () => void;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}

export interface AppIconProps {
  className?: string;
  isSmall?: boolean; // For smaller icon variants, e.g. in taskbar
}

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
}

export interface FilesystemItem extends Partial<ProjectFile> {
  name: string;
  path: string;
  type: 'file' | 'folder';
}

export type ClipboardItem = {
  item: FilesystemItem;
  operation: 'copy' | 'cut';
};

export type AppComponentProps = {
  appInstanceId: string;
  onClose: () => void;
  setTitle: (title: string) => void;
  wallpaper?: string;
  onWallpaperChange?: (newWallpaper: string) => void;
  // Allow apps to open other apps
  openApp?: (appInfo: any, initialData?: any) => void; // Using any for now to avoid circular deps
  initialData?: any; // To pass data on open

  // Filesystem related props for apps like File Explorer and Desktop
  clipboard?: ClipboardItem | null;
  handleCopy?: (item: FilesystemItem) => void;
  handleCut?: (item: FilesystemItem) => void;
  handlePaste?: (destinationPath: string) => void;
};

export type AppComponentType = React.FC<AppComponentProps>;

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  component: AppComponentType;
  defaultSize?: {width: number; height: number};
  isPinnedToTaskbar?: boolean; // To show on taskbar by default
  allowMultipleInstances?: boolean; // To allow multiple windows of the same app
  isExternal?: boolean; // To launch as a separate Electron process
  externalPath?: string; // Path relative to app root for the external app
  fileExtensions?: string[]; // Supported file extensions for 'Open With'
}

export interface OpenApp extends AppDefinition {
  instanceId: string;
  zIndex: number;
  position: {x: number; y: number};
  size: {width: number; height: number};
  isMinimized: boolean;
  isMaximized: boolean;
  title: string;
  previousPosition?: {x: number; y: number}; // For restoring from maximized
  previousSize?: {width: number; height: number}; // For restoring from maximized
  initialData?: any; // Data passed when the app is opened
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isLoading?: boolean;
}

export interface Theme {
  id: string;
  name: string;
  wallpaper: string;
  taskbar: {
    background: string;
    buttonHover: string;
    activeButton: string;
    activeIndicator: string;
    textColor: string;
  };
  startMenu: {
    background: string;
    searchBar: string;
    buttonHover: string;
    textColor: string;
    pinnedButton: string;
  };
  appWindow: {
    header: string;
    background: string;
    border: string;
    borderActive: string;
    textColor: string;
  };
}
