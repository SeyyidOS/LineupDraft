import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Single player drafting interface.
 */
import { calculateChemistry } from './chemistry';
import useDebounce from './useDebounce';
import { canonicalize } from './nameUtils';
import ConditionBar from './ConditionBar';
import {
  getLeagues,
  getNationalities,
  getTeams,
  searchPlayers,
  getPlayerDetails,
} from './api';

// Helper to normalise strings for comparisons. Removes accents and
// converts to lowercase so that names match API data reliably.
// Normalize a string for comparison against API data. Accents are removed,
// case is lowered and any leading "The" is stripped so that user friendly
// names like "Netherlands" match API values such as "The Netherlands".
const normalizeString = canonicalize;

// Lists of teams, leagues and nationalities are now fetched from the backend
// instead of being hard coded.

/**
 * Pick three random conditions from available metadata.
 */
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

/**
 * Main component for a single player draft session.
 */
function App({ formation = [1, 4, 4, 2], useConditions = true }) {
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

  // Fetch leagues and nationalities on initial load when conditions are enabled
  useEffect(() => {
    if (!useConditions) return;
    const fetchMeta = async () => {
      try {
        const [leaguesRes, nationsRes] = await Promise.all([
          getLeagues(),
          getNationalities(),
        ]);
        setLeagues(leaguesRes);
        setNations(nationsRes);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeta();
  }, [useConditions]);

  // Once leagues are fetched, load the top teams for each league
  useEffect(() => {
    if (!useConditions) return;
    const fetchTeams = async () => {
      const dict = {};
      for (const lg of leagues) {
        try {
          const teams = await getTeams(lg);
          dict[lg] = teams;
        } catch (err) {
          console.error(err);
        }
      }
      setTeamsByLeague(dict);
    };
    if (leagues.length) {
      fetchTeams();
    }
  }, [leagues, useConditions]);

  // When all metadata is available, generate initial condition options
  useEffect(() => {
    if (!useConditions) return;
    if (leagues.length && nations.length && Object.keys(teamsByLeague).length) {
      setConditionOptions(
        getRandomOptions(Object.values(teamsByLeague).flat(), leagues, nations)
      );
    }
  }, [leagues, nations, teamsByLeague, useConditions]);

  const debouncedQuery = useDebounce(query, 300);
  const totalSlots = players.flat().length;

  const displayRows = players.slice().reverse();

  // Reset player grid if the formation prop changes
  useEffect(() => {
    setPlayers(formation.map((c) => Array(c).fill(null)));
    setChemistry(formation.map((c) => Array(c).fill(0)));
    if (useConditions) {
      setConditionOptions(
        getRandomOptions(Object.values(teamsByLeague).flat(), leagues, nations)
      );
      setSelectedCondition(null);
    }
    setStep(0);
  }, [formation, useConditions]);

  useEffect(() => {
    if (!useConditions) return;
    if (step < totalSlots) {
      setConditionOptions(
        getRandomOptions(Object.values(teamsByLeague).flat(), leagues, nations)
      );
      setSelectedCondition(null);
    }
  }, [step, totalSlots, useConditions]);

  const handleConditionSelect = (opt) => {
    if (useConditions) {
      setSelectedCondition(opt);
    }
  };

  const handleAddPlayer = (row, index) => {
    if (step >= totalSlots) return;
    if (useConditions && !selectedCondition) {
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
        const names = await searchPlayers(debouncedQuery);
        if (cancel) return;
        const used = players.flat().map(p => p && p.name);
        const available = names.filter(name => !used.includes(name));
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
    if (!useConditions || !selectedCondition) return true;
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
      const res = await getPlayerDetails(name);
      if (useConditions && !matchesCondition(res)) {
        alert('Player does not match the selected condition');
        return;
      }
      const updated = players.map(r => [...r]);
      updated[selectedPos.row][selectedPos.index] = res;
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
      {useConditions && (
        <ConditionBar
          options={conditionOptions}
          onSelect={handleConditionSelect}
          selected={selectedCondition}
        />
      )}
      <div className="total-chemistry">{totalChem}/33</div>
      {useConditions && selectedCondition && (
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
