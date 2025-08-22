import {FilesystemItem} from '../../../types';
import {createLink} from '../../../../services/filesystemService';

export const handleCreateShortcut = async (
  item: FilesystemItem,
  refresh: () => void,
) => {
  try {
    const success = await createLink(item.path);
    if (success) {
      refresh();
    } else {
      // TODO: Show a proper error to the user via a modal or toast notification
      alert('Failed to create shortcut.');
    }
  } catch (error) {
    console.error('Failed to create shortcut:', error);
    alert('An error occurred while creating the shortcut.');
  }
};
