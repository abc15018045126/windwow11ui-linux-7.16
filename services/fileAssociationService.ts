import { getAppDefinitions } from '../components/apps';
import type { AppDefinition } from '../window/types';

/**
 * Gets a list of applications that can handle a given file extension.
 * @param extension The file extension (e.g., '.txt').
 * @returns A promise that resolves to an array of AppDefinitions.
 */
export const getAppsForExtension = async (extension: string): Promise<AppDefinition[]> => {
  const apps = await getAppDefinitions();
  return apps.filter(app =>
    app.fileExtensions?.includes(extension.toLowerCase())
  );
};
