import React, {createContext, useContext} from 'react';
import {Theme} from '../types';
import {defaultTheme} from './default';
import {lightTheme} from './light';

export const themes = {
  default: defaultTheme,
  light: lightTheme,
};

export interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: 'default' | 'light') => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => console.warn('no theme provider'),
});

export const useTheme = () => useContext(ThemeContext);
