import React, {useEffect} from 'react';
import {
  AppDefinition,
  AppComponentProps,
  FilesystemItem,
} from '../../window/types';
import Icon from '../../window/components/icon';

const PropertiesApp: React.FC<AppComponentProps> = ({
  setTitle,
  initialData,
}) => {
  const item = initialData?.item as FilesystemItem | undefined;

  useEffect(() => {
    if (item) {
      setTitle(`${item.name} Properties`);
    } else {
      setTitle('Properties');
    }
  }, [setTitle, item]);

  if (!item) {
    return <div className="p-4">No item selected.</div>;
  }

  return (
    <div className="p-4 text-sm">
      <div className="flex items-center mb-4">
        <Icon
          iconName={item.type === 'folder' ? 'folder' : 'fileGeneric'}
          className="w-8 h-8 mr-4"
        />
        <span className="font-bold text-lg">{item.name}</span>
      </div>
      <div className="space-y-2">
        <div className="flex">
          <span className="w-24 font-semibold">Type:</span>
          <span>{item.type === 'folder' ? 'Folder' : 'File'}</span>
        </div>
        <div className="flex">
          <span className="w-24 font-semibold">Path:</span>
          <span className="break-all">{item.path}</span>
        </div>
        {/* Add more properties like size, date created, etc. later */}
      </div>
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'properties',
  name: 'Properties',
  component: PropertiesApp,
  defaultSize: {width: 400, height: 250},
  // This app shouldn't be pinnable or directly launchable from the start menu
  isPinnedToTaskbar: false,
};

export default PropertiesApp;
