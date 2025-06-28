import React, { useState } from 'react';
import './StartPage.css';

export default function PlayerSetup({ onSubmit }) {
  const [name, setName] = useState('');
  const [players, setPlayers] = useState([]);

  const addPlayer = () => {
    const trimmed = name.trim();
    if (trimmed) {
      setPlayers([...players, trimmed]);
      setName('');
    }
  };

  const start = () => {
    if (players.length > 0) {
      onSubmit(players);
    }
  };

  return (
    <div className="start-page">
      <h1>Enter Player Names</h1>
      <div className="formations">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
        />
        <div className="formation-option" onClick={addPlayer}>
          Add
        </div>
      </div>
      <ul>
        {players.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <div className="formation-option" onClick={start}>
        Start Draft
      </div>
    </div>
  );
}
