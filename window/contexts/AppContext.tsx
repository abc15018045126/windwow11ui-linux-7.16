import React from 'react';

// This definition represents the structure of the JSON data in our .app files,
// which is discovered and served by the backend.
export interface DiscoveredAppDefinition {
  id: string; // filename, e.g., "Notebook.app"
  name: string;
  external?: boolean;
  path?: string;
  appId?: string;
  icon?: string;
  handlesFiles?: boolean;
}

export interface AppContextType {
  apps: DiscoveredAppDefinition[];
  refreshApps?: () => void;
}

// Provide a default value for the context
export const AppContext = React.createContext<AppContextType>({
  apps: [],
  refreshApps: () => {},
});
