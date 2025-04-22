import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Animated, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import Header from '../components/header';
import Navbar from '../components/Navbar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import axios from 'axios';

interface Task {
  taskId?: number; // Add taskId as optional
  userId: number;
  taskName: string;
  taskDescription: string;
  priority: string;
  estimatedDuration: string;
  status: string;
  completed: boolean;
  category: string; 
  createdAt: string;
  deadline: string; // Add dueDate to Task interface
}

const AddTaskScreen: React.FC = () => {
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(moment().toISOString()); // Initialize with current date
  const [priority, setPriority] = useState<string>('low');
  const [status, setStatus] = useState<string>('Not Started'); // Use status for progress and task state
  const [estimatedDays, setEstimatedDays] = useState<string>(''); // New state for days
  const [estimatedHours, setEstimatedHours] = useState<string>(''); // New state for hours
  const [category, setCategory] = useState<string>(''); // New state for category
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const navigation = useNavigation(); // Use navigation hook
  const buttonScale = useRef(new Animated.Value(1)).current; // For button press animation

  const categories = ['Work', 'Personal', 'Shopping', 'Health']; // Define categories

  const handleNumericInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (/^\d*$/.test(value)) {
      setter(value); // Only set the value if it contains digits
    }
  };

  const handleSaveTask = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Haptic feedback

    try {
      const userId = await AsyncStorage.getItem('userId'); // Retrieve userId from AsyncStorage
      if (!userId) {
        throw new Error('User ID not found in AsyncStorage');
      }

      const estimatedDuration = `${estimatedDays || 0} days, ${estimatedHours || 0} hours`; // Combine days and hours

      // Validate required fields
      if (!taskName || !taskDescription || !priority || !estimatedDuration || !status || !category) {
        console.error('Validation failed: Missing required fields');
        return;
      }

      const newTask: Task = {
        userId: parseInt(userId, 10), // Ensure userId is a number
        taskName,
        taskDescription,
        priority: priority.charAt(0).toUpperCase() + priority.slice(1), // Capitalize priority
        estimatedDuration, // Include combined duration
        status, // Use status for progress
        completed: status === 'Completed', // Set completed based on status
        category, // Include selected category
        createdAt: moment().toISOString(), // Add createdAt field
        deadline: dueDate // Use initialized or updated dueDate
      };

      const response = await axios.post('http://localhost:8080/api/tasks', newTask);
      console.log('Task saved successfully:', response.data);

      // Navigate back to the previous screen after saving the task
      navigation.goBack();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    setDueDate(moment(date).toISOString()); // Save full ISO string with timezone
    hideDatePicker();
  };

  const priorityColors = {
    low: '#8BC34A',
    medium: '#FFC107',
    high: '#F44336',
  };

  const handlePriorityPress = (selectedPriority: 'low' | 'medium' | 'high') => {
    setPriority(selectedPriority);
  };

  const animateButtonPress = () => {
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
    ]).start();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <ScrollView
        contentContainerStyle={[styles.scrollViewContent, { paddingBottom: 100 }]} // Add paddingBottom to ensure button visibility
        keyboardShouldPersistTaps="handled" // Ensure taps on inputs and buttons work properly
      >
        <View style={styles.container}>
        
          <Text style={styles.title}>Create New Task</Text>

          {/* Task Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="clipboard-outline" size={24} color="black" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Task Name"
              placeholderTextColor="#aaa"
              value={taskName}
              onChangeText={setTaskName}
            />
          </View>

          {/* Task Description Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={24} color="black" style={styles.icon} />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Task Description"
              placeholderTextColor="#aaa"
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
            />
          </View>

          {/* Estimated Duration Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="time-outline" size={24} color="black" style={styles.icon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Days"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={estimatedDays}
              onChangeText={(value) => handleNumericInput(value, setEstimatedDays)}
            />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 10 }]}
              placeholder="Hours"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={estimatedHours}
              onChangeText={(value) => handleNumericInput(value, setEstimatedHours)}
            />
          </View>

          {/* Status Selector */}
          <View style={styles.inputContainer}>
            <Ionicons name="stats-chart-outline" size={24} color="black" style={styles.icon} />
            <View style={styles.statusButtons}>
              {['Not Started', 'In Progress', 'Completed'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.statusButton,
                    { backgroundColor: status === option ? '#6a11cb' : '#ccc' },
                  ]}
                  onPress={() => setStatus(option)}
                >
                  <Text style={styles.statusButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date Picker */}
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={24} color="black" style={styles.icon} />
            <TouchableOpacity onPress={showDatePicker} style={styles.dateInput}>
              <Text style={styles.dateText}>
                {dueDate ? moment(dueDate).format('MMMM Do YYYY') : 'Select Due Date'} {/* Format dueDate for display */}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
            />
          </View>

          {/* Priority Selector */}
          <View style={styles.priorityContainer}>
            <Text style={styles.priorityLabel}>Priority:</Text>
            <View style={styles.priorityButtons}>
              {Object.entries(priorityColors).map(([key, color]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.priorityButton,
                    { backgroundColor: color, opacity: priority === key ? 1 : 0.3 },
                  ]}
                  onPress={() => handlePriorityPress(key)}
                >
                  <Text style={styles.priorityButtonText}>{key.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.inputContainer}>
            <Ionicons name="list-outline" size={24} color="black" style={styles.icon} />
            <View style={styles.categoryButtons}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    { backgroundColor: category === cat ? '#6a11cb' : '#ccc' },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.categoryButtonText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Task Button */}
          <TouchableOpacity
            onPress={() => {
              animateButtonPress();
              handleSaveTask();
            }}
            style={styles.saveButton}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Text style={styles.saveButtonText}>Save Task</Text>
            </Animated.View>
          </TouchableOpacity>
         
        </View>
      
       
      </ScrollView>
      <Navbar />
    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100, // Add paddingBottom to ensure button visibility
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 16,
  },
  dateInput: {
    flex: 1,
    justifyContent: 'center',
  },
  dateText: {
    color: '#333',
    fontSize: 16,
  },
  priorityContainer: {
    marginBottom: 20,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#6a11cb',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20, // Add marginBottom to create space below the button
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  categoryButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AddTaskScreen;