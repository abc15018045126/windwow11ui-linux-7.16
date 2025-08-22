import React, {useState, useCallback, useEffect, useRef} from 'react';
import {ClipboardItem, FilesystemItem} from './types';
import * as FsService from '../services/filesystemService';
import Taskbar from './components/Taskbar';
import StartMenu from './components/StartMenu';
import AppWindow from './components/AppWindow';
import Desktop from './components/Desktop';
import {ThemeContext, themes} from './theme';
import {AppContext} from './contexts/AppContext';
import {useWindowManager} from './hooks/useWindowManager';

const App: React.FC = () => {
  const desktopRef = useRef<HTMLDivElement>(null);
  const windowManager = useWindowManager(desktopRef);
  const {
    openApps,
    activeAppInstanceId,
    appDefinitions,
    appsLoading,
    openApp,
    focusApp,
    closeApp,
    toggleMinimizeApp,
    toggleMaximizeApp,
    updateAppPosition,
    updateAppSize,
    updateAppTitle,
  } = windowManager;

  const [isStartMenuOpen, setIsStartMenuOpen] = useState<boolean>(false);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);

  // --- Theme State ---
  const [currentThemeId, setCurrentThemeId] = useState<'default' | 'light'>(
    'default',
  );
  const theme = themes[currentThemeId];

  const handleThemeChange = (themeId: 'default' | 'light') => {
    setCurrentThemeId(themeId);
  };

  // A simple way to trigger refresh in filesystem-aware components
  const [refreshId, setRefreshId] = useState(0);
  const triggerRefresh = () => setRefreshId(id => id + 1);

  const toggleStartMenu = useCallback(
    () => setIsStartMenuOpen(prev => !prev),
    [],
  );

  // --- Filesystem Operations ---
  const handleCopy = useCallback((item: FilesystemItem) => {
    setClipboard({item, operation: 'copy'});
  }, []);
  const handleCut = useCallback((item: FilesystemItem) => {
    setClipboard({item, operation: 'cut'});
  }, []);
  const handlePaste = useCallback(
    async (destinationPath: string) => {
      if (!clipboard) return;
      const {item, operation} = clipboard;

      if (operation === 'copy') {
        await FsService.copyItem(item, destinationPath);
      } else {
        // cut
        await FsService.moveItem(item, destinationPath);
        setClipboard(null);
      }
      triggerRefresh();
    },
    [clipboard],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isStartMenuOpen) {
        const target = event.target as HTMLElement;
        if (
          !target.closest('.start-menu-container') &&
          !target.closest('.taskbar-start-button')
        ) {
          setIsStartMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStartMenuOpen]);

  return (
    <AppContext.Provider
      value={{apps: appDefinitions, refreshApps: triggerRefresh}}
    >
      <ThemeContext.Provider value={{theme, setTheme: handleThemeChange}}>
        <div
          ref={desktopRef}
          className="h-screen w-screen flex flex-col bg-cover bg-center"
          style={{backgroundImage: `url(${theme.wallpaper})`}}
        >
          {appsLoading ? (
            <div className="flex-grow flex items-center justify-center text-white">
              Loading OS...
            </div>
          ) : (
            <>
              <div className="flex-grow relative overflow-hidden">
                <Desktop
                  openApp={openApp}
                  clipboard={clipboard}
                  handleCopy={handleCopy}
                  handleCut={handleCut}
                  handlePaste={handlePaste}
                  key={refreshId} // Force remount on refresh
                />
                {openApps
                  .filter(app => !app.isMinimized)
                  .map(app => (
                    <AppWindow
                      key={app.instanceId}
                      app={{
                        ...app,
                        initialData: {
                          ...app.initialData,
                          refreshId,
                          triggerRefresh,
                        },
                      }}
                      onClose={() => closeApp(app.instanceId)}
                      onMinimize={() => toggleMinimizeApp(app.instanceId)}
                      onMaximize={() => toggleMaximizeApp(app.instanceId)}
                      onFocus={() => focusApp(app.instanceId)}
                      onDrag={updateAppPosition}
                      onResize={updateAppSize}
                      isActive={app.instanceId === activeAppInstanceId}
                      desktopRef={desktopRef}
                      updateAppTitle={updateAppTitle}
                      onWallpaperChange={() => {}} // This is now handled by themes app
                      openApp={openApp}
                      clipboard={clipboard}
                      handleCopy={handleCopy}
                      handleCut={handleCut}
                      handlePaste={handlePaste}
                    />
                  ))}
              </div>

              {isStartMenuOpen && (
                <StartMenu
                  onOpenApp={openApp}
                  onClose={() => setIsStartMenuOpen(false)}
                />
              )}

              <Taskbar
                onToggleStartMenu={toggleStartMenu}
                windowManager={windowManager}
              />
            </>
          )}
        </div>
      </ThemeContext.Provider>
    </AppContext.Provider>
  );
};

export default App;
