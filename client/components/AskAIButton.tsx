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
import AITaskList from './AITaskList';
import SuggestionChips from './SuggestionChips';
import PlaceholderContent from './PlaceholderContent';
import { useUserHistory } from '../hooks/useUserHistory';
import useAnimations from '../hooks/useAnimations';
import useAICompletion from '../hooks/useAICompletion';
import useSuggestions from '../hooks/useSuggestions';
import { submitFeedback as submitFeedbackApi } from '../services/api';
import { AskAIButtonProps, BuildForMeState } from '../types'; // <-- Import types here
import { useSuggestionHandlers } from '../hooks/useSuggestionHandlers';

// --- Main AskAIButton Component ---
const AskAIButton: React.FC<AskAIButtonProps> = ({ onTaskAccept }) => {
  // --- Animation Hooks ---
  // Handles all button and suggestion animation states
  const {
    scaleAnim,
    sparkleAnim,
    suggestionAnim,
    glowAnim,
    iconRotateAnim,
    suggestionGradientAnim,
    handlePressIn,
    handlePressOut,
    handleSuggestionPressIn,
    handleSuggestionPressOut,
  } = useAnimations();

  // --- UI State ---
  // Modal, button, feedback, and build-for-me states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFullSize, setIsFullSize] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [suggestionPressed, setSuggestionPressed] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [buildForMeState, setBuildForMeState] = useState<BuildForMeState>('idle');
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | null>(null);
  const [clarifyingAnswer, setClarifyingAnswer] = useState<string>('');
  const [autoAcceptTimeout, setAutoAcceptTimeout] = useState<NodeJS.Timeout | null>(null);

  const insets = useSafeAreaInsets();

  // --- User History Hook ---
  // Manages user goals and accepted tasks history
  const {
    userHistory,
    setUserHistory,
    allGoals,
    smartDefault,
    setSmartDefault,
    addGoalToHistory,
    addAcceptedTasksToHistory,
  } = useUserHistory();

  // --- AI Completion Hook ---
  // Handles AI query, loading, editing, and task management
  const {
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
  } = useAICompletion({
    userHistory,
    addAcceptedTasksToHistory,
    onTaskAccept,
    setShowFeedbackModal,
    smartDefault,
  });

  // --- Suggestions Hook ---
  // Handles suggestion ideas, showing/hiding, and fetching
  const {
    suggestionIdeas,
    setSuggestionIdeas,
    showSuggestions,
    setShowSuggestions,
    showSuggestionsOnOpen,
    setShowSuggestionsOnOpen,
    hasAutoShownSuggestions,
    setHasAutoShownSuggestions,
    fetchSuggestionIdeas,
    handleFetchSuggestions,
  } = useSuggestions({
    setErrorMessage,
    setSuggestedTasks,
    setIsLoading,
    SUGGESTION_IDEAS,
  });

  // --- Recent Ideas State ---
  // Stores recently used suggestion ideas
  const [recentIdeas, setRecentIdeas] = useState<string[]>([]);

  // Adds a new idea to the recent ideas list
  const addRecentIdea = (idea: string) => {
    setRecentIdeas(prev => {
      const filtered = prev.filter(i => i !== idea);
      return [idea, ...filtered].slice(0, 5);
    });
  };

  // --- Modularized Suggestion Handlers ---
  // Handles presses on suggestions, templates, recents, and shortcuts
  const {
    handleSuggestionIdeaPress,
    handleTemplatePress,
    handleRecentIdeaPress,
    handleShortcutPress,
  } = useSuggestionHandlers({
    setAiQuery,
    setNumDays,
    addRecentIdea,
    addGoalToHistory,
    setSuggestionIdeas,
    setShowSuggestions,
    setIsLoading,
    fetchAIResponse,
    inputRef,
  });

  // --- Effect: Reset build-for-me state and clarifying Q/A when modal closes ---
  useEffect(() => {
    if (!isModalVisible) {
      setBuildForMeState('idle');
      setClarifyingQuestion(null);
      setClarifyingAnswer('');
      if (autoAcceptTimeout) clearTimeout(autoAcceptTimeout);
      setAutoAcceptTimeout(null);
    }
  }, [isModalVisible, autoAcceptTimeout]);

  // --- Handlers for Modal Open/Close ---
  const openModal = useCallback(() => {
    resetModalState(true);
    setIsModalVisible(true);
    // Show suggestions automatically if enabled
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
  }, [
    resetModalState,
    showSuggestionsOnOpen,
    fetchSuggestionIdeas,
    hasAutoShownSuggestions,
    setShowSuggestions,
    setSuggestionIdeas,
    setHasAutoShownSuggestions,
  ]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // --- Handler: Select a goal suggestion ---
  const handleGoalSuggestionSelect = (suggestion: string) => {
    setAiQuery(suggestion);
  };

  // --- Handler: Submit feedback to API ---
  const submitFeedback = useCallback(async () => {
    if (feedbackRating === 0) {
      Alert.alert('Feedback Required', 'Please select a rating before submitting.');
      return;
    }
    setFeedbackLoading(true);
    try {
      await submitFeedbackApi({
        user: USER_ID,
        rating: feedbackRating,
        feedback: feedbackText.trim(),
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
              {/* --- Modal Header --- */}
              <ModalHeader
                title="AI Task Planner"
                onClose={closeModal}
                onExpand={() => setIsFullSize(!isFullSize)}
                isFullSize={isFullSize}
                style={styles.modalHeader}
                titleStyle={styles.modalTitle}
              />

              {/* --- Task Display Area --- */}
              <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {(isLoading && (!Array.isArray(suggestedTasks) || suggestedTasks.length === 0)) || (!Array.isArray(suggestedTasks) || suggestedTasks.length === 0) ? (
                  <PlaceholderContent
                    isLoading={isLoading}
                    numDays={numDays}
                    errorMessage={errorMessage}
                    styles={styles}
                  />
                ) : (
                  <AITaskList
                    tasks={suggestedTasks}
                    editingTaskId={editingTaskId}
                    editedTaskText={editedTaskText}
                    onStartEditing={handleStartEditing}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onChangeEditText={setEditedTaskText}
                    onDeleteTask={handleDeleteTask}
                    styles={styles}
                  />
                )}
                <View style={{ height: 20 }} />
              </ScrollView>

              {/* --- Input Area (AI Query, Days, Advanced, Surprise, Accept) --- */}
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
              {/* --- Suggestions Button --- */}
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
              {/* --- Inline Suggestions Chips --- */}
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
                    <SuggestionChips
                      ideas={suggestionIdeas}
                      pastelGradients={pastelGradients}
                      onIdeaPress={handleSuggestionIdeaPress}
                      styles={styles}
                    />
                  </View>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      {/* --- Suggestions Modal (Enhanced, with templates/shortcuts/recents) --- */}
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