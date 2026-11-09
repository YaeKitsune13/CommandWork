import placeholder from '../assets/logo.png';

export const FALLBACK_IMG = placeholder;

export function imageUrl(src) {
  if (typeof src !== 'string' || !src.trim()) {
    return FALLBACK_IMG;
  }

  if (src.startsWith('http')) {
    return src;
  }

  if (src.startsWith('/')) {
    return `http://127.0.0.1:5000${src}`;
  }

  return src;
}

export function onImgError(e) {
  if (e.currentTarget.src !== FALLBACK_IMG) {
    e.currentTarget.src = FALLBACK_IMG;
  }
}