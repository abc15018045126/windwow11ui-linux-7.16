import React, {useState, useEffect} from 'react';
import {AppDefinition, OpenApp} from '../types';
import {TASKBAR_HEIGHT} from '../constants';
import {useTheme} from '../theme';
import Icon, {isValidIcon} from './icon';
import {useWindowManager} from '../hooks/useWindowManager';
import TaskbarContextMenu from './taskbar/right-click/TaskbarContextMenu';

type TaskbarApp = (AppDefinition | OpenApp) & {
  isOpen: boolean;
  isActive: boolean;
};

interface TaskbarProps {
  onToggleStartMenu: () => void;
  windowManager: ReturnType<typeof useWindowManager>;
}

const Taskbar: React.FC<TaskbarProps> = ({
  onToggleStartMenu,
  windowManager,
}) => {
  const {
    taskbarApps,
    pinnedApps,
    openApp,
    focusApp,
    toggleMinimizeApp,
    pinApp,
    unpinApp,
    closeApp,
    toggleMaximizeApp,
  } = windowManager;

  const [currentTime, setCurrentTime] = useState(new Date());
  const {theme} = useTheme();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    app: TaskbarApp;
  } | null>(null);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleAppIconClick = (app: TaskbarApp) => {
    if (app.isOpen && 'instanceId' in app) {
      const openAppInstance = app as OpenApp;
      if (openAppInstance.isMinimized) {
        // If it's minimized, restore and focus it.
        toggleMinimizeApp(openAppInstance.instanceId);
      } else if (app.isActive) {
        // If it's the active window, minimize it.
        toggleMinimizeApp(openAppInstance.instanceId);
      } else {
        // If it's open but not active, just focus it.
        focusApp(openAppInstance.instanceId);
      }
    } else {
      // If the app is not open, open it.
      openApp(app.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, app: TaskbarApp) => {
    e.preventDefault();
    setContextMenu({app, x: e.clientX, y: e.clientY});
  };

  return (
    <>
      <div
        className={`flex items-center justify-between px-4 fixed bottom-0 left-0 right-0 z-50 ${theme.taskbar.background} ${theme.taskbar.textColor}`}
        style={{height: `${TASKBAR_HEIGHT}px`}}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="flex-1 flex justify-center items-center h-full">
          <div className="flex items-center space-x-2 h-full">
            <button
              onClick={onToggleStartMenu}
              className={`taskbar-start-button p-2 rounded h-full flex items-center ${theme.taskbar.buttonHover}`}
              aria-label="Start Menu"
            >
              <Icon iconName="start" className="w-5 h-5 text-blue-400" />
            </button>

            {taskbarApps.map(app => {
              const isPinned = pinnedApps.includes(app.id);
              // The key must be unique. If the app is open, use its instanceId. Otherwise, fall back to id.
              const buttonKey = 'instanceId' in app ? app.instanceId : app.id;
              const iconName = isValidIcon(app.icon) ? app.icon : 'fileGeneric';

              return (
                <button
                  key={buttonKey}
                  onClick={() => handleAppIconClick(app)}
                  onContextMenu={e => handleContextMenu(e, app)}
                  className={`p-2 rounded h-[calc(100%-8px)] flex items-center relative transition-colors duration-150 ease-in-out
                            ${app.isActive ? theme.taskbar.activeButton : theme.taskbar.buttonHover}`}
                  title={app.name}
                >
                  <Icon iconName={iconName} className="w-5 h-5" isSmall />
                  {app.isOpen && (
                    <span
                      className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 rounded-t-sm
                                  ${app.isActive ? 'w-6 ' + theme.taskbar.activeIndicator : 'w-4 ' + theme.taskbar.openIndicator}`}
                    ></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div>
            {currentTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div>
            {currentTime.toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>
      {contextMenu && (
        <TaskbarContextMenu
          app={contextMenu.app}
          x={contextMenu.x}
          y={contextMenu.y}
          isPinned={pinnedApps.includes(contextMenu.app.id)}
          onClose={() => setContextMenu(null)}
          pinApp={pinApp}
          unpinApp={unpinApp}
          closeApp={closeApp}
          openApp={openApp}
          toggleMaximizeApp={toggleMaximizeApp}
          toggleMinimizeApp={toggleMinimizeApp}
        />
      )}
    </>
  );
};

export default Taskbar;
