import React from 'react';
import './ConditionBar.css';
import { canonicalize } from './nameUtils';

export default function ConditionBar({ options, onSelect, selected }) {
  return (
    <div className="condition-bar">
      {options.map((opt) => {
        const isSelected =
          selected && selected.type === opt.type && selected.value === opt.value;
        return (
          <div
            key={`${opt.type}-${canonicalize(opt.value)}`}
            className={`condition-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(opt)}
          >
            <div className="condition-label">
              {opt.type === 'club' && `Team: ${opt.value}`}
              {opt.type === 'league' && `League: ${opt.value}`}
              {opt.type === 'nationality' && `Nation: ${opt.value}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
