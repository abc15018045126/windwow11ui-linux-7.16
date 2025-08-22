import React, {useState, useEffect, useRef} from 'react';
import {AppDefinition, AppComponentProps} from '../../window/types';
import {Browser6Icon} from '../../window/constants';

// --- SVG Icons for Browser Controls (Copied from Chrome3App) ---
const CloseIcon: React.FC<{className?: string}> = ({className = 'w-4 h-4'}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BackIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const ForwardIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const RefreshIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4a12.94 12.94 0 0115.12 2.88M20 20a12.94 12.94 0 01-15.12-2.88" />
  </svg>
);
const HomeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const Spinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface WebViewElement extends HTMLElement {
  loadURL(url: string): void;
  getURL(): string;
  getTitle(): string;
  isLoading(): boolean;
  canGoBack(): boolean;
  canGoForward(): boolean;
  goBack(): void;
  goForward(): void;
  reload(): void;
  getWebContentsId(): number;
  partition: string;
}

const isUrl = (str: string) => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(str);

// Define the structure for a tab's state
interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

const Chrome6App: React.FC<AppComponentProps> = ({ setTitle: setWindowTitle }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const nextTabId = useRef(0);

  // A ref to hold the webview elements for easy access
  const webviewRefs = useRef<{[key: string]: WebViewElement}>({});
  const partition = 'persist:chrome6';

  // Function to create a new tab
  const createNewTab = (url = 'https://www.google.com/search?q=what+is+my+user+agent') => {
    const newTabId = `tab-${nextTabId.current++}`;
    const newTab: Tab = {
      id: newTabId,
      url: url,
      title: 'New Tab',
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
    };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTabId);
  };

  // Initialize with a single tab when the component mounts
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    }
  }, []);

  // This effect is responsible for attaching event listeners to webviews
  useEffect(() => {
    tabs.forEach(tab => {
      const webview = webviewRefs.current[tab.id];
      if (webview && !webview.dataset.listenersAttached) {
        webview.dataset.listenersAttached = 'true';

        const handleDomReady = () => {
          // The initial URL for a new tab is set here
          if (tab.url !== 'about:blank') {
             webview.loadURL(tab.url);
          }
        };

        webview.addEventListener('dom-ready', handleDomReady, { once: true });

        webview.addEventListener('page-title-updated', e => {
          updateTabState(tab.id, { title: e.title });
        });
        webview.addEventListener('did-start-loading', () => {
          updateTabState(tab.id, { isLoading: true });
        });
        webview.addEventListener('did-stop-loading', () => {
          updateTabState(tab.id, {
            isLoading: false,
            canGoBack: webview.canGoBack(),
            canGoForward: webview.canGoForward(),
          });
        });
        webview.addEventListener('did-navigate', e => {
          updateTabState(tab.id, { url: e.url });
        });
        webview.addEventListener('did-fail-load', e => {
          if (e.errorCode !== -3) { // Ignore user-aborted errors
            updateTabState(tab.id, { title: `Error: ${e.errorCode}` });
          }
        });
      }
    });
  }, [tabs]);


  const closeTab = (tabIdToClose: string) => {
    // Prevent closing the last tab
    if (tabs.length === 1) {
      // Optionally, you could reset the state of the last tab instead
      // For now, we just prevent closing. A better UX might be to open a new tab.
      return;
    }

    const tabToCloseIndex = tabs.findIndex(tab => tab.id === tabIdToClose);
    const newTabs = tabs.filter(tab => tab.id !== tabIdToClose);

    // If the closed tab was the active one, decide which tab to activate next
    if (activeTabId === tabIdToClose) {
      // Activate the tab to the left, or the new last tab if the first was closed
      const newActiveIndex = Math.max(0, tabToCloseIndex - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }

    setTabs(newTabs);
    delete webviewRefs.current[tabIdToClose];
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleNavigation = (action: 'back' | 'forward' | 'reload' | 'home' | {url: string}) => {
    if (!activeTabId || !webviewRefs.current[activeTabId]) return;
    const webview = webviewRefs.current[activeTabId];

    if (action === 'back') webview.goBack();
    else if (action === 'forward') webview.goForward();
    else if (action === 'reload') webview.reload();
    else if (action === 'home') webview.loadURL('https://www.google.com');
    else if (typeof action === 'object' && action.url) {
      let newUrl = action.url.trim();
      if (isUrl(newUrl)) {
        newUrl = !/^https?:\/\//i.test(newUrl) ? `https://${newUrl}` : newUrl;
      } else {
        newUrl = `https://duckduckgo.com/?q=${encodeURIComponent(newUrl)}`;
      }
      webview.loadURL(newUrl);
    }
  };

  const handleAddressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setTabs(tabs.map(tab => tab.id === activeTabId ? {...tab, url: newUrl} : tab));
  };

  const updateTabState = (tabId: string, newValues: Partial<Tab>) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId ? { ...tab, ...newValues } : tab
      )
    );
  };

  const handleAddressBarSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeTab) {
      handleNavigation({url: activeTab.url});
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-800 text-white select-none">
      {/* Top bar with navigation controls and address bar */}
      <div className="flex-shrink-0 flex items-center p-1.5 bg-zinc-800 border-b border-zinc-700 space-x-1">
        <button onClick={() => handleNavigation('back')} disabled={!activeTab?.canGoBack} className="p-1.5 rounded-full hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Back">
          <BackIcon />
        </button>
        <button onClick={() => handleNavigation('forward')} disabled={!activeTab?.canGoForward} className="p-1.5 rounded-full hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Forward">
          <ForwardIcon />
        </button>
        <button onClick={() => handleNavigation('reload')} disabled={!activeTab} className="p-1.5 rounded-full hover:bg-zinc-700 disabled:opacity-30" title="Reload">
          {activeTab?.isLoading ? <Spinner /> : <RefreshIcon />}
        </button>
        <button onClick={() => handleNavigation('home')} disabled={!activeTab} className="p-1.5 rounded-full hover:bg-zinc-700 disabled:opacity-30" title="Home">
          <HomeIcon />
        </button>
        <input
          type="text"
          value={activeTab?.url || ''}
          onChange={handleAddressBarChange}
          onKeyDown={handleAddressBarSubmit}
          onFocus={e => e.target.select()}
          className="flex-grow bg-zinc-900 border border-zinc-700 rounded-full py-1.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-zinc-400"
          placeholder="Search or enter address"
        />
      </div>

      {/* Tab Bar */}
      <div className="flex-shrink-0 flex items-center bg-zinc-900 border-b border-zinc-700">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center py-2 px-4 border-r border-zinc-700 cursor-pointer transition-colors ${
              activeTabId === tab.id ? 'bg-zinc-800' : 'hover:bg-zinc-700/50'
            }`}
          >
            <span className="text-xs truncate mr-2">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent the tab itself from being clicked
                closeTab(tab.id);
              }}
              className="p-0.5 rounded-full hover:bg-zinc-600"
            >
              <CloseIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => createNewTab('about:blank')}
          className="p-2 hover:bg-zinc-700/50"
          title="New Tab"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Webview Container */}
      <div className="flex-grow relative bg-black">
        {tabs.map(tab => (
          <div
            key={`webview-container-${tab.id}`}
            className="w-full h-full"
            style={{ display: tab.id === activeTabId ? 'block' : 'none' }}
          >
            {window.electronAPI ? (
              React.createElement('webview', {
                key: tab.id,
                ref: (el: WebViewElement) => {
                  if (el) {
                    webviewRefs.current[tab.id] = el;
                  } else {
                    // Clean up the ref when the webview is unmounted
                    delete webviewRefs.current[tab.id];
                  }
                },
                src: 'about:blank', // Start with a blank page, useEffect handles loading
                className: 'w-full h-full border-none bg-white',
                partition: partition,
                allowpopups: "true",
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400">
                This feature is only available in the Electron version of the app.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'chrome6',
  name: 'Chrome 6',
  icon: 'chrome6', // Will be created in the next step
  component: Chrome6App,
  isExternal: false,
  isPinnedToTaskbar: false,
  defaultSize: {width: 900, height: 650},
};

export default Chrome6App;
