import { useState } from 'react';
import Sidebar from './components/sidebar/sidebar';
import './App.css';

function App() {
  const [role, setRole] = useState('guest');

  const handleLogoClick = () => {
    console.log('Navigate → Catalog_window');
  };

  const handleLoginClick = () => {
    console.log('Navigate → Login_window');
  };

  const handleNavigate = (route) => {
    console.log('Navigate →', route);
  };

  return (
    <div className="app-layout">
      <Sidebar
        auth={{ role: role }}
        onLogoClick={handleLogoClick}
        onLoginClick={handleLoginClick}
        onNavigate={handleNavigate}
      />

      <main className="app-main">
        <h1>Catalog_window</h1>
        <p>Catalogue content will go here.</p>

        <div className="debug-row">
          <span>Preview role:</span>
          {['guest', 'user', 'moderator', 'admin'].map((r) => (
            <button
              key={r}
              className={r == role ? 'debug-btn debug-btn--active' : 'debug-btn'}
              onClick={() => setRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;