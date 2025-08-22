import {ProjectFile, FilesystemItem} from '../types';

const API_BASE_URL = 'http://localhost:3001/api/fs';

const handleResponse = async <T>(response: Response): Promise<T | null> => {
  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
    try {
      const err = await response.json();
      console.error('Error details:', err);
    } catch (e) {
      // Ignore if body is not json
    }
    return null;
  }
  // Handle cases with no content
  if (response.status === 204) return null;
  return response.json() as Promise<T>;
};

export const listDirectory = async (
  path: string,
): Promise<FilesystemItem[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/list?path=${encodeURIComponent(path)}`,
    );
    return (await handleResponse<FilesystemItem[]>(response)) || [];
  } catch (e) {
    console.error('Network error in listDirectory:', e);
    return [];
  }
};

export const readFile = async (path: string): Promise<ProjectFile | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/read?path=${encodeURIComponent(path)}`,
    );
    return await handleResponse<ProjectFile>(response);
  } catch (e) {
    console.error('Network error in readFile:', e);
    return null;
  }
};

export const readFileAsBase64 = async (
  path: string,
): Promise<ProjectFile | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/read-base64?path=${encodeURIComponent(path)}`,
    );
    // The content will be a base64 string. The ProjectFile type is compatible.
    return await handleResponse<ProjectFile>(response);
  } catch (e) {
    console.error('Network error in readFileAsBase64:', e);
    return null;
  }
};

export const downloadFile = async (path: string): Promise<Blob | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/download?path=${encodeURIComponent(path)}`,
    );
    if (!response.ok) return null;
    return response.blob();
  } catch (e) {
    console.error('Network error in downloadFile:', e);
    return null;
  }
};

export const saveFile = async (
  path: string,
  content: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({path, content}),
    });
    const result = await handleResponse<{success: boolean}>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in saveFile:', e);
    return false;
  }
};

export const createLink = async (targetPath: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-link`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({targetPath}),
    });
    const result = await handleResponse<{success: boolean}>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in createLink:', e);
    return false;
  }
};

const APP_DATA_API_BASE_URL = 'http://localhost:3001/api';

export const fetchPinnedApps = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${APP_DATA_API_BASE_URL}/pinned-apps`);
    return (await handleResponse<string[]>(response)) || [];
  } catch (e) {
    console.error('Network error in fetchPinnedApps:', e);
    return [];
  }
};

export const savePinnedApps = async (pinnedAppIds: string[]): Promise<boolean> => {
  try {
    const response = await fetch(`${APP_DATA_API_BASE_URL}/pinned-apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinnedAppIds }),
    });
    const result = await handleResponse<{ success: boolean }>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in savePinnedApps:', e);
    return false;
  }
};

export const findUniqueName = async (
  destinationPath: string,
  baseName: string,
  isFolder: boolean,
  extension = '',
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/find-unique-name`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({destinationPath, baseName, isFolder, extension}),
    });
    const result = await handleResponse<{name: string}>(response);
    return result?.name || `${baseName} (error)`;
  } catch (e) {
    console.error('Network error in findUniqueName:', e);
    return `${baseName} (error)`;
  }
};

export const createFolder = async (
  path: string,
  name: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-folder`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({path, name}),
    });
    const result = await handleResponse<{success: boolean}>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in createFolder:', e);
    return false;
  }
};

export const createFile = async (
  path: string,
  name: string,
  content: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-file`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({path, name, content}),
    });
    const result = await handleResponse<{success: boolean}>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in createFile:', e);
    return false;
  }
};

export const createAppShortcut = async (
  appId: string,
  appName: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-shortcut`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({appId, appName}),
    });
    const result = await handleResponse<{success: boolean}>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in createAppShortcut:', e);
    return false;
  }
};

export const deleteItem = async (item: FilesystemItem): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/delete`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({item}),
    });
    const result = await handleResponse<{success: boolean}>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in deleteItem:', e);
    return false;
  }
};

export const renameItem = async (
  item: FilesystemItem,
  newName: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rename`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({item, newName}),
    });
    const result = await handleResponse<{success: boolean}>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in renameItem:', e);
    return false;
  }
};

export const moveItem = async (
  sourceItem: FilesystemItem,
  destinationPath: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/move`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({sourceItem, destinationPath}),
    });
    const result = await handleResponse<{success: boolean}>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in moveItem:', e);
    return false;
  }
};

export const copyItem = async (
  sourceItem: FilesystemItem,
  destinationPath: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/copy`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({sourceItem, destinationPath}),
    });
    const result = await handleResponse<{success: boolean}>(response);
    return result?.success || false;
  } catch (e) {
    console.error('Network error in copyItem:', e);
    return false;
  }
};
