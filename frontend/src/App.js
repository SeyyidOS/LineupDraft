import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { calculateChemistry } from './chemistry';
import useDebounce from './useDebounce';

function App() {
  const formation = [1, 4, 4, 2];
  const [players, setPlayers] = useState(
    formation.map(count => Array(count).fill(null))
  );
  const [chemistry, setChemistry] = useState(
    formation.map(count => Array(count).fill(0))
  );
  const [totalChem, setTotalChem] = useState(0);
  const [selectedPos, setSelectedPos] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const handleAddPlayer = (row, index) => {
    setSelectedPos({ row, index });
    setQuery('');
    setSuggestions([]);
  };

  useEffect(() => {
    let cancel = false;
    const fetchPlayers = async () => {
      if (!selectedPos || debouncedQuery.trim() === '') {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:8000/players', {
          params: { search: debouncedQuery }
        });
        if (cancel) return;
        const used = players.flat().map(p => p && p.name);
        const available = res.data.players.filter(name => !used.includes(name));
        setSuggestions(available);
      } catch (err) {
        if (!cancel) console.error(err);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    fetchPlayers();
    return () => {
      cancel = true;
    };
  }, [debouncedQuery, selectedPos, players]);

  useEffect(() => {
    const newChem = calculateChemistry(players);
    setChemistry(newChem);
    setTotalChem(newChem.flat().reduce((sum, c) => sum + c, 0));
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
      <div className="total-chemistry">{totalChem}/33</div>
      <button className="toggle-info" onClick={() => setShowInfo(!showInfo)}>
        {showInfo ? 'Hide info' : 'Show info'}
      </button>
      {players.map((row, rowIndex) => (
        <div className="row" key={rowIndex}>
          {row.map((player, posIndex) => (
            <div className="position-container" key={posIndex}>
              <div
                className={`position ${
                  selectedPos &&
                  selectedPos.row === rowIndex &&
                  selectedPos.index === posIndex
                    ? 'selected'
                    : ''
                }`}
                onClick={() => handleAddPlayer(rowIndex, posIndex)}
                style={
                  player && player.photo
                    ? { backgroundImage: `url(${player.photo})` }
                    : {}
                }
              >
                {player && (
                  <div className="chem-badge">
                    {chemistry[rowIndex][posIndex]}
                  </div>
                )}
                {!player && '+'}
              </div>
              {player && (
                <>
                  <div className="player-name">{player.name}</div>
                  {showInfo && (
                    <div className="info">
                      {player.club || 'Unknown'} / {player.league || 'Unknown'} /
                      {player.nationality || 'Unknown'}
                    </div>
                  )}
                </>
              )}
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
          {loading && <div>Loading...</div>}
          {!loading && (
            <ul>
              {suggestions.map((name) => (
                <li key={name} onClick={() => handleSelect(name)}>
                  {name}
                </li>
              ))}
              {suggestions.length === 0 && debouncedQuery.trim() !== '' && (
                <li>No players found</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
