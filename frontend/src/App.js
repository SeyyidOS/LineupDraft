import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { calculateChemistry } from './chemistry';
import useDebounce from './useDebounce';

const TEAMS = ['Arsenal', 'Barcelona', 'Napoli', 'Real Madrid', 'Liverpool'];
const LEAGUES = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
const NATIONS = ['Brazil', 'Spain', 'Italy', 'France', 'Germany', 'Argentina'];

function getRandomOptions() {
  const categories = ['club', 'league', 'nationality'];
  const opts = [];
  while (opts.length < 3) {
    const type = categories[Math.floor(Math.random() * categories.length)];
    const pool = type === 'club' ? TEAMS : type === 'league' ? LEAGUES : NATIONS;
    const value = pool[Math.floor(Math.random() * pool.length)];
    const option = { type, value };
    if (!opts.find(o => o.type === option.type && o.value === option.value)) {
      opts.push(option);
    }
  }
  return opts;
}

function App({ formation = [1, 4, 4, 2] }) {
  const [players, setPlayers] = useState(
    formation.map((count) => Array(count).fill(null))
  );
  const [chemistry, setChemistry] = useState(
    formation.map((count) => Array(count).fill(0))
  );
  const [totalChem, setTotalChem] = useState(0);
  const [selectedPos, setSelectedPos] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [conditionOptions, setConditionOptions] = useState(getRandomOptions());
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [step, setStep] = useState(0);

  const debouncedQuery = useDebounce(query, 300);
  const totalSlots = players.flat().length;

  const displayRows = players.slice().reverse();

  // Reset player grid if the formation prop changes
  useEffect(() => {
    setPlayers(formation.map((c) => Array(c).fill(null)));
    setChemistry(formation.map((c) => Array(c).fill(0)));
    setConditionOptions(getRandomOptions());
    setSelectedCondition(null);
    setStep(0);
  }, [formation]);

  useEffect(() => {
    if (step < totalSlots) {
      setConditionOptions(getRandomOptions());
      setSelectedCondition(null);
    }
  }, [step, totalSlots]);

  const handleAddPlayer = (row, index) => {
    if (step >= totalSlots) return;
    if (!selectedCondition) {
      alert('Select a condition first');
      return;
    }
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

  const matchesCondition = (player) => {
    if (!selectedCondition) return true;
    const val = selectedCondition.value.toLowerCase();
    if (selectedCondition.type === 'club') {
      return (player.club || '').toLowerCase() === val;
    }
    if (selectedCondition.type === 'league') {
      return (player.league || '').toLowerCase() === val;
    }
    if (selectedCondition.type === 'nationality') {
      return (player.nationality || '').toLowerCase() === val;
    }
    return false;
  };

  const handleSelect = async (name) => {
    if (!selectedPos) return;
    try {
      const res = await axios.get('http://localhost:8000/player', {
        params: { name }
      });
      if (!matchesCondition(res.data)) {
        alert('Player does not match the selected condition');
        return;
      }
      const updated = players.map(r => [...r]);
      updated[selectedPos.row][selectedPos.index] = res.data;
      setPlayers(updated);
      setStep(step + 1);
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
      {step < totalSlots && (
        <div className="condition-options">
          {conditionOptions.map((opt, i) => (
            <button
              key={i}
              className={`condition-option ${
                selectedCondition === opt ? 'selected' : ''
              }`}
              onClick={() => setSelectedCondition(opt)}
            >
              {opt.type === 'club' && `Team: ${opt.value}`}
              {opt.type === 'league' && `League: ${opt.value}`}
              {opt.type === 'nationality' && `Nation: ${opt.value}`}
            </button>
          ))}
        </div>
      )}
      <button className="toggle-info" onClick={() => setShowInfo(!showInfo)}>
        {showInfo ? 'Hide info' : 'Show info'}
      </button>
      {displayRows.map((row, displayIndex) => {
        const rowIndex = players.length - 1 - displayIndex;
        return (
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
                    {'\u2605'.repeat(chemistry[rowIndex][posIndex])}
                    {'\u2606'.repeat(3 - chemistry[rowIndex][posIndex])}
                  </div>
                )}
                {!player && '+'}
              </div>
              {player && (
                <>
                  <div className="player-name">{player.name}</div>
                  {showInfo && (
                      <ul className="info-list">
                        <li>Club: {player.club || "Unknown"}</li>
                        <li>League: {player.league || "Unknown"}</li>
                        <li>Nation: {player.nationality || "Unknown"}</li>
                        <li>Chemistry: {chemistry[rowIndex][posIndex]}</li>
                      </ul>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      );
      })}
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
            <div className="suggestions-grid">
              {suggestions.map((name) => (
                <div
                  className="suggestion-card"
                  key={name}
                  onClick={() => handleSelect(name)}
                >
                  {name}
                </div>
              ))}
              {suggestions.length === 0 && debouncedQuery.trim() !== '' && (
                <div className="suggestion-card no-results">No players found</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
