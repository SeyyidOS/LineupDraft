import React, { useState, useEffect } from 'react';
import ConditionBar from './ConditionBar';
import { calculateChemistry } from './chemistry';
import useDebounce from './useDebounce';
import { canonicalize } from './nameUtils';
import './App.css';

/**
 * Multiplayer version of the drafting game.
 */
import {
  getLeagues,
  getNationalities,
  getTeams,
  searchPlayers,
  getPlayerDetails,
} from './api';

/**
 * Select random club/league/nation options.
 */
function getRandomOptions(teams, leagues, nations) {
  const categories = ['club', 'league', 'nationality'];
  const opts = [];
  if ((!teams || teams.length === 0) && (!leagues || leagues.length === 0) && (!nations || nations.length === 0)) {
    return opts;
  }
  let attempts = 0;
  const maxAttempts = 50;
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
 * Main component for multiplayer drafting.
 */
export default function MultiPlayerGame({ formation, players }) {
  const totalSlots = formation.reduce((sum, c) => sum + c, 0);
  const [lineups, setLineups] = useState(players.map(() => formation.map((c) => Array(c).fill(null))));
  const [chemistry, setChemistry] = useState(players.map(() => formation.map((c) => Array(c).fill(0))));
  const [steps, setSteps] = useState(players.map(() => 0));
  const [finished, setFinished] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [pickerIndex, setPickerIndex] = useState(0);
  const [conditionOptions, setConditionOptions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [selectedPos, setSelectedPos] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const [teamsByLeague, setTeamsByLeague] = useState({});
  const [nations, setNations] = useState([]);
  const [usedPlayers, setUsedPlayers] = useState([]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, [leagues]);

  useEffect(() => {
    if (leagues.length && nations.length && Object.keys(teamsByLeague).length) {
      setConditionOptions(getRandomOptions(Object.values(teamsByLeague).flat(), leagues, nations));
    }
  }, [leagues, nations, teamsByLeague]);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!selectedPos || debouncedQuery.trim() === '') {
      setSuggestions([]);
      return;
    }
    let cancel = false;
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const names = await searchPlayers(debouncedQuery);
        if (cancel) return;
        const used = usedPlayers;
        const available = names.filter((name) => !used.includes(name));
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
  }, [debouncedQuery, selectedPos, usedPlayers]);

  useEffect(() => {
    const newChem = lineups.map((lu) => calculateChemistry(lu));
    setChemistry(newChem);
  }, [lineups]);

  const matchesCondition = (player) => {
    if (!selectedCondition) return true;
    const val = canonicalize(selectedCondition.value);
    if (selectedCondition.type === 'club') {
      return canonicalize(player.club) === val;
    }
    if (selectedCondition.type === 'league') {
      return canonicalize(player.league) === val;
    }
    if (selectedCondition.type === 'nationality') {
      return canonicalize(player.nationality) === val;
    }
    return false;
  };

  const handleConditionSelect = (opt) => {
    if (!selectedCondition && currentPlayer === pickerIndex) {
      setSelectedCondition(opt);
    }
  };

  const handleAddPlayer = (row, index) => {
    if (!selectedCondition) return;
    setSelectedPos({ row, index });
    setQuery('');
    setSuggestions([]);
  };

  const handleSelect = async (name) => {
    if (!selectedPos) return;
    try {
      const res = await getPlayerDetails(name);
      if (!matchesCondition(res)) {
        alert('Player does not match the selected condition');
        return;
      }
      const updated = lineups.map((lu) => lu.map((r) => [...r]));
      const prev = updated[currentPlayer][selectedPos.row][selectedPos.index];
      updated[currentPlayer][selectedPos.row][selectedPos.index] = res;
      setLineups(updated);
      const newUsed = [...usedPlayers];
      if (prev) {
        const idx = newUsed.indexOf(prev.name);
        if (idx !== -1) newUsed.splice(idx, 1);
      }
      newUsed.push(res.name);
      setUsedPlayers(newUsed);
      const newSteps = [...steps];
      if (!prev) {
        newSteps[currentPlayer] += 1;
        setSteps(newSteps);
      }
      const nextPlayer = (currentPlayer + 1) % players.length;
      if (nextPlayer === pickerIndex) {
        setSelectedCondition(null);
        setConditionOptions(getRandomOptions(Object.values(teamsByLeague).flat(), leagues, nations));
        setPickerIndex((pickerIndex + 1) % players.length);
      }
      setCurrentPlayer(nextPlayer);
    } catch (err) {
      console.error(err);
    }
    setSelectedPos(null);
    setQuery('');
    setSuggestions([]);
  };

  const allFilled = lineups.every((lu) => lu.flat().every((p) => p));
  const displayRows = lineups[currentPlayer].slice().reverse();

  if (finished) {
    return (
      <div className="field">
        <h2>Draft complete!</h2>
      </div>
    );
  }

  return (
    <div className="field">
      {!selectedCondition && currentPlayer === pickerIndex && (
        <ConditionBar options={conditionOptions} onSelect={handleConditionSelect} selected={selectedCondition} />
      )}
      {selectedCondition && (
        <div className="current-condition">
          Player {players[currentPlayer]} - {selectedCondition.type}: {selectedCondition.value}
        </div>
      )}
      {displayRows.map((row, displayIndex) => {
        const rowIndex = lineups[currentPlayer].length - 1 - displayIndex;
        return (
          <div className="row" key={rowIndex}>
            {row.map((player, posIndex) => (
              <div className="position-container" key={posIndex}>
                <div
                  className={`position ${
                    selectedPos && selectedPos.row === rowIndex && selectedPos.index === posIndex ? 'selected' : ''
                  }`}
                  onClick={() => handleAddPlayer(rowIndex, posIndex)}
                  style={player && player.photo ? { backgroundImage: `url(${player.photo})` } : {}}
                >
                  {player && (
                    <div className="chem-badge">
                      {'\u2605'.repeat(chemistry[currentPlayer][rowIndex][posIndex])}
                      {'\u2606'.repeat(3 - chemistry[currentPlayer][rowIndex][posIndex])}
                    </div>
                  )}
                  {!player && '+'}
                </div>
                {player && <div className="player-name">{player.name}</div>}
              </div>
            ))}
          </div>
        );
      })}
      {selectedPos && (
        <div className="player-search">
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search players" />
          {loading && <div>Loading...</div>}
          {!loading && (
            <div className="suggestions-grid">
              {suggestions.map((name) => (
                <div className="suggestion-card" key={name} onClick={() => handleSelect(name)}>
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
      {allFilled && !finished && (
        <button className="finish-button" onClick={() => setFinished(true)}>
          Finish Draft
        </button>
      )}
    </div>
  );
}
