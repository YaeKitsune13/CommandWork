import { useState } from "react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import Sidebar from "./components/sidebar/sidebar";
import Catalog_window from "./views/Catalog/Catalog_window";
import Login_window from "./views/Login/Login_window";
import Register_window from "./views/Register_window/Register_window";
import Player from "./components/player/player";
import Profile_window from "./views/Profile/Profile_window";
import Settings_window from "./views/Settings_window/Settings_window";
import MyTracks_window from "./views/MyTracks_window/MyTracks_window";
import MyPlaylists_window from "./views/MyPlaylists_window/MyPlaylists_window";
import { useAuth } from "../shared/hooks/auth.js";
import "./App.css";

function App() {
  const auth = useAuth();
  const [currentView, setCurrentView] = useState("catalog");
  const [currentTrack, setCurrentTrack] = useState(null);

  return (
    <div className="app-layout">
      <Sidebar
        auth={{ role: auth.role }}
        onLogoClick={() => setCurrentView("catalog")}
        onLoginClick={() => setCurrentView("login")}
        onNavigate={setCurrentView}
      />

      <main className="app-main">
        <div className="app-content">
          {currentView === "catalog" && (
            <Catalog_window onPlayTrack={setCurrentTrack} />
          )}

          {currentView === "login" && (
            <Login_window
              auth={auth}
              onLoginSuccess={() => setCurrentView("catalog")}
              onGoToRegister={() => setCurrentView("register")}
              onCancel={() => setCurrentView("catalog")}
            />
          )}

          {currentView === "register" && (
            <Register_window
              auth={auth}
              onRegisterSuccess={() => setCurrentView("catalog")}
              onGoToLogin={() => setCurrentView("login")}
              onCancel={() => setCurrentView("catalog")}
            />
          )}

          {currentView === "profile" && (
            <Profile_window userId={auth.user?.id} />
          )}
          {currentView === "settings" && (
            <Settings_window userId={auth.user?.id} user={auth.user} />
          )}
          {currentView === "my-tracks" && <MyTracks_window />}
          {currentView === "my-playlists" && <MyPlaylists_window />}
        </div>

        {/* DEV role switcher — remove when real roles from /auth/me work */}
        <div className="debug-row">
          <span>(DEV) роль: {auth.role}</span>
        </div>

        <Player track={currentTrack} />
      </main>
    </div>
  );
}

export default App;
