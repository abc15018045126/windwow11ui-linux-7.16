import React, {useState, useEffect, useRef, useCallback} from 'react';
import {AppDefinition, AppComponentProps} from '../../window/types';
import {readFile, saveFile} from '../../../services/filesystemService';
import {NotebookIcon} from '../../constants';

interface FileIdentifier {
  path: string;
  name: string;
}

interface StatusBarInfo {
  line: number;
  column: number;
  charCount: number;
  selectedCount: number;
}

// A simple dropdown component for the menu
const MenuDropdown: React.FC<{title: string; children: React.ReactNode}> = ({
  title,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2 py-0.5 text-sm hover:bg-zinc-700 rounded-sm ${isOpen ? 'bg-zinc-700' : ''}`}
      >
        {title}
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 bg-[#2b2b2b] border border-zinc-700 shadow-lg py-1 w-48 z-10 rounded"
          onClick={() => setIsOpen(false)} // Close dropdown on item click
        >
          {children}
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({onClick, children, disabled}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left px-3 py-1 text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
    >
      {children}
    </button>
  );
};

const NotebookApp: React.FC<AppComponentProps> = ({setTitle, initialData}) => {
  const triggerRefresh = initialData?.triggerRefresh;
  const onSaveCallback = initialData?.onSave as
    | ((content: string) => void)
    | undefined;

  const [fileName, setFileName] = useState('Untitled.txt');
  const [filePath, setFilePath] = useState<string | undefined>(undefined);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [statusBarInfo, setStatusBarInfo] = useState<StatusBarInfo>({
    line: 1,
    column: 1,
    charCount: 0,
    selectedCount: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update window title when file name or dirty state changes
  useEffect(() => {
    setTitle(`${isDirty ? '*' : ''}${fileName} - Notebook`);
  }, [fileName, isDirty]);

  // Handles loading file from path, OR from direct content injection
  useEffect(() => {
    const fileIdentifier = initialData?.file as FileIdentifier | undefined;
    const initialContent = initialData?.content as string | undefined;
    const initialName = initialData?.fileName as string | undefined;
    const directFilePath = initialData?.filePath as string | undefined;

    setIsLoading(true);

    const loadFileByPath = async (path: string) => {
      const fileData = await readFile(path);
      if (fileData) {
        setContent(fileData.content);
        setFilePath(fileData.path);
        setFileName(fileData.name);
      } else {
        setContent(`Error: Could not load file at ${path}`);
        setFileName('Error');
      }
      setIsDirty(false);
      setIsLoading(false);
    };

    if (typeof initialContent === 'string') {
      // Handles SFTP/remote files where content is passed directly
      setContent(initialContent);
      setFileName(initialName || 'Untitled Remote File');
      setFilePath(directFilePath); // Store the remote path for context
      setIsDirty(false);
      setIsLoading(false);
    } else if (fileIdentifier?.path) {
      // Handles local virtual files passed as a file object
      loadFileByPath(fileIdentifier.path);
    } else if (directFilePath) {
      // Handles local virtual files passed as just a path
      loadFileByPath(directFilePath);
    } else {
      // Default to a new, empty document
      handleNew();
    }
  }, [initialData]);

  const updateStatusBar = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const {selectionStart, selectionEnd} = textarea;
    const selectedCount = selectionEnd - selectionStart;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLineNumber = lines.length;
    const currentColumnNumber = lines[lines.length - 1].length + 1;

    setStatusBarInfo({
      line: currentLineNumber,
      column: currentColumnNumber,
      charCount: content.length,
      selectedCount: selectedCount,
    });
  }, [content]);

  useEffect(() => {
    updateStatusBar();
  }, [content, updateStatusBar]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (!isDirty) setIsDirty(true);
  };

  // --- Menu Actions ---
  const handleNew = () => {
    setContent('');
    setFileName('Untitled.txt');
    setFilePath(undefined);
    setIsLoading(false);
    setIsDirty(false);
  };

  const handleOpen = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadstart = () => setIsLoading(true);
      reader.onload = event => {
        setContent(event.target?.result as string);
        setFileName(file.name);
        setFilePath(undefined); // This is a new, unsaved buffer from a local file
        setIsLoading(false);
        setIsDirty(true); // Dirty since it's not saved to our virtual FS
      };
      reader.onerror = () => {
        setContent('Error reading file.');
        setIsLoading(false);
      };
      reader.readAsText(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleSave = async () => {
    if (onSaveCallback) {
      // Prefer the remote save handler if provided
      onSaveCallback(content);
      setIsDirty(false);
    } else if (filePath) {
      // File exists in virtual FS
      await saveFile(filePath, content);
      setIsDirty(false);
      triggerRefresh?.();
    } else {
      // New file or file opened from user's disk, fallback to Save As
      handleSaveAs();
    }
  };

  const handleSaveAs = () => {
    const blob = new Blob([content.replace(/\n/g, '\r\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- View Actions ---
  const toggleWordWrap = () => setWordWrap(!wordWrap);
  const zoomIn = useCallback(
    () => setZoomLevel(prev => Math.min(prev + 10, 500)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoomLevel(prev => Math.max(prev - 10, 10)),
    [],
  );
  const resetZoom = () => setZoomLevel(100);

  // Handle Ctrl+Scroll for zooming
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    };
    textarea.addEventListener('wheel', handleWheel, {passive: false});
    return () => textarea.removeEventListener('wheel', handleWheel);
  }, [zoomIn, zoomOut]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-zinc-200">
      <div className="flex-shrink-0 flex items-center space-x-1 px-1 py-0.5 bg-[#2d2d2d] border-b border-zinc-800">
        <MenuDropdown title="File">
          <MenuItem onClick={handleNew}>New</MenuItem>
          <MenuItem onClick={handleOpen}>Open...</MenuItem>
          <MenuItem onClick={handleSave} disabled={!isDirty}>
            Save
          </MenuItem>
          <MenuItem onClick={handleSaveAs}>Save As...</MenuItem>
        </MenuDropdown>
        <MenuDropdown title="View">
          <div
            className="w-full text-left px-3 py-1 text-sm hover:bg-blue-600 flex justify-between items-center cursor-pointer rounded-sm"
            onClick={toggleWordWrap}
          >
            <span>Word Wrap</span>
            <span>{wordWrap ? '✓' : ''}</span>
          </div>
          <div className="my-1 border-t border-zinc-600"></div>
          <MenuItem onClick={zoomIn}>Zoom In</MenuItem>
          <MenuItem onClick={zoomOut}>Zoom Out</MenuItem>
          <MenuItem onClick={resetZoom}>Restore Default Zoom</MenuItem>
        </MenuDropdown>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.js,.ts,.html,.css,.json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <textarea
        ref={textareaRef}
        value={isLoading ? 'Loading...' : content}
        onChange={e => handleContentChange(e.target.value)}
        onKeyUp={updateStatusBar}
        onMouseUp={updateStatusBar}
        onClick={updateStatusBar}
        onSelect={updateStatusBar}
        wrap={wordWrap ? 'soft' : 'off'}
        className="flex-grow w-full h-full bg-[#1e1e1e] text-zinc-100 p-2 font-mono text-sm border-none outline-none resize-none custom-scrollbar whitespace-pre"
        style={{fontSize: `${zoomLevel}%`, lineHeight: 1.5}}
        placeholder=""
        spellCheck="false"
        disabled={isLoading}
      />

      <div className="flex-shrink-0 grid grid-cols-[1fr,auto] items-center px-3 py-0.5 text-xs bg-[#2d2d2d] border-t border-zinc-800 text-zinc-400">
        <div />
        <div className="flex items-center space-x-4 pl-4">
          <span>
            Ln {statusBarInfo.line}, Col {statusBarInfo.column}
          </span>
          <span className="border-l border-zinc-600 h-4"></span>
          <span>{statusBarInfo.charCount} characters</span>
          {statusBarInfo.selectedCount > 0 && (
            <>
              <span className="border-l border-zinc-600 h-4"></span>
              <span>{statusBarInfo.selectedCount} selected</span>
            </>
          )}
          <span className="border-l border-zinc-600 h-4"></span>
          <span>{zoomLevel}%</span>
          <span className="border-l border-zinc-600 h-4"></span>
          <span>Windows (CRLF)</span>
          <span className="border-l border-zinc-600 h-4"></span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'notebook',
  name: 'Notebook',
  icon: 'notebook',
  component: NotebookApp,
  defaultSize: {width: 600, height: 500},
  fileExtensions: ['.txt', '.log'],
  allowMultipleInstances: true,
};

export default NotebookApp;
