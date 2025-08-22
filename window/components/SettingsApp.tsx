import React, {useEffect} from 'react';
import {AppDefinition, AppComponentProps} from '../../window/types';
import {SettingsIcon} from '../../window/constants';
import {useTheme, themes} from '../../window/theme';

const SettingsApp: React.FC<AppComponentProps> = ({
  setTitle,
  onWallpaperChange,
}) => {
  const {theme, setTheme} = useTheme();

  useEffect(() => {
    setTitle('Settings');
  }, []);

  return (
    <div
      className={`p-6 h-full overflow-y-auto custom-scrollbar ${theme.appWindow.textColor}`}
    >
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div
        className={'mb-8 p-4 rounded-lg'}
        style={{
          backgroundColor: theme.appWindow.background.startsWith('bg-white')
            ? 'rgba(0,0,0,0.05)'
            : 'rgba(255,255,255,0.05)',
        }}
      >
        <h2 className="text-lg font-medium mb-3">Themes</h2>
        <p className="text-sm opacity-80 mb-3">
          Select a theme to change the appearance of your desktop, taskbar, and
          windows.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.values(themes).map(t => (
            <div
              key={t.id}
              className={`border rounded-lg overflow-hidden ${theme.appWindow.border}`}
            >
              <button
                onClick={() => setTheme(t.id as 'default' | 'light')}
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={
                  {
                    '--tw-ring-offset-color':
                      theme.appWindow.background.startsWith('bg-white')
                        ? '#FFF'
                        : '#000',
                  } as React.CSSProperties
                }
              >
                <div
                  className="w-full h-24 bg-cover bg-center"
                  style={{backgroundImage: `url(${t.wallpaper})`}}
                ></div>
                <div className="p-4 text-left">
                  <h2 className="font-semibold">{t.name}</h2>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        className={'mb-8 p-4 rounded-lg'}
        style={{
          backgroundColor: theme.appWindow.background.startsWith('bg-white')
            ? 'rgba(0,0,0,0.05)'
            : 'rgba(255,255,255,0.05)',
        }}
      >
        <h2 className="text-lg font-medium mb-3">About</h2>
        <p className="text-sm opacity-80">
          Win11 React Gemini Clone v0.2.0 (Electron)
        </p>
      </div>

      <div className="text-center text-xs text-zinc-500 mt-auto pt-4">
        Settings App v1.1.0
      </div>
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'settings',
  name: 'Settings',
  icon: 'settings',
  component: SettingsApp,
  defaultSize: {width: 700, height: 500},
  isPinnedToTaskbar: true,
};

export default SettingsApp;
