import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useContext,
} from 'react';
import {FilesystemItem, AppComponentProps, ClipboardItem} from '../types';
import * as FsService from '../../services/filesystemService';
import {getAppsForExtension} from '../../services/fileAssociationService';
import ContextMenu, {ContextMenuItem} from './ContextMenu';
import {TASKBAR_HEIGHT} from '../constants';
import {AppContext} from '../contexts/AppContext';
import Icon, {isValidIcon} from './icon';
import {buildContextMenu} from './file/right-click';

const GRID_SIZE = 90;

interface DesktopIconState {
  id: string; // path
  item: FilesystemItem;
  position: {x: number; y: number};
}

type DesktopProps = Pick<
  AppComponentProps,
  'openApp' | 'clipboard' | 'handleCopy' | 'handleCut' | 'handlePaste'
>;

const DesktopItemIcon: React.FC<{item: FilesystemItem}> = ({item}) => {
  let iconName = 'fileGeneric';
  if (item.type === 'folder') {
    iconName = 'folder';
  } else if (item.name.endsWith('.app')) {
    // Default for .app files, in case of parsing error or invalid icon
    iconName = 'fileGeneric';
    if (item.content) {
      try {
        const appInfo = JSON.parse(item.content);
        // Only use the icon from the file if it's a valid, known icon
        if (appInfo.icon && isValidIcon(appInfo.icon)) {
          iconName = appInfo.icon;
        }
      } catch (e) {
        // It's okay if the content is not valid JSON, we just fall back to the default icon.
      }
    }
  } else {
    if (
      item.name.endsWith('.tsx') ||
      item.name.endsWith('.ts') ||
      item.name.endsWith('.html')
    )
      iconName = 'fileCode';
    else if (item.name.endsWith('.json')) iconName = 'fileJson';
    else if (item.name.endsWith('.txt') || item.name.endsWith('.md'))
      iconName = 'notebook';
  }
  return (
    <Icon iconName={iconName} className="w-10 h-10 mb-1 pointer-events-none" />
  );
};

