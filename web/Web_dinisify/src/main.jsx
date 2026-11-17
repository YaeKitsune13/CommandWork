import React from 'react';
import ReactDOM from 'react-dom/client';
import { PlayerProvider } from './shared/player/PlayerContext';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PlayerProvider>
        <App />
      </PlayerProvider>
</BrowserRouter>
  </React.StrictMode>
);
