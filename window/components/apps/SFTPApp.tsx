import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  AppComponentProps,
  AppDefinition,
  FilesystemItem as BaseFilesystemItem,
} from '../../window/types';
import {FolderIcon, FileGenericIcon, SftpIcon} from '../../constants';
import ContextMenu, {ContextMenuItem} from '../../components/ContextMenu';

const pathHelper = {
  join: (...args: string[]) => args.join('/').replace(/\/+/g, '/'),
  dirname: (p: string) => {
    if (p === '/' || p === '.') return p;
    const lastSlash = p.lastIndexOf('/');
    if (lastSlash === -1) return '.';
    if (lastSlash === 0 && p.length > 1) return '/';
    if (lastSlash === 0 && p.length === 1) return '/';
    return p.substring(0, lastSlash) || '/';
  },
  basename: (p: string) => p.substring(p.lastIndexOf('/') + 1),
};

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
interface FilesystemItem extends BaseFilesystemItem {
  size?: number;
}

const getFileIcon = (filename: string) => {
  return <FileGenericIcon className="w-12 h-12 text-zinc-400" />;
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

const SFTPApp: React.FC<AppComponentProps> = ({setTitle, openApp}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMessage, setStatusMessage] = useState('Not connected.');

  // --- State for file browsing ---
  const [currentPath, setCurrentPath] = useState('.');
  const [history, setHistory] = useState(['.']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [items, setItems] = useState<FilesystemItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item?: FilesystemItem;
  } | null>(null);
  const [renamingItemPath, setRenamingItemPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    setTitle(
      `SFTP - ${status === 'connected' ? pathHelper.basename(currentPath) : status}`,
    );
  }, [setTitle, status, currentPath]);

  useEffect(
    () => () => {
      ws.current?.close();
    },
    [],
  );

  // Fetch OS user on mount
  useEffect(() => {
    fetch('http://localhost:3001/api/os-user')
      .then(res => (res.ok ? res.json() : Promise.resolve({username: 'user'})))
      .then(data => setUsername(data.username || 'user'));
  }, []);

  const sortItems = (items: FilesystemItem[]) =>
    items.sort((a, b) =>
      a.type === b.type
        ? a.name.localeCompare(b.name)
        : a.type === 'folder'
          ? -1
          : 1,
    );

  const fetchItems = useCallback((path: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      setItems([]);
      setStatusMessage(`Listing directory ${path}...`);
      ws.current.send(JSON.stringify({type: 'list', payload: {path}}));
    }
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      if (path === currentPath) {
        fetchItems(path); // Refresh if navigating to same path
        return;
      }
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(path);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCurrentPath(path);
      setContextMenu(null);
    },
    [currentPath, history, historyIndex, fetchItems],
  );

  useEffect(() => {
    if (status === 'connected') {
      fetchItems(currentPath);
    }
  }, [currentPath, status, fetchItems]);

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(history[newIndex]);
    }
  };

  const goUp = () => {
    if (currentPath !== '/' && currentPath !== '.') {
      const parentPath = pathHelper.dirname(currentPath);
      navigateTo(parentPath);
    }
  };

  // --- File Interaction ---
  const handleOpenFileInNotebook = useCallback(
    (remotePath: string, content: string) => {
      if (!openApp) return;

      const onSave = (newContent: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          setStatusMessage(`Saving ${remotePath}...`);
          ws.current.send(
            JSON.stringify({
              type: 'save_content',
              payload: {path: remotePath, content: newContent},
            }),
          );
        }
      };

      setStatusMessage(`Opening ${remotePath} in Notebook...`);
      openApp('notebook', {
        fileName: pathHelper.basename(remotePath),
        content: content,
        filePath: remotePath,
        onSave: onSave,
      });
    },
    [openApp],
  );

  // --- Connection Handling ---
  const handleConnect = useCallback(() => {
    if (!host || !port || !username) {
      setErrorMsg('Host, Port, and Username are required.');
      return;
    }
    setStatus('connecting');
    setErrorMsg('');
    setStatusMessage(`Connecting to ${host}...`);
    setItems([]);

    ws.current = new WebSocket('ws://localhost:3003');

    ws.current.onopen = () => {
      ws.current?.send(
        JSON.stringify({
          type: 'connect',
          payload: {host, port, username, password},
        }),
      );
    };

    ws.current.onclose = () => {
      if (status !== 'error') {
        setStatus('disconnected');
        setItems([]);
        setStatusMessage('Disconnected.');
      }
    };

    ws.current.onerror = () => {
      const msg = 'Connection failed. Is the backend running?';
      setErrorMsg(msg);
      setStatus('error');
      setStatusMessage(msg);
    };

    ws.current.onmessage = event => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'status':
          if (msg.payload === 'connected') {
            setStatus('connected');
            setPassword('');
            setStatusMessage('Connected. Listing home directory...');
            setCurrentPath('.');
            setHistory(['.']);
            setHistoryIndex(0);
          } else {
            setStatus('disconnected');
            setStatusMessage('Disconnected.');
          }
          break;
        case 'list':
          setStatusMessage(`Listed ${msg.payload.path}`);
          setItems(sortItems(msg.payload.items));
          setIsLoading(false);
          break;
        case 'file_content':
          handleOpenFileInNotebook(msg.payload.path, msg.payload.content);
          break;
        case 'unique_name_found': {
          const {name, parentDir, isFolder} = msg.payload;
          const createType = isFolder ? 'create_folder' : 'create_file';
          ws.current?.send(
            JSON.stringify({type: createType, payload: {parentDir, name}}),
          );
          break;
        }
        case 'operation_success':
          setStatusMessage(msg.payload.message);
          if (msg.payload.dirToRefresh === currentPath) {
            fetchItems(currentPath);
          }
          if (errorMsg) setErrorMsg('');
          break;
        case 'operation_error':
          setErrorMsg(msg.payload);
          setStatusMessage(`Error: ${msg.payload}`);
          setIsLoading(false);
          setTimeout(() => setErrorMsg(''), 5000);
          break;
        case 'error':
          setErrorMsg(msg.payload);
          setStatus('error');
          setStatusMessage(`Error: ${msg.payload}`);
          setIsLoading(false);
          ws.current?.close();
          break;
      }
    };
  }, [
    host,
    port,
    username,
    password,
    status,
    currentPath,
    fetchItems,
    errorMsg,
    handleOpenFileInNotebook,
  ]);

  const handleDisconnect = useCallback(() => {
    ws.current?.close();
  }, []);

  const handleFileClick = useCallback((item: FilesystemItem) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      setStatusMessage(`Fetching content for ${item.name}...`);
      ws.current.send(
        JSON.stringify({type: 'get_content', payload: {path: item.path}}),
      );
    }
  }, []);

  const openItem = useCallback(
    (item: FilesystemItem) => {
      if (renamingItemPath === item.path) return;
      if (item.type === 'folder') {
        navigateTo(item.path);
      } else if (item.type === 'file') {
        handleFileClick(item);
      }
    },
    [navigateTo, handleFileClick, renamingItemPath],
  );

  // --- Context Menu and Actions ---
  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, [closeContextMenu]);

  const onItemContextMenu = (e: React.MouseEvent, item: FilesystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({x: e.clientX, y: e.clientY, item});
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((e.target as HTMLElement).closest('button')) return;
    setContextMenu({x: e.clientX, y: e.clientY});
  };

  const handleDelete = (item: FilesystemItem) => {
    if (
      !ws.current ||
      !confirm(`Are you sure you want to delete ${item.name}?`)
    )
      return;
    setStatusMessage(`Deleting ${item.name}...`);
    ws.current.send(JSON.stringify({type: 'delete', payload: {item}}));
  };

  const handleRename = () => {
    const item = items.find(i => i.path === renamingItemPath);
    if (item && renameValue && item.name !== renameValue && ws.current) {
      setStatusMessage(`Renaming ${item.name}...`);
      ws.current.send(
        JSON.stringify({type: 'rename', payload: {item, newName: renameValue}}),
      );
    }
    setRenamingItemPath(null);
  };

  const contextMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (!contextMenu) return [];
    const {item} = contextMenu;

    if (item) {
      return [
        {type: 'item', label: 'Open', onClick: () => openItem(item)},
        {type: 'separator'},
        {type: 'item', label: 'Delete', onClick: () => handleDelete(item)},
        {
          type: 'item',
          label: 'Rename',
          onClick: () => {
            setRenamingItemPath(item.path);
            setRenameValue(item.name);
          },
        },
      ];
    } else {
      const handleCreateFolder = () => {
        if (!ws.current) return;
        setStatusMessage('Creating new folder...');
        ws.current.send(
          JSON.stringify({
            type: 'find_unique_name',
            payload: {
              parentDir: currentPath,
              baseName: 'New folder',
              isFolder: true,
            },
          }),
        );
      };
      const handleCreateFile = () => {
        if (!ws.current) return;
        setStatusMessage('Creating new file...');
        ws.current.send(
          JSON.stringify({
            type: 'find_unique_name',
            payload: {
              parentDir: currentPath,
              baseName: 'New Text Document.txt',
              isFolder: false,
            },
          }),
        );
      };
      return [
        {type: 'item', label: 'New Folder', onClick: handleCreateFolder},
        {type: 'item', label: 'New Text File', onClick: handleCreateFile},
        {type: 'separator'},
        {
          type: 'item',
          label: 'Refresh',
          onClick: () => fetchItems(currentPath),
        },
      ];
    }
  }, [contextMenu, openItem, items, currentPath, fetchItems]);

  // --- Breadcrumbs ---
  const breadcrumbParts = useMemo(() => {
    if (currentPath === '.') return ['Home'];
    if (currentPath === '/') return ['/'];
    const parts = currentPath.split('/').filter(p => p);
    return ['/', ...parts];
  }, [currentPath]);

  const handleBreadcrumbClick = (index: number) => {
    if (breadcrumbParts[0] === 'Home' && index === 0) {
      navigateTo('.');
      return;
    }
    if (breadcrumbParts[0] === '/' && index === 0) {
      navigateTo('/');
      return;
    }
    const newPath = pathHelper.join(
      '/',
      ...breadcrumbParts.slice(1, index + 1),
    );
    navigateTo(newPath);
  };

  const quickAccessItems = [
    {
      path: '.',
      label: 'Home',
      icon: <FolderIcon className="w-5 h-5 text-amber-400" isSmall />,
    },
    {
      path: '/',
      label: 'Root',
      icon: <SftpIcon isSmall className="w-5 h-5 text-zinc-400" />,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-white select-none">
      <div className="flex-shrink-0 flex items-center space-x-2 text-sm p-2 border-b border-zinc-700">
        <span>Host:</span>{' '}
        <input
          type="text"
          value={host}
          onChange={e => setHost(e.target.value)}
          disabled={status !== 'disconnected'}
          className="w-32 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 disabled:opacity-50"
        />
        <span>Port:</span>{' '}
        <input
          type="text"
          value={port}
          onChange={e => setPort(e.target.value)}
          disabled={status !== 'disconnected'}
          className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 disabled:opacity-50"
        />
        <span>User:</span>{' '}
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={status !== 'disconnected'}
          className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 disabled:opacity-50"
        />
        <span>Pass:</span>{' '}
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={status !== 'disconnected'}
          onKeyDown={e => e.key === 'Enter' && handleConnect()}
          className="flex-grow bg-zinc-800 border border-zinc-700 rounded px-2 py-1 disabled:opacity-50"
        />
        {status === 'connected' ? (
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={status === 'connecting'}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 rounded"
          >
            {status === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>
      {errorMsg && (
        <div className="flex-shrink-0 text-center py-1 bg-red-800/50 text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {status !== 'connected' ? (
        <div className="flex-grow flex items-center justify-center text-zinc-500">
          <p>Please connect to a server to begin.</p>
        </div>
      ) : (
        <div
          className="flex flex-grow overflow-hidden"
          onClick={() => setContextMenu(null)}
        >
          <aside className="w-56 flex-shrink-0 bg-zinc-900/50 p-2 flex flex-col border-r border-zinc-800">
            <h3 className="px-2 pb-2 text-xs font-semibold text-zinc-400">
              Remote locations
            </h3>
            <div className="space-y-1">
              {quickAccessItems.map(item => (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
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
                disabled={currentPath === '/' || currentPath === '.'}
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
                {breadcrumbParts.map((crumb, i) => (
                  <React.Fragment key={i}>
                    <button
                      onClick={() => handleBreadcrumbClick(i)}
                      className="px-2 py-0.5 hover:bg-zinc-800 rounded"
                    >
                      {crumb}
                    </button>
                    {i < breadcrumbParts.length - 1 && (
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
              ) : items.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                  {items.map(item => (
                    <button
                      key={item.path}
                      onDoubleClick={() => openItem(item)}
                      onContextMenu={e => onItemContextMenu(e, item)}
                      className="flex flex-col items-center p-2 rounded hover:bg-white/10 transition-colors text-center aspect-square relative focus:outline-none focus:bg-blue-500/30"
                    >
                      {item.type === 'folder' ? (
                        <FolderIcon className="w-12 h-12 text-amber-400" />
                      ) : (
                        getFileIcon(item.name)
                      )}
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
        </div>
      )}

      <div className="flex-shrink-0 h-8 border-t border-zinc-700 p-2 flex items-center text-xs">
        <p className="font-semibold mr-2">Status:</p>{' '}
        <div className="flex-grow text-zinc-400 truncate">{statusMessage}</div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'sftp',
  name: 'SFTP Client',
  icon: 'sftp',
  component: SFTPApp,
  defaultSize: {width: 950, height: 650},
};
export default SFTPApp;
