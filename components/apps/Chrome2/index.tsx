import React, {useEffect} from 'react';
import {AppDefinition, AppComponentProps} from '../../../types';
import {Browser2Icon} from '../../../constants';

// This component is just a placeholder. The app is launched externally.
const Chrome2App: React.FC<AppComponentProps> = ({setTitle}) => {
  useEffect(() => {
    setTitle('Chrome 2');
  }, [setTitle]);
  return (
    <div className="p-4">
      Launching Chrome 2... This app will open in a new window.
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'chrome2',
  name: 'Chrome 2',
  icon: Browser2Icon,
  component: Chrome2App,
  isExternal: true,
  externalPath: 'components/apps/chrome2',
  isPinnedToTaskbar: true,
};

export default Chrome2App;
