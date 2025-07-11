import React from 'react';
import './StartPage.css';

/**
 * Choose between single and multiplayer modes.
 */

/**
 * Render mode selection screen.
 */
export default function ModeSelect({ onSelect }) {
  return (
    <div className="start-page">
      <h1>Select Game Mode</h1>
      <div className="formations">
        <div className="formation-option" onClick={() => onSelect('single')}>
          Single Player
        </div>
        <div className="formation-option" onClick={() => onSelect('multi')}>
          Multiplayer
        </div>
        <div className="formation-option" onClick={() => onSelect('free')}>
          Free Play
        </div>
      </div>
    </div>
  );
}
