import React, { useState } from 'react';
import type { TimelineSlot } from '../../types/environment';

interface TimelineProps {
  timeline: TimelineSlot[];
}

export const Timeline: React.FC<TimelineProps> = ({ timeline }) => {
  const [selectedSlot, setSelectedSlot] = useState<TimelineSlot | null>(null);

  return (
    <>
      <div className="env-timeline">
        {timeline.map((slot, idx) => (
          <div
            key={idx}
            className={`timeline-slot slot-${slot.status.toLowerCase()} ${selectedSlot?.time === slot.time ? 'active' : ''}`}
            onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
          >
            <div className="slot-bar"></div>
            <div className="slot-time">{slot.time}</div>
          </div>
        ))}
      </div>
      
      {selectedSlot && (
        <div className="recommendation-drawer slide-down">
          <h4 className="drawer-title">{selectedSlot.time}</h4>
          <p className="drawer-desc">{selectedSlot.recommendation}</p>
        </div>
      )}
    </>
  );
};
