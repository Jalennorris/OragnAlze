import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  Animated,
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import OpenAI from 'openai';
import config from '@/src/config';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import {
  SUGGESTION_IDEAS,
  suggestionGradientA,
  suggestionGradientB,
  pastelGradients,
  TEMPLATES,
  SHORTCUTS,
  SURPRISE_PROMPTS,
  SURPRISE_GRADIENT,
  DEFAULT_DAYS,
  ANIMATION_DURATION_MEDIUM,
  API_MODEL,
  USER_ID,
  generateUniqueId,
  dayOptions,
  mapTasksToApiFormat,
  STORAGE_USER_HISTORY,
  summarizeHistory,
  interpolateGradient,
} from '../utils/aiTaskUtils';
import styles from './AskAIButton.styles';
import AnimatedGradientButton from './AnimatedGradientButton';
import TaskInputArea from './TaskInputArea';
import TaskEditRow from './TaskEditRow';
import FeedbackModal from './FeedbackModal';
import SuggestionModal from './SuggestionModal';
import FloatingAIButton from './FloatingAIButton';
import ModalHeader from './ModalHeader';

const AskAIButton: React.FC<AskAIButtonProps> = ({ onTaskAccept }) => {
  // --- Refs ---
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const suggestionAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

  // --- State ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFullSize, setIsFullSize] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [suggestionPressed, setSuggestionPressed] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestionsOnOpen, setShowSuggestionsOnOpen] = useState(true);
  const [suggestionGradientAnim] = useState(new Animated.Value(0));
  const [hasAutoShownSuggestions, setHasAutoShownSuggestions] = useState(false);

  const [aiQuery, setAiQuery] = useState('');
  const [numDays, setNumDays] = useState<number>(DEFAULT_DAYS);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestionIdeas, setSuggestionIdeas] = useState<string[]>(SUGGESTION_IDEAS || []); // Default to SUGGESTION_IDEAS or empty array
  const [recentIdeas, setRecentIdeas] = useState<string[]>([]); // Default to an empty array
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskText, setEditedTaskText] = useState<string>('');
  const [userHistory, setUserHistory] = useState<{ goals: string[]; accepted: string[] }>({ goals: [], accepted: [] }); // Default to empty arrays
  const [smartDefault, setSmartDefault] = useState<string | null>(null);
  const [allGoals, setAllGoals] = useState<string[]>([]); // Default to an empty array
  const [surprisePressed, setSurprisePressed] = useState(false);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [buildForMeState, setBuildForMeState] = useState<BuildForMeState>('idle');
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | null>(null);
  const [clarifyingAnswer, setClarifyingAnswer] = useState<string>('');
  const [autoAcceptTimeout, setAutoAcceptTimeout] = useState<NodeJS.Timeout | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const insets = useSafeAreaInsets();

  // --- Animation Effects ---
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
    return () => sparkleLoop.stop();
  }, [sparkleAnim]);

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

  // --- Effects: Load user history and goals
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
        let parsed = { goals: [], accepted: [] };
        if (raw) {
          parsed = JSON.parse(raw);
        }
        const mergedGoals = [
          ...filteredBackendGoals,
          ...parsed.goals.filter(g => !filteredBackendGoals.includes(g)),
        ].slice(0, 20);
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

  useEffect(() => {
    if (!isModalVisible) {
      setBuildForMeState('idle');
      setClarifyingQuestion(null);
      setClarifyingAnswer('');
      if (autoAcceptTimeout) clearTimeout(autoAcceptTimeout);
      setAutoAcceptTimeout(null);
    }
  }, [isModalVisible, autoAcceptTimeout]);

  // --- OpenAI Client (Memoized)
  const openai = useMemo(() => new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.OAI_KEY,
    defaultHeaders: {},
    timeout: 30 * 1000,
    maxRetries: 1,
  }), []);

  // --- Handlers ---
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

  const resetModalState = useCallback((clearQueryToo: boolean = true) => {
    if (clearQueryToo) {
      setAiQuery('');
    }
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

  // --- Add/Accept task logic
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

  // --- AI Response
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

  const fetchSuggestionIdeas = useCallback(async () => {
    setSuggestionIdeas(SUGGESTION_IDEAS || []); // Ensure SUGGESTION_IDEAS is defined
  }, []);

  const handleFetchSuggestions = useCallback(() => {
    setErrorMessage(null);
    setSuggestedTasks([]);
    setSuggestionIdeas([]);
    setIsLoading(true);
    setShowSuggestions(true);
    fetchSuggestionIdeas();
    setIsLoading(false);
  }, [fetchSuggestionIdeas]);

  const handleSuggestionIdeaPress = (idea: string) => {
    setAiQuery(idea);
    addRecentIdea(idea);
    addGoalToHistory(idea);
    setSuggestionIdeas([]);
    setShowSuggestions(false);
    setIsLoading(true);
    setTimeout(() => {
      fetchAIResponse();
    }, 200);
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

  const addRecentIdea = (idea: string) => {
    setRecentIdeas(prev => {
      const filtered = prev.filter(i => i !== idea);
      return [idea, ...filtered].slice(0, 5);
    });
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
  }, [suggestedTasks, onTaskAccept]);

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

  const openModal = useCallback(() => {
    resetModalState(true);
    setIsModalVisible(true);
    if (showSuggestionsOnOpen && !hasAutoShownSuggestions) {
      setSuggestionIdeas([]);
      setShowSuggestions(true);
      fetchSuggestionIdeas();
      setHasAutoShownSuggestions(true);
      setTimeout(() => {
        setShowSuggestions(false);
        setSuggestionIdeas([]);
      }, 2500);
    }
  }, [resetModalState, showSuggestionsOnOpen, fetchSuggestionIdeas, hasAutoShownSuggestions]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("User stopped generation");
    }
    setIsLoading(false);
    setShowSuggestions(false);
  }, []);

  const handleGoalSuggestionSelect = (suggestion: string) => {
    setAiQuery(suggestion);
  };

  const handleSurpriseMe = () => {
    const randomPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    setAiQuery(randomPrompt);
  };

  const handleSmartDefaultPress = useCallback(() => {
    if (smartDefault) setAiQuery(smartDefault);
  }, [smartDefault]);

  const submitFeedback = useCallback(async () => {
    if (feedbackRating === 0) {
      Alert.alert('Feedback Required', 'Please select a rating before submitting.');
      return;
    }
    setFeedbackLoading(true);
    try {
      await axios.post('http://localhost:8080/api/feedback', {
        user: USER_ID,
        rating: feedbackRating,
        feedback: feedbackText.trim(),
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Thank You!', 'Your feedback has been submitted.');
      setShowFeedbackModal(false);
      setFeedbackRating(0);
      setFeedbackText('');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  }, [feedbackRating, feedbackText]);

  // --- Task Rendering
  const renderTask = (task: Task, index: number) => {
    const isEditing = editingTaskId === task.id;
    return (
      <View key={task.id} style={styles.taskItem}>
        {isEditing ? (
          <TaskEditRow
            task={task}
            editedTaskText={editedTaskText}
            onChangeText={setEditedTaskText}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
            styles={styles}
          />
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

  // --- Render ---
  return (
    <>
      {/* --- Ultra-Modern Floating AI Button --- */}
      <FloatingAIButton
        onPress={openModal}
        glowAnim={glowAnim}
        iconRotateAnim={iconRotateAnim}
        sparkleAnim={sparkleAnim}
      />

      {/* --- AI Modal --- */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={closeModal}
        onBackButtonPress={closeModal}
        style={styles.modalWrapper}
        backdropTransitionOutTiming={0}
        avoidKeyboard
        propagateSwipe
        onSwipeComplete={closeModal}
        swipeDirection={['down']}
      >
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.modalContainerOuter,
            { height: isFullSize ? '85%' : '65%' }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <View style={styles.modalContainerInner}>
              {/* Modal Header */}
              <ModalHeader
                title="AI Task Planner"
                onClose={closeModal}
                onExpand={() => setIsFullSize(!isFullSize)}
                isFullSize={isFullSize}
                style={styles.modalHeader}
                titleStyle={styles.modalTitle}
              />

              {/* Task Display Area */}
              <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {isLoading && (!Array.isArray(suggestedTasks) || suggestedTasks.length === 0) ? (
                  <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#BB86FC" />
                    <Text style={styles.placeholderText}>Generating your {numDays}-day plan...</Text>
                  </View>
                ) : (!Array.isArray(suggestedTasks) || suggestedTasks.length === 0) ? (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="bulb-outline" size={40} color="#888" style={{ marginBottom: 10 }} />
                    <Text style={styles.placeholderText}>
                      {errorMessage ? errorMessage : `Describe your goal below to get a personalized ${numDays}-day task plan.`}
                    </Text>
                  </View>
                ) : (
                  Array.isArray(suggestedTasks) ? suggestedTasks.map(renderTask) : null
                )}
                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Input Area */}
              <TaskInputArea
                aiQuery={aiQuery}
                setAiQuery={setAiQuery}
                numDays={numDays}
                setNumDays={setNumDays}
                isLoading={isLoading}
                errorMessage={errorMessage}
                inputRef={inputRef}
                showAdvanced={showAdvanced}
                setShowAdvanced={setShowAdvanced}
                smartDefault={smartDefault}
                handleSmartDefaultPress={handleSmartDefaultPress}
                SHORTCUTS={SHORTCUTS}
                dayOptions={dayOptions}
                userHistory={userHistory}
                allGoals={allGoals}
                handleGoalSuggestionSelect={handleGoalSuggestionSelect}
                SURPRISE_GRADIENT={SURPRISE_GRADIENT}
                handleSurpriseMe={handleSurpriseMe}
                surprisePressed={surprisePressed}
                setSurprisePressed={setSurprisePressed}
                styles={styles}
                handleStopGeneration={handleStopGeneration}
                fetchAIResponse={fetchAIResponse}
                suggestedTasks={suggestedTasks}
                resetModalState={resetModalState}
                handleAcceptAllTasks={handleAcceptAllTasks}
              />
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
              {showSuggestions && Array.isArray(suggestionIdeas) && suggestionIdeas.length > 0 && (
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
                      {Array.isArray(suggestionIdeas) ? suggestionIdeas.map((idea, idx) => (
                        <LinearGradient
                          key={idx}
                          colors={Array.isArray(pastelGradients) && Array.isArray(pastelGradients[idx % pastelGradients.length]) ? pastelGradients[idx % pastelGradients.length] : ['#eee', '#ccc']}
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
                      )) : null}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      {/* --- Suggestions Modal (Enhanced) --- */}
      <SuggestionModal
        visible={showSuggestions}
        onClose={() => { setShowSuggestions(false); setSuggestionIdeas([]); }}
        onTemplatePress={handleTemplatePress}
        onShortcutPress={handleShortcutPress}
        onRecentPress={handleRecentIdeaPress}
        onIdeaPress={handleSuggestionIdeaPress}
        templates={TEMPLATES}
        shortcuts={SHORTCUTS}
        recent={recentIdeas}
        ideas={suggestionIdeas}
        pastelGradients={pastelGradients}
        numDays={numDays}
        showOnOpen={showSuggestionsOnOpen}
        setShowOnOpen={setShowSuggestionsOnOpen}
      />

      {/* --- Feedback Modal --- */}
      <FeedbackModal
        isVisible={showFeedbackModal}
        feedbackRating={feedbackRating}
        feedbackText={feedbackText}
        feedbackLoading={feedbackLoading}
        onSetRating={setFeedbackRating}
        onChangeText={setFeedbackText}
        onSubmit={submitFeedback}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
};

export default AskAIButton;