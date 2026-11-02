import './Settings_window.css';

function Settings_window() {
  return (
    <div className="settings">
      <h1 className="settings__title">Настройки</h1>
      <div className="settings__card">
        <div className="settings__group">
          <label>Email</label>
          <input type="email" defaultValue="user@example.com" />
        </div>
        <div className="settings__group">
          <label>Имя пользователя</label>
          <input type="text" defaultValue="Guest User" />
        </div>
        <button className="settings__save-btn">Сохранить изменения</button>
      </div>
    </div>
  );
}
export default Settings_window;