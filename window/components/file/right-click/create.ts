import * as FsService from '../../../../services/filesystemService';

export const handleNewFolder = async (
  currentPath: string,
  refresh: () => void,
) => {
  const name = await FsService.findUniqueName(currentPath, 'New folder', true);
  await FsService.createFolder(currentPath, name);
  refresh();
};

export const handleNewFile = async (
  currentPath: string,
  refresh: () => void,
) => {
  const name = await FsService.findUniqueName(
    currentPath,
    'New Text Document',
    false,
    '.txt',
  );
  await FsService.createFile(currentPath, name, '');
  refresh();
};
