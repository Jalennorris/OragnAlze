// Helper functions for AI Task Planner

export const MIN_DAYS = 1;
export const MAX_DAYS = 7;
export const DEFAULT_DAYS = 7;
export const ANIMATION_DURATION_SHORT = 300;
export const ANIMATION_DURATION_MEDIUM = 500;
export const API_MODEL = "microsoft/mai-ds-r1:free";
export const USER_ID = 95;

export const SUGGESTION_IDEAS = [
  "Plan my week for studying for finals.",
  "Help me organize a home renovation project.",
  "Create a fitness routine for 5 days.",
  "Suggest a daily routine for better sleep.",
  "Help me prepare for a job interview.",
  "Organize a meal prep schedule.",
  "Plan a reading challenge for a month.",
  "Set up a daily mindfulness routine.",
  "Prepare a travel itinerary for a city trip.",
  "Design a project timeline for launching a website."
];

export const suggestionGradientA = ['#A6BFFF', '#D1B3FF', '#F3E8FF'];
export const suggestionGradientB = ['#B7E0FF', '#C6B8FF', '#F9EFFF'];

export const pastelGradients = [
  ['#A6BFFF', '#D1B3FF', '#F3E8FF'],
  ['#B7E0FF', '#B2FFD6', '#F9EFFF'],
  ['#FFD6E0', '#F3E8FF', '#B7E0FF'],
  ['#FFF6B7', '#F3E8FF', '#B2FFD6'],
  ['#B2FFD6', '#B7E0FF', '#FFF6B7'],
  ['#F3E8FF', '#FFD6E0', '#A6BFFF'],
  ['#F9EFFF', '#B2FFD6', '#FFD6E0'],
  ['#D1B3FF', '#FFF6B7', '#B7E0FF'],
];

export const TEMPLATES = [
  { label: "Study Plan", prompt: "Plan my study schedule for exams.", days: 7 },
  { label: "Fitness Plan", prompt: "Create a 5-day fitness routine.", days: 5 },
  { label: "Sleep Routine", prompt: "Suggest a daily routine for better sleep.", days: 7 },
  { label: "Meal Prep", prompt: "Organize a meal prep schedule.", days: 7 },
];

export const SHORTCUTS = [
  { label: "Today", days: 1 },
  { label: "Tomorrow", days: 1, prompt: "Plan my tasks for tomorrow" },
  { label: "3 Days", days: 3 },
  { label: "This Week", days: 7 },
  { label: "Weekend", days: 2, prompt: "Plan my weekend" },
];

export const SURPRISE_PROMPTS = [
  "Invent a new morning ritual for creative energy.",
  "Plan a day as if you were a famous chef.",
  "Organize a 'no screen' adventure challenge.",
  "Design a productivity quest for a superhero.",
  "Schedule a week of random acts of kindness.",
  "Plan a day to learn something totally new.",
  "Create a routine inspired by astronauts.",
  "Organize a 'reverse to-do list' day.",
  "Plan a day for maximum fun and zero stress.",
  "Set up a week of micro-habits for happiness."
];

export const SURPRISE_GRADIENT = ['#FFD6E0', '#F3E8FF', '#B2FFD6'];

export const generateUniqueId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const dayOptions = Array.from({ length: MAX_DAYS - MIN_DAYS + 1 }, (_, i) => MIN_DAYS + i);

export const isIsoDate = (str: string) => {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(str);
};

export const mapTasksToApiFormat = (tasks: any[], userId: number) => {
  const now = new Date();
  return tasks.map((task) => {
    let deadline = task.suggestedDeadline;
    let parsedDeadline: Date | null = null;
    if (deadline && isIsoDate(deadline)) {
      parsedDeadline = new Date(deadline);
      if (parsedDeadline < now) parsedDeadline = now;
    } else {
      parsedDeadline = now;
    }
    deadline = parsedDeadline.toISOString();
    return {
      userId,
      taskName: String(task.title),
      taskDescription: task.description,
      priority: "Medium",
      estimatedDuration: "1 hour",
      deadline,
      status: "Not Started",
      completed: false,
      category: "General",
      notes: "",
      createdAt: now.toISOString(),
    };
  });
};

export const STORAGE_USER_HISTORY = 'ai_taskplanner_user_history';

export const summarizeHistory = (history: { goals: string[]; accepted: string[] }) => {
  let summary = '';
  if (history.goals.length > 0) {
    summary += `Previous goals: ${history.goals.slice(0, 5).join('; ')}. `;
  }
  if (history.accepted.length > 0) {
    summary += `Recently accepted tasks: ${history.accepted.slice(0, 5).join('; ')}. `;
  }
  return summary.trim();
};

export const interpolateGradient = (a: string[], b: string[], t: number) => {
  const lerp = (start: number, end: number, t: number) => Math.round(start + (end - start) * t);
  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  };
  const rgbToHex = (rgb: number[]) =>
    '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
  return a.map((color, i) => {
    const rgbA = hexToRgb(a[i]);
    const rgbB = hexToRgb(b[i]);
    return rgbToHex([
      lerp(rgbA[0], rgbB[0], t),
      lerp(rgbA[1], rgbB[1], t),
      lerp(rgbA[2], rgbB[2], t),
    ]);
  });
};
