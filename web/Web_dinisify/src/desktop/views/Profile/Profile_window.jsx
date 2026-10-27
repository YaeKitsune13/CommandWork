import './Profile_window.css';

function Profile_window() {
  return (
    <div className="profile">
      <div className="profile__header">
        <div className="profile__avatar">U</div>
        <div className="profile__info">
          <h1 className="profile__name">Guest User</h1>
          <p className="profile__bio">Music lover and creator. Welcome to my profile!</p>
          <div className="profile__stats">
            <span><strong>12</strong> Tracks</span>
            <span><strong>4</strong> Playlists</span>
            <span><strong>128</strong> Followers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Profile_window;