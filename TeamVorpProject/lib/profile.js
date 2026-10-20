import { ref, get, update } from "firebase/database";
import { db } from "./firebase";
import { TIERED_BADGES, tierStatus, levelFromScore } from "./progress";

export const NAME_MIN = 2;
export const NAME_MAX = 20;
export const BIO_MAX = 120;
export const PHOTO_SIZE = 160;
export const PHOTO_INPUT_MAX_MB = 5;

export function validateUserName(name) {
  const n = (name || "").trim();
  if (n.length < NAME_MIN) return "Your name needs at least " + NAME_MIN + " characters.";
  if (n.length > NAME_MAX) return "Your name can be up to " + NAME_MAX + " characters.";
  if (!/^[\p{L}\p{N} _.'-]+$/u.test(n)) return "Use letters, numbers, spaces and . _ - ' only.";
  return "";
}

export function buildHighlights(u) {
  const values = {
    mastery_phrasing: ((u.mastery || {}).phrasing || {}).score || 0,
    mastery_context: ((u.mastery || {}).context || {}).score || 0,
    mastery_pronunciation: ((u.mastery || {}).pronunciation || {}).score || 0,
    mastery_grammar: ((u.mastery || {}).grammar || {}).score || 0,
    mastery_proverbs: ((u.mastery || {}).proverbs || {}).score || 0,
    mastery_vocab: ((u.mastery || {}).vocab || {}).score || 0,
    streak: (u.streak || {}).best || 0,
  };
  const units = { streak: "in a row" };
  const candidates = Object.keys(values)
    .filter((key) => TIERED_BADGES[key])
    .map((key) => ({
      id: key,
      label: TIERED_BADGES[key].name,
      value: values[key],
      unit: units[key] || "points",
      level: tierStatus(key, values[key]).level,
    }))
    .filter((c) => c.level > 0);
  candidates.sort((a, b) => b.level - a.level || b.value - a.value);
  const days = (u.login || {}).days || 0;
  const best = candidates.slice(0, 2);
  best.push({
    id: "login",
    label: TIERED_BADGES.login.name,
    value: days,
    unit: days === 1 ? "day logged in" : "days logged in",
    level: tierStatus("login", days).level,
  });
  return best;
}

export async function getPublicProfile(uid) {
  if (!uid) return null;
  const snap = await get(ref(db, `users/${uid}`));
  const u = snap.val();
  if (!u) return null;
  const p = u.profile || {};
  const s = u.settings || {};
  return {
    userName: u.userName || "Player",
    bio: p.bio || "",
    photo: p.photo || "",
    level: s.showLevel === false ? null : levelFromScore(u.totalScore || 0),
    publicProgress: s.publicProgress === true,
    highlights: s.publicProgress === true ? buildHighlights(u) : [],
    badgeCount: s.publicProgress === true ? Object.keys(u.badges || {}).length : null,
  };
}

export async function getProfile(uid) {
  if (!uid) return null;
  const snap = await get(ref(db, `users/${uid}`));
  const u = snap.val() || {};
  const p = u.profile || {};
  const s = u.settings || {};
  return {
    userName: u.userName || "",
    bio: p.bio || "",
    photo: p.photo || "",
    showOnLeaderboard: s.showOnLeaderboard !== false,
    showLevel: s.showLevel !== false,
    publicProgress: s.publicProgress === true,
    highlights: buildHighlights(u),
    totalScore: u.totalScore || 0,
    badgeCount: Object.keys(u.badges || {}).length,
    bestStreak: (u.streak || {}).best || 0,
    loginDays: (u.login || {}).days || 0,
  };
}

export async function saveProfile(uid, values) {
  const updates = {
    [`users/${uid}/userName`]: values.userName.trim(),
    [`users/${uid}/profile/bio`]: values.bio.trim(),
    [`users/${uid}/profile/photo`]: values.photo || "",
    [`users/${uid}/settings/showOnLeaderboard`]: !!values.showOnLeaderboard,
    [`users/${uid}/settings/showLevel`]: !!values.showLevel,
    [`users/${uid}/settings/publicProgress`]: !!values.publicProgress,
  };
  await update(ref(db), updates);
}

export function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > PHOTO_INPUT_MAX_MB * 1024 * 1024) {
      reject(new Error("That image is too big. Choose one under " + PHOTO_INPUT_MAX_MB + " MB."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = PHOTO_SIZE;
      canvas.height = PHOTO_SIZE;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("We could not read that image."));
    };
    img.src = url;
  });
}

export function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return Array.from(parts[0])[0].toUpperCase();
  return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toUpperCase();
}