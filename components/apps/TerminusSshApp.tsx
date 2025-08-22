import React, {useState, useEffect, useRef, useCallback} from 'react';
import {AppComponentProps, AppDefinition} from '../../window/types';
import {HyperIcon as TerminusIcon} from '../../window/constants';
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const TerminusSshApp: React.FC<AppComponentProps> = ({setTitle}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const ws = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);
  const fitAddon = useRef(new FitAddon());

  useEffect(() => {
    setTitle(`Terminus SSH - ${status}`);
  }, [setTitle, status]);

  // Fetch current OS user to pre-fill the form
  useEffect(() => {
    fetch('http://localhost:3001/api/os-user')
      .then(res =>
        res.ok ? res.json() : Promise.reject('Failed to fetch user'),
      )
      .then(data => {
        setUsername(data.username || '');
        setHost('127.0.0.1');
      })
      .catch(err => {
        console.error("Couldn't fetch OS username:", err);
        setHost('127.0.0.1');
      });
  }, []);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      ws.current?.close();
      term.current?.dispose();
    };
  }, []);

  // Initialize Terminal on connect
  useEffect(() => {
    if (status === 'connected' && terminalRef.current && !term.current) {
      const terminal = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selectionBackground: '#264f78',
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        allowProposedApi: true,
      });
      term.current = terminal;

      terminal.loadAddon(fitAddon.current);
      terminal.open(terminalRef.current);
      fitAddon.current.fit();
      terminal.focus();

      terminal.onData(data => {
        ws.current?.send(JSON.stringify({type: 'data', payload: data}));
      });

      const resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon.current.fit();
        } catch (e) {
          /* ignore */
        }
      });
      resizeObserver.observe(terminalRef.current);

      return () => {
        resizeObserver.disconnect();
        terminal.dispose();
        term.current = null;
      };
    }
  }, [status]);

  useEffect(() => {
    if (status === 'connected' && term.current) {
      const dims = fitAddon.current.proposeDimensions();
      if (dims && dims.cols && dims.rows) {
        ws.current?.send(
          JSON.stringify({
            type: 'resize',
            payload: {cols: dims.cols, rows: dims.rows},
          }),
        );
      }
    }
  }, [status]);

  const handleConnect = useCallback(() => {
    if (!host || !username || !password) {
      setErrorMsg('Host, username, and password are required.');
      return;
    }

    setStatus('connecting');
    setErrorMsg('');
    term.current?.reset();

    ws.current = new WebSocket('ws://localhost:3002');

    ws.current.onopen = () => {
      term.current?.write(`Connecting to ${username}@${host}...\r\n`);
      const connectPayload = {
        type: 'connect',
        payload: {host, username, password},
      };
      ws.current?.send(JSON.stringify(connectPayload));
    };

    ws.current.onmessage = event => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'status':
          if (message.payload === 'connected') {
            setStatus('connected');
            setPassword('');
          } else {
            setStatus('disconnected');
          }
          break;
        case 'data':
          term.current?.write(message.payload);
          break;
        case 'error':
          term.current?.write(
            `\r\n\x1b[31mError: ${message.payload}\x1b[0m\r\n`,
          );
          setErrorMsg(message.payload);
          setStatus('error');
          ws.current?.close();
          break;
      }
    };

    ws.current.onerror = event => {
      const error =
        'WebSocket connection failed. Is the backend server running?';
      term.current?.write(`\r\n\x1b[31m${error}\x1b[0m\r\n`);
      setErrorMsg(error);
      setStatus('error');
    };

    ws.current.onclose = () => {
      if (status !== 'error') {
        term.current?.write('\r\n\x1b[33mConnection closed.\x1b[0m\r\n');
        setStatus('disconnected');
      }
    };
  }, [host, username, password, status]);

  const handleDisconnect = () => {
    ws.current?.send(JSON.stringify({type: 'disconnect'}));
    ws.current?.close();
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-zinc-200 font-mono text-sm">
      {status !== 'connected' ? (
        // --- Connection View ---
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="w-full max-w-sm bg-zinc-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-center mb-4">
              New SSH Connection
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Host</label>
                <input
                  type="text"
                  value={host}
                  onChange={e => setHost(e.target.value)}
                  className="w-full bg-zinc-900 p-2 rounded border border-zinc-700 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-zinc-900 p-2 rounded border border-zinc-700 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                  className="w-full bg-zinc-900 p-2 rounded border border-zinc-700 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            {errorMsg && (
              <p className="text-red-400 text-xs mt-4 text-center">
                {errorMsg}
              </p>
            )}
            <button
              onClick={handleConnect}
              disabled={status === 'connecting'}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 p-2 rounded font-semibold transition-colors"
            >
              {status === 'connecting' ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      ) : (
        // --- Terminal View ---
        <div className="flex-grow flex flex-col overflow-hidden relative">
          <div ref={terminalRef} className="w-full h-full p-2" />
          <button
            onClick={handleDisconnect}
            className="absolute bottom-2 right-2 text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded z-10"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'terminusSsh',
  name: 'Terminus SSH',
  icon: 'terminusSsh',
  component: TerminusSshApp,
  defaultSize: {width: 800, height: 500},
};

export default TerminusSshApp;
