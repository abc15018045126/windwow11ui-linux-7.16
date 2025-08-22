import {FilesystemItem} from '../../../types';
import {DiscoveredAppDefinition} from '../../../contexts/AppContext';

type OpenAppFunction = (
  appIdentifier: string | DiscoveredAppDefinition,
  initialData?: any,
) => void;

export const handleShowProperties = (
  item: FilesystemItem,
  openApp: OpenAppFunction,
) => {
  openApp('properties', {item});
};
