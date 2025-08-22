import React, {useState, useEffect, useRef} from 'react';
import {AppComponentProps, AppDefinition} from '../../window/types';
import {generateGeminiResponse} from '../../services/geminiService';
import {HyperIcon} from '../../window/constants';

interface Line {
  type: 'input' | 'output';
  content: string;
}

const HyperApp: React.FC<AppComponentProps> = ({appInstanceId, setTitle}) => {
  const [lines, setLines] = useState<Line[]>([
    {
      type: 'output',
      content:
        'Welcome to Hyper Terminal Clone. Type `help` for a list of commands.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(`Hyper - ${appInstanceId.substring(0, 4)}`);
  }, [appInstanceId, setTitle]);

  useEffect(() => {
    // Focus on mount and after processing
    if (!isProcessing) {
      inputRef.current?.focus();
    }
  }, [isProcessing]);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (line: Line) => {
    setLines(prev => [...prev, line]);
  };

  const processCommand = async (commandStr: string) => {
    const trimmedCommand = commandStr.trim();
    if (trimmedCommand === '') return;

    setIsProcessing(true);
    const [command, ...args] = trimmedCommand.split(' ');
    const fullArgs = args.join(' ');

    addLine({type: 'input', content: trimmedCommand});

    switch (command.toLowerCase()) {
      case 'help':
        addLine({
          type: 'output',
          content:
            'Available commands:\n\n- help: Show this help message\n- clear: Clear the terminal screen\n- date: Display the current date and time\n- echo [message]: Print a message\n- whoami: Display the current user\n- neofetch: Display system information\n- gemini [prompt]: Ask Gemini a question',
        });
        break;
      case 'clear':
        setLines([]);
        break;
      case 'date':
        addLine({type: 'output', content: new Date().toString()});
        break;
      case 'echo':
        addLine({type: 'output', content: fullArgs});
        break;
      case 'whoami':
        addLine({type: 'output', content: 'User'});
        break;
      case 'neofetch': {
        const neofetchOutput = `
   OS: Win11 React Gemini Clone
   Kernel: 1.0.0-react
   Uptime: ${Math.floor(performance.now() / 60000)} minutes
   Shell: hyper-clone
   Resolution: ${window.innerWidth}x${window.innerHeight}
   CPU: Virtual (TypeScript)
   GPU: Browser Rendering Engine
   Memory: A few MBs of JS heap
        `;
        addLine({type: 'output', content: neofetchOutput.trim()});
        break;
      }
      case 'gemini':
        if (!fullArgs) {
          addLine({type: 'output', content: 'Usage: gemini [your question]'});
        } else {
          setLines(prev => [
            ...prev,
            {type: 'output', content: 'Asking Gemini...'},
          ]);

          const response = await generateGeminiResponse(fullArgs);

          setLines(prev =>
            prev.map(line =>
              line.content === 'Asking Gemini...' // Find and replace the loading message
                ? {...line, content: response}
                : line,
            ),
          );
        }
        break;
      default:
        addLine({type: 'output', content: `command not found: ${command}`});
        break;
    }

    setInput('');
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing) {
      processCommand(input);
    }
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="flex flex-col h-full bg-[#121212] text-zinc-200 font-mono text-sm p-2"
      onClick={handleTerminalClick}
    >
      <div
        ref={terminalBodyRef}
        className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-1"
      >
        {lines.map((line, index) => (
          <div key={index}>
            {line.type === 'input' && (
              <div className="flex">
                <span className="text-green-400">C:\\Users\\User&gt;</span>
                <span className="ml-2 flex-shrink-0">{line.content}</span>
              </div>
            )}
            {line.type === 'output' && (
              <div className="whitespace-pre-wrap">{line.content}</div>
            )}
          </div>
        ))}
      </div>

      {/* Hidden input to capture keyboard events */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isProcessing}
        className="absolute w-0 h-0 p-0 m-0 border-0 opacity-0"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
      />

      {/* Visual representation of the input prompt */}
      <div className="flex mt-2 items-center">
        <span className="text-green-400 flex-shrink-0">
          C:\\Users\\User&gt;
        </span>
        <div className="ml-2 flex items-center">
          <span>{input}</span>
          {!isProcessing && <span className="blinking-cursor"></span>}
        </div>
      </div>
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'hyper',
  name: 'Hyper',
  icon: 'hyper',
  component: HyperApp,
  defaultSize: {width: 680, height: 420},
  isPinnedToTaskbar: true,
};

export default HyperApp;
