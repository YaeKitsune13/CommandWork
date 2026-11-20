// src/shared/fallbackImage.js
import placeholder from '../assets/logo.png';

export const FALLBACK_IMG = placeholder;

const API_ORIGIN = "http://127.0.0.1:5000";

export function imageUrl(path) {
  if (!path) return "/images/default-cover.png";
  if (/^https?:\/\//i.test(path)) return path;

  return `${API_ORIGIN}/${path.replace(/^\/+/, "")}`;
}


export function onImgError(e) {
  if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
}