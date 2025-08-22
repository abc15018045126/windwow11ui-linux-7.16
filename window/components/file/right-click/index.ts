import {FilesystemItem} from '../../../types';
import {ContextMenuItem} from '../ContextMenu';
import {DiscoveredAppDefinition} from '../../../contexts/AppContext';
import {handleNewFolder, handleNewFile} from './create';
import {handleDeleteItem} from './delete';
import {handleShowProperties} from './properties';
import {handleCreateShortcut} from './shortcut';
import {handleOpenFileLocation} from './location';

type OpenAppFunction = (
  appIdentifier: string | DiscoveredAppDefinition,
  initialData?: any,
) => void;

// The context object will contain all the necessary information and handlers
// from the calling component (e.g., Desktop or FileExplorer).
export interface MenuBuilderContext {
  clickedItem?: FilesystemItem;
  currentPath: string;
  refresh: () => void;
  openApp: OpenAppFunction;
  // Handlers that depend on component state are passed in
  onRename: (item: FilesystemItem) => void;
  onCopy: (item: FilesystemItem) => void;
  onCut: (item: FilesystemItem) => void;
  onPaste: (path: string) => void;
  onOpen: (item: FilesystemItem) => void;
  isPasteDisabled: boolean;
}

export const buildContextMenu = (
  context: MenuBuilderContext,
): ContextMenuItem[] => {
  const {
    clickedItem,
    currentPath,
    refresh,
    openApp,
    onRename,
    onCopy,
    onCut,
    onPaste,
    onOpen,
    isPasteDisabled,
  } = context;

  // Clicked on a file or folder
  if (clickedItem) {
    const menuItems: ContextMenuItem[] = [];
    menuItems.push({
      type: 'item',
      label: 'Open',
      onClick: () => onOpen(clickedItem),
    });
    menuItems.push({
      type: 'item',
      label: 'Open file location',
      onClick: () => handleOpenFileLocation(clickedItem, openApp),
    });
    // TODO: Add 'Open With' logic here later
    menuItems.push({type: 'separator'});
    menuItems.push({
      type: 'item',
      label: 'Cut',
      onClick: () => onCut(clickedItem),
    });
    menuItems.push({
      type: 'item',
      label: 'Copy',
      onClick: () => onCopy(clickedItem),
    });
    menuItems.push({type: 'separator'});
    menuItems.push({
      type: 'item',
      label: 'Create shortcut',
      onClick: () => handleCreateShortcut(clickedItem, refresh),
    });
    menuItems.push({
      type: 'item',
      label: 'Delete',
      onClick: () => handleDeleteItem(clickedItem, refresh),
    });
    menuItems.push({
      type: 'item',
      label: 'Rename',
      onClick: () => onRename(clickedItem),
    });
    menuItems.push({type: 'separator'});
    menuItems.push({
      type: 'item',
      label: 'Properties',
      onClick: () => handleShowProperties(clickedItem, openApp),
    });
    return menuItems;
  }
  // Clicked on the background
  else {
    const menuItems: ContextMenuItem[] = [];
    menuItems.push({
      type: 'item',
      label: 'New Folder',
      onClick: () => handleNewFolder(currentPath, refresh),
    });
    menuItems.push({
      type: 'item',
      label: 'New Text File',
      onClick: () => handleNewFile(currentPath, refresh),
    });
    menuItems.push({type: 'separator'});
    menuItems.push({
      type: 'item',
      label: 'Paste',
      onClick: () => onPaste(currentPath),
      disabled: isPasteDisabled,
    });
    // TODO: Add other background items like 'Display Settings'
    return menuItems;
  }
};
