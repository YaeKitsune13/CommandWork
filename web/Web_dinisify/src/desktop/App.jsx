import { useState } from "react";
import Sidebar from "./components/sidebar/sidebar";
import "./App.css";
import Catalog_window from "./views/Catalog/Catalog_window";
import Login_window from "./views/Login/Login_window";
import Register_window from "./views/Register_window/Register_window";
import Player from "./components/player/player";
import redfangCover from '../assets/images/redfang.jpg';
import redfangSong from '../assets/music/redfang.m4a';
import Profile_window from "./views/Profile/Profile_window";
import Settings_window from "./views/Settings_window/Settings_window";
import MyTracks_window from "./views/MyTracks_window/MyTracks_window";
import MyPlaylists_window from "./views/MyPlaylists_window/MyPlaylists_window";
function App() {
  const [role, setRole] = useState("guest");
  const [currentView, setCurrentView] = useState("catalog");

  const handleLogoClick = () => {
    setCurrentView("catalog");
  };

  const handleLoginClick = () => {
    setCurrentView("login");
  }; 

  const currentTrack = {
    title: "prehistoric dogs",
    artist: "red fang",
    cover: redfangCover,
    audioUrl: redfangSong 

  };
  const handleNavigate = (route) => {
    console.log("Navigate →", route);
    setCurrentView(route);
  };

  const handleAuthSuccess = (newRole) => {
    setRole(newRole);
    setCurrentView("catalog");
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
        <div className="app-content">
          {currentView == "catalog" && <Catalog_window />}

          {currentView == "login" && (
            <Login_window
              onLoginSuccess={handleAuthSuccess}
              onGoToRegister={() => setCurrentView("register")} 
              onCancel={() => setCurrentView("catalog")}
            />
          )}

          {currentView == "register" && (
            <Register_window
              onRegisterSuccess={handleAuthSuccess}
              onGoToLogin={() => setCurrentView("login")}
              onCancel={() => setCurrentView("catalog")}
            />
          )}
          {currentView == "profile" && <Profile_window />}
          {currentView == "settings" && <Settings_window />}
          {currentView == "my-tracks" && <MyTracks_window />}
          {currentView == "my-playlists" && <MyPlaylists_window />}
        </div>

        <div className="debug-row">
          <span>(DEV) выбор роли:</span>
          {["guest", "user", "moderator", "admin"].map((r) => (
            <button
              key={r}
              className={
                r == role ? "debug-btn debug-btn--active" : "debug-btn"
              }
              onClick={() => setRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <Player track={currentTrack} />
      </main>
    </div>
  );
}

export default App;
