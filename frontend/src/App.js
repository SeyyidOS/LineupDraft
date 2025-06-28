import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { calculateChemistry } from './chemistry';
import useDebounce from './useDebounce';
import { canonicalize } from './nameUtils';
import ConditionBar from './ConditionBar';
import {
  DEFAULT_LEAGUES,
  DEFAULT_TEAMS,
  DEFAULT_NATIONALITIES,
} from './fallbackData';

// Helper to normalise strings for comparisons. Removes accents and
// converts to lowercase so that names match API data reliably.
// Normalize a string for comparison against API data. Accents are removed,
// case is lowered and any leading "The" is stripped so that user friendly
// names like "Netherlands" match API values such as "The Netherlands".
const normalizeString = canonicalize;

// Lists of teams, leagues and nationalities are now fetched from the backend
// instead of being hard coded.

function getRandomOptions(teams, leagues, nations) {
  const categories = ['club', 'league', 'nationality'];
  const opts = [];

  // If all pools are empty, avoid an infinite loop
  if (
    (!teams || teams.length === 0) &&
    (!leagues || leagues.length === 0) &&
    (!nations || nations.length === 0)
  ) {
    return opts;
  }

  let attempts = 0;
  const maxAttempts = 50; // safety guard
  while (opts.length < 3 && attempts < maxAttempts) {
    attempts += 1;
    const type = categories[Math.floor(Math.random() * categories.length)];
    const pool = type === 'club' ? teams : type === 'league' ? leagues : nations;
    if (!pool || pool.length === 0) continue;
    const value = pool[Math.floor(Math.random() * pool.length)];
    const option = { type, value };
    if (!opts.find((o) => o.type === option.type && o.value === option.value)) {
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
  const [leagues, setLeagues] = useState([]);
  const [teamsByLeague, setTeamsByLeague] = useState({});
  const [nations, setNations] = useState([]);
  const [conditionOptions, setConditionOptions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [step, setStep] = useState(0);

  // Fetch leagues and nationalities on initial load
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [leaguesRes, nationsRes] = await Promise.all([
          axios.get('http://localhost:8000/leagues'),
          axios.get('http://localhost:8000/nationalities'),
        ]);
        setLeagues(leaguesRes.data.leagues || DEFAULT_LEAGUES);
        setNations(nationsRes.data.nationalities || DEFAULT_NATIONALITIES);
      } catch (err) {
        console.error(err);
        setLeagues(DEFAULT_LEAGUES);
        setNations(DEFAULT_NATIONALITIES);
      }
    };
    fetchMeta();
  }, []);

  // Once leagues are fetched, load the top teams for each league
  useEffect(() => {
    const fetchTeams = async () => {
      const dict = {};
      for (const lg of leagues) {
        try {
          const res = await axios.get('http://localhost:8000/teams', {
            params: { league: lg },
          });
          dict[lg] = res.data.teams || DEFAULT_TEAMS[lg] || [];
        } catch (err) {
          console.error(err);
          dict[lg] = DEFAULT_TEAMS[lg] || [];
        }
      }
      setTeamsByLeague(dict);
    };
    if (leagues.length) {
      fetchTeams();
    }
  }, [leagues]);

  // When all metadata is available, generate initial condition options
  useEffect(() => {
    if (leagues.length && nations.length && Object.keys(teamsByLeague).length) {
      setConditionOptions(
        getRandomOptions(Object.values(teamsByLeague).flat(), leagues, nations)
      );
    }
  }, [leagues, nations, teamsByLeague]);

  const debouncedQuery = useDebounce(query, 300);
  const totalSlots = players.flat().length;

  const displayRows = players.slice().reverse();

  // Reset player grid if the formation prop changes
  useEffect(() => {
    setPlayers(formation.map((c) => Array(c).fill(null)));
    setChemistry(formation.map((c) => Array(c).fill(0)));
    setConditionOptions(getRandomOptions(Object.values(teamsByLeague).flat(), leagues, nations));
    setSelectedCondition(null);
    setStep(0);
  }, [formation]);

  useEffect(() => {
    if (step < totalSlots) {
      setConditionOptions(getRandomOptions(Object.values(teamsByLeague).flat(), leagues, nations));
      setSelectedCondition(null);
    }
  }, [step, totalSlots]);

  const handleConditionSelect = (opt) => {
    setSelectedCondition(opt);
  };

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
    const val = normalizeString(selectedCondition.value);
    if (selectedCondition.type === 'club') {
      return normalizeString(player.club) === val;
    }
    if (selectedCondition.type === 'league') {
      return normalizeString(player.league) === val;
    }
    if (selectedCondition.type === 'nationality') {
      return normalizeString(player.nationality) === val;
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
      <ConditionBar
        options={conditionOptions}
        onSelect={handleConditionSelect}
        selected={selectedCondition}
      />
      <div className="total-chemistry">{totalChem}/33</div>
      {selectedCondition && (
        <div className="current-condition">
          {selectedCondition.type === 'club' && `Team: ${selectedCondition.value}`}
          {selectedCondition.type === 'league' && `League: ${selectedCondition.value}`}
          {selectedCondition.type === 'nationality' && `Nation: ${selectedCondition.value}`}
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
