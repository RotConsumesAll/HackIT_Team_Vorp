import { ref, get, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import { db } from "./firebase";

export const MASTERY_SCORE = 20;

// Streak lengths that earn a badge.
const STREAK_BADGES = { 5: "streak5", 10: "streak10" };

export const SKILL_BY_QUIZ = {
  naturalPhrase: "phrasing",
  naturalGuess: "context",
  sound: "pronunciation",
  tone: "pronunciation",
  character: "grammar",
  measure: "grammar",
};

export const BADGE_NAMES = {
  streak5: "5 in a row",
  streak10: "10 in a row",
  mastery_phrasing: "Phrasing master",
  mastery_context: "Context master",
  mastery_pronunciation: "Pronunciation master",
  mastery_grammar: "Grammar master",
};

export function currentUid() {
  const user = getAuth().currentUser;
  return user ? user.uid : null;
}

export async function recordAnswer(uid, quizType, correct) {
  if (!uid) return null;
  try {
    const skill = SKILL_BY_QUIZ[quizType] || "general";
    const snap = await get(ref(db, `users/${uid}`));
    const user = snap.val() || {};

    const oldStreak = user.streak || {};
    const current = correct ? (oldStreak.current || 0) + 1 : 0;
    const best = Math.max(oldStreak.best || 0, current);

    const oldSkill = (user.mastery || {})[skill] || {};
    const answered = (oldSkill.answered || 0) + 1;
    const score = (oldSkill.score || 0) + (correct ? 1 : 0);

    const owned = user.badges || {};
    const newBadges = [];
    const streakBadge = STREAK_BADGES[current];
    if (streakBadge && !owned[streakBadge]) newBadges.push(streakBadge);
    const masteryBadge = "mastery_" + skill;
    if (score >= MASTERY_SCORE && !owned[masteryBadge]) newBadges.push(masteryBadge);

    const updates = {};
    updates[`users/${uid}/streak/current`] = current;
    updates[`users/${uid}/streak/best`] = best;
    updates[`users/${uid}/mastery/${skill}/answered`] = answered;
    updates[`users/${uid}/mastery/${skill}/score`] = score;
    newBadges.forEach((id) => {
      updates[`users/${uid}/badges/${id}`] = { earnedAt: Date.now() };
    });
    await update(ref(db), updates);

    return { streak: current, best, skill, score, newBadges };
  } catch (e) {
    console.warn("Could not save progress:", e.message);
    return null;
  }
}

export async function recordHighScore(uid, feature, score) {
  if (!uid) return;
  try {
    const scoreRef = ref(db, `users/${uid}/highScores/${feature}`);
    const snap = await get(scoreRef);
    if (!snap.exists() || score > snap.val()) {
      await update(ref(db), { [`users/${uid}/highScores/${feature}`]: score });
    }
  } catch (e) {
    console.warn("Could not save high score:", e.message);
  }
}