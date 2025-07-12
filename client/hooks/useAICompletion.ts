import { useState, useRef, useMemo, useCallback } from 'react';
import OpenAI from 'openai';
import config from '@/src/config';
import axios from 'axios';
import { Alert, TextInput, ScrollView } from 'react-native';
import {
  DEFAULT_DAYS,
  API_MODEL,
  USER_ID,
  generateUniqueId,
  mapTasksToApiFormat,
  summarizeHistory,
  SURPRISE_PROMPTS,
} from '../utils/aiTaskUtils';

type Task = {
  id: string;
  title: string;
  description: string;
  suggestedDeadline?: string;
};

type UseAICompletionProps = {
  userHistory: { goals: string[]; accepted: string[] };
  addAcceptedTasksToHistory: (tasks: Task[]) => void;
  onTaskAccept: (tasks: Task[]) => void;
  setShowFeedbackModal: (v: boolean) => void;
  smartDefault: string | null;
  globalGoal?: string; // <--- NEW: allows steering the AI
};

export function useAICompletion({
  userHistory,
  addAcceptedTasksToHistory,
  onTaskAccept,
  setShowFeedbackModal,
  smartDefault,
  globalGoal, // <--- NEW
}: UseAICompletionProps) {
  const [aiQuery, setAiQuery] = useState('');
  const [numDays, setNumDays] = useState<number>(DEFAULT_DAYS);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskText, setEditedTaskText] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [surprisePressed, setSurprisePressed] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const openai = useMemo(() => new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.OAI_KEY,
    defaultHeaders: {},
    timeout: 30 * 1000,
    maxRetries: 1,
  }), []);

  // Add a simple domain inference for dynamic examples
  function inferDomain(goal: string | undefined, query: string): 'academic' | 'fitness' | 'career' | 'general' {
    const text = ((goal || '') + ' ' + query).toLowerCase();
    if (/study|research|essay|exam|university|read|write/.test(text)) return 'academic';
    if (/workout|exercise|run|fitness|health|diet|gym/.test(text)) return 'fitness';
    if (/job|career|promotion|resume|interview|network/.test(text)) return 'career';
    return 'general';
  }

  // Dynamic example tasks for each domain (keep field names as in EXAMPLE_TASKS)
  const EXAMPLES = {
    academic: [
      {
        taskTitle: "Read Chapter 1 of 'Deep Work'",
        taskDescription: "Read the first chapter and jot down 3 key takeaways in your notes.",
        deadline: "2025-07-07"
      },
      {
        taskTitle: "Write 500 words on your research topic",
        taskDescription: "Draft an outline and write 500 focused words. Aim for clarity and depth.",
        deadline: "2025-07-08"
      },
      {
        taskTitle: "Summarize yesterday's research",
        taskDescription: "Review your notes from yesterday and write a concise summary (at least 2 sentences) of your findings.",
        deadline: "2025-07-09"
      }
    ],
    fitness: [
      {
        taskTitle: "Complete a 30-minute cardio workout",
        taskDescription: "Do any form of cardio (running, cycling, brisk walking) for at least 30 minutes.",
        deadline: "2025-07-07"
      },
      {
        taskTitle: "Prepare a healthy meal",
        taskDescription: "Cook a balanced meal with vegetables, protein, and whole grains. Avoid processed foods.",
        deadline: "2025-07-08"
      },
      {
        taskTitle: "Track your water intake",
        taskDescription: "Record how much water you drink today. Aim for at least 8 cups.",
        deadline: "2025-07-09"
      }
    ],
    career: [
      {
        taskTitle: "Update your resume",
        taskDescription: "Review and revise your resume. Add recent achievements and tailor it to your target job.",
        deadline: "2025-07-07"
      },
      {
        taskTitle: "Apply to one new job",
        taskDescription: "Find a relevant job posting and submit your application with a customized cover letter.",
        deadline: "2025-07-08"
      },
      {
        taskTitle: "Reach out to a professional contact",
        taskDescription: "Send a message to someone in your network to reconnect or ask for advice.",
        deadline: "2025-07-09"
      }
    ],
    general: [
      {
        taskTitle: "Organize your workspace",
        taskDescription: "Clean and declutter your desk or main work area. Remove distractions and tidy up supplies.",
        deadline: "2025-07-07"
      },
      {
        taskTitle: "Plan your week",
        taskDescription: "List your top priorities and schedule key tasks for the next 7 days.",
        deadline: "2025-07-08"
      },
      {
        taskTitle: "Reflect on your progress",
        taskDescription: "Write a short reflection (at least 2 sentences) on what you accomplished yesterday.",
        deadline: "2025-07-09"
      }
    ]
  };

  const resetModalState = useCallback((clearQueryToo: boolean = true) => {
    if (clearQueryToo) setAiQuery('');
    setSuggestedTasks([]);
    setEditingTaskId(null);
    setEditedTaskText('');
    setIsLoading(false);
    setErrorMessage(null);
    setNumDays(DEFAULT_DAYS);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("Resetting modal state");
      abortControllerRef.current = null;
    }
  }, []);

  const buildSystemPrompt = useCallback(() => {
    const historySummary = summarizeHistory(userHistory);
    const pretrainGoal = globalGoal
      ? `The user is working toward this overall goal: "${globalGoal}". `
      : "";
    const domain = inferDomain(globalGoal, aiQuery);
    const exampleTasksString = JSON.stringify({ tasks: EXAMPLES[domain] }, null, 2);

    return `
You are a highly skilled and practical task planner assistant.
${pretrainGoal}
${historySummary}
When the user asks for a task plan, follow these steps:
1. Break down the user's goal into smaller actionable steps.
2. For each of ${numDays} days, propose one concrete, non-overlapping task that moves the user closer to their goal.
3. Assign a realistic deadline for each task.

Each task must include:
- "title": a brief, specific summary (max 10 words)
- "description": step-by-step instructions or criteria for completion (at least 2 sentences, motivational and concise)
- "deadline": a realistic date (YYYY-MM-DD)

CONSTRAINTS:
- Output ONLY valid JSON. No explanations, commentary, or markdown.
- Do NOT include any extraneous text, commentary, or markdown formatting.
- Each description must be at least 2 sentences.
- Use motivational, concise language.

EXAMPLES:
(Note: Example fields may differ in name, but your output must use "title", "description", and "deadline" fields.)
${exampleTasksString}

Return a JSON object with a "tasks" array, each containing "title", "description", "deadline".
    `.trim();
  }, [userHistory, numDays, globalGoal, aiQuery]);

  const fetchAIResponse = useCallback(async () => {
    const trimmedQuery = aiQuery.trim();
    if (!trimmedQuery) {
      Alert.alert('Input Required', 'Please describe what you need help planning.');
      return;
    }
    try {
      await axios.post('http://localhost:8080/api/goals', {
        user: USER_ID,
        goalText: trimmedQuery,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {}

    if (abortControllerRef.current) {
      abortControllerRef.current.abort("Starting new request");
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setSuggestedTasks([]);
    setErrorMessage(null);

    try {
      const systemPrompt = buildSystemPrompt();

      const userContent = globalGoal
        ? `Goal Context: "${globalGoal}". Create a ${numDays}-day task plan for: "${trimmedQuery}"`
        : `Create a ${numDays}-day task plan for: "${trimmedQuery}"`;

      const completion = await openai.chat.completions.create(
        {
          model: API_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        },
        { signal: abortControllerRef.current.signal }
      );
      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response from AI.");
      const jsonResponse = JSON.parse(content.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || content);
      if (!Array.isArray(jsonResponse.tasks)) throw new Error("Invalid JSON structure.");

      const finalTasks = jsonResponse.tasks
        .slice(0, numDays)
        .map((task: any) => ({
          id: generateUniqueId(),
          title: (task.title || '').trim(),
          description: (task.description || '').trim(),
          suggestedDeadline: task.deadline?.trim(),
        }))
        .filter(task => task.title);

      if (finalTasks.length === 0) throw new Error("No valid tasks generated.");
      if (finalTasks.length < numDays) setErrorMessage(`Only ${finalTasks.length} tasks generated.`);

      setSuggestedTasks(finalTasks);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (error: any) {
      setErrorMessage(error.name === 'AbortError' ? 'Task generation cancelled.' : error.message);
      setSuggestedTasks([]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [aiQuery, numDays, openai, userHistory, buildSystemPrompt, globalGoal]);

  const handleAcceptAllTasks = useCallback(async () => {
    if (suggestedTasks.length === 0) {
      Alert.alert('No Tasks', 'There are no tasks to accept.');
      return;
    }
    try {
      const apiTasks = mapTasksToApiFormat(suggestedTasks);
      if (suggestedTasks.length === 1) {
        await axios.post('http://localhost:8080/api/accepted', apiTasks[0], {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (suggestedTasks.length > 1 && suggestedTasks.length <= 7) {
        await axios.post('http://localhost:8080/api/accepted/batch/create', apiTasks, {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error('Only up to 7 tasks can be accepted at once.');
      }
      Alert.alert('Success', 'Tasks created successfully!');
      onTaskAccept(suggestedTasks);
      addAcceptedTasksToHistory(suggestedTasks);
      setShowFeedbackModal(true);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to save tasks.');
    }
  }, [suggestedTasks, onTaskAccept, addAcceptedTasksToHistory, setShowFeedbackModal]);

  const handleStartEditing = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditedTaskText(task.title);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingTaskId) return;
    setSuggestedTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editingTaskId
          ? { ...task, title: editedTaskText }
          : task
      )
    );
    setEditingTaskId(null);
    setEditedTaskText('');
  }, [editingTaskId, editedTaskText]);

  const handleCancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditedTaskText('');
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setSuggestedTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("User stopped generation");
    }
    setIsLoading(false);
  }, []);

  const handleSmartDefaultPress = useCallback(() => {
    if (smartDefault) setAiQuery(smartDefault);
  }, [smartDefault]);

  const handleSurpriseMe = () => {
    const randomPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    setAiQuery(randomPrompt);
  };

  return {
    aiQuery,
    setAiQuery,
    numDays,
    setNumDays,
    isLoading,
    setIsLoading,
    suggestedTasks,
    setSuggestedTasks,
    errorMessage,
    setErrorMessage,
    editingTaskId,
    setEditingTaskId,
    editedTaskText,
    setEditedTaskText,
    showAdvanced,
    setShowAdvanced,
    surprisePressed,
    setSurprisePressed,
    abortControllerRef,
    scrollViewRef,
    inputRef,
    resetModalState,
    fetchAIResponse,
    handleAcceptAllTasks,
    handleStartEditing,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteTask,
    handleStopGeneration,
    handleSmartDefaultPress,
    handleSurpriseMe,
  };
}

export default useAICompletion;
