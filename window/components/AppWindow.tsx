import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {OpenApp, ClipboardItem, FilesystemItem} from '../types';
import {DiscoveredAppDefinition} from '../contexts/AppContext';
import {TASKBAR_HEIGHT} from '../constants';
import {useTheme} from '../theme';
import Icon from './icon';

interface AppWindowProps {
  app: OpenApp;
  commonData: {
    refreshId: number;
    triggerRefresh: () => void;
  };
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onDrag: (instanceId: string, position: {x: number; y: number}) => void;
  onResize: (instanceId: string, size: {width: number; height: number}) => void;
  isActive: boolean;
  desktopRef: React.RefObject<HTMLDivElement>;
  updateAppTitle: (instanceId: string, newTitle: string) => void;
  onWallpaperChange: (newUrl: string) => void;
  openApp?: (appInfo: DiscoveredAppDefinition, initialData?: any) => void;
  clipboard?: ClipboardItem | null;
  handleCopy?: (item: FilesystemItem) => void;
  handleCut?: (item: FilesystemItem) => void;
  handlePaste?: (destinationPath: string) => void;
}

const AppWindow: React.FC<AppWindowProps> = ({
  app,
  commonData,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onDrag,
  onResize,
  isActive,
  desktopRef,
  updateAppTitle,
  onWallpaperChange,
  openApp,
  clipboard,
  handleCopy,
  handleCut,
  handlePaste,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({x: 0, y: 0});
  const [initialWinPos, setInitialWinPos] = useState({x: 0, y: 0});

  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    winX: 0,
    winY: 0,
  });

  const windowRef = useRef<HTMLDivElement>(null);
  const {theme} = useTheme();

  const handleMouseDownHeader = (e: React.MouseEvent<HTMLDivElement>) => {
    if (app.isMaximized || isResizing) return;
    if ((e.target as HTMLElement).closest('button')) return;

    onFocus();
    setIsDragging(true);
    setDragStartPos({x: e.clientX, y: e.clientY});
    setInitialWinPos(app.position);
  };

  const handleMouseDownResize = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: string,
  ) => {
    if (app.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    setIsResizing(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: app.size.width,
      height: app.size.height,
      winX: app.position.x,
      winY: app.position.y,
    });
  };

  const handleMouseMoveDrag = useCallback(
    (e: MouseEvent) => {
      const dx = e.clientX - dragStartPos.x;
      const dy = e.clientY - dragStartPos.y;

      let newX = initialWinPos.x + dx;
      let newY = initialWinPos.y + dy;

      const desktopWidth = desktopRef.current?.clientWidth || window.innerWidth;
      const desktopHeight =
        (desktopRef.current?.clientHeight || window.innerHeight) -
        TASKBAR_HEIGHT;
      const windowWidth = windowRef.current?.offsetWidth || app.size.width;

      newX = Math.max(-windowWidth + 50, Math.min(newX, desktopWidth - 50));
      newY = Math.max(0, Math.min(newY, desktopHeight - 30));

      onDrag(app.instanceId, {x: newX, y: newY});
    },
    [
      dragStartPos,
      initialWinPos,
      app.instanceId,
      onDrag,
      app.size.width,
      desktopRef,
    ],
  );

  const handleMouseMoveResize = useCallback(
    (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.winX;
      let newY = resizeStart.winY;

      const MIN_WIDTH = 250;
      const MIN_HEIGHT = 150;

      if (isResizing?.includes('right'))
        newWidth = Math.max(MIN_WIDTH, resizeStart.width + dx);
      if (isResizing?.includes('left')) {
        const calculatedWidth = resizeStart.width - dx;
        if (calculatedWidth >= MIN_WIDTH) {
          newWidth = calculatedWidth;
          newX = resizeStart.winX + dx;
        }
      }
      if (isResizing?.includes('bottom'))
        newHeight = Math.max(MIN_HEIGHT, resizeStart.height + dy);
      if (isResizing?.includes('top')) {
        const calculatedHeight = resizeStart.height - dy;
        if (calculatedHeight >= MIN_HEIGHT) {
          newHeight = calculatedHeight;
          newY = resizeStart.winY + dy;
        }
      }

      onResize(app.instanceId, {width: newWidth, height: newHeight});
      if (newX !== app.position.x || newY !== app.position.y) {
        onDrag(app.instanceId, {x: newX, y: newY});
      }
    },
    [isResizing, resizeStart, app.instanceId, app.position, onResize, onDrag],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !app.isMaximized) handleMouseMoveDrag(e);
      if (isResizing && !app.isMaximized) handleMouseMoveResize(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    handleMouseMoveDrag,
    handleMouseMoveResize,
    app.isMaximized,
  ]);

  const AppComponent = app.component;

  const setTitle = useCallback(
    (newTitle: string) => {
      updateAppTitle(app.instanceId, newTitle);
    },
    [updateAppTitle, app.instanceId],
  );

  const windowClasses = `
    fixed flex flex-col shadow-2xl rounded-lg overflow-hidden
    border
    transition-opacity duration-150 ease-in-out
    ${app.isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}
    ${theme.appWindow.background}
    ${isActive ? theme.appWindow.borderActive : theme.appWindow.border}
  `;

  return (
    <div
      ref={windowRef}
      className={windowClasses}
      style={{
        left: `${app.position.x}px`,
        top: `${app.position.y}px`,
        width: `${app.size.width}px`,
        height: `${app.size.height}px`,
        zIndex: app.zIndex,
        transition:
          isDragging || isResizing
            ? 'none'
            : 'left 0.1s ease-out, top 0.1s ease-out, width 0.2s ease-out, height 0.2s ease-out, opacity 0.15s ease-in-out',
      }}
      onMouseDown={onFocus}
    >
      {!app.isMaximized && (
        <>
          <div
            className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize z-10"
            onMouseDown={e => handleMouseDownResize(e, 'left')}
          />
          <div
            className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize z-10"
            onMouseDown={e => handleMouseDownResize(e, 'right')}
          />
          <div
            className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize z-10"
            onMouseDown={e => handleMouseDownResize(e, 'top')}
          />
          <div
            className="absolute -bottom-1 left-0 right-0 h-2 cursor-ns-resize z-10"
            onMouseDown={e => handleMouseDownResize(e, 'bottom')}
          />
          <div
            className="absolute -left-1 -top-1 w-3 h-3 cursor-nwse-resize z-10"
            onMouseDown={e => handleMouseDownResize(e, 'top-left')}
          />
          <div
            className="absolute -right-1 -top-1 w-3 h-3 cursor-nesw-resize z-10"
            onMouseDown={e => handleMouseDownResize(e, 'top-right')}
          />
          <div
            className="absolute -left-1 -bottom-1 w-3 h-3 cursor-nesw-resize z-10"
            onMouseDown={e => handleMouseDownResize(e, 'bottom-left')}
          />
          <div
            className="absolute -right-1 -bottom-1 w-3 h-3 cursor-nwse-resize z-10"
            onMouseDown={e => handleMouseDownResize(e, 'bottom-right')}
          />
        </>
      )}

      <div
        className={`flex items-center justify-between h-8 px-3 ${app.isMaximized ? '' : 'cursor-grab'} select-none ${theme.appWindow.header} ${theme.appWindow.textColor}`}
        onMouseDown={handleMouseDownHeader}
        onDoubleClick={onMaximize}
      >
        <div className="flex items-center space-x-2">
          <Icon iconName={app.icon} className="w-4 h-4" isSmall />
          <span className="text-xs font-medium truncate">{app.title}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onMinimize}
            className="p-1.5 hover:bg-white/20 rounded-sm"
            title="Minimize"
          >
            <Icon iconName="minimize" className="w-4 h-4" />
          </button>
          <button
            onClick={onMaximize}
            className="p-1.5 hover:bg-white/20 rounded-sm"
            title={app.isMaximized ? 'Restore' : 'Maximize'}
          >
            <Icon
              iconName={app.isMaximized ? 'restore' : 'maximize'}
              className="w-4 h-4"
            />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/80 rounded-sm"
            title="Close"
          >
            <Icon iconName="close" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className={`flex-grow overflow-auto custom-scrollbar ${theme.appWindow.background}`}
      >
        <AppComponent
          appInstanceId={app.instanceId}
          onClose={onClose}
          setTitle={setTitle}
          wallpaper={app.id === 'themes' ? theme.wallpaper : undefined}
          onWallpaperChange={
            app.id === 'themes' ? onWallpaperChange : undefined
          }
          openApp={openApp}
          initialData={useMemo(
            () => ({...app.initialData, ...commonData}),
            [app.initialData, commonData],
          )}
          clipboard={clipboard}
          handleCopy={handleCopy}
          handleCut={handleCut}
          handlePaste={handlePaste}
        />
      </div>
    </div>
  );
};

export default AppWindow;
