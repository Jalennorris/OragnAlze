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
  // Add Horizontal ScrollView for days
  ScrollView as HorizontalScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import OpenAI from 'openai';
// import * Haptics from 'expo-haptics'; // Optional: For haptic feedback
import config from '@/src/config';
import axios from 'axios';

// --- Constants ---
const MIN_DAYS = 1;
const MAX_DAYS = 7;
const DEFAULT_DAYS = 7;
const ANIMATION_DURATION_SHORT = 300;
const ANIMATION_DURATION_MEDIUM = 500;
const API_MODEL = "microsoft/mai-ds-r1:free"; // Or choose another model like "microsoft/phi-3-medium-128k:free", "google/gemma-2-9b-it:free"
// const API_MODEL = "openai/gpt-3.5-turbo"; // Example if using OpenAI models via OpenRouter

const USER_ID = 95; // Replace with actual user ID from auth/context if available

// --- Types ---
interface Task {
  id: string;
  text: string;
  suggestedDeadline?: string; // Optional: Add suggested deadline
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
    if (!deadline || !isIsoDate(deadline)) {
      deadline = new Date().toISOString();
    }
    return {
      userId: USER_ID,
      taskName: task.text,
      taskDescription: task.text, // Or use a separate description if available
      priority: "Medium", // Or infer from AI if you add that field
      estimatedDuration: "1 hour", // Or infer from AI if you add that field
      deadline,
      status: "Not Started",
      completed: false,
      category: "General", // Or infer from AI if you add that field
      notes: "",
      createdAt: new Date().toISOString(),
    };
  });
};

