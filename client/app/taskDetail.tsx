import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install @expo/vector-icons

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
  const pathname = usePathname();
  const taskId = pathname.split('/').pop(); // Extract taskId from the URL

  // Fetch the task data based on the taskId. This is a placeholder.
  // You might want to fetch the actual task data from your backend or state
  const task: Task = {
    id: taskId!,
    title: 'Task Title',
    description: 'Task Description',
    dueDate: '2025-01-30',
    completed: false,
    priority: 'medium',
  };

  // Define colors based on priority
  const priorityColors = {
    low: '#8BC34A',
    medium: '#FFC107',
    high: '#F44336',
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.description}>{task.description}</Text>
        <View style={styles.row}>
          <Ionicons name="calendar" size={20} color="#4CAF50" />
          <Text style={styles.dueDate}>Due: {task.dueDate}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="alert-circle" size={20} color={priorityColors[task.priority]} />
          <Text style={[styles.priority, { color: priorityColors[task.priority] }]}>Priority: {task.priority}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name={task.completed ? "checkmark-circle" : "ellipse-outline"} size={20} color={task.completed ? "#4CAF50" : "#999"} />
          <Text style={styles.completed}>Completed: {task.completed ? 'Yes' : 'No'}</Text>
        </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
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
});

export default TaskDetail;