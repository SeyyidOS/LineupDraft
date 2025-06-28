import React, { useEffect, useState } from 'react';
import './ConditionModal.css';
import { canonicalize } from './nameUtils';

function Logo({ option }) {
  const [src, setSrc] = useState('/logo192.png');

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      if (option.type === 'nationality') {
        const code = option.value
          .toLowerCase()
          .replace(/[^a-z]/g, '');
        setSrc(`https://flagcdn.com/w80/${code}.png`);
        return;
      }

      let url = null;
      if (option.type === 'club') {
        try {
          const resp = await fetch(
            `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(
              option.value
            )}`
          );
          const data = await resp.json();
          if (data.teams) {
            const normalized = canonicalize(option.value);
            let team = data.teams.find(
              (t) => canonicalize(t.strTeam) === normalized
            );
            if (!team) {
              team = data.teams[0];
            }
            if (team && team.strTeamBadge) {
              url = team.strTeamBadge;
            }
          }
        } catch (e) {
          // ignore network errors
        }
      } else if (option.type === 'league') {
        try {
          const resp = await fetch(
            `https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?l=${encodeURIComponent(
              option.value
            )}`
          );
          const data = await resp.json();
          if (data.leagues) {
            const normalized = canonicalize(option.value);
            let league = data.leagues.find(
              (l) => canonicalize(l.strLeague) === normalized ||
                (l.strLeagueAlternate &&
                  canonicalize(l.strLeagueAlternate) === normalized)
            );
            if (!league) {
              league = data.leagues[0];
            }
            if (league && league.strBadge) {
              url = league.strBadge;
            }
          }
        } catch (e) {
          // ignore network errors
        }
      }

      if (!canceled) {
        setSrc(url || '/logo192.png');
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [option]);

  return <img src={src} alt={option.value} />;
}


export default function ConditionModal({ options, onSelect, selected }) {
  return (
    <div className="condition-modal">
      <div className="condition-modal-content">
        {options.map((opt, i) => (
          <div
            key={i}
            className={`condition-card ${selected === opt ? 'selected' : ''}`}
            onClick={() => onSelect(opt)}
          >
            <Logo option={opt} />
            <div className="condition-label">
              {opt.type === 'club' && `Team: ${opt.value}`}
              {opt.type === 'league' && `League: ${opt.value}`}
              {opt.type === 'nationality' && `Nation: ${opt.value}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
