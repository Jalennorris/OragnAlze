import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  Animated,
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView, // Import ScrollView
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator, // Use standard ActivityIndicator for loading inside input
  Pressable, // Add Pressable for hover effect
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import OpenAI from 'openai';
// import * Haptics from 'expo-haptics'; // Optional: For haptic feedback
import config from '@/src/config';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import GoalSuggestionAlgorithm from './GoalSuggestionAlgorithm';
import DateTimePicker from '@react-native-community/datetimepicker'; // (optional, not used here)

// --- Constants ---
const MIN_DAYS = 1;
const MAX_DAYS = 7;
const DEFAULT_DAYS = 7;
const ANIMATION_DURATION_SHORT = 300;
const ANIMATION_DURATION_MEDIUM = 500;
const API_MODEL = "microsoft/mai-ds-r1:free"; // Or choose another model like "microsoft/phi-3-medium-128k:free", "google/gemma-2-9b-it:free"
// const API_MODEL = "openai/gpt-3.5-turbo"; // Example if using OpenAI models via OpenRouter

const USER_ID = 95; // Replace with actual user ID from auth/context if available

const SUGGESTION_IDEAS = [
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

const suggestionGradientA = ['#A6BFFF', '#D1B3FF', '#F3E8FF'];
const suggestionGradientB = ['#B7E0FF', '#C6B8FF', '#F9EFFF']; // Slightly different for animation

const pastelGradients = [
  ['#A6BFFF', '#D1B3FF', '#F3E8FF'],
  ['#B7E0FF', '#B2FFD6', '#F9EFFF'],
  ['#FFD6E0', '#F3E8FF', '#B7E0FF'],
  ['#FFF6B7', '#F3E8FF', '#B2FFD6'],
  ['#B2FFD6', '#B7E0FF', '#FFF6B7'],
  ['#F3E8FF', '#FFD6E0', '#A6BFFF'],
  ['#F9EFFF', '#B2FFD6', '#FFD6E0'],
  ['#D1B3FF', '#FFF6B7', '#B7E0FF'],
];

const TEMPLATES = [
  { label: "Study Plan", prompt: "Plan my study schedule for exams.", days: 7 },
  { label: "Fitness Plan", prompt: "Create a 5-day fitness routine.", days: 5 },
  { label: "Sleep Routine", prompt: "Suggest a daily routine for better sleep.", days: 7 },
  { label: "Meal Prep", prompt: "Organize a meal prep schedule.", days: 7 },
];

// Add more shortcut options
const SHORTCUTS = [
  { label: "Today", days: 1 },
  { label: "Tomorrow", days: 1, prompt: "Plan my tasks for tomorrow" },
  { label: "3 Days", days: 3 },
  { label: "This Week", days: 7 },
  { label: "Weekend", days: 2, prompt: "Plan my weekend" },
];

const SURPRISE_PROMPTS = [
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

const SURPRISE_GRADIENT = ['#FFD6E0', '#F3E8FF', '#B2FFD6'];

// --- Types ---
interface Task {
  id: string;
  title: string;
  description: string;
  suggestedDeadline?: string;
}

interface AskAIButtonProps {
  onTaskAccept: (tasks: Task[]) => void; // Pass tasks with IDs
}

// --- Helper Functions ---
// Simple ID generator if uuid is not preferred for demo
const generateUniqueId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Generate numbers for day selector
const dayOptions = Array.from({ length: MAX_DAYS - MIN_DAYS + 1 }, (_, i) => MIN_DAYS + i);

// Helper to convert AI tasks to API payload
const isIsoDate = (str: string) => {
  // Simple ISO-8601 check
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(str);
};

const mapTasksToApiFormat = (tasks: Task[]): any[] => {
  return tasks.map((task) => {
    let deadline = task.suggestedDeadline;
    const now = new Date();
    let parsedDeadline: Date | null = null;
    if (deadline && isIsoDate(deadline)) {
      parsedDeadline = new Date(deadline);
      // If deadline is before now, set to today
      if (parsedDeadline < now) {
        parsedDeadline = now;
      }
    } else {
      parsedDeadline = now;
    }
    // Format as ISO string
    deadline = parsedDeadline.toISOString();
    return {
      userId: USER_ID,
      taskName: String(task.title), // <-- Ensure string type
      // Optionally include 'title' for compatibility
      // title: task.title,
      taskDescription: task.description,
      priority: "Medium", // Or infer from AI if you add that field
      estimatedDuration: "1 hour", // Or infer from AI if you add that field
      deadline,
      status: "Not Started",
      completed: false,
      category: "General", // Or infer from AI if you add that field
      notes: "",
      createdAt: now.toISOString(),
    };
  });
};

// AsyncStorage keys
const STORAGE_USER_HISTORY = 'ai_taskplanner_user_history';

// Helper to summarize user history for AI prompt
const summarizeHistory = (history: { goals: string[]; accepted: string[] }) => {
  let summary = '';
  if (history.goals.length > 0) {
    summary += `Previous goals: ${history.goals.slice(0, 5).join('; ')}. `;
  }
  if (history.accepted.length > 0) {
    summary += `Recently accepted tasks: ${history.accepted.slice(0, 5).join('; ')}. `;
  }
  return summary.trim();
};

// --- AnimatedGradientButton helper ---
const AnimatedGradientButton = ({
  suggestionGradientAnim,
  pressed,
  children,
}: {
  suggestionGradientAnim: Animated.Value;
  pressed: boolean;
  children: React.ReactNode;
}) => {
  // Interpolate gradient colors
  const [gradientColors, setGradientColors] = useState(suggestionGradientA);

  useEffect(() => {
    const id = suggestionGradientAnim.addListener(({ value }) => {
      try {
        const a = suggestionGradientA;
        const b = suggestionGradientB;
        // Interpolate between gradients
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
        const colors = a.map((color, i) => {
          const rgbA = hexToRgb(a[i]);
          const rgbB = hexToRgb(b[i]);
          return rgbToHex([
            lerp(rgbA[0], rgbB[0], value),
            lerp(rgbA[1], rgbB[1], value),
            lerp(rgbA[2], rgbB[2], value),
          ]);
        });
        setGradientColors(colors);
      } catch {
        setGradientColors(suggestionGradientA);
      }
    });
    return () => suggestionGradientAnim.removeListener(id);
  }, [suggestionGradientAnim]);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.suggestionButton,
        pressed && { opacity: 0.85 },
      ]}
    >
      {children}
    </LinearGradient>
  );
};

// --- Add: Build For Me Workflow State ---
type BuildForMeState = 'idle' | 'clarifying' | 'generating' | 'reviewing' | 'autoAccepting' | 'done' | 'cancelled';

