import React from 'react';
import { AppDefinition, OpenApp } from '../../../types';

// A type that can be either a full OpenApp or a base AppDefinition
type TaskbarApp = (AppDefinition | OpenApp) & { isOpen: boolean; isActive: boolean };

interface TaskbarContextMenuProps {
    app: TaskbarApp;
    x: number;
    y: number;
    onClose: () => void;
    pinApp: (appId: string) => void;
    unpinApp: (appId: string) => void;
    closeApp: (instanceId: string) => void;
    toggleMinimizeApp: (instanceId: string) => void;
    toggleMaximizeApp: (instanceId: string) => void;
    openApp: (appId: string) => void;
    isPinned: boolean;
}

const TaskbarContextMenu: React.FC<TaskbarContextMenuProps> = ({
    app,
    x,
    y,
    onClose,
    pinApp,
    unpinApp,
    closeApp,
    toggleMinimizeApp,
    toggleMaximizeApp,
    openApp,
    isPinned,
}) => {
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // The instanceId is only present for open apps
    const instanceId = 'instanceId' in app ? (app as OpenApp).instanceId : undefined;

    const handlePinToggle = () => {
        if (isPinned) {
            unpinApp(app.id);
        } else {
            pinApp(app.id);
        }
        onClose();
    };

    const handleOpen = () => {
        openApp(app.id);
        onClose();
    };

    const handleClose = () => {
        if (instanceId) {
            closeApp(instanceId);
        }
        onClose();
    };

    const handleMinimize = () => {
        if (instanceId) {
            toggleMinimizeApp(instanceId);
        }
        onClose();
    }

    const handleMaximize = () => {
        if (instanceId) {
            toggleMaximizeApp(instanceId);
        }
        onClose();
    }

    const menuWidth = 180;
    const finalX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 5 : x;
    const finalY = y - 120 > 0 ? y - 120 : y + 20; // Simplified logic to open upwards

    return (
        <div
            ref={menuRef}
            style={{ top: finalY, left: finalX }}
            className="fixed bg-black/80 backdrop-blur-xl border border-zinc-700 rounded-md shadow-lg py-1.5 w-48 text-sm text-zinc-100 z-[60] animate-fade-in-fast"
            onContextMenu={(e) => e.preventDefault()}
        >
            {app.isOpen && instanceId && (
                 <button
                    onClick={handleMaximize}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 rounded-sm flex items-center"
                >
                    Maximize
                </button>
            )}
             {app.isOpen && instanceId && (
                 <button
                    onClick={handleMinimize}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 rounded-sm flex items-center"
                >
                    Minimize
                </button>
            )}
            {!app.isOpen && (
                <button
                    onClick={handleOpen}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 rounded-sm flex items-center"
                >
                    Open
                </button>
            )}
            <div className="h-px bg-zinc-700 my-1.5" />
            <button
                onClick={handlePinToggle}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 rounded-sm flex items-center"
            >
                {isPinned ? 'Unpin from taskbar' : 'Pin to taskbar'}
            </button>
            {app.isOpen && (
                <button
                    onClick={handleClose}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 rounded-sm flex items-center"
                >
                    Close window
                </button>
            )}
        </div>
    );
};

export default TaskbarContextMenu;
