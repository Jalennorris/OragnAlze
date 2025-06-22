import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns'; // Use date-fns for date formatting
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { runOnJS } from 'react-native-reanimated';

// Import custom components (assuming they exist)
import Header from '../components/header'; // Adjust path if needed
import Navbar from '../components/Navbar'; // Adjust path if needed

// Add a simple color picker (array of color hex codes)
const CATEGORY_COLORS = ['#6a11cb', '#ff9800', '#43a047', '#e91e63', '#00bcd4', '#f44336', '#9c27b0', '#607d8b', '#ffd600', '#795548'];

// --- Enums for Priority and Status ---
export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}
export enum Status {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

// --- Constants ---
const BASE_API_URL = 'http://localhost:8080/api'; // Use a constant for the base URL
const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.Low]: '#8BC34A',
  [Priority.Medium]: '#FFC107',
  [Priority.High]: '#F44336',
};
const STATUS_OPTIONS: Status[] = [
  Status.NotStarted,
  Status.InProgress,
  Status.Completed,
];

// --- Interfaces ---
interface Task {
  taskId?: number;
  userId: number;
  taskName: string;
  taskDescription: string;
  priority: Priority;
  estimatedDuration: string;
  status: Status;
  completed: boolean;
  category: string;
  createdAt: string;
  deadline: string;
  notes: string;
}

// --- Category type with color ---
type Category = { name: string; color: string };

// --- Prop types for extracted components (if needed) ---
type HeaderProps = {};
type NavbarProps = {};