const AskAIButton: React.FC<AskAIButtonProps> = ({ onTaskAccept }) => {
  // --- Refs ---
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollViewRef = useRef<ScrollView>(null); // Add ref for ScrollView
  const suggestionAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  // --- New: Glow Animation for Modern Button ---
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [glowAnim]);

  // --- New: Icon Rotation Animation ---
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(() => {
    setIsButtonPressed(true);
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();
    Animated.spring(iconRotateAnim, { toValue: 1, useNativeDriver: true }).start();
  }, [scaleAnim, iconRotateAnim]);

  const handlePressOut = useCallback(() => {
    setIsButtonPressed(false);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    Animated.spring(iconRotateAnim, { toValue: 0, useNativeDriver: true }).start();
  }, [scaleAnim, iconRotateAnim]);

  // --- State ---
  // UI State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFullSize, setIsFullSize] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false); // Floating button press state
  const [suggestionPressed, setSuggestionPressed] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestionsOnOpen, setShowSuggestionsOnOpen] = useState(true); // Add user preference
  const [suggestionGradientAnim] = useState(new Animated.Value(0)); // 0: A, 1: B

  // Track if suggestions have been auto-shown on first open
  const [hasAutoShownSuggestions, setHasAutoShownSuggestions] = useState(false);

  // AI & Task State
  const [aiQuery, setAiQuery] = useState('');
  const [numDays, setNumDays] = useState<number>(DEFAULT_DAYS);
  // REMOVED: const [daysInputText, setDaysInputText] = useState<string>(DEFAULT_DAYS.toString()); // State for the input field text
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // For displaying errors inline
  const [suggestionIdeas, setSuggestionIdeas] = useState<string[]>([]);
  const [recentIdeas, setRecentIdeas] = useState<string[]>([]);

  // Editing State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskText, setEditedTaskText] = useState<string>('');

  const [userHistory, setUserHistory] = useState<{ goals: string[]; accepted: string[] }>({ goals: [], accepted: [] });
  const [smartDefault, setSmartDefault] = useState<string | null>(null);
  const [allGoals, setAllGoals] = useState<string[]>([]); // Add this state for all goals

  // Place this with other state hooks, before the render/return:
  const [surprisePressed, setSurprisePressed] = useState(false);

  // --- Feedback State ---
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // --- Load user history and previous goals on mount ---
  useEffect(() => {
    (async () => {
      try {
        // Fetch all goals (everyone)
        const allResp = await axios.get('http://localhost:8080/api/goals');
        const allGoalsArr: string[] = Array.isArray(allResp.data)
          ? allResp.data.map((g: any) =>
              typeof g === 'string'
                ? g
                : g.goalText || g.goal || g.title || ''
            )
          : [];
        setAllGoals(allGoalsArr.filter(Boolean));

        // Fetch user-specific goals
        const userResp = await axios.get(`http://localhost:8080/api/goals/user/${USER_ID}`);
        const backendGoals: string[] = Array.isArray(userResp.data)
          ? userResp.data.map((g: any) =>
              typeof g === 'string'
                ? g
                : g.goalText || g.goal || g.title || ''
            )
          : [];
        const filteredBackendGoals = backendGoals.filter(Boolean);

        // Load local history
        const raw = await AsyncStorage.getItem(STORAGE_USER_HISTORY);
        let parsed = { goals: [], accepted: [] };
        if (raw) {
          parsed = JSON.parse(raw);
        }
        // Merge backend goals with local goals, dedupe, prioritize backend
        const mergedGoals = [
          ...filteredBackendGoals,
          ...parsed.goals.filter(g => !filteredBackendGoals.includes(g)),
        ].slice(0, 20);

        setUserHistory({
          ...parsed,
          goals: mergedGoals,
        });

        // Smart default: most frequent goal
        if (mergedGoals.length > 0) {
          const freq: Record<string, number> = {};
          mergedGoals.forEach(g => { freq[g] = (freq[g] || 0) + 1; });
          const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
          setSmartDefault(sorted[0][0]);
        }
      } catch {}
    })();
  }, []);

  // --- Save user history when changed ---
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_USER_HISTORY, JSON.stringify(userHistory));
  }, [userHistory]);

  // --- Add to user history ---
  const addGoalToHistory = (goal: string) => {
    setUserHistory(prev => ({
      ...prev,
      goals: [goal, ...prev.goals.filter(g => g !== goal)].slice(0, 20),
    }));
  };
  const addAcceptedTasksToHistory = (tasks: Task[]) => {
    setUserHistory(prev => ({
      ...prev,
      accepted: [
        ...tasks.map(t => t.title),
        ...prev.accepted.filter(t => !tasks.some(nt => nt.title === t)),
      ].slice(0, 20),
    }));
  };

  // --- Hooks ---
  const insets = useSafeAreaInsets();

  // --- OpenAI Client --- (Memoized)
  const openai = useMemo(() => new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.OAI_KEY,
    // Headers are important for OpenRouter identification & potentially free tiers
    defaultHeaders: {
      
    },
    // Important: Setting a timeout prevents requests hanging indefinitely
    timeout: 30 * 1000, // 30 seconds
    // Allow AbortController integration
    maxRetries: 1, // Don't retry automatically on failure with AbortController
  }), []);

  // --- Animations ---
  // Persistent sparkle animation on the floating button
  useEffect(() => {
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION_MEDIUM,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION_MEDIUM,
          useNativeDriver: true,
        }),
      ])
    );
    sparkleLoop.start();
    return () => sparkleLoop.stop(); // Cleanup on unmount
  }, [sparkleAnim]);

  // Suggestion Button Animation Handlers
  const handleSuggestionPressIn = () => {
    setSuggestionPressed(true);
    Animated.spring(suggestionAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };
  const handleSuggestionPressOut = () => {
    setSuggestionPressed(false);
    Animated.spring(suggestionAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Animate gradient on press
  useEffect(() => {
    if (suggestionPressed) {
      Animated.timing(suggestionGradientAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(suggestionGradientAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [suggestionPressed, suggestionGradientAnim]);

  // Helper to interpolate between two gradients
  const interpolateGradient = (a: string[], b: string[], t: number) => {
    // Only works for hex colors of same length arrays
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

  // --- Core AI Logic ---
  const fetchAIResponse = useCallback(async () => {
    const trimmedQuery = aiQuery.trim();
    if (!trimmedQuery) {
      Alert.alert('Input Required', 'Please describe what you need help planning.');
      return;
    }

    // Always create a new goal in backend with the user's input, using correct fields
    try {
      await axios.post('http://localhost:8080/api/goals', {
        user: USER_ID,
        goalText: trimmedQuery,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      // Optionally log or ignore errors here
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort("Starting new request");
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setSuggestedTasks([]);
    setErrorMessage(null);

    try {
      // Personalization: inject user history summary
      const historySummary = summarizeHistory(userHistory);
      const systemPrompt = `You are a helpful task planner. ${historySummary} Generate exactly ${numDays} specific, actionable daily tasks with deadlines. For each task, provide a "title" (short summary), a "description" (detailed steps or explanation), and a "deadline". Return a JSON object with a "tasks" array containing objects with "title", "description", and "deadline" fields.`;

      console.log(`Requesting ${numDays} tasks for query: "${trimmedQuery}" using model ${API_MODEL}`);
      const completion = await openai.chat.completions.create(
        {
          model: API_MODEL,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Create a ${numDays}-day task plan for: "${trimmedQuery}"`,
            },
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
      scrollToBottom();
    } catch (error: any) {
      console.error('AI Fetch Error:', error);
      setErrorMessage(error.name === 'AbortError' ? 'Task generation cancelled.' : error.message);
      setSuggestedTasks([]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [aiQuery, numDays, openai, userHistory]);

  // Use hardcoded suggestions instead of AI
  const fetchSuggestionIdeas = useCallback(async () => {
    setSuggestionIdeas(SUGGESTION_IDEAS);
  }, []);

  const handleFetchSuggestions = useCallback(() => {
    setErrorMessage(null);
    setSuggestedTasks([]);
    setSuggestionIdeas([]);
    setIsLoading(true);
    setShowSuggestions(true); // Show suggestions when button is clicked
    fetchSuggestionIdeas();
    setIsLoading(false);
  }, [fetchSuggestionIdeas]);

  const addRecentIdea = (idea: string) => {
    setRecentIdeas(prev => {
      const filtered = prev.filter(i => i !== idea);
      return [idea, ...filtered].slice(0, 5);
    });
  };

  const handleSuggestionIdeaPress = (idea: string) => {
    setAiQuery(idea);
    addRecentIdea(idea);
    addGoalToHistory(idea);
    setSuggestionIdeas([]); // Clear suggestions after click
    setShowSuggestions(false); // Hide suggestions after click
    setIsLoading(true); // Show spinner instantly
    setTimeout(() => {
      fetchAIResponse();
    }, 200); // Small delay to close modal before generating
  };

  const handleTemplatePress = (template: { label: string; prompt: string; days: number }) => {
    setAiQuery(template.prompt);
    setNumDays(template.days);
    addRecentIdea(template.prompt);
    addGoalToHistory(template.prompt);
    setSuggestionIdeas([]);
    setShowSuggestions(false);
    setIsLoading(true);
    setTimeout(() => {
      fetchAIResponse();
    }, 200);
  };

  const handleRecentIdeaPress = (idea: string) => {
    setAiQuery(idea);
    setShowSuggestions(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  const handleShortcutPress = (days: number) => {
    setNumDays(days);
  };

  // --- Task Management Handlers ---
  const handleAcceptAllTasks = useCallback(async () => {
    if (suggestedTasks.length === 0) {
      Alert.alert('No Tasks', 'There are no tasks to accept.');
      return;
    }
    try {
      const apiTasks = mapTasksToApiFormat(suggestedTasks);
      console.log("Sending tasks to backend:", apiTasks); // <-- Add this line
      if (suggestedTasks.length === 1) {
        // Single day: use /api/accepted
        await axios.post('http://localhost:8080/api/accepted', apiTasks[0], {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (suggestedTasks.length > 1 && suggestedTasks.length <= 7) {
        // Multiple days: use /api/accepted/batch/create
        await axios.post('http://localhost:8080/api/accepted/batch/create', apiTasks, {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error('Only up to 7 tasks can be accepted at once.');
      }
      Alert.alert('Success', 'Tasks created successfully!');
      onTaskAccept(suggestedTasks); // Pass the final list
      addAcceptedTasksToHistory(suggestedTasks);
      // Instead of closing, show feedback modal
      setShowFeedbackModal(true);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to save tasks.');
    }
  }, [suggestedTasks, onTaskAccept, resetModalState]);

  const handleStartEditing = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditedTaskText(task.title);
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Optional
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
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Optional
  }, [editingTaskId, editedTaskText]);

  const handleCancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditedTaskText('');
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Optional
    setSuggestedTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  // --- Control Handlers ---
  const openModal = useCallback(() => {
    resetModalState(true); // Reset when opening
    setIsModalVisible(true);
    // Only auto-show suggestions the first time
    if (showSuggestionsOnOpen && !hasAutoShownSuggestions) {
      setSuggestionIdeas([]);
      setShowSuggestions(true);
      fetchSuggestionIdeas();
      setHasAutoShownSuggestions(true);
      // Auto-close suggestions after 2.5s
      setTimeout(() => {
        setShowSuggestions(false);
        setSuggestionIdeas([]);
      }, 2500);
    }
  }, [resetModalState, showSuggestionsOnOpen, fetchSuggestionIdeas, hasAutoShownSuggestions]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    // Optional: Reset state on close if desired, or keep it for reopening
    // resetModalState(true);
  }, []);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("User stopped generation");
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Optional
      console.log("User stopped AI generation.");
      // State updates (loading, message) are handled in the fetchAIResponse catch block
    }
    setIsLoading(false); // Hide spinner
    setShowSuggestions(false); // Close suggestions modal if open
  }, []);

  const resetModalState = useCallback((clearQueryToo: boolean = true) => {
    if (clearQueryToo) {
        setAiQuery('');
    }
    setSuggestedTasks([]);
    setEditingTaskId(null);
    setEditedTaskText('');
    setIsLoading(false);
    setErrorMessage(null);
    setNumDays(DEFAULT_DAYS); // Reset internal number state
    // REMOVED: setDaysInputText(DEFAULT_DAYS.toString()); // Reset visual input text
    // Stop any potential ongoing request on full reset
    if (abortControllerRef.current) {
        abortControllerRef.current.abort("Resetting modal state");
        abortControllerRef.current = null;
    }
  }, []);

  // Scroll helper
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150); // Increased delay slightly
  };

  // --- Add this handler for suggestion selection ---
  const handleGoalSuggestionSelect = (suggestion: string) => {
    setAiQuery(suggestion);
    // Optionally, you can trigger fetchAIResponse() here if you want instant generation
    // fetchAIResponse();
  };

  // --- Add this handler for surprise prompt ---
  const handleSurpriseMe = () => {
    const randomPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    setAiQuery(randomPrompt);
    // Optionally, trigger fetchAIResponse() here for instant generation
    // fetchAIResponse();
  };

  // --- Task Rendering ---
  const renderTask = (task: Task, index: number) => {
    const isEditing = editingTaskId === task.id;
    return (
      <View key={task.id} style={styles.taskItem}>
        {isEditing ? (
          <View style={styles.taskEditContainer}>
            <TextInput
              style={styles.taskInput}
              value={editedTaskText}
              onChangeText={setEditedTaskText}
              autoFocus
              multiline
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.taskActionButton} onPress={handleSaveEdit}>
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.taskActionButton} onPress={handleCancelEdit}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.taskContentContainer}>
            <View style={styles.taskTextWrapper}>
              <View style={styles.taskHeaderLine}>
                <Text style={styles.taskDay}>Day {index + 1}:</Text>
                {task.suggestedDeadline && (
                  <Text style={styles.taskDeadline}> (Due: {task.suggestedDeadline})</Text>
                )}
              </View>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {task.description ? (
                <Text style={styles.taskDescription}>{task.description}</Text>
              ) : null}
            </View>
            <View style={styles.taskActions}>
              <TouchableOpacity style={styles.taskActionButton} onPress={() => handleStartEditing(task)}>
                <Ionicons name="create-outline" size={20} color="#FFC107" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.taskActionButton} onPress={() => handleDeleteTask(task.id)}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // --- Feedback Submission Handler ---
  const submitFeedback = async () => {
    if (!feedbackRating) {
      Alert.alert('Rating Required', 'Please select a rating.');
      return;
    }
    setFeedbackLoading(true);
    try {
      const now = new Date().toISOString();
      if (suggestedTasks.length === 1) {
        // One day: single feedback
        await axios.post('http://localhost:8080/api/feedback', {
          user: USER_ID,
          feedbackText,
          rating: feedbackRating,
          createdAt: now,
          acceptedAITaskId: suggestedTasks[0].id, // Use generated task id
        });
      } else if (suggestedTasks.length > 1 && suggestedTasks.length <= 7) {
        // Batch feedback for each task
        const batch = suggestedTasks.map(task => ({
          user: USER_ID,
          feedbackText,
          rating: feedbackRating,
          createdAt: now,
          acceptedAITaskId: task.id,
        }));
        await axios.post('http://localhost:8080/api/feedback/batch', batch);
      }
      setShowFeedbackModal(false);
      setFeedbackRating(0);
      setFeedbackText('');
      Alert.alert('Thank you!', 'Your feedback was submitted.');
      // Optionally: reset modal state after feedback
      resetModalState(false);
      setIsModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // --- Build For Me State ---
  const [buildForMeState, setBuildForMeState] = useState<BuildForMeState>('idle');
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | null>(null);
  const [clarifyingAnswer, setClarifyingAnswer] = useState<string>('');
  const [autoAcceptTimeout, setAutoAcceptTimeout] = useState<NodeJS.Timeout | null>(null);

  // --- Build For Me Handler ---
  const handleBuildForMe = useCallback(async () => {
    setBuildForMeState('generating');
    setIsLoading(true);
    setSuggestedTasks([]);
    setErrorMessage(null);

    let currentQuery = aiQuery.trim();
    if (!currentQuery) {
      Alert.alert('Input Required', 'Please describe what you need help planning.');
      setIsLoading(false);
      setBuildForMeState('idle');
      return;
    }

    // Step 1: Ask for clarification if prompt is vague
    try {
      const clarifyPrompt = `Is the following user goal clear enough to generate a ${numDays}-day plan? If not, ask a clarifying question. If clear, reply ONLY with "OK".\n\nGoal: "${currentQuery}"`;
      const clarifyResp = await openai.chat.completions.create({
        model: API_MODEL,
        messages: [
          { role: "system", content: "You are an expert at clarifying vague goals." },
          { role: "user", content: clarifyPrompt }
        ]
      });
      const clarifyContent = clarifyResp.choices[0]?.message?.content?.trim();
      if (clarifyContent && clarifyContent !== "OK") {
        setClarifyingQuestion(clarifyContent);
        setBuildForMeState('clarifying');
        setIsLoading(false);
        return;
      }
    } catch (e) {
      setErrorMessage('Failed to clarify prompt.');
      setIsLoading(false);
      setBuildForMeState('idle');
      return;
    }

    // Step 2: Generate plan
    try {
      setBuildForMeState('generating');
      setIsLoading(true);
      // Always create a new goal in backend
      try {
        await axios.post('http://localhost:8080/api/goals', {
          user: USER_ID,
          goalText: currentQuery,
          createdAt: new Date().toISOString(),
        });
      } catch {}
      // Personalization: inject user history summary
      const historySummary = summarizeHistory(userHistory);
      const systemPrompt = `You are a helpful task planner. ${historySummary} Generate exactly ${numDays} specific, actionable daily tasks with deadlines. For each task, provide a "title" (short summary), a "description" (detailed steps or explanation), and a "deadline". Return a JSON object with a "tasks" array containing objects with "title", "description", and "deadline" fields.`;
      const completion = await openai.chat.completions.create(
        {
          model: API_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Create a ${numDays}-day task plan for: "${currentQuery}"` },
          ],
        }
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
      setSuggestedTasks(finalTasks);
      setBuildForMeState('reviewing');
      setIsLoading(false);

      // Step 3: Auto-accept after short delay unless cancelled
      const timeout = setTimeout(async () => {
        setBuildForMeState('autoAccepting');
        try {
          const apiTasks = mapTasksToApiFormat(finalTasks);
          if (finalTasks.length === 1) {
            await axios.post('http://localhost:8080/api/accepted', apiTasks[0], {
              headers: { 'Content-Type': 'application/json' },
            });
          } else if (finalTasks.length > 1 && finalTasks.length <= 7) {
            await axios.post('http://localhost:8080/api/accepted/batch/create', apiTasks, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          onTaskAccept(finalTasks);
          addAcceptedTasksToHistory(finalTasks);
          setBuildForMeState('done');
          setShowFeedbackModal(true);
        } catch (error: any) {
          setErrorMessage(error?.response?.data?.message || error.message || 'Failed to save tasks.');
          setBuildForMeState('idle');
        }
      }, 3500); // 3.5 seconds to allow user to cancel
      setAutoAcceptTimeout(timeout);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to generate plan.');
      setIsLoading(false);
      setBuildForMeState('idle');
    }
  }, [aiQuery, numDays, openai, userHistory, onTaskAccept]);

  // --- Clarifying Answer Handler ---
  const handleClarifyingAnswerSubmit = useCallback(async () => {
    if (!clarifyingAnswer.trim()) return;
    setBuildForMeState('generating');
    setIsLoading(true);
    setClarifyingQuestion(null);
    let combinedQuery = aiQuery.trim() + " " + clarifyingAnswer.trim();
    setAiQuery(combinedQuery);
    setClarifyingAnswer('');
    // Continue with plan generation using combined query
    // Reuse handleBuildForMe logic but skip clarification
    try {
      // Always create a new goal in backend
      try {
        await axios.post('http://localhost:8080/api/goals', {
          user: USER_ID,
          goalText: combinedQuery,
          createdAt: new Date().toISOString(),
        });
      } catch {}
      const historySummary = summarizeHistory(userHistory);
      const systemPrompt = `You are a helpful task planner. ${historySummary} Generate exactly ${numDays} specific, actionable daily tasks with deadlines. For each task, provide a "title" (short summary), a "description" (detailed steps or explanation), and a "deadline". Return a JSON object with a "tasks" array containing objects with "title", "description", and "deadline" fields.`;
      const completion = await openai.chat.completions.create(
        {
          model: API_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Create a ${numDays}-day task plan for: "${combinedQuery}"` },
          ],
        }
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
      setSuggestedTasks(finalTasks);
      setBuildForMeState('reviewing');
      setIsLoading(false);

      // Auto-accept after delay
      const timeout = setTimeout(async () => {
        setBuildForMeState('autoAccepting');
        try {
          const apiTasks = mapTasksToApiFormat(finalTasks);
          if (finalTasks.length === 1) {
            await axios.post('http://localhost:8080/api/accepted', apiTasks[0], {
              headers: { 'Content-Type': 'application/json' },
            });
          } else if (finalTasks.length > 1 && finalTasks.length <= 7) {
            await axios.post('http://localhost:8080/api/accepted/batch/create', apiTasks, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          onTaskAccept(finalTasks);
          addAcceptedTasksToHistory(finalTasks);
          setBuildForMeState('done');
          setShowFeedbackModal(true);
        } catch (error: any) {
          setErrorMessage(error?.response?.data?.message || error.message || 'Failed to save tasks.');
          setBuildForMeState('idle');
        }
      }, 3500);
      setAutoAcceptTimeout(timeout);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to generate plan.');
      setIsLoading(false);
      setBuildForMeState('idle');
    }
  }, [aiQuery, clarifyingAnswer, numDays, openai, userHistory, onTaskAccept]);

  // --- Cancel Build For Me ---
  const handleCancelBuildForMe = useCallback(() => {
    setBuildForMeState('cancelled');
    setClarifyingQuestion(null);
    setClarifyingAnswer('');
    setIsLoading(false);
    if (autoAcceptTimeout) clearTimeout(autoAcceptTimeout);
    setAutoAcceptTimeout(null);
  }, [autoAcceptTimeout]);

  // --- Reset Build For Me State on Modal Close ---
  useEffect(() => {
    if (!isModalVisible) {
      setBuildForMeState('idle');
      setClarifyingQuestion(null);
      setClarifyingAnswer('');
      if (autoAcceptTimeout) clearTimeout(autoAcceptTimeout);
      setAutoAcceptTimeout(null);
    }
  }, [isModalVisible, autoAcceptTimeout]);

  // --- FEEDBACK LABELS for Feedback Modal ---
  const FEEDBACK_LABELS = [
    "Terrible",
    "Not Good",
    "Okay",
    "Good",
    "Amazing!",
  ];

  // Add this handler to fix the error
  const handleSmartDefaultPress = useCallback(() => {
    if (smartDefault) setAiQuery(smartDefault);
  }, [smartDefault]);

  // Show/hide advanced options (day selector)
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- Render ---
  return (
    <>
      {/* --- Ultra-Modern Floating AI Button --- */}
      <Animated.View
        style={[
          styles.buttonContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={['#A6BFFF', '#D1B3FF', '#F3E8FF']}
          start={{ x: 0.1, y: 0.2 }}
          end={{ x: 0.9, y: 0.8 }}
          style={styles.gradientRing}
        >
          <TouchableOpacity
            style={styles.modernButtonTouchable}
            onPress={openModal}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityLabel="Ask AI for task suggestions"
            accessibilityRole="button"
            activeOpacity={0.82}
          >
            {/* Glowing Animated Ring */}
            <Animated.View
              style={[
                styles.glowRing,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.38, 0.92],
                  }),
                  shadowRadius: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 32],
                  }),
                  borderColor: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#BB86FC', '#A6BFFF'],
                  }),
                },
              ]}
            />
            {/* Glassmorphism Button */}
            <BlurView intensity={90} tint="light" style={styles.glassButton}>
              <LinearGradient
                colors={[
                  'rgba(166,191,255,0.92)',
                  'rgba(211,179,255,0.90)',
                  'rgba(243,232,255,0.88)',
                ]}
                start={{ x: 0.2, y: 0.1 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.gradientOverlay}
              >
                <View style={styles.innerGlow} />
                <Animated.View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [
                      {
                        rotate: iconRotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '22deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons
                    name="planet"
                    size={34} // 38 * 0.9
                    color="#6C47FF"
                    style={{
                      textShadowColor: '#fff',
                      textShadowRadius: 8,
                      opacity: 0.96,
                      borderRadius: 10, // subtle rounding for modern look
                    }}
                  />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.sparklePulse,
                    {
                      opacity: sparkleAnim,
                      transform: [
                        { scale: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={18} color="#FFD700" />
                </Animated.View>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* --- AI Modal --- */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={closeModal}
        onBackButtonPress={closeModal} // Hardware back button on Android
        style={styles.modalWrapper}
        backdropTransitionOutTiming={0} // Avoid backdrop flicker
        avoidKeyboard // Use react-native-modal's built-in avoidance
        propagateSwipe // Allows scrolling within modal
        onSwipeComplete={closeModal}
        swipeDirection={['down']}
      >
        {/* Use SafeAreaView inside Modal for better layout control */}
        <SafeAreaView
            edges={['bottom']} // Only apply safe area to bottom inside modal
            style={[
              styles.modalContainerOuter,
              { height: isFullSize ? '85%' : '65%' } // Adjusted heights
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Let modal handle Android
              style={styles.keyboardAvoidingView} // Use flex: 1
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Adjust if needed
            >
              {/* Inner container for content */}
              <View style={styles.modalContainerInner}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.modalControlButton}
                    onPress={() => setIsFullSize(!isFullSize)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel={isFullSize ? "Collapse modal" : "Expand modal"}
                  >
                    <Ionicons name={isFullSize ? "chevron-down" : "chevron-up"} size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>AI Task Planner</Text>
                  <TouchableOpacity
                    style={styles.modalControlButton}
                    onPress={closeModal}
                     hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                     accessibilityLabel="Close modal"
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Task Display Area (This is the scrollable response part) */}
                <ScrollView
                  ref={scrollViewRef}
                  style={{ flex: 1 }} // Ensure it takes available space
                  contentContainerStyle={{ paddingBottom: 20 }} // Add only necessary padding
                  showsVerticalScrollIndicator={true} // Enable scrollbar
                  keyboardShouldPersistTaps="handled" // Allow taps to dismiss the keyboard
                >
                  {/* Loading Indicator */}
                  {isLoading && suggestedTasks.length === 0 ? (
                    <View style={styles.placeholderContainer}>
                      <ActivityIndicator size="large" color="#BB86FC" />
                      {/* Use numDays state for placeholder text */}
                      <Text style={styles.placeholderText}>Generating your {numDays}-day plan...</Text>
                    </View>
                  ) : suggestedTasks.length === 0 ? (
                    <View style={styles.placeholderContainer}>
                      <Ionicons name="bulb-outline" size={40} color="#888" style={{ marginBottom: 10 }} />
                      <Text style={styles.placeholderText}>
                        {/* Use numDays state for placeholder text */}
                        {errorMessage ? errorMessage : `Describe your goal below to get a personalized ${numDays}-day task plan.`}
                      </Text>
                    </View>
                  ) : (
                    suggestedTasks.map(renderTask)
                  )}
                  {/* Add some padding at the bottom of scroll */}
                  <View style={{ height: 20 }} />
                </ScrollView>

                {/* Input Area (Fixed at the bottom) */}
                <View style={styles.inputArea}>
                   {errorMessage && !isLoading && suggestedTasks.length > 0 && (
                     <Text style={styles.errorTextInline}>{errorMessage}</Text>
                   )}
                   {/* --- Modern Compact Chips Row --- */}
                   <View style={styles.compactChipsRow}>
                     <ScrollView
                       horizontal
                       showsHorizontalScrollIndicator={false}
                       contentContainerStyle={styles.compactChipsScroll}
                       style={{ flexGrow: 0 }}
                     >
                       {smartDefault && (
                         <TouchableOpacity
                           style={styles.compactSmartChip}
                           onPress={handleSmartDefaultPress}
                           activeOpacity={0.85}
                         >
                           <Ionicons name="flash" size={16} color="#6C47FF" style={{ marginRight: 4 }} />
                           <Text style={styles.compactSmartChipText} numberOfLines={1}>Plan: {smartDefault}</Text>
                         </TouchableOpacity>
                       )}
                       {SHORTCUTS.map((sc, idx) => (
                         <TouchableOpacity
                           key={sc.label}
                           style={[
                             styles.compactShortcutChip,
                             numDays === sc.days && styles.compactShortcutChipSelected,
                           ]}
                           onPress={() => {
                             setNumDays(sc.days);
                             if (sc.prompt) setAiQuery(sc.prompt);
                           }}
                           activeOpacity={0.85}
                         >
                           <Ionicons
                             name={
                               sc.label === "Today"
                                 ? "sunny"
                                 : sc.label === "Tomorrow"
                                 ? "cloud-outline"
                                 : sc.label === "Weekend"
                                 ? "calendar"
                                 : "calendar-outline"
                             }
                             size={15}
                             color={numDays === sc.days ? "#fff" : "#6C47FF"}
                             style={{ marginRight: 0 }}
                           />
                         </TouchableOpacity>
                       ))}
                     </ScrollView>
                     <TouchableOpacity
                       style={styles.advancedToggle}
                       onPress={() => setShowAdvanced((v) => !v)}
                       activeOpacity={0.8}
                       accessibilityLabel="Show advanced options"
                     >
                       <Ionicons name={showAdvanced ? "chevron-up" : "options-outline"} size={20} color="#BB86FC" />
                     </TouchableOpacity>
                   </View>
                   <View style={styles.chipDivider} />

                   {/* --- Advanced: Day Selector --- */}
                   {showAdvanced && (
                     <View style={styles.daySelectorContainer}>
                       <Text style={styles.daySelectorLabel}>Plan Duration:</Text>
                       <ScrollView
                         horizontal
                         showsHorizontalScrollIndicator={true}
                         contentContainerStyle={styles.daySelectorScrollContent}
                         style={styles.daySelectorScrollView}
                       >
                         {dayOptions.map((day) => (
                           <TouchableOpacity
                             key={day}
                             style={[
                               styles.dayButton,
                               numDays === day && styles.dayButtonSelected,
                               isLoading && styles.dayButtonDisabled
                             ]}
                             onPress={() => !isLoading && setNumDays(day)}
                             disabled={isLoading}
                             accessibilityLabel={`Select ${day} days`}
                             accessibilityState={{ selected: numDays === day }}
                           >
                             <Text
                               style={[
                                 styles.dayButtonText,
                                 numDays === day && styles.dayButtonTextSelected,
                               ]}
                             >
                               {day}
                             </Text>
                           </TouchableOpacity>
                         ))}
                       </ScrollView>
                       <Text style={styles.daySelectorLabelEnd}>days</Text>
                     </View>
                   )}

                  {/* Query Input and Submit Button */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputFieldQuery}
                      placeholder="What's your goal?"
                      placeholderTextColor="#888"
                      value={aiQuery}
                      onChangeText={setAiQuery}
                      multiline
                      editable={!isLoading}
                      blurOnSubmit={true} // Dismiss keyboard on return key
                      ref={inputRef}
                    />
                    {/* REMOVED Days Input Container */}
                    {/* <View style={styles.daysInputContainer}> ... </View> */}

                    {isLoading ? (
                      // Stop Button
                      <TouchableOpacity
                        style={[styles.controlButtonInInput, styles.stopButton]}
                        onPress={handleStopGeneration}
                        accessibilityLabel="Stop AI generation"
                      >
                        <Ionicons name="stop-circle" size={24} color="#FFF" />
                      </TouchableOpacity>
                    ) : (
                      // Generate Button
                      <TouchableOpacity
                        style={[
                          styles.controlButtonInInput,
                          styles.generateButton,
                          // Dim button if query is empty
                          !aiQuery.trim() ? styles.generateButtonDisabled : null
                        ]}
                        onPress={fetchAIResponse}
                        disabled={!aiQuery.trim()} // Disable if query is empty
                        accessibilityLabel="Generate tasks"
                      >
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <GoalSuggestionAlgorithm
                    userGoals={userHistory.goals}
                    allGoals={allGoals}
                    query={aiQuery}
                    onSuggestionPress={handleGoalSuggestionSelect}
                  />
                  {/* Modern "Surprise Me!" bubble, only show if user is typing */}
                  {aiQuery.trim().length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
                      <Animated.View style={{ transform: [{ scale: surprisePressed ? 0.96 : 1 }] }}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={handleSurpriseMe}
                          onPressIn={() => setSurprisePressed(true)}
                          onPressOut={() => setSurprisePressed(false)}
                          style={{ borderRadius: 24, overflow: 'hidden' }}
                        >
                          <LinearGradient
                            colors={SURPRISE_GRADIENT}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.surpriseBubble}
                          >
                            <Ionicons name="sparkles" size={18} color="#BB86FC" style={{ marginRight: 6 }} />
                            <Text style={styles.surpriseBubbleText}>Surprise Me!</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  )}
                  {/* Action Buttons (Accept/Reset) */}
                  <View style={styles.actionButtonsContainer}>
                     {suggestedTasks.length > 0 && !isLoading && (
                       <>
                         <TouchableOpacity
                           style={[styles.actionButton, styles.clearButton]}
                           onPress={() => resetModalState(false)} // Keep query
                           accessibilityLabel="Clear generated tasks and retry"
                         >
                           <Ionicons name="refresh-outline" size={18} color="#FFF" style={{marginRight: 5}}/>
                           <Text style={styles.actionButtonText}>Clear</Text>
                         </TouchableOpacity>
                          <TouchableOpacity
                           style={[styles.actionButton, styles.acceptAllButton]}
                           onPress={handleAcceptAllTasks}
                           accessibilityLabel="Accept all tasks"
                         >
                           <Ionicons name="checkmark-done-outline" size={18} color="#FFF" style={{marginRight: 5}}/>
                           <Text style={styles.actionButtonText}>Accept All</Text>
                         </TouchableOpacity>
                       </>
                     )}
                  </View>
                </View>
                <Animated.View style={{ transform: [{ scale: suggestionAnim }] }}>
                  <Pressable
                    style={styles.suggestionButtonWrapper}
                    onPress={handleFetchSuggestions}
                    onPressIn={handleSuggestionPressIn}
                    onPressOut={handleSuggestionPressOut}
                    accessibilityLabel="Show example prompts for AI task planner"
                    disabled={isLoading}
                  >
                    <AnimatedGradientButton
                      suggestionGradientAnim={suggestionGradientAnim}
                      pressed={suggestionPressed || isLoading}
                    >
                      <Text style={styles.suggestionButtonText}>Suggestions</Text>
                    </AnimatedGradientButton>
                  </Pressable>
                </Animated.View>
                {/* Show suggestion ideas as chips/buttons */}
                {showSuggestions && suggestionIdeas.length > 0 && (
                  <View style={styles.suggestionIdeasContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                      <Text style={styles.suggestionIdeasTitle}>Try one of these:</Text>
                      <TouchableOpacity
                        onPress={() => { setShowSuggestions(false); setSuggestionIdeas([]); }}
                        style={{ marginLeft: 'auto', padding: 8 }}
                        accessibilityLabel="Hide suggestions"
                      >
                        <Ionicons name="close" size={20} color="#AAA" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.suggestionIdeasScrollWrapper}>
                      <ScrollView
                        style={{ maxHeight: 180 }}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.suggestionIdeasList}
                      >
                        {suggestionIdeas.map((idea, idx) => (
                          <LinearGradient
                            key={idx}
                            colors={pastelGradients[idx % pastelGradients.length]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.suggestionIdeaChip}
                          >
                            <TouchableOpacity
                              style={{ flex: 1 }}
                              onPress={() => handleSuggestionIdeaPress(idea)}
                            >
                              <Text style={styles.suggestionIdeaText}>{idea}</Text>
                            </TouchableOpacity>
                          </LinearGradient>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                )}
                {/* --- Build For Me Workflow UI --- */}
                {buildForMeState === 'clarifying' && clarifyingQuestion && (
                  <View style={styles.buildForMeClarifyContainer}>
                    <Text style={styles.buildForMeClarifyQuestion}>{clarifyingQuestion}</Text>
                    <TextInput
                      style={styles.buildForMeClarifyInput}
                      placeholder="Your answer..."
                      placeholderTextColor="#888"
                      value={clarifyingAnswer}
                      onChangeText={setClarifyingAnswer}
                      editable={true}
                      multiline
                    />
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptAllButton, { flex: 1, marginRight: 8 }]}
                        onPress={handleClarifyingAnswerSubmit}
                      >
                        <Text style={styles.actionButtonText}>Submit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.clearButton, { flex: 1 }]}
                        onPress={handleCancelBuildForMe}
                      >
                        <Text style={styles.actionButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {buildForMeState === 'reviewing' && suggestedTasks.length > 0 && (
                  <View style={styles.buildForMeReviewingContainer}>
                    <Text style={styles.buildForMeReviewingText}>
                      AI plan ready! Accepting in 3 seconds...
                    </Text>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.clearButton, { marginTop: 8 }]}
                      onPress={handleCancelBuildForMe}
                    >
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {buildForMeState === 'autoAccepting' && (
                  <View style={styles.buildForMeReviewingContainer}>
                    <ActivityIndicator size="small" color="#BB86FC" />
                    <Text style={styles.buildForMeReviewingText}>Accepting tasks...</Text>
                  </View>
                )}
                {buildForMeState === 'done' && (
                  <View style={styles.buildForMeReviewingContainer}>
                    <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                    <Text style={styles.buildForMeReviewingText}>Tasks accepted!</Text>
                  </View>
                )}
                {buildForMeState === 'cancelled' && (
                  <View style={styles.buildForMeReviewingContainer}>
                    <Ionicons name="close-circle" size={32} color="#F44336" />
                    <Text style={styles.buildForMeReviewingText}>Cancelled.</Text>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      {/* --- Suggestions Modal (Enhanced) --- */}
      <Modal
        isVisible={showSuggestions}
        onBackdropPress={() => setShowSuggestions(false)}
        onBackButtonPress={() => setShowSuggestions(false)}
        style={styles.modalWrapper}
        backdropTransitionOutTiming={0}
      >
        <SafeAreaView style={[styles.modalContainerOuter, { height: '60%' }]}>
          <View style={styles.modalContainerInner}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suggestions</Text>
              <TouchableOpacity
                onPress={() => { setShowSuggestions(false); setSuggestionIdeas([]); }}
                style={styles.modalControlButton}
                accessibilityLabel="Close suggestions"
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Templates */}
            <Text style={styles.suggestionIdeasTitle}>Templates</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
              {TEMPLATES.map((tpl, idx) => (
                <TouchableOpacity
                  key={tpl.label}
                  style={[styles.suggestionIdeaChip, { marginRight: 8, marginBottom: 8, backgroundColor: pastelGradients[idx % pastelGradients.length][1] }]}
                  onPress={() => handleTemplatePress(tpl)}
                >
                  <Text style={styles.suggestionIdeaText}>{tpl.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Shortcuts */}
            <Text style={styles.suggestionIdeasTitle}>Quick Duration</Text>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {SHORTCUTS.map((sc, idx) => (
                <TouchableOpacity
                  key={sc.label}
                  style={[styles.dayButton, numDays === sc.days && styles.dayButtonSelected]}
                  onPress={() => handleShortcutPress(sc.days)}
                >
                  <Text style={[styles.dayButtonText, numDays === sc.days && styles.dayButtonTextSelected]}>{sc.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Recent Ideas */}
            {recentIdeas.length > 0 && (
              <>
                <Text style={styles.suggestionIdeasTitle}>Recent</Text>
                <View style={styles.suggestionIdeasScrollWrapper}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row' }}>
                    {recentIdeas.map((idea, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.suggestionIdeaChip, { marginRight: 8, backgroundColor: pastelGradients[idx % pastelGradients.length][2] }]}
                        onPress={() => handleRecentIdeaPress(idea)}
                      >
                        <Text style={styles.suggestionIdeaText}>{idea}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
            {/* Popular Ideas */}
            <Text style={styles.suggestionIdeasTitle}>Popular</Text>
            <View style={styles.suggestionIdeasScrollWrapper}>
              <ScrollView
                style={{ maxHeight: 120 }}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.suggestionIdeasList}
              >
                {suggestionIdeas.map((idea, idx) => (
                  <LinearGradient
                    key={idx}
                    colors={pastelGradients[idx % pastelGradients.length]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.suggestionIdeaChip}
                  >
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => handleSuggestionIdeaPress(idea)}
                    >
                      <Text style={styles.suggestionIdeaText}>{idea}</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                ))}
              </ScrollView>
            </View>
            {/* Show spinner if loading from suggestion/template */}
            {isLoading && (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <ActivityIndicator size="small" color="#BB86FC" />
                <Text style={{ color: '#AAA', marginTop: 6 }}>Generating tasks...</Text>
              </View>
            )}
            {/* Optionally add a toggle for user preference */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setShowSuggestionsOnOpen(!showSuggestionsOnOpen)}
                style={{ marginRight: 8 }}
              >
                <Ionicons
                  name={showSuggestionsOnOpen ? "checkbox-outline" : "square-outline"}
                  size={20}
                  color="#BB86FC"
                />
              </TouchableOpacity>
              <Text style={{ color: '#AAA', fontSize: 14 }}>Show suggestions when opening planner</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      {/* --- Feedback Modal UI --- */}
      <Modal
        isVisible={showFeedbackModal}
        onBackdropPress={() => setShowFeedbackModal(false)}
        onBackButtonPress={() => setShowFeedbackModal(false)}
        style={styles.modalWrapper}
        backdropTransitionOutTiming={0}
      >
        <SafeAreaView style={[styles.modalContainerOuter, { height: 340, justifyContent: 'center' }]}>
          <View style={[styles.modalContainerInner, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={[styles.modalTitle, { marginBottom: 18 }]}>How was your AI plan?</Text>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map(rating => (
                <Animated.View
                  key={rating}
                  style={{
                    transform: [
                      {
                        scale:
                          feedbackRating === rating
                            ? 1.22
                            : feedbackRating > 0 && feedbackRating < rating
                            ? 0.96
                            : 1,
                      },
                    ],
                    marginHorizontal: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setFeedbackRating(rating)}
                    activeOpacity={0.85}
                    accessibilityLabel={`Rate ${rating} out of 5`}
                    style={{ borderRadius: 32, overflow: 'hidden' }}
                  >
                    {feedbackRating >= rating ? (
                      <LinearGradient
                        colors={['#FFD700', '#FFB300']}
                        start={{ x: 0.2, y: 0 }}
                        end={{ x: 0.8, y: 1 }}
                        style={styles.modernStarGradient}
                      >
                        <Ionicons
                          name="star"
                          size={40}
                          color="#fff"
                          style={{ textShadowColor: '#FFD700', textShadowRadius: 8 }}
                        />
                      </LinearGradient>
                    ) : (
                      <View style={styles.modernStarUnselected}>
                        <Ionicons
                          name="star-outline"
                          size={40}
                          color="#AAA"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
            <Text style={styles.feedbackLabelText}>
              {feedbackRating > 0 ? FEEDBACK_LABELS[feedbackRating - 1] : "Tap a star to rate"}
            </Text>
            <TextInput
              style={[
                styles.inputFieldQuery,
                {
                  minHeight: 40,
                  maxHeight: 80,
                  width: '100%',
                  backgroundColor: '#232B3A',
                  borderRadius: 8,
                  color: '#fff',
                  marginTop: 18,
                  marginBottom: 16,
                },
              ]}
              placeholder="Optional feedback..."
              placeholderTextColor="#AAA"
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              editable={!feedbackLoading}
            />
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: '#4CAF50', minWidth: 120, justifyContent: 'center' },
              ]}
              onPress={submitFeedback}
              disabled={feedbackLoading}
              accessibilityLabel="Submit feedback"
            >
              {feedbackLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.actionButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

// --- Styles --- (Organized and refined)
const styles = StyleSheet.create({
  // --- Ultra-Modern Floating Button ---
  buttonContainer: {
    position: 'absolute',
    bottom: 38,
    right: 22,
    zIndex: 10,
    elevation: 20,
  },
  gradientRing: {
    width: 83, // 92 * 0.9
    height: 83,
    borderRadius: 41.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A6BFFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 13,
    // Add subtle blur for extra modern depth
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  modernButtonTouchable: {
    width: 74, // 82 * 0.9
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
    shadowColor: '#B7E0FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 8,
  },
  glassButton: {
    width: 65, // 72 * 0.9
    height: 65,
    borderRadius: 32.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(180,180,180,0.18)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#A6BFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 7,
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerGlow: {
    position: 'absolute',
    width: 49, // 54 * 0.9
    height: 49,
    borderRadius: 24.5,
    backgroundColor: 'rgba(166,191,255,0.14)',
    top: 8,
    left: 8,
    zIndex: 1,
    shadowColor: '#A6BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 1,
  },
  sparklePulse: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 2,
  },
  glowRing: {
    position: 'absolute',
    width: 88, // 98 * 0.9
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: '#BB86FC',
    shadowColor: '#A6BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    zIndex: -1,
    alignSelf: 'center',
  },
  // --- Modal ---
  modalWrapper: {
    justifyContent: 'flex-end', // Aligns modal to bottom
    margin: 0, // Remove default margins
  },
  modalContainerOuter: {
      backgroundColor: '#121212', // Darker background
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden', // Clip content to rounded corners
  },
   keyboardAvoidingView: {
      flex: 1, // Take available space
   },
   modalContainerInner: {
       flex: 1, // Inner container takes all space within Safe/Keyboard view
       paddingHorizontal: 16,
       paddingBottom: 10, // Reduced bottom padding, SafeArea handles it
   },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12, // Reduced padding
    // Removed border, rely on content separation
  },
  modalControlButton: {
    padding: 8, // Make touch target larger
  },
  modalTitle: {
    color: '#E0E0E0', // Lighter text color
    fontSize: 20,
    fontWeight: '600', // Semi-bold
  },

  // --- Scroll & Placeholders ---
  scrollContent: {
    flexGrow: 1, // Add this back
    paddingTop: 10,
    paddingBottom: 10, // Padding inside scroll
  },
  placeholderContainer: {
    // flex: 1, // <-- REMOVE THIS LINE
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 150, // Ensure it takes some space
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15, // Space from icon/indicator
    lineHeight: 22,
  },
  errorTextInline: {
    color: '#FF7043', // Orange/Red color for errors
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },

  // --- Task Item ---
  taskItem: {
    backgroundColor: '#1E1E1E', // Slightly lighter dark shade
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A', // Subtle border
  },
  taskEditContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Align input and buttons
  },
  taskContentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Push actions to the right
    alignItems: 'flex-start', // Align items to the top
  },
  taskTextWrapper: { // New wrapper for text content
    flex: 1, // Allow text content to take available space
    marginRight: 8, // Space before action buttons
  },
  taskHeaderLine: { // Container for Day and Deadline
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // Space between header and task text
  },
  taskDay: {
    color: '#BB86FC', // Theme purple
    fontWeight: 'bold',
    fontSize: 15,
    lineHeight: 22, // Match task text line height
  },
  taskDeadline: { // Style for the suggested deadline
    color: '#A0A0A0', // Lighter grey
    fontSize: 13,
    marginLeft: 5,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  taskTitle: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    lineHeight: 22,
  },
  taskDescription: {
    color: '#B0B0B0',
    fontSize: 14,
    marginBottom: 0,
    lineHeight: 20,
  },
  taskText: {
    // flex: 1, // Removed flex: 1 here, handled by wrapper
    color: '#E0E0E0', // Lighter text
    fontSize: 15,
    lineHeight: 22,
  },
  taskInput: {
    flex: 1,
    color: '#FFF',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginRight: 8,
    lineHeight: 20,
    textAlignVertical: 'top', // Better multiline alignment
  },
   editActions: {
       flexDirection: 'row',
   },
  taskActions: { // Container for edit/delete icons
    flexDirection: 'row',
    alignItems: 'center', // Vertically center icons
    // Removed marginLeft, spacing handled by taskTextWrapper
  },
  taskActionButton: {
    marginLeft: 10, // Space between icons
    padding: 5, // Increase touch area
  },

  // --- Input Area ---
  inputArea: {
    paddingTop: 8, // Add slight padding above input
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A', // Separator line
  },
  // --- Day Selector (NEW) ---
  daySelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Space below selector, before query input
    marginTop: 5, // Space above selector
  },
  daySelectorLabel: {
    color: '#AAA',
    fontSize: 14,
    marginRight: 8,
  },
  daySelectorLabelEnd: { // Label after the scroll view
    color: '#AAA',
    fontSize: 14,
    marginLeft: 8,
  },
  daySelectorScrollView: {
    flex: 1, // Allow scroll view to take available space
  },
  daySelectorScrollContent: {
    paddingVertical: 5, // Padding inside the scroll area
    alignItems: 'center',
  },
  dayButton: {
    backgroundColor: '#333',
    borderRadius: 18, // More rounded
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4, // Space between buttons
    minWidth: 40, // Ensure minimum width
    height: 36, // Fixed height
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  dayButtonSelected: {
    backgroundColor: '#6200EE', // Highlight selected day
    borderColor: '#BB86FC',
  },
  dayButtonDisabled: {
    opacity: 0.6, // Dim buttons when loading
  },
  dayButtonText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: '#FFF',
  },
  // --- Query Input Wrapper ---
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align items to bottom (for multiline)
    backgroundColor: '#1E1E1E', // Match task item background
    borderRadius: 12, // Match task item radius
    paddingHorizontal: 12,
    paddingVertical: 8,
    // REMOVED: marginTop: 12, // Now handled by daySelectorContainer margin
    minHeight: 50, // Minimum height
  },
  inputFieldQuery: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8, // Adjust vertical padding
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    marginRight: 8,
    maxHeight: 100, // Limit height for multiline
    textAlignVertical: 'center', // Try to center single line text
  },
  // REMOVED: daysInputContainer, inputFieldDays, daysLabel styles
  controlButtonInInput: {
    marginLeft: 8,
    borderRadius: 20, // Circular button
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  generateButton: {
     backgroundColor: '#6200EE', // Theme purple
  },
  generateButtonDisabled: { // Style for disabled state
      backgroundColor: '#444', // Darker/greyed out color
  },
  stopButton: {
     backgroundColor: '#F44336', // Red for stop
    paddingHorizontal: 20,
  },
  // --- Action Buttons ---
  actionButtonsContainer: { // Below the input field
      flexDirection: 'row',
      justifyContent: 'space-between', // Space out buttons
      marginTop: 15, // Space above buttons
      marginBottom: 5, // Space below buttons
  },
  actionButton: {
      flexDirection: 'row', // Icon and text side-by-side
      borderRadius: 25,
      paddingVertical: 12,
      paddingHorizontal: 18, // Adjusted padding
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1, // Make buttons share space
      marginHorizontal: 5, // Space between buttons
      elevation: 2, // Subtle elevation
  },
  acceptAllButton: {
    backgroundColor: '#4CAF50', // Green
  },
  clearButton: {
    backgroundColor: '#FF9800', // Orange
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  suggestionButtonWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  suggestionButton: {
    // Remove backgroundColor, use gradient instead
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 320,
  },
  suggestionButtonText: {
    color: '#232B3A', // Changed from '#fff' to dark for contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionIdeasContainer: {
    marginTop: 18,
    alignItems: 'flex-start',
    width: '100%',
  },
  suggestionIdeasTitle: {
    color: '#AAA',
    fontSize: 15,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  suggestionIdeasScrollWrapper: {
    width: '100%',
    maxHeight: 180,
  },
  suggestionIdeasList: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 8,
  },
  suggestionIdeaChip: {
    borderRadius: 24, // More rounded for bubble
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 140,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(180,180,200,0.12)',
  },
  suggestionIdeaText: {
    color: '#232B3A', // Dark text for pastel backgrounds
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  surpriseBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 22,
    minHeight: 38,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#BB86FC',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  surpriseBubbleText: {
    color: '#6C47FF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    textShadowColor: '#fff',
    textShadowRadius: 2,
  },
  modernStarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  modernStarUnselected: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  feedbackLabelText: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
    minHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  // --- Build For Me Styles ---
  buildForMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C47FF',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 10,
    elevation: 2,
  },
  buildForMeButtonDisabled: {
    opacity: 0.5,
  },
  buildForMeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  buildForMeClarifyContainer: {
    backgroundColor: '#232B3A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  buildForMeClarifyQuestion: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 10,
  },
  buildForMeClarifyInput: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 80,
  },
  buildForMeReviewingContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  buildForMeReviewingText: {
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  // --- Smart Default Chip (improved) ---
  smartDefaultChipGradient: {
    borderRadius: 22,
    padding: 2,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    marginHorizontal: 2,
  },
  smartDefaultChipTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 38,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  smartDefaultChipText: {
    color: '#6C47FF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.1,
    textShadowColor: '#fff',
    textShadowRadius: 2,
  },

  // --- Shortcut Chips (improved) ---
  shortcutChipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingLeft: 4,
    paddingRight: 8,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 2,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0D7FF',
  },
  shortcutChipSelected: {
    backgroundColor: '#6C47FF',
    borderColor: '#6C47FF',
    shadowOpacity: 0.18,
  },
  shortcutChipText: {
    color: '#6C47FF',
    fontWeight: '600',
    fontSize: 15,
  },
  shortcutChipTextSelected: {
    color: '#fff',
  },

  // --- Modern Compact Chips Row ---
  compactChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 2,
    minHeight: 38,
  },
  compactChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingLeft: 2,
    paddingRight: 2,
  },
  compactSmartChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9E3FF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 6,
    minWidth: 60,
    maxWidth: 160,
    elevation: 1,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  compactSmartChipText: {
    color: '#6C47FF',
    fontWeight: '600',
    fontSize: 14,
    maxWidth: 110,
  },
  compactShortcutChip: {
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#A6BFFF',
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  compactShortcutChipSelected: {
    backgroundColor: '#6C47FF',
  },
  advancedToggle: {
    marginLeft: 4,
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(187,134,252,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDivider: {
    height: 1,
    backgroundColor: '#232B3A',
    opacity: 0.13,
    marginVertical: 6,
    borderRadius: 1,
  },
});

export default AskAIButton;