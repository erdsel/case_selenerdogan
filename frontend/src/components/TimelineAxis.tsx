import React, { useMemo } from 'react';
import './TimelineAxis.css';

interface TimelineAxisProps {
  startTime: Date;
  endTime: Date;
  width: number;   // px
  height?: number; // px
}

export const TimelineAxis: React.FC<TimelineAxisProps> = ({
  startTime,
  endTime,
  width,
  height = 40,
}) => {
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();
  const span = Math.max(1, endMs - startMs);

  // ~10 tick için akıllı adım
  const stepMs = useMemo(() => {
    const hours = span / 3_600_000;
    if (hours <= 12) return 60 * 60 * 1000;         // 1h
    if (hours <= 48) return 3 * 60 * 60 * 1000;     // 3h
    const days = hours / 24;
    if (days <= 14) return 24 * 60 * 60 * 1000;     // 1d
    return 7 * 24 * 60 * 60 * 1000;                 // 1w
  }, [span]);

  const ticks = useMemo(() => {
    const out: number[] = [];
    const first = Math.ceil(startMs / stepMs) * stepMs;
    for (let t = first; t <= endMs; t += stepMs) out.push(t);
    return out;
  }, [startMs, endMs, stepMs]);

  const timeToX = (t: number) => Math.round(((t - startMs) / span) * width);

  return (
    <div className="gt-axis" style={{ width, height }}>
      {ticks.map((t, i) => {
        const d = new Date(t);
        const time = d.toLocaleTimeString('tr-TR', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
        });
        const date = d.toLocaleDateString('tr-TR', {
          day: '2-digit', month: '2-digit'
        });
        return (
          <div key={i} className="gt-axis-tick" style={{ left: timeToX(t) }}>
  <div className="gt-axis-label">
    {time}
  </div>
  <div className="gt-axis-line" />
</div>

        );
      })}
    </div>
  );
};
