import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';

const AddTaskScreen: React.FC = () => {
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const router = useRouter();

  const handleSaveTask = () => {
    const newTask = {
      id: Math.random().toString(), // Generate a unique id (for demonstration)
      title: taskName,
      description: taskDescription,
      dueDate: dueDate,
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

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>Add Task</Text>
        <TouchableOpacity onPress={handleSaveTask}>
          <Ionicons name="checkmark" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Create New Task</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="clipboard-outline" size={20} color="white" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Task Name"
            placeholderTextColor="#aaa"
            value={taskName}
            onChangeText={setTaskName}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="document-text-outline" size={20} color="white" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Task Description"
            placeholderTextColor="#aaa"
            value={taskDescription}
            onChangeText={setTaskDescription}
            multiline
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="calendar-outline" size={20} color="white" style={styles.icon} />
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1e88e5',
  },
  navbarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    color: 'white',
  },
  dateInput: {
    flex: 1,
    justifyContent: 'center',
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
  },
  dateText: {
    color: 'white',
  },
});

export default AddTaskScreen;
