import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/header';
import NavBar from '@/components/Navbar';

// Define types for the task structure
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const TaskDetail: React.FC = () => {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);



  // Simulate fetching task data based on taskId
  useEffect(() => {
    const fetchTask = async () => {
      try {


       const response = await axios.get(`http://localhost:8080/api/tasks/${taskId}`);
       const data =response.data;
        const TaskDetail: Task = {
          id: taskId,
          title: data.taskName,
          description: data.taskDescription,
          dueDate: data.deadline,
          completed: data.completed,
          priority: data.priority,
        };
        setTask(TaskDetail);
      } catch (error) {
        console.error('Failed to fetch task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  // Define colors based on priority
  const priorityColors = {
    low: '#8BC34A',
    medium: '#FFC107',
    high: '#F44336',
  };

  // Handle task completion toggle
  const handleToggleCompletion = () => {
    if (task) {
      setTask({ ...task, completed: !task.completed });
    }
  };

  // Handle task deletion
  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Simulate task deletion
            router.back();
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
    <View style={styles.container}>
      <Header />
      <View style={styles.taskContainer}>
        <View style={styles.card}>
          {/* Task Title */}
          <Text style={styles.title}>{task.title}</Text>

          {/* Task Description */}
          <Text style={styles.description}>{task.description}</Text>

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
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => router.push(`/editTask/${task.id}`)}
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
          </View>
        </View>
      </View>
      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default TaskDetail;