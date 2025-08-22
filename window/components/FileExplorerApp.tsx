import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
  useRef,
} from 'react';
import {
  AppDefinition,
  AppComponentProps,
  FilesystemItem,
} from '../../window/types';
import * as FsService from '../../services/filesystemService';
import {getAppsForExtension} from '../../services/fileAssociationService';
import ContextMenu, {
  ContextMenuItem,
} from '../../window/components/ContextMenu';
import Icon from '../../window/components/icon';
import {AppContext} from '../../window/contexts/AppContext';
import {buildContextMenu} from '../../window/components/file/right-click';

const getFileIconName = (filename: string): string => {
  if (filename.endsWith('.app')) return 'fileGeneric';
  if (
    filename.endsWith('.tsx') ||
    filename.endsWith('.ts') ||
    filename.endsWith('.html')
  )
    return 'fileCode';
  if (filename.endsWith('.json')) return 'fileJson';
  if (filename.endsWith('.txt') || filename.endsWith('.md')) return 'notebook';
  return 'fileGeneric';
};

const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive: boolean;
}> = ({icon, label, onClick, isActive}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded ${isActive ? 'bg-blue-600/30 text-white' : 'hover:bg-zinc-700/50'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const FileExplorerApp: React.FC<AppComponentProps> = ({
  setTitle,
  openApp,
  initialData,
  clipboard,
  handleCopy,
  handleCut,
  handlePaste,
}) => {
  const {apps} = useContext(AppContext);
  const startPath = initialData?.initialPath || '/';
  const [currentPath, setCurrentPath] = useState(startPath);
  const [history, setHistory] = useState([startPath]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [itemsInCurrentPath, setItemsInCurrentPath] = useState<
    FilesystemItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item?: FilesystemItem;
  } | null>(null);
  const [renamingItemPath, setRenamingItemPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [itemToSelect, setItemToSelect] = useState<string | null>(null);
  const itemRefs = useRef<{[key: string]: HTMLButtonElement | null}>({});

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    itemRefs.current = {}; // Clear refs on each fetch
    const items = await FsService.listDirectory(currentPath);
    setItemsInCurrentPath(items);
    setIsLoading(false);
  }, [currentPath]);

  // Effect to handle selecting an item when the component loads or data changes
  useEffect(() => {
    if (initialData?.selectItem) {
      setItemToSelect(initialData.selectItem);
    }
  }, [initialData]);

  // Effect to scroll to and highlight the selected item
  useEffect(() => {
    if (itemToSelect && itemRefs.current[itemToSelect]) {
      const element = itemRefs.current[itemToSelect];
      element?.scrollIntoView({behavior: 'smooth', block: 'center'});

      // Temporarily highlight and then remove the highlight
      const timer = setTimeout(() => {
        setItemToSelect(null);
      }, 2000); // Highlight for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [itemToSelect, itemsInCurrentPath]); // Rerun if items change

  useEffect(() => {
    const pathName =
      currentPath === '/'
        ? 'Project Root'
        : currentPath.split('/').pop() || 'Files';
    setTitle(`File Explorer - ${pathName}`);
  }, [currentPath]);

  useEffect(() => {
    fetchItems();
  }, [currentPath, fetchItems, initialData?.refreshId]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      if (path === currentPath) return;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(path);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCurrentPath(path);
      setContextMenu(null);
    },
    [currentPath, history, historyIndex],
  );

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(history[newIndex]);
    }
  };

  const goUp = () => {
    if (currentPath !== '/') {
      const parentPath =
        currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
      navigateTo(parentPath);
    }
  };

  const openItem = useCallback(
    async (item: FilesystemItem) => {
      if (renamingItemPath === item.path) return;
      if (item.type === 'folder') {
        navigateTo(item.path);
        return;
      }

      // Handle files
      if (item.name.endsWith('.lnk')) {
        try {
          const fileContent = await FsService.readFile(item.path);
          if (fileContent?.content) {
            const shortcutInfo = JSON.parse(fileContent.content);
            if (!shortcutInfo.target || !shortcutInfo.type) {
              throw new Error('Invalid shortcut file format.');
            }

            if (shortcutInfo.type === 'folder') {
              navigateTo(shortcutInfo.target);
            } else {
              const extension =
                '.' + (shortcutInfo.target.split('.').pop() || '').toLowerCase();
              const associatedApps = await getAppsForExtension(extension);
              const targetAppId =
                associatedApps.length > 0
                  ? associatedApps[0].id
                  : 'notebook';
              openApp?.(targetAppId, {filePath: shortcutInfo.target});
            }
          }
        } catch (e) {
          console.error('Could not open shortcut', e);
          alert('Could not open shortcut. It may be broken.');
        }
      } else if (item.name.endsWith('.app')) {
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
        const extension =
          '.' + (item.name.split('.').pop() || '').toLowerCase();
        const associatedApps = await getAppsForExtension(extension);

        const targetAppId =
          associatedApps.length > 0 ? associatedApps[0].id : 'notebook';

        openApp?.(targetAppId, {filePath: item.path});
      }
    },
    [navigateTo, openApp, renamingItemPath],
  );

  const handleItemContextMenu = (e: React.MouseEvent, item: FilesystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({x: e.clientX, y: e.clientY, item});
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((e.target as HTMLElement).closest('button')) return;
    setContextMenu({x: e.clientX, y: e.clientY});
  };

  const handleRename = async () => {
    const item = itemsInCurrentPath.find(i => i.path === renamingItemPath);
    if (item && renameValue && item.name !== renameValue) {
      await FsService.renameItem(item, renameValue);
      fetchItems();
    }
    setRenamingItemPath(null);
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
      const items = await buildContextMenu({
        clickedItem: contextMenu.item,
        currentPath: currentPath,
        refresh: fetchItems,
        openApp: openAppHandler,
        onRename: item => {
          setRenamingItemPath(item.path);
          setRenameValue(item.name);
        },
        onCopy: handleCopy!,
        onCut: handleCut!,
        onPaste: handlePaste!,
        onOpen: openItem,
        isPasteDisabled: !clipboard,
      });

      if (!contextMenu.item) {
        items.push({type: 'separator'});
        items.push({type: 'item', label: 'Refresh', onClick: fetchItems});
      }
      setContextMenuItems(items);
    };

    generateMenuItems();
  }, [
    contextMenu,
    openItem,
    handleCopy,
    handleCut,
    handlePaste,
    clipboard,
    currentPath,
    fetchItems,
    openApp,
  ]);

  const breadcrumbs = [
    'Project Root',
    ...currentPath.split('/').filter(p => p),
  ];
  const handleBreadcrumbClick = (index: number) => {
    const newPath =
      index === 0 ? '/' : '/' + breadcrumbs.slice(1, index + 1).join('/');
    navigateTo(newPath);
  };

  const quickAccessItems = [
    {path: '/', label: 'Project Root', iconName: 'fileExplorer'},
    {path: '/Desktop', label: 'Desktop', iconName: 'folder'},
    {path: '/Documents', label: 'Documents', iconName: 'folder'},
    {path: '/Downloads', label: 'Downloads', iconName: 'folder'},
  ];

  return (
    <div
      className="flex h-full bg-black text-zinc-200 select-none"
      onClick={() => setContextMenu(null)}
    >
      <aside className="w-56 flex-shrink-0 bg-zinc-900/50 p-2 flex flex-col border-r border-zinc-800">
        <h3 className="px-2 pb-2 text-xs font-semibold text-zinc-400">
          Quick access
        </h3>
        <div className="space-y-1">
          {quickAccessItems.map(item => (
            <SidebarItem
              key={item.path}
              icon={
                <Icon iconName={item.iconName} isSmall className="w-5 h-5" />
              }
              label={item.label}
              onClick={() => navigateTo(item.path)}
              isActive={currentPath === item.path}
            />
          ))}
        </div>
      </aside>

      <main className="flex-grow flex flex-col">
        <div className="flex-shrink-0 flex items-center space-x-2 p-2 border-b border-zinc-800 bg-black/50">
          <button
            onClick={goBack}
            disabled={historyIndex === 0}
            className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <button
            onClick={goUp}
            disabled={currentPath === '/'}
            className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Up"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
          <div className="flex items-center bg-zinc-900 rounded p-1 text-sm flex-grow">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className="px-2 py-0.5 hover:bg-zinc-800 rounded"
                >
                  {crumb}
                </button>
                {i < breadcrumbs.length - 1 && (
                  <span className="text-zinc-500 mx-1">&gt;</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div
          className="flex-grow p-4 overflow-y-auto custom-scrollbar relative"
          onContextMenu={handleBackgroundContextMenu}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
              Loading...
            </div>
          ) : itemsInCurrentPath.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {itemsInCurrentPath.map(item => (
                <button
                  key={item.path}
                  ref={el => (itemRefs.current[item.name] = el)}
                  onDoubleClick={() => openItem(item)}
                  onContextMenu={e => handleItemContextMenu(e, item)}
                  className={`flex flex-col items-center p-2 rounded hover:bg-white/10 transition-colors text-center aspect-square relative focus:outline-none focus:bg-blue-500/30 ${
                    item.name === itemToSelect ? 'bg-blue-600/40' : ''
                  }`}
                >
                  <Icon
                    iconName={
                      item.type === 'folder'
                        ? 'folder'
                        : getFileIconName(item.name)
                    }
                    className="w-12 h-12"
                  />
                  {renamingItemPath === item.path ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={handleRename}
                      onKeyDown={e => e.key === 'Enter' && handleRename()}
                      className="text-xs text-center text-black bg-white w-full border border-blue-500 mt-1.5"
                      autoFocus
                      onFocus={e => e.target.select()}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-xs mt-1.5 break-words w-full truncate">
                      {item.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-400 mt-10">
              This folder is empty.
            </div>
          )}
        </div>
      </main>

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

export const appDefinition: AppDefinition = {
  id: 'fileExplorer',
  name: 'File Explorer',
  icon: 'fileExplorer',
  component: FileExplorerApp,
  defaultSize: {width: 800, height: 600},
  isPinnedToTaskbar: true,
  allowMultipleInstances: true,
};

export default FileExplorerApp;
