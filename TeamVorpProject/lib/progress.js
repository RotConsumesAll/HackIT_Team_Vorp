import { ref, get, update, increment } from "firebase/database";
import { getAuth } from "firebase/auth";
import { db } from "./firebase";

export const POINTS_PER_CORRECT = 10;
export const DAILY_GOAL_BONUS = 20;
export const POINTS_PER_LEVEL = 100;

export function levelFromScore(totalScore) {
  return Math.floor((totalScore || 0) / POINTS_PER_LEVEL) + 1;
}

export const DAILY_QUIZ_COUNT = 5;
export const DAILY_QUIZ_BONUS = 30;

export const LEVEL_NAMES = ["Bronze", "Silver", "Gold", "Diamond"];

export const TIERED_BADGES = {
  mastery_phrasing: { name: "Phrasing master", levels: [10, 30, 60, 100], unit: "points" },
  mastery_context: { name: "Context master", levels: [10, 30, 60, 100], unit: "points" },
  mastery_pronunciation: { name: "Pronunciation master", levels: [10, 30, 60, 100], unit: "points" },
  mastery_grammar: { name: "Grammar master", levels: [10, 30, 60, 100], unit: "points" },
  streak: { name: "Streak star", levels: [5, 10, 20, 30], unit: "in a row (best streak)" },
  login: { name: "Regular visitor", levels: [3, 7, 14, 30], unit: "days logged in" },
};

const ONE_OFF_BADGES = {
  first_quiz: "First quiz",
  perfect: "Perfect score",
  daily_quiz: "Quiz of the Day finisher",
  first_phrase: "First saved phrase",
  first_post: "First community post",
  daily3: "3 days in a row",
  daily7: "7 days in a row",
};

const PERFECT_MIN_QUESTIONS = 5;

export const SKILL_BY_QUIZ = {
  naturalPhrase: "phrasing",
  naturalGuess: "context",
  sound: "pronunciation",
  tone: "pronunciation",
  character: "grammar",
  measure: "grammar",
};

export const BADGE_NAMES = { ...ONE_OFF_BADGES };
Object.entries(TIERED_BADGES).forEach(([key, t]) => {
  t.levels.forEach((_, i) => {
    BADGE_NAMES[`${key}_${i + 1}`] = `${t.name} (${LEVEL_NAMES[i]})`;
  });
});

export function tierStatus(key, value) {
  const levels = TIERED_BADGES[key].levels;
  const v = value || 0;
  let level = 0;
  levels.forEach((need, i) => {
    if (v >= need) level = i + 1;
  });
  return {
    level,
    levelName: level > 0 ? LEVEL_NAMES[level - 1] : "No level yet",
    next: level < levels.length ? levels[level] : null,
  };
}

function newTierBadges(owned, key, value) {
  const found = [];
  TIERED_BADGES[key].levels.forEach((need, i) => {
    const id = `${key}_${i + 1}`;
    if ((value || 0) >= need && !owned[id]) found.push(id);
  });
  return found;
}

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
    const newBadges = [...newTierBadges(owned, "streak", best)];
    if (TIERED_BADGES["mastery_" + skill]) {
      newBadges.push(...newTierBadges(owned, "mastery_" + skill, score));
    }

    const updates = {};
    updates[`users/${uid}/streak/current`] = current;
    updates[`users/${uid}/streak/best`] = best;
    updates[`users/${uid}/mastery/${skill}/answered`] = answered;
    updates[`users/${uid}/mastery/${skill}/score`] = score;
    if (correct) {
      updates[`users/${uid}/totalScore`] = increment(POINTS_PER_CORRECT);
    }
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
    if (goalReached) {
      updates[`users/${uid}/totalScore`] = increment(DAILY_GOAL_BONUS);
    }
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

export function todayString() {
  return dayString(new Date());
}

export async function getDailyQuizResult(uid) {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}/dailyQuiz`));
    const saved = snap.val();
    return saved && saved.date === todayString() ? saved : null;
  } catch (e) {
    return null;
  }
}

export async function recordDailyQuiz(uid, score, total) {
  if (!uid) return null;
  try {
    const existing = await getDailyQuizResult(uid);
    if (existing) return { ...existing, newBadges: [] };
    const result = { date: todayString(), score, total };
    const owned = (await get(ref(db, `users/${uid}/badges`))).val() || {};
    const newBadges = owned.daily_quiz ? [] : ["daily_quiz"];
    const updates = {
      [`users/${uid}/dailyQuiz`]: result,
      [`users/${uid}/totalScore`]: increment(DAILY_QUIZ_BONUS),
    };
    newBadges.forEach((id) => {
      updates[`users/${uid}/badges/${id}`] = { earnedAt: Date.now() };
    });
    await update(ref(db), updates);
    return { ...result, newBadges };
  } catch (e) {
    console.warn("Could not save the daily quiz:", e.message);
    return null;
  }
}

export async function awardBadge(uid, id) {
  if (!uid) return [];
  try {
    const badgeRef = ref(db, `users/${uid}/badges/${id}`);
    const snap = await get(badgeRef);
    if (snap.exists()) return [];
    await update(ref(db), { [`users/${uid}/badges/${id}`]: { earnedAt: Date.now() } });
    return [id];
  } catch (e) {
    console.warn("Could not save the badge:", e.message);
    return [];
  }
}

export async function recordQuizFinished(uid, score, total) {
  if (!uid) return { newBadges: [] };
  try {
    const owned = (await get(ref(db, `users/${uid}/badges`))).val() || {};
    const newBadges = [];
    if (!owned.first_quiz) newBadges.push("first_quiz");
    if (total >= PERFECT_MIN_QUESTIONS && score === total && !owned.perfect) newBadges.push("perfect");
    if (newBadges.length > 0) {
      const updates = {};
      newBadges.forEach((id) => {
        updates[`users/${uid}/badges/${id}`] = { earnedAt: Date.now() };
      });
      await update(ref(db), updates);
    }
    return { newBadges };
  } catch (e) {
    console.warn("Could not save quiz badges:", e.message);
    return { newBadges: [] };
  }
}

const loginChecked = new Set();
export async function recordLogin(uid) {
  if (!uid || loginChecked.has(uid)) return null;
  loginChecked.add(uid);
  try {
    const snap = await get(ref(db, `users/${uid}`));
    const user = snap.val() || {};
    const login = user.login || {};
    const today = todayString();
    if (login.lastDay === today) return null;

    const days = (login.days || 0) + 1;
    const newBadges = newTierBadges(user.badges || {}, "login", days);
    const updates = {
      [`users/${uid}/login/days`]: days,
      [`users/${uid}/login/lastDay`]: today,
    };
    newBadges.forEach((id) => {
      updates[`users/${uid}/badges/${id}`] = { earnedAt: Date.now() };
    });
    await update(ref(db), updates);
    return { days, newBadges };
  } catch (e) {
    console.warn("Could not save the login:", e.message);
    return null;
  }
}