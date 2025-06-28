import React from 'react';
import './ConditionModal.css';

function getImageSrc(option) {
  // Use flag images for nationalities when possible. Fallback to generic logo.
  if (option.type === 'nationality') {
    const code = option.value
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    // Attempt to fetch flag from flagcdn. This may fail silently if offline.
    return `https://flagcdn.com/w80/${code}.png`;
  }
  // For club and league use the default React logo as placeholder.
  return '/logo192.png';
}

export default function ConditionModal({ options, onSelect, selected }) {
  return (
    <div className="condition-modal">
      <div className="condition-modal-content">
        {options.map((opt, i) => (
          <div
            key={i}
            className={`condition-card ${selected === opt ? 'selected' : ''}`}
            onClick={() => onSelect(opt)}
          >
            <img src={getImageSrc(opt)} alt={opt.value} />
            <div className="condition-label">
              {opt.type === 'club' && `Team: ${opt.value}`}
              {opt.type === 'league' && `League: ${opt.value}`}
              {opt.type === 'nationality' && `Nation: ${opt.value}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