const AddTaskScreen: React.FC = () => {
  // --- State ---
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString());
  const [priority, setPriority] = useState<Priority>(Priority.Low);
  const [status, setStatus] = useState<Status>(Status.NotStarted);
  const [estimatedDays, setEstimatedDays] = useState<string>('0');
  const [estimatedHours, setEstimatedHours] = useState<string>('0');
  const [categories, setCategories] = useState<Category[]>([
    { name: 'Work', color: '#6a11cb' },
    { name: 'Personal', color: '#ff9800' },
    { name: 'Shopping', color: '#43a047' },
    { name: 'Health', color: '#e91e63' },
    { name: 'Other', color: '#607d8b' },
  ]);
  const [category, setCategory] = useState<string>('');
  const [categoryColor, setCategoryColor] = useState<string>(CATEGORY_COLORS[0]); // For new category color
  const [notes, setNotes] = useState<string>(''); // Add notes state
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for API call
  const [userId, setUserId] = useState<number | null>(null); // Store userId
  const [isAddCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showNewTaskButton, setShowNewTaskButton] = useState(false);

  const navigation = useNavigation();
  const buttonScale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Add ref for Task Name input
  const taskNameRef = useRef<TextInput>(null);

  // --- Effects ---
  useEffect(() => {
    // Fetch userId when the component mounts
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(parseInt(storedUserId, 10));
        } else {
          // Handle case where userId is not found (e.g., redirect to login)
          console.warn('User ID not found in AsyncStorage.');
          Alert.alert(
            'Authentication Error',
            'Could not find user ID. Please log in again.',
            [{ text: 'OK', onPress: () => navigation.navigate('Login') }] // Example: Navigate to Login
          );
          // Or just go back: navigation.goBack();
        }
      } catch (error) {
        console.error('Failed to fetch user ID:', error);
        Alert.alert('Error', 'Failed to load user data.');
      }
    };
    fetchUserId();
    // Auto-focus Task Name input on mount
    taskNameRef.current?.focus();
  }, [navigation]);

  // --- Input Handlers (useCallback) ---
  const handleNumericInput = React.useCallback(
    (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
      if (/^\d*$/.test(value)) {
        setter(value);
      }
    },
    []
  );

  const showDatePicker = React.useCallback(() => setDatePickerVisibility(true), []);
  const hideDatePicker = React.useCallback(() => setDatePickerVisibility(false), []);
  const handleConfirmDate = React.useCallback((date: Date) => {
    setDueDate(date.toISOString());
    hideDatePicker();
  }, [hideDatePicker]);

  const animateButtonPress = React.useCallback((callback?: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  }, [buttonScale]);

  const openAddCategoryModal = React.useCallback(() => {
    setNewCategory('');
    setCategoryColor(CATEGORY_COLORS[0]);
    setAddCategoryModalVisible(true);
  }, []);

  const closeAddCategoryModal = React.useCallback(() => setAddCategoryModalVisible(false), []);

  const handleAddCategory = React.useCallback(() => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Category name cannot be empty.');
      return;
    }
    if (categories.some(cat => cat.name === trimmed)) {
      Alert.alert('Duplicate Category', 'This category already exists.');
      return;
    }
    setCategories([...categories, { name: trimmed, color: categoryColor }]);
    setCategory(trimmed);
    setAddCategoryModalVisible(false);
  }, [newCategory, categories, categoryColor]);

  // --- Validation ---
  const validateInput = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!taskName.trim()) {
      newErrors.taskName = 'Task Name is required.';
    }
    if (!taskDescription.trim()) {
      newErrors.taskDescription = 'Task Description is required.';
    }
    if (!category) {
      newErrors.category = 'Please select a category.';
    }
    if (!dueDate) {
      newErrors.dueDate = 'Please select a due date.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Save Task Logic (useCallback) ---
  const handleSaveTask = React.useCallback(async () => {
    Keyboard.dismiss();
    if (!validateInput() || !userId) {
      if (!userId) Alert.alert('Error', 'User not identified. Cannot save task.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    const estimatedDuration = `${estimatedDays || '0'} days, ${estimatedHours || '0'} hours`;
    const newTask: Omit<Task, 'taskId' | 'createdAt'> & { createdAt?: string } = {
      userId: userId,
      taskName: taskName.trim(),
      taskDescription: taskDescription.trim(),
      priority,
      estimatedDuration,
      status,
      completed: status === Status.Completed,
      category,
      deadline: dueDate,
      notes: notes.trim(),
    };
    try {
      const response = await axios.post(`${BASE_API_URL}/tasks`, newTask);
      setShowNewTaskButton(true);
      setTaskName('');
      setTaskDescription('');
      setEstimatedDays('0');
      setEstimatedHours('0');
      setCategory('');
      setNotes('');
      setDueDate(new Date().toISOString());
      setPriority(Priority.Low);
      setStatus(Status.NotStarted);
      setErrors({});
      taskNameRef.current?.focus();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
      Alert.alert('Error Saving Task', `Failed to save the task. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    validateInput,
    userId,
    estimatedDays,
    estimatedHours,
    taskName,
    taskDescription,
    priority,
    status,
    category,
    dueDate,
    notes,
  ]);

  // --- Button Animation ---
  // --- Save Button Disabled State ---
  const isSaveDisabled = isLoading || !taskName.trim() || !taskDescription.trim() || !category || !dueDate;

  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#f8fafc', '#e0e7ff', '#f8fafc']}
        style={StyleSheet.absoluteFill}
        start={[0, 0]}
        end={[1, 1]}
      />
  
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <Animated.View entering={FadeIn.duration(600)}>
                <Text style={styles.title}>Create a New Task</Text>
                <Text style={styles.subtitle}>Organize your day with clarity and style</Text>
              </Animated.View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Task Name */}
              <Animated.View style={styles.card} entering={FadeIn.delay(100).duration(500)}>
                <View style={styles.inputContainer}>
                  <Ionicons name="clipboard-outline" size={24} color="#7c3aed" style={styles.icon} />
                  <TextInput
                    ref={taskNameRef}
                    style={styles.input}
                    placeholder="Task Name *"
                    placeholderTextColor="#a3a3a3"
                    value={taskName}
                    onChangeText={text => {
                      setTaskName(text);
                      if (errors.taskName) setErrors(prev => ({ ...prev, taskName: '' }));
                    }}
                    accessibilityLabel="Task Name Input"
                    accessibilityHint="Enter the name of your task here"
                    accessibilityRole="textbox"
                    accessibilityState={{ invalid: !!errors.taskName }}
                    maxLength={100}
                    allowFontScaling={true}
                    testID="input-task-name"
                  />
                </View>
                {errors.taskName ? <Text style={styles.errorText} testID="error-task-name">{errors.taskName}</Text> : null}
              </Animated.View>

              {/* Task Description */}
              <Animated.View style={styles.card} entering={FadeIn.delay(200).duration(500)}>
                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#7c3aed" style={styles.icon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Task Description *"
                    placeholderTextColor="#a3a3a3"
                    value={taskDescription}
                    onChangeText={text => {
                      setTaskDescription(text);
                      if (errors.taskDescription) setErrors(prev => ({ ...prev, taskDescription: '' }));
                    }}
                    multiline
                    numberOfLines={4}
                    accessibilityLabel="Task Description Input"
                    accessibilityHint="Describe the task in detail"
                    accessibilityRole="textbox"
                    accessibilityState={{ invalid: !!errors.taskDescription }}
                    maxLength={500}
                    allowFontScaling={true}
                    testID="input-task-desc"
                  />
                </View>
                {errors.taskDescription ? <Text style={styles.errorText} testID="error-task-desc">{errors.taskDescription}</Text> : null}
              </Animated.View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Estimated Duration */}
              <Animated.View style={styles.card} entering={FadeIn.delay(300).duration(500)}>
                <Text style={styles.label}>Estimated Duration</Text>
                <Text style={styles.helpText}>How long do you expect this task to take?</Text>
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={22} color="#7c3aed" style={styles.icon} />
                  <View style={styles.durationInputWrapper}>
                    <TextInput
                      style={[styles.input, styles.durationInput]}
                      placeholder="Days"
                      placeholderTextColor="#a3a3a3"
                      keyboardType="numeric"
                      value={estimatedDays}
                      onChangeText={(value) => handleNumericInput(value, setEstimatedDays)}
                      accessibilityLabel="Estimated duration in days"
                      accessibilityHint="Enter the number of days estimated for this task"
                      allowFontScaling={true}
                    />
                    <Text style={styles.durationLabel} allowFontScaling={true}>days</Text>
                  </View>
                  <View style={styles.durationInputWrapper}>
                    <TextInput
                      style={[styles.input, styles.durationInput]}
                      placeholder="Hours"
                      placeholderTextColor="#a3a3a3"
                      keyboardType="numeric"
                      value={estimatedHours}
                      onChangeText={(value) => handleNumericInput(value, setEstimatedHours)}
                      accessibilityLabel="Estimated duration in hours"
                      accessibilityHint="Enter the number of hours estimated for this task"
                      allowFontScaling={true}
                    />
                    <Text style={styles.durationLabel} allowFontScaling={true}>hours</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Status Selector */}
              <Animated.View style={styles.card} entering={FadeIn.delay(400).duration(500)}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.pillGroup}>
                  {STATUS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.pill,
                        status === option && styles.pillActive,
                      ]}
                      onPress={() => setStatus(option)}
                      accessibilityLabel={`Set status to ${option}`}
                      accessibilityHint={`Mark this task as ${option}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: status === option }}
                      testID={`status-${option.replace(/\s/g, '').toLowerCase()}`}
                      activeOpacity={0.85}
                    >
                      <Text style={[
                        styles.pillText,
                        status === option && styles.pillTextActive
                      ]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Due Date Picker */}
              <Animated.View style={styles.card} entering={FadeIn.delay(500).duration(500)}>
                <Text style={styles.label}>Due Date *</Text>
                <TouchableOpacity
                  onPress={showDatePicker}
                  style={styles.dateInputContainer}
                  accessibilityLabel="Select Due Date Button"
                  accessibilityHint="Tap to select a due date for this task"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isDatePickerVisible, invalid: !!errors.dueDate }}
                  testID="button-due-date"
                  activeOpacity={0.85}
                >
                  <Ionicons name="calendar-outline" size={22} color="#7c3aed" style={styles.icon} />
                  <Text style={styles.dateText} allowFontScaling={true}>
                    {dueDate ? format(new Date(dueDate), 'MMMM d, yyyy') : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {errors.dueDate ? <Text style={styles.errorText} testID="error-due-date">{errors.dueDate}</Text> : null}
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  date={dueDate ? new Date(dueDate) : new Date()}
                  minimumDate={new Date()}
                  onConfirm={handleConfirmDate}
                  onCancel={hideDatePicker}
                  accessibilityLabel="Date Picker Modal"
                  accessibilityHint="Pick a date for the task deadline"
                  testID="modal-date-picker"
                />
              </Animated.View>

              {/* Priority Selector */}
              <Animated.View style={styles.card} entering={FadeIn.delay(600).duration(500)}>
                <Text style={styles.label}>Priority</Text>
                <Text style={styles.helpText}>Set how important or urgent this task is.</Text>
                <View style={styles.pillGroup}>
                  {(Object.values(Priority) as Priority[]).map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.pill,
                        { backgroundColor: PRIORITY_COLORS[key] + 'cc' },
                        priority === key && styles.pillActive,
                      ]}
                      onPress={() => setPriority(key)}
                      accessibilityLabel={`Set priority to ${key}`}
                      accessibilityHint={`Set the priority of this task to ${key}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: priority === key }}
                      testID={`priority-${key}`}
                      activeOpacity={0.85}
                    >
                      <Text style={[
                        styles.pillText,
                        key === Priority.Medium ? { color: '#222' } : {},
                        priority === key && styles.pillTextActive
                      ]}>
                        {key.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Category Selector */}
              <Animated.View style={styles.card} entering={FadeIn.delay(700).duration(500)}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScrollContainer}
                  testID="scroll-categories"
                >
                  <View style={styles.pillGroup}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.name}
                        style={[
                          styles.pill,
                          { backgroundColor: cat.color + '22' },
                          category === cat.name && [styles.pillActive, { backgroundColor: cat.color }],
                        ]}
                        onPress={() => {
                          setCategory(cat.name);
                          if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                        }}
                        accessibilityLabel={`Set category to ${cat.name}`}
                        accessibilityHint={`Assign this task to the ${cat.name} category`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: category === cat.name }}
                        testID={`category-${cat.name.toLowerCase()}`}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.categoryColorDot, { backgroundColor: cat.color }]} />
                        <Text style={[
                          styles.pillText,
                          (cat.color === '#ffd600' || cat.color === '#FFC107') && category === cat.name
                            ? { color: '#222' }
                            : { color: category === cat.name ? '#fff' : '#555' },
                          { marginLeft: 6 }
                        ]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {/* Add Category Button */}
                    <TouchableOpacity
                      style={[styles.pill, styles.addCategoryButton]}
                      onPress={openAddCategoryModal}
                      accessibilityLabel="Add custom category"
                      accessibilityHint="Tap to add a new custom category"
                      accessibilityRole="button"
                      testID="button-add-category"
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add-circle-outline" size={24} color="#7c3aed" />
                    </TouchableOpacity>
                  </View>
                </ScrollView>
                {errors.category ? <Text style={styles.errorText} testID="error-category">{errors.category}</Text> : null}
              </Animated.View>

              {/* Add Category Modal */}
              <Modal
                visible={isAddCategoryModalVisible}
                animationType="fade"
                transparent
                onRequestClose={closeAddCategoryModal}
                accessibilityLabel="Add Category Modal"
                accessibilityHint="Modal dialog to add a new custom category"
                testID="modal-add-category"
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalBlur} />
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle} allowFontScaling={true}>Add Custom Category</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter category name"
                      value={newCategory}
                      onChangeText={setNewCategory}
                      maxLength={30}
                      autoFocus
                      accessibilityLabel="New Category Name Input"
                      accessibilityHint="Enter the name for your new category"
                      accessibilityRole="textbox"
                      testID="input-new-category"
                      allowFontScaling={true}
                    />
                    <Text style={styles.modalLabel} allowFontScaling={true}>Pick a color:</Text>
                    <View style={styles.colorPickerRow}>
                      {CATEGORY_COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorCircle,
                            { backgroundColor: color, borderWidth: categoryColor === color ? 3 : 0, borderColor: '#7c3aed' }
                          ]}
                          onPress={() => setCategoryColor(color)}
                          accessibilityLabel={`Pick color ${color}`}
                          accessibilityHint={`Select ${color} as the category color`}
                          accessibilityRole="button"
                          accessibilityState={{ selected: categoryColor === color }}
                          testID={`color-${color.replace('#', '')}`}
                          activeOpacity={0.85}
                        />
                      ))}
                    </View>
                    <View style={styles.modalButtonRow}>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={closeAddCategoryModal}
                        accessibilityLabel="Cancel Add Category"
                        accessibilityHint="Cancel adding a new category"
                        accessibilityRole="button"
                        testID="button-cancel-category"
                        activeOpacity={0.85}
                      >
                        <Text style={styles.modalButtonText} allowFontScaling={true}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonPrimary]}
                        onPress={handleAddCategory}
                        accessibilityLabel="Add Category"
                        accessibilityHint="Add this new category"
                        accessibilityRole="button"
                        testID="button-confirm-category"
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]} allowFontScaling={true}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    {isLoading && (
                      <View style={styles.modalLoadingOverlay}>
                        <ActivityIndicator size="large" color="#7c3aed" testID="modal-loading-indicator" />
                      </View>
                    )}
                  </View>
                </View>
              </Modal>

              {/* Notes Input */}
              <Animated.View style={styles.card} entering={FadeIn.delay(800).duration(500)}>
                <View style={styles.inputContainer}>
                  <Ionicons name="reader-outline" size={24} color="#7c3aed" style={styles.icon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Additional Notes (Optional)"
                    placeholderTextColor="#a3a3a3"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    accessibilityLabel="Additional Notes Input"
                    accessibilityHint="Add any extra notes for this task"
                    accessibilityRole="textbox"
                    testID="input-notes"
                    maxLength={1000}
                    allowFontScaling={true}
                  />
                </View>
              </Animated.View>

              {/* Save Task Button */}
              <Animated.View
                style={[
                  styles.saveButton,
                  (isSaveDisabled || isLoading) && styles.saveButtonDisabled,
                  animatedButtonStyle
                ]}
                entering={FadeIn.delay(900).duration(500)}
              >
                <LinearGradient
                  colors={isSaveDisabled ? ['#c7d2fe', '#c7d2fe'] : ['#7c3aed', '#6366f1']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={{ width: '100%', borderRadius: 32, alignItems: 'center', padding: 22 }}
                >
                  <TouchableOpacity
                    onPress={() => animateButtonPress(handleSaveTask)}
                    disabled={isSaveDisabled}
                    accessibilityLabel="Save Task Button"
                    accessibilityHint="Save this task"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isSaveDisabled }}
                    testID="button-save-task"
                    style={{ width: '100%', alignItems: 'center' }}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" accessibilityLabel="Loading indicator" testID="button-loading-indicator" />
                    ) : (
                      <Text style={styles.saveButtonText} allowFontScaling={true}>Save Task</Text>
                    )}
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {/* Floating New Task Button */}
      {showNewTaskButton && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowNewTaskButton(false)}
          accessibilityLabel="Add Another Task"
          accessibilityHint="Start adding a new task"
          accessibilityRole="button"
          testID="button-new-task"
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={styles.navbarContainer}>
        <Navbar />
      </View>
    </SafeAreaView>
  );
};

// --- Styles --- (Modernized)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 100,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  container: {
    flex: 1,
    padding: 22,
    paddingTop: 16,
    gap: 22,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#181c2f',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e7ef',
    marginVertical: 10,
    borderRadius: 1,
    opacity: 0.7,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 26,
    marginBottom: 0,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 0,
    marginHorizontal: 2,
  },
  inputGroup: {
    marginBottom: 18,
    gap: 2,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: '#232946',
    marginBottom: 8,
    marginLeft: 5,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f8',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 0,
    borderWidth: 0,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f8',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 0,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  icon: {
    marginRight: 14,
    color: '#7c3aed',
  },
  input: {
    flex: 1,
    color: '#232946',
    fontSize: 17,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    borderRadius: 12,
  },
  durationInput: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f8',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 0,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    minHeight: 54,
  },
  dateText: {
    color: '#232946',
    fontSize: 17,
    marginLeft: 10,
    fontWeight: '500',
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e0e7ef',
    marginRight: 10,
    marginBottom: 10,
    minHeight: 40,
    minWidth: 68,
    borderWidth: 0,
    elevation: 0,
    transitionDuration: '150ms',
  },
  pillActive: {
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  pillText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#232946',
    letterSpacing: 0.2,
  },
  pillTextActive: {
    color: '#fff',
  },
  categoryButton: {
    minWidth: 90,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addCategoryButton: {
    backgroundColor: '#f3f4f8',
    borderWidth: 2,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
    minHeight: 48,
    margin: 2,
    borderRadius: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35,41,70,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(8px)',
    zIndex: 1,
  },
  modalContent: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 34,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#232946',
    letterSpacing: 0.2,
  },
  modalInput: {
    width: '100%',
    borderWidth: 0,
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    marginBottom: 20,
    color: '#232946',
    backgroundColor: '#f3f4f8',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 12,
    marginLeft: 12,
    backgroundColor: '#e0e7ff',
  },
  modalButtonPrimary: {
    backgroundColor: '#7c3aed',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#232946',
    fontWeight: '600',
  },
  modalButtonPrimaryText: {
    color: '#fff',
  },
  saveButton: {
    borderRadius: 32,
    alignItems: 'center',
    marginTop: 40,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#c7d2fe',
    elevation: 1,
    shadowOpacity: 0.07,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 0.3,
  },
  navbarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  categoryScrollContainer: {
    flexGrow: 1,
    paddingRight: 10,
    gap: 6,
  },
  durationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: 'transparent',
  },
  durationLabel: {
    fontSize: 16,
    color: '#7c3aed',
    marginRight: 8,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    color: '#8a8fa3',
    marginBottom: 4,
    marginLeft: 5,
  },
  categoryColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#232946',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 1,
  },
  colorPickerRow: {
    flexDirection: 'row',
    marginVertical: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
    marginVertical: 6,
    borderColor: '#7c3aed',
  },
  modalLabel: {
    fontSize: 16,
    color: '#232946',
    marginBottom: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginBottom: 10,
    marginLeft: 8,
    fontWeight: '500',
  },
  modalLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    zIndex: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 28,
    backgroundColor: '#43a047',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#43a047',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  newTaskButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.2,
  },
});

export default AddTaskScreen;