const Desktop: React.FC<DesktopProps> = ({
  openApp,
  clipboard,
  handleCopy,
  handleCut,
  handlePaste,
}) => {
  const {apps} = useContext(AppContext);
  const [icons, setIcons] = useState<DesktopIconState[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [draggingIcon, setDraggingIcon] = useState<{
    id: string;
    offset: {x: number; y: number};
  } | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item?: FilesystemItem;
  } | null>(null);
  const [renamingIconId, setRenamingIconId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const DESKTOP_PATH = '/Desktop';

  const fetchDesktopItems = useCallback(async () => {
    const desktopItems = await FsService.listDirectory(DESKTOP_PATH);
    if (desktopRef.current) {
      const desktopHeight = desktopRef.current.clientHeight;
      const iconsPerColumn = Math.floor((desktopHeight - 20) / GRID_SIZE);
      setIcons(
        desktopItems.map((item, index) => ({
          id: item.path,
          item,
          position: {
            x: 10 + Math.floor(index / iconsPerColumn) * GRID_SIZE,
            y: 10 + (index % iconsPerColumn) * GRID_SIZE,
          },
        })),
      );
    }
  }, []);

  useEffect(() => {
    fetchDesktopItems();
  }, [fetchDesktopItems]);

  const handleIconMouseDown = (e: React.MouseEvent, icon: DesktopIconState) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button !== 0 || renamingIconId === icon.id) return;
    setSelectedIconId(icon.id);
    setContextMenu(null);
    setDraggingIcon({
      id: icon.id,
      offset: {x: e.clientX - icon.position.x, y: e.clientY - icon.position.y},
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingIcon || !desktopRef.current) return;
      let newX = e.clientX - draggingIcon.offset.x;
      let newY = e.clientY - draggingIcon.offset.y;
      const {clientWidth, clientHeight} = desktopRef.current;
      newX = Math.max(10, Math.min(newX, clientWidth - GRID_SIZE + 10));
      newY = Math.max(10, Math.min(newY, clientHeight - GRID_SIZE + 10));
      setIcons(prev =>
        prev.map(icon =>
          icon.id === draggingIcon.id
            ? {...icon, position: {x: newX, y: newY}}
            : icon,
        ),
      );
    },
    [draggingIcon],
  );

  const handleMouseUp = useCallback(() => {
    if (draggingIcon) {
      setIcons(prevIcons =>
        prevIcons.map(icon => {
          if (icon.id === draggingIcon.id) {
            const snappedX =
              Math.round((icon.position.x - 10) / GRID_SIZE) * GRID_SIZE + 10;
            const snappedY =
              Math.round((icon.position.y - 10) / GRID_SIZE) * GRID_SIZE + 10;
            return {...icon, position: {x: snappedX, y: snappedY}};
          }
          return icon;
        }),
      );
      setDraggingIcon(null);
    }
  }, [draggingIcon]);

  useEffect(() => {
    if (draggingIcon) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIcon, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = async (item: FilesystemItem) => {
    if (renamingIconId === item.path) return;

    if (item.type === 'folder') {
      openApp?.('fileExplorer', {initialPath: item.path});
      return;
    }

    // Handle files
    if (item.name.endsWith('.app')) {
      try {
        const fileContent = await FsService.readFile(item.path);
        if (fileContent?.content) {
          const appInfo = JSON.parse(fileContent.content);
          openApp?.(appInfo);
        }
      } catch (e) {
        console.error('Could not parse or open app shortcut', e);
      }
    } else {
      // Handle other files using the association service
      const extension = '.' + (item.name.split('.').pop() || '').toLowerCase();
      const associatedApps = await getAppsForExtension(extension);

      const targetAppId =
        associatedApps.length > 0 ? associatedApps[0].id : 'notebook';

      openApp?.(targetAppId, {filePath: item.path});
    }
  };

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.target !== desktopRef.current) return;
    setSelectedIconId(null);
    setContextMenu({x: e.clientX, y: e.clientY, item: undefined});
  };

  const handleIconContextMenu = (
    e: React.MouseEvent,
    icon: DesktopIconState,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIconId(icon.id);
    setContextMenu({x: e.clientX, y: e.clientY, item: icon.item});
  };

  const handleRename = async () => {
    const icon = icons.find(i => i.id === renamingIconId);
    if (icon && renameValue && icon.item.name !== renameValue) {
      await FsService.renameItem(icon.item, renameValue);
      fetchDesktopItems();
    }
    setRenamingIconId(null);
  };

  const [contextMenuItems, setContextMenuItems] = useState<ContextMenuItem[]>(
    [],
  );

  useEffect(() => {
    if (!contextMenu) {
      setContextMenuItems([]);
      return;
    }

    const openAppHandler = openApp || (() => {});

    const generateMenuItems = async () => {
      if (!contextMenu.item) {
        // Background context menu
        const backgroundItems = await buildContextMenu({
          currentPath: DESKTOP_PATH,
          refresh: fetchDesktopItems,
          openApp: openAppHandler,
          onRename: () => {},
          onCopy: () => {},
          onCut: () => {},
          onPaste: handlePaste!,
          onOpen: () => {},
          isPasteDisabled: !clipboard,
        });
        backgroundItems.push({type: 'separator'});
        backgroundItems.push({
          type: 'item',
          label: 'Display Settings',
          onClick: () => openAppHandler('settings'),
        });
        backgroundItems.push({
          type: 'item',
          label: 'About This Clone',
          onClick: () => openAppHandler('about'),
        });
        setContextMenuItems(backgroundItems);
      } else {
        // Item context menu
        const items = await buildContextMenu({
          clickedItem: contextMenu.item,
          currentPath: DESKTOP_PATH,
          refresh: fetchDesktopItems,
          openApp: openAppHandler,
          onRename: item => {
            setRenamingIconId(item.path);
            setRenameValue(item.name);
          },
          onCopy: handleCopy!,
          onCut: handleCut!,
          onPaste: handlePaste!,
          onOpen: handleDoubleClick,
          isPasteDisabled: !clipboard,
        });
        setContextMenuItems(items);
      }
    };

    generateMenuItems();
  }, [
    contextMenu,
    openApp,
    clipboard,
    handleCopy,
    handleCut,
    handlePaste,
    fetchDesktopItems,
  ]);

  const handleDesktopClick = (e: React.MouseEvent) => {
    if (e.target === desktopRef.current) {
      if (renamingIconId) handleRename();
      setSelectedIconId(null);
      setContextMenu(null);
    }
  };

  return (
    <div
      ref={desktopRef}
      className="absolute inset-0 h-full w-full"
      style={{paddingBottom: `${TASKBAR_HEIGHT}px`}}
      onContextMenu={handleDesktopContextMenu}
      onClick={handleDesktopClick}
    >
      {icons.map(icon => (
        <div
          key={icon.id}
          className="absolute flex flex-col items-center p-2 rounded cursor-pointer select-none"
          style={{
            left: `${icon.position.x}px`,
            top: `${icon.position.y}px`,
            width: `${GRID_SIZE - 10}px`,
            height: `${GRID_SIZE - 10}px`,
            backgroundColor:
              selectedIconId === icon.id
                ? 'rgba(255, 255, 255, 0.15)'
                : 'transparent',
            border:
              selectedIconId === icon.id
                ? '1px solid rgba(255, 255, 255, 0.3)'
                : '1px solid transparent',
            transition:
              draggingIcon?.id === icon.id ? 'none' : 'all 0.2s ease-out',
          }}
          onMouseDown={e => handleIconMouseDown(e, icon)}
          onDoubleClick={() => handleDoubleClick(icon.item)}
          onContextMenu={e => handleIconContextMenu(e, icon)}
          title={icon.item.name}
        >
          <DesktopItemIcon item={icon.item} />

          {renamingIconId === icon.id ? (
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              className="text-xs text-center text-black bg-white w-full border border-blue-500 mt-1.5"
              autoFocus
              onFocus={e => e.target.select()}
            />
          ) : (
            <span className="text-xs text-center text-white shadow-black [text-shadow:1px_1px_2px_var(--tw-shadow-color)] truncate w-full pointer-events-none">
              {icon.item.name}
            </span>
          )}
        </div>
      ))}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default Desktop;
