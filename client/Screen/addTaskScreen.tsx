import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  Alert, // Import Alert
  ActivityIndicator, // Import ActivityIndicator for loading state
  Keyboard, // Import Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment'; // Consider date-fns for smaller bundle size if needed
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Import custom components (assuming they exist)
import Header from '../components/header'; // Adjust path if needed
import Navbar from '../components/Navbar'; // Adjust path if needed

// --- Constants ---
const BASE_API_URL = 'http://localhost:8080/api'; // Use a constant for the base URL
const CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health', 'Other']; // Define categories centrally
const PRIORITY_COLORS = {
  low: '#8BC34A',
  medium: '#FFC107',
  high: '#F44336',
};
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];

// --- Interfaces ---
interface Task {
  taskId?: number;
  userId: number;
  taskName: string;
  taskDescription: string;
  priority: 'low' | 'medium' | 'high'; // Use specific types
  estimatedDuration: string;
  status: string;
  completed: boolean;
  category: string;
  createdAt: string;
  deadline: string;
  notes: string;
}

const AddTaskScreen: React.FC = () => {
  // --- State ---
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(moment().toISOString());
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low'); // Enforce type
  const [status, setStatus] = useState<string>('Not Started');
  const [estimatedDays, setEstimatedDays] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [notes, setNotes] = useState<string>(''); // Add notes state
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for API call
  const [userId, setUserId] = useState<number | null>(null); // Store userId

  const navigation = useNavigation();
  const buttonScale = useRef(new Animated.Value(1)).current;

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
  }, [navigation]);

  // --- Input Handlers ---
  const handleNumericInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    // Allow only digits or empty string (for clearing)
    if (/^\d*$/.test(value)) {
      setter(value);
    }
  };

  // --- Date Picker ---
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date: Date) => {
    setDueDate(moment(date).toISOString());
    hideDatePicker();
  };

  // --- Validation ---
  const validateInput = (): boolean => {
    if (!taskName.trim()) {
      Alert.alert('Validation Error', 'Task Name is required.');
      return false;
    }
    if (!taskDescription.trim()) {
      Alert.alert('Validation Error', 'Task Description is required.');
      return false;
    }
    // Basic check for duration - ensure at least one is entered if needed, or specific format
    // if (!estimatedDays && !estimatedHours) {
    //   Alert.alert('Validation Error', 'Please enter an estimated duration.');
    //   return false;
    // }
     if (!category) {
       Alert.alert('Validation Error', 'Please select a category.');
       return false;
     }
    if (!dueDate) {
      Alert.alert('Validation Error', 'Please select a due date.');
      return false;
    }
    // Add more specific validation if needed (e.g., date not in the past)
    return true;
  };

  // --- Button Animation ---
  const animateButtonPress = (callback?: () => void) => {
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
    ]).start(callback); // Execute callback after animation completes
  };

  // --- Save Task Logic ---
  const handleSaveTask = async () => {
    Keyboard.dismiss(); // Dismiss keyboard before potentially showing alerts
    if (!validateInput() || !userId) {
        if (!userId) Alert.alert('Error', 'User not identified. Cannot save task.');
        return; // Stop if validation fails or userId is missing
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true); // Start loading indicator

    // Combine days and hours, defaulting to '0' if empty
    const estimatedDuration = `${estimatedDays || '0'} days, ${estimatedHours || '0'} hours`;

    const newTask: Omit<Task, 'taskId' | 'createdAt'> & { createdAt?: string } = { // Omit fields set by backend potentially
      userId: userId, // Use state userId
      taskName: taskName.trim(),
      taskDescription: taskDescription.trim(),
      priority, // Already typed correctly
      estimatedDuration,
      status,
      completed: status === 'Completed',
      category,
      deadline: dueDate,
      notes: notes.trim(),
      // Let backend handle createdAt ideally, but keep if required by current API
      // createdAt: moment().toISOString(),
    };

    try {
      const response = await axios.post(`${BASE_API_URL}/tasks`, newTask);
      console.log('Task saved successfully:', response.data);

      Alert.alert('Success', 'Task added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }, // Navigate back on OK
      ]);
    } catch (error: any) {
      console.error('Error saving task:', error);
      // Provide more specific error feedback if possible
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
      Alert.alert('Error Saving Task', `Failed to save the task. ${errorMessage}`);
    } finally {
      setIsLoading(false); // Stop loading indicator regardless of success/failure
    }
  };

  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false} // Hide scrollbar if preferred
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create New Task</Text>

          {/* Task Name */}
          <View style={styles.inputContainer}>
            <Ionicons name="clipboard-outline" size={22} color="#555" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Task Name *"
              placeholderTextColor="#aaa"
              value={taskName}
              onChangeText={setTaskName}
              accessibilityLabel="Task Name Input"
              maxLength={100} // Add max length
            />
          </View>

          {/* Task Description */}
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={22} color="#555" style={styles.icon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Task Description *"
              placeholderTextColor="#aaa"
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
              numberOfLines={4} // Suggest initial height
              accessibilityLabel="Task Description Input"
              maxLength={500} // Add max length
            />
          </View>

          {/* Estimated Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Duration:</Text>
            <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={22} color="#555" style={styles.icon} />
                <TextInput
                style={[styles.input, styles.durationInput]}
                placeholder="Days"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={estimatedDays}
                onChangeText={(value) => handleNumericInput(value, setEstimatedDays)}
                accessibilityLabel="Estimated duration in days"
                />
                <TextInput
                style={[styles.input, styles.durationInput]}
                placeholder="Hours"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={estimatedHours}
                onChangeText={(value) => handleNumericInput(value, setEstimatedHours)}
                accessibilityLabel="Estimated duration in hours"
                />
            </View>
          </View>

          {/* Status Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status:</Text>
             <View style={styles.segmentedControl}>
               {STATUS_OPTIONS.map((option) => (
                 <TouchableOpacity
                   key={option}
                   style={[
                     styles.segmentButton,
                     { backgroundColor: status === option ? '#6a11cb' : '#eee' },
                   ]}
                   onPress={() => setStatus(option)}
                   accessibilityLabel={`Set status to ${option}`}
                   accessibilityState={{ selected: status === option }}
                 >
                   <Text style={[styles.segmentButtonText, { color: status === option ? '#fff' : '#555'}]}>{option}</Text>
                 </TouchableOpacity>
               ))}
             </View>
          </View>

          {/* Due Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date *:</Text>
            <TouchableOpacity onPress={showDatePicker} style={styles.dateInputContainer} accessibilityLabel="Select Due Date Button">
                <Ionicons name="calendar-outline" size={22} color="#555" style={styles.icon} />
                <Text style={styles.dateText}>
                {dueDate ? moment(dueDate).format('MMMM D, YYYY') : 'Select Date'}
                </Text>
            </TouchableOpacity>
          </View>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            date={dueDate ? new Date(dueDate) : new Date()} // Set initial date
            minimumDate={new Date()} // Optional: Prevent selecting past dates
            onConfirm={handleConfirmDate}
            onCancel={hideDatePicker}
          />

          {/* Priority Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority:</Text>
             <View style={styles.segmentedControl}>
               {(Object.keys(PRIORITY_COLORS) as Array<keyof typeof PRIORITY_COLORS>).map((key) => (
                 <TouchableOpacity
                   key={key}
                   style={[
                     styles.segmentButton,
                     { backgroundColor: PRIORITY_COLORS[key], opacity: priority === key ? 1 : 0.5 }, // More distinct opacity
                   ]}
                   onPress={() => setPriority(key)}
                   accessibilityLabel={`Set priority to ${key}`}
                   accessibilityState={{ selected: priority === key }}
                 >
                   <Text style={styles.segmentButtonText}>{key.toUpperCase()}</Text>
                 </TouchableOpacity>
               ))}
             </View>
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
             <Text style={styles.label}>Category *:</Text>
             <View style={styles.segmentedControl}>
               {CATEGORIES.map((cat) => (
                 <TouchableOpacity
                   key={cat}
                   style={[
                     styles.segmentButton, // Reuse segment style
                     { backgroundColor: category === cat ? '#6a11cb' : '#eee' },
                     styles.categoryButton, // Add specific category styles if needed
                   ]}
                   onPress={() => setCategory(cat)}
                   accessibilityLabel={`Set category to ${cat}`}
                   accessibilityState={{ selected: category === cat }}
                 >
                   <Text style={[styles.segmentButtonText, { color: category === cat ? '#fff' : '#555'}]}>{cat}</Text>
                 </TouchableOpacity>
               ))}
             </View>
           </View>

           {/* Notes Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="reader-outline" size={22} color="#555" style={styles.icon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional Notes (Optional)"
              placeholderTextColor="#aaa"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              accessibilityLabel="Additional Notes Input"
              maxLength={1000}
            />
          </View>

          {/* Save Task Button */}
          <TouchableOpacity
            onPress={() => animateButtonPress(handleSaveTask)} // Pass handleSaveTask as callback
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} // Style changes when loading
            disabled={isLoading} // Disable button when loading
            accessibilityLabel="Save Task Button"
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" /> // Show loader
              ) : (
                <Text style={styles.saveButtonText}>Save Task</Text>
              )}
            </Animated.View>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Navbar remains absolutely positioned */}
      <View style={styles.navbarContainer}>
        <Navbar />
      </View>

    </SafeAreaView>
  );
};

