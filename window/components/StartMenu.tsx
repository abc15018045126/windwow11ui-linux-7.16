import React, {useState, useMemo, useContext, useRef, useEffect} from 'react';
import {AppContext} from '../contexts/AppContext';
import Icon, {isValidIcon} from './icon';
import {useTheme} from '../theme';
import ContextMenu, {ContextMenuItem} from './ContextMenu';
import {AppDefinition} from '../types';

interface StartMenuProps {
  onOpenApp: (app: AppDefinition) => void;
  onClose: () => void;
}

const StartMenu: React.FC<StartMenuProps> = ({onOpenApp, onClose}) => {
  const {apps, refreshApps} = useContext(AppContext);
  const [isShowingAllApps, setIsShowingAllApps] = useState(false);
  const {theme} = useTheme();
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);
  const powerButtonRef = useRef<HTMLButtonElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  const pinnedApps = useMemo(
    () => apps.filter(app => app.isPinnedToTaskbar).slice(0, 12),
    [apps],
  );
  const recommendedApps = useMemo(
    () => apps.filter(app => !app.isPinnedToTaskbar).slice(0, 6),
    [apps],
  );
  const sortedApps = useMemo(
    () => [...apps].sort((a, b) => a.name.localeCompare(b.name)),
    [apps],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPowerMenuOpen &&
        powerButtonRef.current &&
        !powerButtonRef.current.contains(event.target as Node)
      ) {
        setIsPowerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPowerMenuOpen]);

  const handleContextMenu = (e: React.MouseEvent, app: AppDefinition) => {
    e.preventDefault();
    e.stopPropagation();

    const menuItems: ContextMenuItem[] = [
      {
        type: 'item',
        label: 'Open',
        onClick: () => {
          onOpenApp(app);
          onClose();
        },
      },
      {type: 'separator'},
      {type: 'item', label: 'Copy', onClick: () => {}},
      {type: 'item', label: 'Cut', onClick: () => {}},
      {type: 'item', label: 'Paste', onClick: () => {}, disabled: true},
      {type: 'separator'},
      {type: 'item', label: 'Rename', onClick: () => {}},
      {type: 'item', label: 'Pin to Taskbar', onClick: () => {}},
      {type: 'separator'},
      {
        type: 'item',
        label: 'Properties',
        onClick: () => {},
        disabled: true,
      },
    ];

    setContextMenu({x: e.clientX, y: e.clientY, items: menuItems});
  };

  const handleRestart = () => {
    window.electronAPI?.restartApp();
  };

  return (
    <>
      <div
        className={`start-menu-container fixed bottom-[52px] left-1/2 transform -translate-x-1/2
                 w-[580px] h-[650px] rounded-lg shadow-2xl
                 flex flex-col p-6 z-40 ${theme.startMenu.background} ${theme.startMenu.textColor}`}
        onClick={e => {
          e.stopPropagation();
          if (contextMenu) setContextMenu(null);
          if (isPowerMenuOpen) setIsPowerMenuOpen(false);
        }}
        onContextMenu={e => e.preventDefault()}
      >
        {/* ... (rest of the component up to the bottom bar) ... */}
        <div className="flex-grow overflow-hidden">
          {isShowingAllApps ? (
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">All Apps</h2>
                <button
                  onClick={() => setIsShowingAllApps(false)}
                  className={`px-3 py-1 text-xs bg-zinc-800/80 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.startMenu.buttonHover}`}
                >
                  &lt; Back
                </button>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar -mr-4 pr-4">
                <div className="space-y-1">
                  {sortedApps.map(app => {
                    const iconName = isValidIcon(app.icon) ? app.icon : 'fileGeneric';
                    return (
                      <button
                        key={`all-${app.id}`}
                        onClick={() => {
                          onOpenApp(app);
                          onClose();
                        }}
                        onContextMenu={e => handleContextMenu(e, app)}
                        className={`w-full flex items-center p-2 rounded-md transition-colors ${theme.startMenu.buttonHover}`}
                        title={app.name}
                      >
                        <Icon
                          iconName={iconName}
                          className="w-6 h-6 mr-4 flex-shrink-0"
                        />
                        <span className="text-sm text-left truncate">
                          {app.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-semibold opacity-80">Pinned</h2>
                  <button
                    onClick={() => setIsShowingAllApps(true)}
                    className={`px-3 py-1 text-xs bg-zinc-800/80 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.startMenu.buttonHover}`}
                  >
                    All apps &gt;
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-4">
                  {pinnedApps.map(app => {
                    const iconName = isValidIcon(app.icon) ? app.icon : 'fileGeneric';
                    return (
                      <button
                        key={app.id}
                        onClick={() => {
                          onOpenApp(app);
                          onClose();
                        }}
                        onContextMenu={e => handleContextMenu(e, app)}
                        className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors aspect-square ${theme.startMenu.pinnedButton}`}
                        title={app.name}
                      >
                        <Icon iconName={iconName} className="w-8 h-8 mb-1.5" />
                        <span className="text-xs text-center truncate w-full">
                          {app.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold opacity-80 mb-3">
                  Recommended
                </h2>
                <div className="space-y-2">
                  {recommendedApps.map(app => {
                    const iconName = isValidIcon(app.icon) ? app.icon : 'fileGeneric';
                    return (
                      <button
                        key={`rec-${app.id}`}
                        onClick={() => {
                          onOpenApp(app);
                          onClose();
                        }}
                        onContextMenu={e => handleContextMenu(e, app)}
                        className={`w-full flex items-center p-2 rounded-md transition-colors ${theme.startMenu.buttonHover}`}
                        title={app.name}
                      >
                        <Icon
                          iconName={iconName}
                          className="w-6 h-6 mr-3 flex-shrink-0"
                        />
                        <span className="text-sm text-left truncate">
                          {app.name}
                        </span>
                      </button>
                    );
                  })}
                  {recommendedApps.length === 0 && (
                    <p className="text-xs text-zinc-400">
                      No recommendations yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 mt-auto pt-4 border-t border-zinc-800/50 flex justify-between items-center">
          <button
            className={`flex items-center p-2 rounded-md ${theme.startMenu.buttonHover}`}
          >
            <Icon iconName="user" className="w-7 h-7 rounded-full mr-2" />
            <span className="text-sm">User</span>
          </button>
          <div className="relative flex space-x-1">
            <button
              title="Settings"
              onClick={() => {
                const settingsApp = apps.find(app => app.id === 'settings');
                if (settingsApp) onOpenApp(settingsApp);
                onClose();
              }}
              className={`p-2 rounded-md ${theme.startMenu.buttonHover}`}
            >
              <Icon iconName="settings" className="w-5 h-5" />
            </button>
            <button
              ref={powerButtonRef}
              title="Power"
              onClick={e => {
                e.stopPropagation();
                setIsPowerMenuOpen(!isPowerMenuOpen);
              }}
              className={`p-2 rounded-md ${theme.startMenu.buttonHover}`}
            >
              <Icon iconName="start" className="w-5 h-5" />
            </button>
            {isPowerMenuOpen && (
              <div
                className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={handleRestart}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-600 flex items-center"
                >
                  <Icon iconName="start" className="w-4 h-4 mr-2" />
                  Restart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};

export default StartMenu;
