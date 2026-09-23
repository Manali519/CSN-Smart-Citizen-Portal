import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UtilityTicker.css';

const TICKER_ITEMS = [
  { text: '💧 Area-wise water supply timings', tab: 'water' },
  { text: '⚡ Today’s electricity maintenance schedule', tab: 'power' },
  { text: '🚧 Ongoing road & pothole repair updates', tab: 'roads' },
];

export default function UtilityTicker() {
  const navigate = useNavigate();

  const handleNavigate = (tab) => {
    navigate(`/daily-updates?tab=${tab}`);
  };

  return (
    <div className="ticker" aria-label="Daily Civic Updates Bulletin">
      <button
        type="button"
        className="ticker-label"
        onClick={() => handleNavigate('water')}
        title="View Daily Updates"
      >
        Click here to know&nbsp;{'\u2192'}
      </button>
      <div className="ticker-track">
        <div className="ticker-content">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <button
              key={i}
              type="button"
              className="ticker-item"
              onClick={() => handleNavigate(item.tab)}
              title={`View ${item.text}`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