// --- Styles --- (Refined and organized)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 100, // Ensure space for absolute Navbar + save button
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100, // Ensure enough space for the absolute Navbar + save button
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26, // Slightly smaller
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
    textAlign: 'center',
  },
  inputGroup: {
      marginBottom: 20, // Consistent spacing
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginBottom: 8,
    marginLeft: 5, // Align with input fields visually
  },
  inputContainer: { // For single text inputs
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12, // Slightly rounder
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd', // Subtle border
  },
  durationContainer: { // Container specific for duration inputs
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 0, // Vertical padding handled by input itself
    borderWidth: 1,
    borderColor: '#ddd',
  },
  icon: {
    marginRight: 10,
    color: '#666', // Softer icon color
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 16,
    paddingVertical: 8, // Add vertical padding inside input
  },
  textArea: {
    height: 100, // Default height
    textAlignVertical: 'top', // Align text to top
    paddingTop: 12, // Adjust padding for multiline
  },
  durationInput: {
      flex: 1,
      marginHorizontal: 5, // Space between day/hour inputs
  },
  dateInputContainer: { // Specific style for date touchable
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12, // Consistent padding
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 50, // Ensure consistent height
  },
  dateText: {
    color: '#333',
    fontSize: 16,
    marginLeft: 5, // Space from icon
  },
  segmentedControl: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute evenly
    backgroundColor: '#eee', // Background for the container
    borderRadius: 10,
    overflow: 'hidden', // Clip children to rounded corners
    marginTop: 5, // Space from label
  },
  segmentButton: {
    flex: 1, // Make buttons fill space
    paddingVertical: 12, // Consistent padding
    paddingHorizontal: 5, // Horizontal padding for text
    borderRadius: 8, // Slightly rounded inner buttons (visual only if needed, outer container handles clipping)
    margin: 2, // Create separation with background visible
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonText: {
    fontWeight: 'bold',
    fontSize: 13, // Slightly smaller text
    textAlign: 'center',
    color: '#fff', // Default text color for selected/priority
  },
  categoryButton: {
     // Add specific styles here if needed, e.g., minWidth
     minWidth: 80, // Ensure categories aren't too squished
  },
  saveButton: {
    backgroundColor: '#6a11cb', // Primary action color
    padding: 16, // Slightly larger padding
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 25, // More space before save button
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
   saveButtonDisabled: {
     backgroundColor: '#b39ddb', // Lighter shade when disabled
     elevation: 2, // Reduced elevation
     shadowOpacity: 0.1,
   },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  navbarContainer: {
    position: 'absolute',
    bottom: 0, // Stick exactly to the bottom
    left: 0,
    right: 0,
    // Ensure Navbar has its own background if needed
    // backgroundColor: 'white', // Example
    // borderTopWidth: 1, // Example
    // borderTopColor: '#eee', // Example
  },
});

export default AddTaskScreen;