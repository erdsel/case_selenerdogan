import { format, parseISO, differenceInMilliseconds } from 'date-fns';

export const formatDateTime = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'MMM dd, HH:mm');
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoString;
  }
};

export const formatTime = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'HH:mm');
  } catch (error) {
    console.error('Error formatting time:', error);
    return isoString;
  }
};

export const formatDuration = (startISO: string, endISO: string): string => {
  try {
    const start = parseISO(startISO);
    const end = parseISO(endISO);
    const diffMs = differenceInMilliseconds(end, start);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return '0m';
  }
};

export const getTimelinePosition = (
  timeISO: string,
  startTime: Date,
  endTime: Date,
  width: number
): number => {
  try {
    const time = parseISO(timeISO);
    const totalDuration = endTime.getTime() - startTime.getTime();
    const timeSinceStart = time.getTime() - startTime.getTime();
    return (timeSinceStart / totalDuration) * width;
  } catch (error) {
    console.error('Error calculating timeline position:', error);
    return 0;
  }
};

export const getOperationWidth = (
  startISO: string,
  endISO: string,
  timelineStart: Date,
  timelineEnd: Date,
  totalWidth: number
): number => {
  try {
    const start = parseISO(startISO);
    const end = parseISO(endISO);
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const operationDuration = end.getTime() - start.getTime();
    return (operationDuration / totalDuration) * totalWidth;
  } catch (error) {
    console.error('Error calculating operation width:', error);
    return 50; // Default width
  }
};

export const isTimeInPast = (isoString: string): boolean => {
  try {
    const time = parseISO(isoString);
    return time.getTime() < Date.now();
  } catch (error) {
    console.error('Error checking if time is in past:', error);
    return false;
  }
};

export const getCurrentTimePosition = (
  timelineStart: Date,
  timelineEnd: Date,
  width: number
): number => {
  const now = new Date();
  const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
  const timeSinceStart = now.getTime() - timelineStart.getTime();
  
  if (timeSinceStart < 0 || timeSinceStart > totalDuration) {
    return -1; // Current time is outside the timeline
  }
  
  return (timeSinceStart / totalDuration) * width;
};