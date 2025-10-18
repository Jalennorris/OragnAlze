import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import  { FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import Animated from 'react-native-reanimated'; // <-- Add this line
import { runOnJS } from 'react-native-reanimated';

// Import custom components (assuming they exist)
import Header from '../components/header'; // Adjust path if needed
import Navbar from '../components/Navbar'; // Adjust path if needed

// Add a simple color picker (array of color hex codes)
const CATEGORY_COLORS = ['#6a11cb', '#ff9800', '#43a047', '#e91e63', '#00bcd4', '#f44336', '#9c27b0', '#607d8b', '#ffd600', '#795548'];

const DARK_COLORS = {
  background: '#18181b',
  card: '#232336',
  accent: '#818cf8',    // Indigo
  accent2: '#fbbf24',   // Amber
  accent3: '#34d399',   // Emerald
  text: '#f3f4f6',
  muted: '#a1a1aa',
  border: '#232336',
  input: '#232336',
  placeholder: '#52525b',
  error: '#f87171',
  pill: '#232336',
  pillActive: '#818cf8',
  pillText: '#f3f4f6',
  pillTextActive: '#18181b',
  divider: '#232336',
  success: '#34d399',
};

const LIGHT_COLORS = {
  background: '#f8fafc',
  card: '#fff',
  accent: '#7c3aed',
  accent2: '#6366f1',
  accent3: '#43cea2',
  text: '#181c2f',
  muted: '#8a8fa3',
  border: '#e0e7ef',
  input: '#f3f4f8',
  placeholder: '#a3a3a3',
  error: '#F44336',
  pill: '#e0e7ef',
  pillActive: '#7c3aed',
  pillText: '#232946',
  pillTextActive: '#fff',
  divider: '#e0e7ef',
  success: '#43cea2',
};

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
  [Priority.Low]: '#34d399',     // Emerald
  [Priority.Medium]: '#fbbf24',  // Amber
  [Priority.High]: '#f87171',    // Red
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
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [estimateDays, setEstimateDays] = React.useState<string>('0');
  const [estimateHours, setEstimateHours] = React.useState<string>('0');
  const [EstimatedApplied, setEstimatedApplied] = React.useState<boolean>(false);


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

  useEffect(() => {
    const getColorScheme = async () => {
      try {
        const storedDarkMode = await AsyncStorage.getItem('darkMode');
        setColorScheme(storedDarkMode && JSON.parse(storedDarkMode) ? 'dark' : 'light');
      } catch {
        setColorScheme('light');
      }
    };
    getColorScheme();
    // Listen for navigation focus to update dark mode immediately after settings change
    const unsubscribe = navigation.addListener?.('focus', getColorScheme);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigation]);

  const COLORS = colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  // --- Input Handlers (useCallback) ---



const safeInt = (v: string) => {
  const n = parseInt(v,10);
  return  Number.isFinite(n) ? n : 0;
}



const normalizeDuration = (days: number, hours: number ) => {
  const extraDays = Math.floor(hours / 24);
  const normalizedHours = hours % 24;
  return{days: days + extraDays, hours: normalizedHours};

}


const addDurationToIso = (iso: string, days: number, hours : number) =>{
  const base = new Date(iso);
  const {days: d, hours: h} = normalizeDuration(days, hours);
  const result = new Date(base);
  result.setDate(result.getDate() + d)

  result.setHours(result.getHours() + h);
  return result.toISOString();
}

const estimatedDuePreview = React.useMemo(() => {
  const d = parseInt(estimateDays || '0', 10);
  const h = parseInt(estimateHours || '0', 10)

  if(!dueDate) return undefined;
  try {
    return addDurationToIso(dueDate, d, h)
  } catch (error) {
    return undefined
    
  }
}, [estimateDays, estimateHours,dueDate])

const applyEstimateToDue = React.useCallback(() => {
  const d = parseInt(estimateDays || '0', 10);
  const h = parseInt(estimateHours || '0', 10);
  const safeD = Number.isNaN(d) ? 0 : d;
  const safeH = Number.isNaN(h) ? 0 : h;
  
  const baseIso = dueDate || new Date().toISOString();
  try {
    const newIso = addDurationToIso(baseIso, safeD, safeH);
    setDueDate(newIso);
    setEstimatedApplied(true);
  } catch (e) {
    // optional: handle invalid date error (toast/log)
  }
}, [estimateDays, estimateHours, dueDate, setDueDate]);

const resetEstimate = React.useCallback(() => {
  setEstimateDays('0');
  setEstimateHours('0');
  setEstimatedApplied(false);
},[setEstimateDays, setEstimateHours, setEstimatedApplied]);


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
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 50 }),
      withTiming(1, { duration: 100 }, (finished) => {
        if (finished && callback) {
          runOnJS(callback)();
        }
      })
    );
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <LinearGradient
        colors={colorScheme === 'dark' ? [COLORS.background, COLORS.card, COLORS.background] : ['#f8fafc', '#e0e7ff', '#f8fafc']}
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
            contentContainerStyle={[styles.scrollViewContent, { backgroundColor: COLORS.background }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.container, { backgroundColor: COLORS.background }]}>
              <Animated.View entering={FadeIn.duration(600)}>
                <Text style={[styles.title, { color: COLORS.text }]}>Create a New Task</Text>
                <Text style={[styles.subtitle, { color: COLORS.accent }]}>Organize your day with clarity and style</Text>
              </Animated.View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: COLORS.divider }]} />

              {/* Task Name */}
              <Animated.View style={[styles.card, { backgroundColor: COLORS.card }]} entering={FadeIn.delay(100).duration(500)}>
                <View style={styles.inputContainer}>
                  <Ionicons name="clipboard-outline" size={24} color={COLORS.accent} style={styles.icon} />
                  <TextInput
                    ref={taskNameRef}
                    style={[styles.input, { color: COLORS.text, backgroundColor: COLORS.input }]}
                    placeholder="Task Name *"
                    placeholderTextColor={COLORS.placeholder}
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
                {errors.taskName ? <Text style={[styles.errorText, { color: COLORS.error }]} testID="error-task-name">{errors.taskName}</Text> : null}
              </Animated.View>

              {/* Task Description */}
              <Animated.View style={[styles.card, { backgroundColor: COLORS.card }]} entering={FadeIn.delay(200).duration(500)}>
                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={24} color={COLORS.accent} style={styles.icon} />
                  <TextInput
                    style={[styles.input, styles.textArea, { color: COLORS.text, backgroundColor: COLORS.input }]}
                    placeholder="Task Description *"
                    placeholderTextColor={COLORS.placeholder}
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
                {errors.taskDescription ? <Text style={[styles.errorText, { color: COLORS.error }]} testID="error-task-desc">{errors.taskDescription}</Text> : null}
              </Animated.View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: COLORS.divider }]} />

              {/* Estimated Duration */}
              <Animated.View style={[styles.card, { backgroundColor: COLORS.card }]} entering={FadeIn.delay(300).duration(500)}>
                <Text style={[styles.label, { color: COLORS.text }]}>Estimated Duration</Text>
                <Text style={[styles.helpText, { color: COLORS.muted }]}>How long do you expect this task to take?</Text>
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={22} color={COLORS.accent} style={styles.icon} />
                  <View style={styles.durationInputWrapper}>
                    <TextInput
                      style={[styles.input, styles.durationInput, { color: COLORS.text, backgroundColor: COLORS.input }]}
                      placeholder="Days"
                      placeholderTextColor={COLORS.placeholder}
                      keyboardType="numeric"
                      value={estimateDays}
                      onChangeText={(value) => handleNumericInput(value, setEstimateDays)}
                      accessibilityLabel="Estimated duration in days"
                      accessibilityHint="Enter the number of days estimated for this task"
                      allowFontScaling={true}
                    />
                    <Text style={[styles.durationLabel, { color: COLORS.accent }]} allowFontScaling={true}>days</Text>
                  </View>

                  <View style={styles.durationInputWrapper}>
                    <TextInput
                      style={[styles.input, styles.durationInput, { color: COLORS.text, backgroundColor: COLORS.input }]}
                      placeholder="Hours"
                      placeholderTextColor={COLORS.placeholder}
                      keyboardType="numeric"
                      value={estimateHours}
                      onChangeText={(value) => handleNumericInput(value, setEstimateHours)}
                      accessibilityLabel="Estimated duration in hours"
                      accessibilityHint="Enter the number of hours estimated for this task"
                      allowFontScaling={true}
                    />
                    <Text style={[styles.durationLabel, { color: COLORS.accent }]} allowFontScaling={true}>hours</Text>
                  </View>
                </View>
                <View  style= {styles.preViewDuration}> 
                <Text style={styles.preViewDurationText}>
                    Preview: {estimatedDuePreview ? new Date(estimatedDuePreview).toLocaleString() : 'N/A'} {' '}
                </Text>
                {EstimatedApplied === false  ? (
                <TouchableOpacity onPress={applyEstimateToDue} style={styles.preViewDurationButton} >
                    <Text style={styles.preViewDurationApplyText}>Apply Estimate</Text>
                </TouchableOpacity>
                ) : 
                (
                  <TouchableOpacity onPress={resetEstimate} style={styles.preViewDurationResetButton} > 
                    <Text style={styles.preViewDurationApplyText}>Reset Estimate</Text>
                  </TouchableOpacity>
                )
                    }
                </View>
              </Animated.View>

              {/* Status Selector */}
              <Animated.View style={[styles.card, { backgroundColor: COLORS.card }]} entering={FadeIn.delay(400).duration(500)}>
                <Text style={[styles.label, { color: COLORS.text }]}>Status</Text>
                <View style={styles.pillGroup}>
                  {STATUS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.pill,
                        { backgroundColor: COLORS.pill },
                        status === option && [styles.pillActive, { backgroundColor: COLORS.pillActive }],
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
                        { color: COLORS.pillText },
                        status === option && [styles.pillTextActive, { color: COLORS.pillTextActive }]
                      ]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: COLORS.divider }]} />

              {/* Due Date Picker */}
              <Animated.View style={[styles.card, { backgroundColor: COLORS.card }]} entering={FadeIn.delay(500).duration(500)}>
                <Text style={[styles.label, { color: COLORS.text }]}>Due Date *</Text>
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
                  <Ionicons name="calendar-outline" size={22} color={COLORS.accent} style={styles.icon} />
                  <Text style={[styles.dateText, { color: COLORS.text }]} allowFontScaling={true}>
                    {dueDate ? format(new Date(dueDate), 'MMMM d, yyyy') : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {errors.dueDate ? <Text style={[styles.errorText, { color: COLORS.error }]} testID="error-due-date">{errors.dueDate}</Text> : null}
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
              <Animated.View style={[styles.card, { backgroundColor: COLORS.card }]} entering={FadeIn.delay(600).duration(500)}>
                <Text style={[styles.label, { color: COLORS.text }]}>Priority</Text>
                <Text style={[styles.helpText, { color: COLORS.muted }]}>Set how important or urgent this task is.</Text>
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
              <View style={[styles.divider, { backgroundColor: COLORS.divider }]} />

              {/* Category Selector */}
              <Animated.View style={[styles.card, { backgroundColor: COLORS.card }]} entering={FadeIn.delay(700).duration(500)}>
                <Text style={[styles.label, { color: COLORS.text }]}>Category *</Text>
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
                      style={[styles.pill, styles.addCategoryButton, { backgroundColor: COLORS.input, borderColor: COLORS.accent }]}
                      onPress={openAddCategoryModal}
                      accessibilityLabel="Add custom category"
                      accessibilityHint="Tap to add a new custom category"
                      accessibilityRole="button"
                      testID="button-add-category"
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add-circle-outline" size={24} color={COLORS.accent} />
                    </TouchableOpacity>
                  </View>
                </ScrollView>
                {errors.category ? <Text style={[styles.errorText, { color: COLORS.error }]} testID="error-category">{errors.category}</Text> : null}
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
                  <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
                    <Text style={[styles.modalTitle, { color: COLORS.text }]} allowFontScaling={true}>Add Custom Category</Text>
                    <TextInput
                      style={[styles.modalInput, { color: COLORS.text, backgroundColor: COLORS.input }]}
                      placeholder="Enter category name"
                      placeholderTextColor={COLORS.placeholder}
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
                    <Text style={[styles.modalLabel, { color: COLORS.text }]} allowFontScaling={true}>Pick a color:</Text>
                    <View style={styles.colorPickerRow}>
                      {CATEGORY_COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorCircle,
                            { backgroundColor: color, borderWidth: categoryColor === color ? 3 : 0, borderColor: COLORS.accent }
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
                        style={[styles.modalButton, { backgroundColor: COLORS.input }]}
                        onPress={closeAddCategoryModal}
                        accessibilityLabel="Cancel Add Category"
                        accessibilityHint="Cancel adding a new category"
                        accessibilityRole="button"
                        testID="button-cancel-category"
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.modalButtonText, { color: COLORS.text }]} allowFontScaling={true}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: COLORS.accent }]}
                        onPress={handleAddCategory}
                        accessibilityLabel="Add Category"
                        accessibilityHint="Add this new category"
                        accessibilityRole="button"
                        testID="button-confirm-category"
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText, { color: COLORS.pillTextActive }]} allowFontScaling={true}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    {isLoading && (
                      <View style={styles.modalLoadingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.accent} testID="modal-loading-indicator" />
                      </View>
                    )}
                  </View>
                </View>
              </Modal>

              {/* Notes Input */}
              <Animated.View style={[styles.card, { backgroundColor: COLORS.card }]} entering={FadeIn.delay(800).duration(500)}>
                <View style={styles.inputContainer}>
                  <Ionicons name="reader-outline" size={24} color={COLORS.accent} style={styles.icon} />
                  <TextInput
                    style={[styles.input, styles.textArea, { color: COLORS.text, backgroundColor: COLORS.input }]}
                    placeholder="Additional Notes (Optional)"
                    placeholderTextColor={COLORS.placeholder}
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
                  colors={isSaveDisabled ? [COLORS.divider, COLORS.divider] : [COLORS.accent, COLORS.accent2]}
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

     
      <View style={styles.navbarContainer}>
     
      </View>
      <Navbar />
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
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
    borderRadius: 1,
    opacity: 0.7,
  },
  card: {
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
    marginBottom: 8,
    marginLeft: 5,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  input: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 8,
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
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 10,
    marginBottom: 10,
    minHeight: 40,
    minWidth: 68,
    borderWidth: 0,
    elevation: 0,
  },
  pillActive: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  pillText: {
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  pillTextActive: {},
  categoryButton: {
    minWidth: 90,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addCategoryButton: {
    borderWidth: 2,
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
    zIndex: 1,
  },
  modalContent: {
    width: '92%',
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
    letterSpacing: 0.2,
  },
  modalInput: {
    width: '100%',
    borderWidth: 0,
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    marginBottom: 20,
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
  },
  modalButtonPrimary: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimaryText: {},
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
    elevation: 1,
    shadowOpacity: 0.07,
  },
  saveButtonText: {
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
  preViewDuration: {
    marginTop: 40,
    flexDirection: 'column',
    alignItems: 'center',
    
    

  },
  preViewDurationText: {
    marginBottom: 12,
    fontSize: 15,
    fontWeight: '500',
    
  },
  preViewDurationApplyText: {
  textAlign: 'center',  
    fontSize: 14,
    fontWeight: '500',
    
  },
  preViewDurationButton: {
    backgroundColor:  '#6366f1',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 20,
    
  },
  preViewDurationResetButton: {

    backgroundColor: '#dc2626',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 20,
    height: 45
    
  },
  durationLabel: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 5,
  },
  categoryColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 2,
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
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  errorText: {
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
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.2,
  },
});

export default AddTaskScreen;