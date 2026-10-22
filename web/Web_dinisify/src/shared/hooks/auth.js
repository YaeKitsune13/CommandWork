//Пустышкаа скорее всего перезапишу 
export function useAuth() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || (token ? 'user' : 'guest');
  return { token, role, isGuest: role === 'guest' };
}