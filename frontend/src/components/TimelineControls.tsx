import React from 'react';
import './TimelineControls.css';

export interface TimelineSettings {
  scale: 'hourly' | 'daily' | 'weekly';
  zoom: number; // Fixed at 1.4
  gridSnap: boolean;
}

interface TimelineControlsProps {
  settings: TimelineSettings;
  onSettingsChange: (settings: TimelineSettings) => void;
}

// TimelineControls component removed - now we don't need any controls
export const TimelineControls: React.FC<TimelineControlsProps> = ({
  settings,
  onSettingsChange,
}) => {
  // Return empty component since we don't need controls anymore
  return null;
};