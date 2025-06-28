import React from 'react';
import './StartPage.css';

const FORMATIONS = {
  '4-4-2': [1,4,4,2],
  '4-2-3-1': [1,4,2,3,1],
  '3-5-2': [1,3,5,2],
  '3-4-3': [1,3,4,3],
  '4-3-3': [1,4,3,3]
};

function FormationVisual({ layout }) {
  return (
    <div className="formation-visual">
      {layout.slice().reverse().map((count, i) => (
        <div key={i} className="formation-row">
          {Array.from({ length: count }).map((_, j) => (
            <div key={j} className="dot" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function StartPage({ onSelect }) {
  return (
    <div className="start-page">
      <h1>Select Formation</h1>
      <div className="formations">
        {Object.entries(FORMATIONS).map(([name, layout]) => (
          <div
            key={name}
            className="formation-option"
            onClick={() => onSelect(layout)}
          >
            <FormationVisual layout={layout} />
            <div className="formation-name">{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
