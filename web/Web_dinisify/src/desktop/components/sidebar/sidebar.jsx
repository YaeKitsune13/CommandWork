import {
  Music,
  ListMusic,
  User,
  Settings,
  LogIn,
  Shield,
  ShieldCheck,
} from "lucide-react";
import "./sidebar.css";
import logo from '../../assets/logo.png';

function Sidebar({ auth, onLogoClick, onLoginClick, onNavigate }) {
  const role = auth ? auth.role : "guest";
  const isGuest = role == "guest";

  const navItems = [
    { icon: Music, route: "my-tracks" },
    { icon: ListMusic, route: "my-playlists" },
    { icon: User, route: "profile" },
    { icon: Settings, route: "settings" },
  ];

  if (role == "moderator" || role == "admin") {
    navItems.push({  icon: Shield, route: "moderation" });
  }

  if (role == "admin") {
    navItems.push({ icon: ShieldCheck, route: "admin" });
  }

  return (
    <aside className="sidebar">
      <button
        type="button"
        className="sidebar__brand"
        onClick={() => onLogoClick?.()}
      >
        <img src={logo} alt="Dinisify_logo" className="sidebar__brand-logo" />
        <span>Dinisify</span>
      </button>

      {isGuest ? (
        <div className="sidebar__guest">
          <p className="sidebar__guest-text">Войти</p>
          <button
            type="button"
            className="sidebar__login-btn"
            onClick={() => onLoginClick?.()}
          >
            <LogIn size={18} />
            Войти
          </button>
        </div>
      ) : (
        <>
          <nav className="sidebar__nav">
            {navItems.map(({ icon: Icon, route }) => (
              <button
                key={route}
                type="button"
                className="sidebar__link"
                onClick={() => onNavigate?.(route)}
              >
                <Icon size={50} />
              </button>
            ))}
          </nav>

          <div className="sidebar__footer">
            <div className="sidebar__avatar">U</div>
            <div>
              <div className="sidebar__user">Guest User</div>
              <div className="sidebar__user-sub">Creator plan</div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

export default Sidebar;
