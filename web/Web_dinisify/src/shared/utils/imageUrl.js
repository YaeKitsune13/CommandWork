import { API_URL } from '../api/client';

export function getImageUrl(path) {
  if (!path) return null;
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
}