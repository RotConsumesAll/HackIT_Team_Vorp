import { ref, get, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import { db } from "./firebase";

// Score a skill needs before its mastery badge is earned. Change it here.
export const MASTERY_SCORE = 20;

// Streak lengths that earn a badge.
const STREAK_BADGES = { 5: "streak5", 10: "streak10" };

// Which skill each quiz type counts towards. Teammates can add their own.
export const SKILL_BY_QUIZ = {
  naturalPhrase: "phrasing",
  naturalGuess: "context",
  sound: "pronunciation",
  tone: "pronunciation",
  character: "grammar",
  measure: "grammar",
};

// Names shown to the user.
export const BADGE_NAMES = {
  streak5: "5 in a row",
  streak10: "10 in a row",
  mastery_phrasing: "Phrasing master",
  mastery_context: "Context master",
  mastery_pronunciation: "Pronunciation master",
  mastery_grammar: "Grammar master",
  daily3: "3 days in a row",
  daily7: "7 days in a row",
};

// Daily streak 
export const DAILY_GOAL = 5;

const DAILY_BADGES = { 3: "daily3", 7: "daily7" };

function dayString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dailyStatus(saved) {
  const d = saved || {};
  const today = dayString(new Date());
  const yesterday = dayString(new Date(Date.now() - 86400000));
  const alive = d.lastCountedDay === today || d.lastCountedDay === yesterday;
  return {
    current: alive ? d.current || 0 : 0,
    best: d.best || 0,
    todayCount: d.todayDate === today ? d.todayCount || 0 : 0,
    goal: DAILY_GOAL,
    doneToday: d.lastCountedDay === today,
  };
}

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

export async function recordDaily(uid, feature) {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}`));
    const user = snap.val() || {};
    const d = (user.dailyStreak || {})[feature] || {};

    const today = dayString(new Date());
    const yesterday = dayString(new Date(Date.now() - 86400000));

    const todayCount = (d.todayDate === today ? d.todayCount || 0 : 0) + 1;
    let current = d.current || 0;
    let best = d.best || 0;
    let lastCountedDay = d.lastCountedDay || "";
    let goalReached = false;

    if (todayCount >= DAILY_GOAL && lastCountedDay !== today) {
      current = lastCountedDay === yesterday ? current + 1 : 1;
      best = Math.max(best, current);
      lastCountedDay = today;
      goalReached = true;
    }

    const owned = user.badges || {};
    const newBadges = [];
    const badge = DAILY_BADGES[current];
    if (goalReached && badge && !owned[badge]) newBadges.push(badge);

    const base = `users/${uid}/dailyStreak/${feature}`;
    const updates = {};
    updates[`${base}/todayDate`] = today;
    updates[`${base}/todayCount`] = todayCount;
    updates[`${base}/current`] = current;
    updates[`${base}/best`] = best;
    updates[`${base}/lastCountedDay`] = lastCountedDay;
    newBadges.forEach((id) => {
      updates[`users/${uid}/badges/${id}`] = { earnedAt: Date.now() };
    });
    await update(ref(db), updates);

    return { current, best, todayCount, goal: DAILY_GOAL, goalReached, newBadges };
  } catch (e) {
    console.warn("Could not save daily streak:", e.message);
    return null;
  }
}