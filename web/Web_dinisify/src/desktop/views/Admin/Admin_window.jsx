import { useEffect, useState } from "react";
import {
  Users,
  Shield,
  ShieldOff,
  UserCog,
  X,
  AlertCircle,
} from "lucide-react";
import { api } from "shared/hooks/client.js";
import "./admin-common.css";

const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys)
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
};

const listFrom = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  for (const k of ["items", "data", "users", "results"]) {
    if (Array.isArray(result[k])) return result[k];
  }
  return [];
};

function Admin_window({ auth }) {
  const isAdmin = auth?.isAdmin ?? auth?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <AlertCircle size={36} />
        <h2>Доступ запрещён</h2>
        <p>Эта страница доступна только администраторам.</p>
      </div>
    );
  }

  return (
    <div className="admin">
      <div className="admin__header">
        <h1 className="admin__title">Панель администратора</h1>
        <div className="admin__tabs">
          <button type="button" className="admin__tab admin__tab--active">
            <Users size={16} /> Пользователи
          </button>
        </div>
      </div>

      <div className="admin__content">
        <UsersPanel />
      </div>
    </div>
  );
}

/* ============================== USERS PANEL ============================= */

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openUser, setOpenUser] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(
        `/admin/users?search=${encodeURIComponent(search)}&page=1&pageSize=50`,
      )
      .then((result) => setUsers(listFrom(result)))
      .catch((err) => setError(err.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search]);

  return (
    <div className="admin-users">
      <div className="admin-users__search">
        <input
          type="text"
          placeholder="Поиск по email или имени..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
        />
        <button
          type="button"
          className="admin-btn"
          onClick={() => setSearch(searchInput)}
        >
          Найти
        </button>
      </div>

      {loading && <p className="admin__msg">Загрузка...</p>}
      {error && <p className="admin__msg admin__msg--error">{error}</p>}

      {!loading && !error && users.length === 0 && (
        <p className="admin__msg">Пользователи не найдены</p>
      )}

      {!loading && !error && users.length > 0 && (
        <table className="admin-users__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Роль</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const id = pick(u, "id", "user_id");
              const email = pick(u, "email") ?? "—";
              const nickname = pick(u, "nickname", "name") ?? "—";
              const role = pick(u, "role") ?? "user";
              const blocked = pick(u, "is_blocked", "isBlocked") ?? false;

              return (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{email}</td>
                  <td>{nickname}</td>
                  <td>
                    <span className={`admin-role admin-role--${role}`}>
                      {role}
                    </span>
                  </td>
                  <td>
                    {blocked ? (
                      <span className="admin-status admin-status--blocked">
                        заблокирован
                      </span>
                    ) : (
                      <span className="admin-status admin-status--active">
                        активен
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn admin-btn--small"
                      onClick={() =>
                        setOpenUser({ id, email, nickname, role, blocked })
                      }
                    >
                      <UserCog size={14} /> Управлять
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {openUser && (
        <UserControlModal
          user={openUser}
          onClose={() => setOpenUser(null)}
          onChanged={() => {
            setOpenUser(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function UserControlModal({ user, onClose, onChanged }) {
  const [role, setRole] = useState(user.role);
  const [blocked, setBlocked] = useState(user.blocked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const applyRole = async (newRole) => {
    if (newRole === role) return;
    setBusy(true);
    setError("");
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      setRole(newRole);
    } catch (err) {
      setError(err.message || "Не удалось изменить роль");
    } finally {
      setBusy(false);
    }
  };

  const toggleBlock = async () => {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/admin/users/${user.id}/block`, { isBlocked: !blocked });
      setBlocked(!blocked);
    } catch (err) {
      setError(err.message || "Не удалось изменить статус");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>Управление пользователем</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className="admin-modal__body">
          <p>
            <b>ID:</b> {user.id}
          </p>
          <p>
            <b>Email:</b> {user.email}
          </p>
          <p>
            <b>Имя:</b> {user.nickname}
          </p>
          <p>
            <b>Роль:</b>{" "}
            <span className={`admin-role admin-role--${role}`}>{role}</span>
          </p>
          <p>
            <b>Статус:</b>{" "}
            {blocked ? (
              <span className="admin-status admin-status--blocked">
                заблокирован
              </span>
            ) : (
              <span className="admin-status admin-status--active">активен</span>
            )}
          </p>

          {error && <p className="admin-modal__error">{error}</p>}

          <div className="admin-modal__section">
            <h3>Роль</h3>
            <div className="admin-modal__roles">
              {["user", "moderator", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`admin-role-btn ${role === r ? "admin-role-btn--active" : ""}`}
                  disabled={busy}
                  onClick={() => applyRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-modal__section">
            <h3>Блокировка</h3>
            <button
              type="button"
              className={`admin-btn ${blocked ? "admin-btn--approve" : "admin-btn--reject"}`}
              disabled={busy}
              onClick={toggleBlock}
            >
              {blocked ? (
                <>
                  <Shield size={16} /> Разблокировать
                </>
              ) : (
                <>
                  <ShieldOff size={16} /> Заблокировать
                </>
              )}
            </button>
          </div>
        </div>

        <div className="admin-modal__footer">
          <button type="button" className="admin-btn" onClick={onChanged}>
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

export default Admin_window;
