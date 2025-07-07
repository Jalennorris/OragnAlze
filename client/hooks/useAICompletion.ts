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
  globalGoal?: String;
};

export function useAICompletion({
  userHistory,
  addAcceptedTasksToHistory,
  onTaskAccept,
  setShowFeedbackModal,
  smartDefault,
  globalGoal,
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

  const EXAMPLE_TASKS = [
    {
      taskTitle: "Read Chapter 1 of 'Deep Work'",
      taskDescription: "Read the first chapter and jot down 3 key takeaways in your notes.",
      deadline: "2025-07-07"
    },
    {
      taskTitle: "Write 500 words on your research topic",
      taskDescription: "Draft an outline and write 500 focused words. Aim for clarity and depth.",
      deadline: "2025-07-08"
    }
  ];

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
      const historySummary = summarizeHistory(userHistory);
      const systemPrompt = `You are a helpful task planner. ${historySummary} Generate exactly ${numDays} specific, actionable daily tasks with deadlines. For each task, provide a "title" (short summary), a "description" (detailed steps or explanation), and a "deadline". Return a JSON object with a "tasks" array containing objects with "title", "description", and "deadline" fields.`;
      const completion = await openai.chat.completions.create(
        {
          model: API_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Create a ${numDays}-day task plan for: "${trimmedQuery}"` },
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
  }, [aiQuery, numDays, openai, userHistory]);

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
