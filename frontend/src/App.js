import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { calculateChemistry } from './chemistry';

function App() {
  const formation = [1, 4, 4, 2];
  const [players, setPlayers] = useState(
    formation.map(count => Array(count).fill(null))
  );
  const [chemistry, setChemistry] = useState(
    formation.map(count => Array(count).fill(0))
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
        const used = players.flat().map(p => p && p.name);
        const available = res.data.players.filter(name => !used.includes(name));
        setSuggestions(available);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayers();
  }, [query, selectedPos, players]);

  useEffect(() => {
    setChemistry(calculateChemistry(players));
  }, [players]);

  const handleSelect = async (name) => {
    if (!selectedPos) return;
    try {
      const res = await axios.get('http://localhost:8000/player', {
        params: { name }
      });
      const updated = players.map(r => [...r]);
      updated[selectedPos.row][selectedPos.index] = res.data;
      setPlayers(updated);
    } catch (err) {
      console.error(err);
    }
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
              {player ? `${player.name} (${chemistry[rowIndex][posIndex]})` : '+'}
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
