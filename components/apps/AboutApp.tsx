import React, {useEffect} from 'react';
import {AppDefinition, AppComponentProps} from '../../window/types';
import {
  StartIcon,
  SettingsIcon,
  SearchIcon,
  AboutIcon,
} from '../../window/constants';

const AboutApp: React.FC<AppComponentProps> = ({appInstanceId, setTitle}) => {
  useEffect(() => {
    setTitle('About This Clone');
  }, [setTitle]);

  return (
    <div className="p-8 text-zinc-200 h-full flex flex-col items-center justify-center bg-gradient-to-br from-black to-zinc-900/80">
      <div className="text-center max-w-md">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <StartIcon className="w-12 h-12 text-blue-400" />
          <SearchIcon className="w-10 h-10 text-green-400" />
          <SettingsIcon className="w-10 h-10 text-purple-400" />
        </div>

        <h1 className="text-3xl font-bold mb-3 text-white">
          Win11 React Gemini Clone
        </h1>
        <p className="text-md text-zinc-300 mb-6">
          A simplified Windows 11-like desktop experience built with React,
          TypeScript, and Tailwind CSS, running in an Electron shell.
        </p>

        <div className="bg-zinc-900/50 p-4 rounded-lg shadow mb-6 text-left">
          <h2 className="text-lg font-semibold mb-2 text-white">
            Key Features:
          </h2>
          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
            <li>React 18 functional components and hooks</li>
            <li>Draggable and manageable app windows</li>
            <li>Taskbar and Start Menu</li>
            <li>Gemini API integration for AI Chat</li>
            <li>Native file system access via Electron IPC</li>
          </ul>
        </div>

        <p className="text-xs text-zinc-400">
          Instance ID:{' '}
          <span className="font-mono bg-zinc-900 px-1 rounded">
            {appInstanceId}
          </span>
        </p>
        <p className="text-xs text-zinc-500 mt-2">Version 0.2.0 (Electron)</p>
      </div>
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'about',
  name: 'About This PC',
  icon: 'about',
  component: AboutApp,
  defaultSize: {width: 450, height: 380},
};

export default AboutApp;
