import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_USER_HISTORY, USER_ID } from '../utils/aiTaskUtils';

type UserHistory = {
  goals: string[];
  accepted: string[];
};

export function useUserHistory() {
  const [userHistory, setUserHistory] = useState<UserHistory>({ goals: [], accepted: [] });
  const [allGoals, setAllGoals] = useState<string[]>([]);
  const [smartDefault, setSmartDefault] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const allResp = await axios.get('http://localhost:8080/api/goals');
        const allGoalsArr: string[] = Array.isArray(allResp.data)
          ? allResp.data.map((g: any) =>
              typeof g === 'string'
                ? g
                : g.goalText || g.goal || g.title || ''
            )
          : [];
        setAllGoals(allGoalsArr.filter(Boolean));

        const userResp = await axios.get(`http://localhost:8080/api/goals/user/${USER_ID}`);
        const backendGoals: string[] = Array.isArray(userResp.data)
          ? userResp.data.map((g: any) =>
              typeof g === 'string'
                ? g
                : g.goalText || g.goal || g.title || ''
            )
          : [];
        const filteredBackendGoals = backendGoals.filter(Boolean);

        const raw = await AsyncStorage.getItem(STORAGE_USER_HISTORY);
        let parsed: UserHistory = { goals: [], accepted: [] };
        if (raw) {
          parsed = JSON.parse(raw);
        }
        const mergedGoals = Array.from(
          new Set([
            ...filteredBackendGoals,
            ...parsed.goals
          ])
        ).slice(0, 20);
        setUserHistory({
          ...parsed,
          goals: mergedGoals,
        });
        if (mergedGoals.length > 0) {
          const freq: Record<string, number> = {};
          mergedGoals.forEach(g => { freq[g] = (freq[g] || 0) + 1; });
          const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
          setSmartDefault(sorted[0][0]);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_USER_HISTORY, JSON.stringify(userHistory));
  }, [userHistory]);

  const addGoalToHistory = (goal: string) => {
    setUserHistory(prev => ({
      ...prev,
      goals: Array.from(
        new Set([goal, ...prev.goals])
      ).slice(0, 20),
    }));
  };

  const addAcceptedTasksToHistory = (tasks: { title: string }[]) => {
    setUserHistory(prev => ({
      ...prev,
      accepted: [
        ...tasks.map(t => t.title),
        ...prev.accepted.filter(t => !tasks.some(nt => nt.title === t)),
      ].slice(0, 20),
    }));
  };

  return {
    userHistory,
    setUserHistory,
    allGoals,
    smartDefault,
    setSmartDefault,
    addGoalToHistory,
    addAcceptedTasksToHistory,
  };
}

export default useUserHistory;
