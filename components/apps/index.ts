import type {AppDefinition} from '../../window/types';

let appDefinitions: AppDefinition[] | null = null;

// A type guard to check if a module has an appDefinition
function hasAppDefinition(
  module: any,
): module is {appDefinition: AppDefinition} {
  return (
    module &&
    typeof module.appDefinition === 'object' &&
    module.appDefinition !== null
  );
}

export const getAppDefinitions = async (): Promise<AppDefinition[]> => {

  // Use import.meta.glob to dynamically find all App.tsx files for internal apps
  const internalAppModules = import.meta.glob([
    './*App.tsx',
    '../../window/components/**/*App.tsx',
    '../../window/components/*App.tsx',
  ]);

  const internalDefinitions: AppDefinition[] = [];
  for (const path in internalAppModules) {
    const module = await internalAppModules[path]();
    if (hasAppDefinition(module)) {
      internalDefinitions.push(module.appDefinition);
    }
  }

  // Fetch the list of registered external apps from our new JSON-based registry
  let externalDefinitions: AppDefinition[] = [];
  try {
    const response = await fetch('http://localhost:3001/api/apps/external');
    if (response.ok) {
      const externalAppsData = await response.json();
      // Add the dummy component property required by the AppDefinition type
      externalDefinitions = externalAppsData.map((app: any) => ({
        ...app,
        component: () => null,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch external apps:', error);
    // Continue without external apps if the fetch fails
  }

  // Combine internal and external app definitions
  const allDefinitions = [...internalDefinitions, ...externalDefinitions];

  // Cache the definitions so we don't reload them on every call
  appDefinitions = allDefinitions.sort((a, b) => a.name.localeCompare(b.name));

  return appDefinitions;
};
