import { Routes, Route } from 'react-router-dom';
import RequireAuth from '../shared/components/RequireAuth';
import Home from './Home';
import LoginForm from './Login';
import Register from './Register';
import PlayerBar from '../shared/player/PlayerBar';
import SearchResults from './views/SearchResults';
import Album from './views/Album';
import TrackPage from './views/TrackPage';
import UploadTrack from './views/UploadTrack';
import Profile from './views/Profile';
import RequireRole from '../shared/components/RequireRole';
import ModerationPanel from './views/ModerationPanel';
export default function MobileApp() {
  return (
    <>
      <div style={{ paddingBottom: '80px' }}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchResults />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route path="/albums/:id" element={<Album />} />
          <Route path="*" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/tracks/:id" element={<TrackPage />} />
          <Route path="/upload" element={<UploadTrack />} />
          <Route path="/users/:id" element={<Profile />} />
          <Route 
            path="/moderation" 
            element={
              <RequireRole allowedRoles={['moderator', 'admin']}>
                <ModerationPanel />
              </RequireRole>
            }/>
        </Routes>
      </div>
      <PlayerBar />
    </>
  );
}