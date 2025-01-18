import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type AddTaskScreenProps = {
  navigation: {
    goBack: () => void;
  };
};

const AddTaskScreen: React.FC<AddTaskScreenProps> = ({ navigation }) => {
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
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
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Task</Text>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.iconContainer} 
        onPress={() => router.back()} // Use router.back() to go back
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>


      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Task Name"
        value={taskName}
        onChangeText={setTaskName}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Task Description"
        value={taskDescription}
        onChangeText={setTaskDescription}
        multiline
      />
      
      <TextInput
        style={styles.input}
        placeholder="Due Date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={setDueDate}
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
        <Text style={styles.saveButtonText}>Save Task</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 8,
    borderRadius: 5,
  },
  iconContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 5,
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