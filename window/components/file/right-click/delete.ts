import * as FsService from '../../../../services/filesystemService';
import {FilesystemItem} from '../../../types';

export const handleDeleteItem = async (
  item: FilesystemItem,
  refresh: () => void,
) => {
  if (
    window.confirm(
      `Are you sure you want to delete ${item.name}? This action cannot be undone.`,
    )
  ) {
    await FsService.deleteItem(item);
    refresh();
  }
};
