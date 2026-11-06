// src/shared/fallbackImage.js
import placeholder from '../assets/logo.png';

export const FALLBACK_IMG = placeholder;

export function imageUrl(src) {
  return typeof src === 'string' && src.trim() ? src : FALLBACK_IMG;
}

export function onImgError(e) {
  if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
}