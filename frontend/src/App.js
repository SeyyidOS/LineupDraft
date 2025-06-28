import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const formation = [1, 4, 4, 2];
  const [players, setPlayers] = useState(
    formation.map(count => Array(count).fill(''))
  );
  const [selectedPos, setSelectedPos] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleAddPlayer = (row, index) => {
    setSelectedPos({ row, index });
    setQuery('');
    setSuggestions([]);
  };

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!selectedPos || query.trim() === '') {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get('http://localhost:8000/players', {
          params: { search: query }
        });
        const used = players.flat();
        const available = res.data.players.filter(name => !used.includes(name));
        setSuggestions(available);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayers();
  }, [query, selectedPos, players]);

  const handleSelect = (name) => {
    if (!selectedPos) return;
    const updated = players.map(r => [...r]);
    updated[selectedPos.row][selectedPos.index] = name;
    setPlayers(updated);
    setSelectedPos(null);
    setQuery('');
    setSuggestions([]);
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
      {selectedPos && (
        <div className="player-search">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players"
          />
          <ul>
            {suggestions.map((name) => (
              <li key={name} onClick={() => handleSelect(name)}>
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
