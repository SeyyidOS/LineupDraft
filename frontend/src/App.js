import React, { useState } from 'react';
import './App.css';

function App() {
  const formation = [1, 4, 4, 2];
  const [players, setPlayers] = useState(
    formation.map(count => Array(count).fill(''))
  );

  const handleAddPlayer = (row, index) => {
    const name = prompt('Enter player name:');
    if (name) {
      const updated = players.map(r => [...r]);
      updated[row][index] = name;
      setPlayers(updated);
    }
  };

  return (
    <div className="field">
      {players.map((row, rowIndex) => (
        <div className="row" key={rowIndex}>
          {row.map((player, posIndex) => (
            <div
              key={posIndex}
              className="position"
              onClick={() => handleAddPlayer(rowIndex, posIndex)}
            >
              {player || '+'}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;
