import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import Header from '../components/header';
import Navbar from '../components/Navbar';
import * as Haptics from 'expo-haptics';

const AddTaskScreen: React.FC = () => {
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<string>('low');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const router = useRouter();
  const buttonScale = new Animated.Value(1); // For button press animation

  const handleSaveTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Haptic feedback
    const newTask = {
      id: Math.random().toString(),
      title: taskName,
      description: taskDescription,
      dueDate: dueDate,
      priority: priority,
    };

    console.log('New task created:', newTask);

    // Navigate back to the Home screen after saving the task
    router.back();
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    setDueDate(moment(date).format('YYYY-MM-DD'));
    hideDatePicker();
  };

  const priorityColors = {
    low: '#8BC34A',
    medium: '#FFC107',
    high: '#F44336',
  };

  const handlePriorityPress = (selectedPriority: string) => {
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
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Create New Task</Text>

        {/* Task Name Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="clipboard-outline" size={24} color="#6a11cb" style={styles.icon} />
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
          <Ionicons name="document-text-outline" size={24} color="#6a11cb" style={styles.icon} />
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Task Description"
            placeholderTextColor="#aaa"
            value={taskDescription}
            onChangeText={setTaskDescription}
            multiline
          />
        </View>

        {/* Due Date Picker */}
        <View style={styles.inputContainer}>
          <Ionicons name="calendar-outline" size={24} color="#6a11cb" style={styles.icon} />
          <TouchableOpacity onPress={showDatePicker} style={styles.dateInput}>
            <Text style={styles.dateText}>
              {dueDate ? dueDate : 'Select Due Date'}
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
      </ScrollView>
      <Navbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
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
});

export default AddTaskScreen;