import React, { useEffect, useState } from 'react';
import './ConditionModal.css';

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
          if (
            data.teams &&
            data.teams[0] &&
            data.teams[0].strTeamBadge
          ) {
            url = data.teams[0].strTeamBadge;
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
          if (
            data.leagues &&
            data.leagues[0] &&
            data.leagues[0].strBadge
          ) {
            url = data.leagues[0].strBadge;
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
