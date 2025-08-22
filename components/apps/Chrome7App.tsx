import React, {useState} from 'react';
import {AppDefinition, AppComponentProps} from '../../window/types';
import {Browser7Icon} from '../../window/constants';

const isUrl = (str: string) => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(str);

const Chrome7App: React.FC<AppComponentProps> = ({setTitle}) => {
  const [inputValue, setInputValue] = useState('https://www.google.com');
  const [proxiedHtml, setProxiedHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setProxiedHtml('');

    let targetUrl = url.trim();
    if (!isUrl(targetUrl)) {
      // For non-URLs, perform a search (implementation for next step)
      targetUrl = `https://duckduckgo.com/?q=${encodeURIComponent(targetUrl)}`;
    }

    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const html = await response.text();
      setProxiedHtml(html);
      setTitle(`Chrome 7 - ${url}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load page: ${errorMessage}`);
      setProxiedHtml(`<div style="color: red; padding: 20px;"><h1>Error</h1><p>${errorMessage}</p></div>`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressBarSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-800 text-white select-none">
      <div className="flex-shrink-0 flex items-center p-1.5 bg-zinc-800 border-b border-zinc-700 space-x-1">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleAddressBarSubmit}
          onFocus={e => e.target.select()}
          className="flex-grow bg-zinc-900 border border-zinc-700 rounded-full py-1.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-zinc-400"
          placeholder="Enter address"
        />
      </div>

      <div className="flex-grow relative bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">Loading...</div>
        ) : (
          <iframe
            srcDoc={proxiedHtml}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
            title="Proxied Content"
          />
        )}
      </div>
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'chrome7',
  name: 'Chrome 7 (Web Proxy)',
  icon: 'chrome7',
  component: Chrome7App,
  isExternal: false,
  isPinnedToTaskbar: false,
  defaultSize: {width: 900, height: 650},
};

export default Chrome7App;
