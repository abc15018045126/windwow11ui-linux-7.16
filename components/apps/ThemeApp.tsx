import React, {useEffect} from 'react';
import {AppDefinition, AppComponentProps} from '../../window/types';
import {ThemeIcon} from '../../window/constants';
import {themes, useTheme} from '../../window/theme';

const ThemeApp: React.FC<AppComponentProps> = ({
  setTitle,
  onWallpaperChange,
}) => {
  const {theme, setTheme} = useTheme();

  useEffect(() => {
    setTitle('Themes');
  }, [setTitle]);

  const handleThemeChange = (themeId: 'default' | 'light') => {
    const newTheme = themes[themeId];
    setTheme(themeId);
    // The wallpaper change is handled by the App component when the theme state changes.
    // onWallpaperChange is now redundant but kept for potential future use.
  };

  return (
    <div
      className={`p-6 h-full overflow-y-auto custom-scrollbar ${theme.appWindow.background.replace('bg-opacity-60', '')} ${theme.appWindow.textColor}`}
    >
      <div className="flex items-center mb-6">
        <ThemeIcon className="w-10 h-10 text-blue-400 mr-4" />
        <div>
          <h1 className="text-2xl font-semibold">Themes</h1>
          <p className="text-sm opacity-80">
            Change the look and feel of your desktop.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(themes).map(t => (
          <div
            key={t.id}
            className={`border rounded-lg overflow-hidden ${theme.appWindow.border}`}
          >
            <button
              onClick={() => handleThemeChange(t.id as 'default' | 'light')}
              className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
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
  );
};

export const appDefinition: AppDefinition = {
  id: 'themes',
  name: 'Themes',
  icon: 'themes',
  component: ThemeApp,
  defaultSize: {width: 500, height: 400},
};

export default ThemeApp;
