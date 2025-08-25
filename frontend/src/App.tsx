import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './services/queryClient';
import { store } from './store';
import { GanttTimeline } from './components/GanttTimeline';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <ThemeProvider>
            <div className="app-container">
              <div className="app-wrapper">
                <header className="app-header">
                  <div className="header-top">
                    <h1 className="app-title">
                      Factory Scheduler
                    </h1>
                    <ThemeToggle />
                  </div>
                  <p className="app-subtitle">
                    Visualize and manage factory work orders on an interactive Gantt timeline with drag & drop support
                  </p>
                </header>
                
                <main className="app-main">
                  <GanttTimeline />
                </main>
              </div>
            </div>
          </ThemeProvider>
        </DndProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
