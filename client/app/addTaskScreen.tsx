import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Picker } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import Header from '../components/header';
import Navbar from '../components/Navbar';

const AddTaskScreen: React.FC = () => {
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<string>('low');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const router = useRouter();

  const handleSaveTask = () => {
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

  const handleColorPicker = (priority: string) => {
    setPriority(priority);
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Create New Task</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="clipboard-outline" size={20} color="black" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Task Name"
            placeholderTextColor="#aaa"
            value={taskName}
            onChangeText={setTaskName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="document-text-outline" size={20} color="black" style={styles.icon} />
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
          <Ionicons name="calendar-outline" size={20} color="black" style={styles.icon} />
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

        <View style={styles.inputContainer}>
          <Ionicons name="alert-outline" size={20} color="black" style={styles.icon} />
          <Picker
            selectedValue={priority}
            style={styles.picker}
            onValueChange={(itemValue) => handleColorPicker(itemValue)}
          >
            <Picker.Item label="Low" value="low" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="High" value="high" />
          </Picker>
        </View>

        <TouchableOpacity onPress={handleSaveTask} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Task</Text>
        </TouchableOpacity>
      </ScrollView>
      <Navbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'black',
  },
  icon: {
    marginRight: 10,
    color: 'black',
  },
  input: {
    flex: 1,
    height: 40,
    color: 'black',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
  },
  dateInput: {
    flex: 1,
    justifyContent: 'center',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
  },
  dateText: {
    color: 'black',
  },
  picker: {
    flex: 1,
    color: 'black',
  },
  saveButton: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddTaskScreen;