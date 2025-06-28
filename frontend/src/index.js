import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import StartPage from './StartPage';
import ModeSelect from './ModeSelect';
import PlayerSetup from './PlayerSetup';
import MultiPlayerGame from './MultiPlayerGame';
import reportWebVitals from './reportWebVitals';

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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
