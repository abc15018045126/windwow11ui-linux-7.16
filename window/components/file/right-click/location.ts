import {FilesystemItem} from '../../../types';
import {DiscoveredAppDefinition} from '../../../contexts/AppContext';

type OpenAppFunction = (
  appIdentifier: string | DiscoveredAppDefinition,
  initialData?: any,
) => void;

export const handleOpenFileLocation = (
  item: FilesystemItem,
  openApp: OpenAppFunction,
) => {
  // Path for a file like /a/b/c.txt becomes /a/b.
  // Path for a folder like /a/b/ becomes /a.
  // The root '/' is its own parent.
  const parentPath =
    item.path.lastIndexOf('/') > 0
      ? item.path.substring(0, item.path.lastIndexOf('/'))
      : '/';

  openApp('fileExplorer', {
    initialPath: parentPath,
    selectItem: item.name,
  });
};
