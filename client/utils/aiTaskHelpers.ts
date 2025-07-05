const USER_ID = 95; // Should be imported or passed in real app

export const generateUniqueId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const isIsoDate = (str: string) => {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(str);
};

export const mapTasksToApiFormat = (tasks: any[]): any[] => {
  return tasks.map((task) => {
    let deadline = task.suggestedDeadline;
    const now = new Date();
    let parsedDeadline: Date | null = null;
    if (deadline && isIsoDate(deadline)) {
      parsedDeadline = new Date(deadline);
      if (parsedDeadline < now) {
        parsedDeadline = now;
      }
    } else {
      parsedDeadline = now;
    }
    deadline = parsedDeadline.toISOString();
    return {
      userId: USER_ID,
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

export const MIN_DAYS = 1;
export const MAX_DAYS = 7;
export const dayOptions = Array.from({ length: MAX_DAYS - MIN_DAYS + 1 }, (_, i) => MIN_DAYS + i);