const AskAIButton: React.FC<AskAIButtonProps> = ({ onTaskAccept }) => {
  // --- Refs ---
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollViewRef = useRef<ScrollView>(null); // Add ref for ScrollView

  // --- State ---
  // UI State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFullSize, setIsFullSize] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false); // Floating button press state

  // AI & Task State
  const [aiQuery, setAiQuery] = useState('');
  const [numDays, setNumDays] = useState<number>(DEFAULT_DAYS);
  // REMOVED: const [daysInputText, setDaysInputText] = useState<string>(DEFAULT_DAYS.toString()); // State for the input field text
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // For displaying errors inline

  // Editing State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskText, setEditedTaskText] = useState<string>('');

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

  // Floating button press animations
  const handlePressIn = useCallback(() => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Optional haptics
    setIsButtonPressed(true);
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    setIsButtonPressed(false);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }, [scaleAnim]);

  // --- Core AI Logic ---
  const fetchAIResponse = useCallback(async () => {
    const trimmedQuery = aiQuery.trim();
    if (!trimmedQuery) {
      Alert.alert('Input Required', 'Please describe what you need help planning.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort("Starting new request");
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setSuggestedTasks([]);
    setErrorMessage(null);

    try {
      console.log(`Requesting ${numDays} tasks for query: "${trimmedQuery}" using model ${API_MODEL}`);
      const completion = await openai.chat.completions.create(
        {
          model: API_MODEL,
          messages: [
            {
              role: "system",
              content: `You are a helpful task planner. Generate exactly ${numDays} specific, actionable daily tasks with deadlines. For each task, suggest a deadline based on the task's type or estimated duration. Return a JSON object with a "tasks" array containing objects with "task" and "deadline" fields.`,
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
          text: task.task.trim(),
          suggestedDeadline: task.deadline?.trim(),
        }))
        .filter(task => task.text);

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
  }, [aiQuery, numDays, openai]);

  const fetchSuggestedTasks = useCallback(async () => {
    try {
      const response = await openai.chat.completions.create({
        model: API_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an assistant that suggests tasks based on user activity or common patterns. Analyze the user's activity and provide relevant tasks.",
          },
          {
            role: "user",
            content: "Suggest tasks for me based on my recent activity and recurring patterns.",
          },
        ],
      });

      const tasks = JSON.parse(response.choices[0]?.message?.content || "{}").tasks || [];
      setSuggestedTasks(tasks.map((task: any) => ({
        id: generateUniqueId(),
        text: task.task,
        suggestedDeadline: task.deadline,
      })));
    } catch (error) {
      console.error("Error fetching suggested tasks:", error);
      Alert.alert("Error", "Failed to fetch suggested tasks. Please try again.");
    }
  }, [openai]);

  const handleFetchSuggestions = () => {
    fetchSuggestedTasks();
  };

  // --- Task Management Handlers ---
  const handleAcceptAllTasks = useCallback(async () => {
    if (suggestedTasks.length === 0) {
      Alert.alert('No Tasks', 'There are no tasks to accept.');
      return;
    }
    try {
      const apiTasks = mapTasksToApiFormat(suggestedTasks);
      await axios.post('http://localhost:8080/api/tasks/batch', apiTasks, {
        headers: { 'Content-Type': 'application/json' },
      });
      Alert.alert('Success', 'Tasks created successfully!');
      onTaskAccept(suggestedTasks); // Pass the final list
      resetModalState(false);
      setIsModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to save tasks.');
    }
  }, [suggestedTasks, onTaskAccept, resetModalState]);

  const handleStartEditing = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditedTaskText(task.text);
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Optional
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingTaskId) return;
    setSuggestedTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editingTaskId
          ? { ...task, text: editedTaskText /*, potentially update deadline here too */ }
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
  }, []);

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
              <Text style={styles.taskText}>{task.text}</Text>
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
      {/* --- Floating AI Button --- */}
      <Animated.View style={[styles.buttonContainer, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={openModal}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel="Ask AI for task suggestions"
          accessibilityRole="button"
        >
          {/* Cute face design */}
          <View style={styles.faceContainer}>
             <View style={styles.eyes}>
               <View style={styles.eye} />
               <View style={[styles.eye, { marginLeft: 10 }]} />
             </View>
             {isButtonPressed ? (
               <View style={styles.mouthOpen} />
             ) : (
               <View style={styles.mouthClosed} />
             )}
             {/* Sparkles */}
             <Animated.View style={[ styles.sparkle, styles.sparkle1, { opacity: sparkleAnim, transform: [{ scale: sparkleAnim }] } ]}>
               <Ionicons name="sparkles" size={16} color="#FFD700" />
             </Animated.View>
             <Animated.View style={[ styles.sparkle, styles.sparkle2, { opacity: sparkleAnim, transform: [{ scale: sparkleAnim }] } ]}>
               <Ionicons name="sparkles" size={16} color="#FFD700" />
             </Animated.View>
           </View>
        </TouchableOpacity>
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
                   {/* Day Selector */}
                   <View style={styles.daySelectorContainer}>
                     <Text style={styles.daySelectorLabel}>Plan Duration:</Text>
                     <ScrollView
                       horizontal
                       showsHorizontalScrollIndicator={true} // Enable horizontal scrollbar
                       contentContainerStyle={styles.daySelectorScrollContent}
                       style={styles.daySelectorScrollView} // Added style
                     >
                       {dayOptions.map((day) => (
                         <TouchableOpacity
                           key={day}
                           style={[
                             styles.dayButton,
                             numDays === day && styles.dayButtonSelected,
                             isLoading && styles.dayButtonDisabled // Disable during loading
                           ]}
                           onPress={() => !isLoading && setNumDays(day)} // Prevent changing during load
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
                <TouchableOpacity
                  style={styles.suggestionButton}
                  onPress={handleFetchSuggestions}
                  accessibilityLabel="Get AI-suggested tasks"
                >
                  <Text style={styles.suggestionButtonText}>Get Suggestions</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

// --- Styles --- (Organized and refined)
const styles = StyleSheet.create({
  // --- Floating Button ---
  buttonContainer: {
    position: 'absolute',
    bottom: 30, // Adjusted position slightly
    right: 20,
    zIndex: 10,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6200EE', // Use a theme color
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  faceContainer: { // Container for face elements
      width: 40,
      height: 40,
      position: 'relative',
      alignItems: 'center', // Center eyes and mouth
      justifyContent: 'center',
  },
  eyes: {
      flexDirection: 'row',
      position: 'absolute', // Position eyes absolutely within face container
      top: 8,
  },
  eye: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FFF', // White eyes
  },
  mouthClosed: {
      width: 18,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#FFF', // White mouth
      position: 'absolute', // Position mouth absolutely
      bottom: 10,
  },
  mouthOpen: { // Example: simple open mouth
      width: 18,
      height: 8,
      borderRadius: 3,
      backgroundColor: '#FF6347', // Example tongue color
      position: 'absolute',
      bottom: 8,
  },
  sparkle: { // Common style for sparkles
    position: 'absolute',
  },
  sparkle1: {
    top: -5, // Adjust position
    left: -8,
    transform: [{ rotate: '-15deg' }],
  },
  sparkle2: {
    bottom: -5, // Adjust position
    right: -8,
    transform: [{ rotate: '15deg' }],
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
  suggestionButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  suggestionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AskAIButton;