import React, {useEffect, useRef} from 'react';

export type ContextMenuItem =
  | {type: 'item'; label: string; onClick: () => void; disabled?: boolean}
  | {type: 'separator'};

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({x, y, items, onClose}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to stay within viewport
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const menuWidth = 180; // Estimated width
  const menuHeight = items.length * 32; // Estimated height

  const finalX = x + menuWidth > screenWidth ? screenWidth - menuWidth - 5 : x;
  const finalY =
    y + menuHeight > screenHeight ? screenHeight - menuHeight - 5 : y;

  return (
    <div
      ref={menuRef}
      style={{top: finalY, left: finalX}}
      className="fixed bg-black/80 backdrop-blur-xl border border-zinc-700 rounded-md shadow-lg py-1.5 w-48 text-sm text-zinc-100 z-[60] animate-fade-in-fast"
      onClick={e => {
        // Prevent clicks inside menu from bubbling up to a dismiss handler
        // that would close the menu, e.g., the one on the Start Menu container.
        e.stopPropagation();
      }}
      onContextMenu={e => e.preventDefault()} // Prevent native context menu on our custom one
    >
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="h-px bg-zinc-700 my-1.5" />;
        }
        return (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
