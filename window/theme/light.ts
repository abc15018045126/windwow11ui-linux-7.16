import {Theme} from '../types';

export const lightTheme: Theme = {
  id: 'light',
  name: 'Windows 11 Light',
  wallpaper:
    'https://images.unsplash.com/photo-1596263576825-f948a33b04c0?auto=format&fit=crop&w=1920&q=80',
  taskbar: {
    background: 'bg-white/80 backdrop-blur-xl',
    buttonHover: 'hover:bg-black/10',
    activeButton: 'bg-black/20',
    activeIndicator: 'bg-blue-600',
    openIndicator: 'bg-gray-400',
    textColor: 'text-black',
  },
  startMenu: {
    background: 'bg-white/80 backdrop-blur-xl',
    searchBar: 'bg-gray-200/80 border border-gray-300 placeholder-gray-500',
    buttonHover: 'hover:bg-black/10',
    textColor: 'text-black',
    pinnedButton: 'bg-gray-200/80 hover:bg-gray-300/80',
  },
  appWindow: {
    header: 'bg-gray-200/80',
    background: 'bg-white/90',
    border: 'border-gray-300/80',
    borderActive: 'border-blue-500/80',
    textColor: 'text-black',
  },
};
