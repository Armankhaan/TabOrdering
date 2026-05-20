// ThemeContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { LightTheme, DarkTheme } from '../services/theme';

export const ThemeContext = createContext({
  theme: {
    ...LightTheme,
    fonts: LightTheme.fonts || {},
  },
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Hardcode LightTheme as the default
  const [theme, setTheme] = useState(LightTheme);

  // Manual toggle (for a switch in your UI)
  const toggleTheme = () => {
    setTheme((old) => (old.dark ? LightTheme : DarkTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
