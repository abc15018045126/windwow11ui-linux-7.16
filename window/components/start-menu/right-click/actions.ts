import { AppDefinition } from '../../../types';
import { createFile } from '../../../../services/filesystemService';

import { ContextMenuItem } from '../../ContextMenu';

type OnOpenAppFunction = (app: AppDefinition) => void;

export const handleCreateShortcut = async (app: AppDefinition): Promise<void> => {
  const shortcutContent = {
    name: app.name,
    appId: app.id,
    icon: app.icon,
  };
  const fileName = `${app.name}.app`;
  try {
    await createFile(
      '/Desktop',
      fileName,
      JSON.stringify(shortcutContent, null, 2)
    );
    // Optional: show a success notification
  } catch (error) {
    console.error(`Failed to create shortcut for ${app.name}:`, error);
    // Optional: show an error notification
  }
};

interface MenuBuilderContext {
  app: AppDefinition;
  onOpenApp: OnOpenAppFunction;
}

export const buildStartMenuContextMenu = (
  context: MenuBuilderContext,
): ContextMenuItem[] => {
  const { app, onOpenApp } = context;

  return [
    {
      type: 'item',
      label: 'Open',
      onClick: () => onOpenApp(app),
    },
    {
      type: 'item',
      label: 'Create shortcut',
      onClick: () => handleCreateShortcut(app),
    },
  ];
};
