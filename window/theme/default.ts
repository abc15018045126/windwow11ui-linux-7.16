import {Theme} from '../types';

export const defaultTheme: Theme = {
  id: 'default',
  name: 'Windows 11 Dark',
  wallpaper:
    'https://images.unsplash.com/photo-1538438253629-5777598687b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80&blur=10',
  taskbar: {
    background: 'bg-black/80 backdrop-blur-xl',
    buttonHover: 'hover:bg-white/20',
    activeButton: 'bg-white/30',
    activeIndicator: 'bg-blue-400',
    openIndicator: 'bg-gray-500',
    textColor: 'text-white',
  },
  startMenu: {
    background: 'bg-black/80 backdrop-blur-xl',
    searchBar: 'bg-zinc-900/50 border border-zinc-700 placeholder-zinc-400',
    buttonHover: 'hover:bg-white/10',
    textColor: 'text-white',
    pinnedButton: 'hover:bg-white/10',
  },
  appWindow: {
    header: 'bg-black/50',
    background: 'bg-black/60',
    border: 'border-zinc-800/50',
    borderActive: 'border-blue-500/80',
    textColor: 'text-zinc-200',
  },
};
