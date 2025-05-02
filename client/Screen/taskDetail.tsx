import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, TextInput } from 'react-native'; // Added TextInput
import { useNavigation, useRoute } from '@react-navigation/native'; // Updated import
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/header';
import NavBar from '@/components/Navbar';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added AsyncStorage import

// Define types for the task structure
interface Task {
  taskId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const TaskDetail: React.FC = () => {
  const navigation = useNavigation(); // Replaced useRouter with useNavigation
  const route = useRoute();
  const { taskId } = route.params as { taskId: string }; // Extract taskId from route params
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [editedTitle, setEditedTitle] = useState(''); // State for edited title
  const [editedDescription, setEditedDescription] = useState(''); // State for edited description

  // Save task data to AsyncStorage
  const saveTaskToStorage = async (task: Task) => {
    try {
      await AsyncStorage.setItem(`task_${task.taskId}`, JSON.stringify(task));
    } catch (error) {
      console.error('Failed to save task to storage:', error);
    }
  };

  // Load task data from AsyncStorage
  const loadTaskFromStorage = async (taskId: string) => {
    try {
      const storedTask = await AsyncStorage.getItem(`task_${taskId}`);
      if (storedTask) {
        setTask(JSON.parse(storedTask));
      }
    } catch (error) {
      console.error('Failed to load task from storage:', error);
    }
  };

  // Simulate fetching task data based on taskId
  useEffect(() => {
    const fetchTask = async () => {
      try {
        await loadTaskFromStorage(taskId); // Load from AsyncStorage first
        const response = await axios.get(`http://localhost:8080/api/tasks/${taskId}`);
        const data = response.data;
        const TaskDetail: Task = {
          taskId: taskId,
          title: data.taskName,
          description: data.taskDescription,
          dueDate: data.deadline,
          completed: data.completed,
          priority: data.priority,
        };
        setTask(TaskDetail);
        await saveTaskToStorage(TaskDetail); // Save to AsyncStorage
      } catch (error) {
        console.error('Failed to fetch task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description);
    }
  }, [task]);

  const handleSaveEdit = async () => {
    if (task) {
      try {
        // Send the updated task details to the server
        await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
          taskName: editedTitle,
          taskDescription: editedDescription,
        });

        // Update the local state with the new task details
         const updatedTask = { ...task, title: editedTitle, description: editedDescription };
        setTask(updatedTask);
        await saveTaskToStorage(updatedTask); // Save updated task to AsyncStorage
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update task:', error);
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      }
    }
  };

  // Define colors based on priority
  const priorityColors = {
    low: '#8BC34A',
    medium: '#FFC107',
    high: '#F44336',
  };

  // Handle task completion toggle
  const handleToggleCompletion = async () => {
    if (task) {
      try {
        // Send the updated completion status to the server
        await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
          completed: !task.completed,
        });

        // Update the local state with the new completion status
        setTask({ ...task, completed: !task.completed });
      } catch (error) {
        console.error('Failed to toggle task completion:', error);
        Alert.alert('Error', 'Failed to update task completion status. Please try again.');
      }
    }
  };

  // Handle task deletion
  const handleDelete = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (task) {
              try {
                // Send a DELETE request to the server
                await axios.delete(`http://localhost:8080/api/tasks/${task.taskId}`);

                // Navigate back after successful deletion
                navigation.goBack();
              } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                  Alert.alert('Error', 'Task not found on the server.');
                } else {
                  console.error('Failed to delete task:', error);
                  Alert.alert('Error', 'Failed to delete the task. Please try again.');
                }
              }
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.taskContainer}>
          <Text style={styles.errorText}>Task not found!</Text>
        </View>
        <NavBar />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}> {/* Added SafeAreaView */}
      <View style={styles.container}>
        <Header />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()} // Navigate back to the previous screen
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
         
        </TouchableOpacity>
        <View style={styles.taskContainer}>
          <View style={styles.card}>
            {/* Task Title */}
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Edit Title"
              />
            ) : (
              <Text style={styles.title}>{task.title}</Text>
            )}

            {/* Task Description */}
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedDescription}
                onChangeText={setEditedDescription}
                placeholder="Edit Description"
                multiline
              />
            ) : (
              <Text style={styles.description}>{task.description}</Text>
            )}

            {/* Due Date */}
            <View style={styles.row}>
              <Ionicons name="calendar" size={20} color="#4CAF50" />
              <Text style={styles.dueDate}>Due: {task.dueDate}</Text>
            </View>

            {/* Priority */}
            <View style={styles.row}>
              <Ionicons name="alert-circle" size={20} color={priorityColors[task.priority]} />
              <Text style={[styles.priority, { color: priorityColors[task.priority] }]}>
                Priority: {task.priority}
              </Text>
            </View>

            {/* Completion Status */}
            <View style={styles.row}>
              <Ionicons
                name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={task.completed ? '#4CAF50' : '#999'}
              />
              <Text style={styles.completed}>Completed: {task.completed ? 'Yes' : 'No'}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={() => setIsEditing(true)}
                  >
                    <Text style={styles.buttonText}>Edit Task</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.completeButton]}
                    onPress={handleToggleCompletion}
                  >
                    <Text style={styles.buttonText}>
                      {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Text style={styles.buttonText}>Delete Task</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
        <NavBar />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Match the container background color
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContainer: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 18,
    marginBottom: 10,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dueDate: {
    fontSize: 16,
    marginLeft: 10,
    color: '#4CAF50',
  },
  priority: {
    fontSize: 16,
    marginLeft: 10,
  },
  completed: {
    fontSize: 16,
    marginLeft: 10,
    color: '#999',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 5,
    color: '#000',
  },
});

export default TaskDetail;