import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import StartPage from './StartPage';
import ModeSelect from './ModeSelect';
import PlayerSetup from './PlayerSetup';
import MultiPlayerGame from './MultiPlayerGame';

const root = ReactDOM.createRoot(document.getElementById('root'));

function Root() {
  const [mode, setMode] = useState(null);
  const [players, setPlayers] = useState([]);
  const [formation, setFormation] = useState(null);

  if (!mode) {
    return <ModeSelect onSelect={setMode} />;
  }

  if (mode === 'multi' && players.length === 0) {
    return <PlayerSetup onSubmit={setPlayers} />;
  }

  if (!formation) {
    return <StartPage onSelect={setFormation} />;
  }

  if (mode === 'single') {
    return <App formation={formation} />;
  }

  return <MultiPlayerGame formation={formation} players={players} />;
}

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

