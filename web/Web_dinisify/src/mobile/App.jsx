import { Routes, Route, Navigate } from 'react-router-dom';
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
import ModerationPanel from './views/ModerationPanel';
import ProfileSettings from './views/ProfileSettings';

export default function MobileApp() {
  return (
    <>
      <div style={{ paddingBottom: '80px' }}>
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

          {/*ошибки*/}
          {/*если ошибся ;(*/}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <PlayerBar />
    </>
  );
}