import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle ${theme}`}
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="theme-toggle-inner">
        <span className="theme-icon sun">☀️</span>
        <span className="theme-icon moon">🌙</span>
        <div className="theme-toggle-slider"></div>
      </div>
      <span className="theme-label">
        {theme === 'light' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};