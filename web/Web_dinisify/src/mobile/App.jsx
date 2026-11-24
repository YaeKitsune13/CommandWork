import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import RequireAuth from '../shared/components/RequireAuth';
import RequireRole from '../shared/components/RequireRole';
import Home from './Home';
import LoginForm from './Login';
import Register from './Register';
import PlayerBar from '../shared/player/PlayerBar';
import SearchResults from './views/SearchResults';
import Album from './views/Album';
import TrackPage from './views/TrackPage';
import UploadTrack from './views/UploadTrack';
import Profile from './views/Profile';
import AdminPanel from './views/AdminPanel';
import ModerationPanel from './views/ModerationPanel';
import ProfileSettings from './views/ProfileSettings';

export default function MobileApp() {
  const { pathname } = useLocation();
  const { token, isGuest, user } = useAuth();

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isAuthenticated = Boolean(token || user) && !isGuest;
  const showPlayer = !isAuthRoute && isAuthenticated;

  return (
    <>
      <div style={{ paddingBottom: showPlayer ? '80px' : '0' }}>
        <Routes>
          {/*публичные*/}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/albums/:id" element={<Album />} />
          <Route path="/tracks/:id" element={<TrackPage />} />
          <Route path="/users/:id" element={<Profile />} />

          {/*защищённые*/}
          <Route 
            path="/" 
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <RequireAuth>
                <UploadTrack />
              </RequireAuth>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <RequireAuth>
                <ProfileSettings />
              </RequireAuth>
            } 
          />
          
          {/*роли*/}
          <Route 
            path="/moderation" 
            element={
              <RequireRole allowedRoles={['moderator', 'admin']}>
                <ModerationPanel />
              </RequireRole>
            }
          />
          <Route 
            path="/admin" 
            element={
              <RequireRole allowedRoles={['admin']}>
                <AdminPanel />
              </RequireRole>
            }
          />

          {/*ошибки*/}
          {/*если ошибся ;(*/}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showPlayer && <PlayerBar />}
    </>
  );
}