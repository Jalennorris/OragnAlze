import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Make sure to install expo-linear-gradient
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

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onToggleCompletion: () => void;
  priorityColor: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onPress, onToggleCompletion, priorityColor }) => {
  // Format due date for better readability
  const formattedDueDate = new Date(task.dueDate).toLocaleDateString();

  // Define gradient colors based on priority
  const gradientColors = {
    low: ['#8BC34A', '#CDDC39'],
    medium: ['#FF9800', '#FFC107'],
    high: ['#F44336', '#E57373'],
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} accessibilityRole="button">
      <LinearGradient
        colors={gradientColors[task.priority]}
        style={styles.gradientBackground}
        start={[0, 0]}
        end={[1, 1]}
      >
        <View style={styles.taskInfo}>
          <Text style={[styles.title, { color: priorityColor }]}>{task.title}</Text>
          <Text style={styles.description}>{task.description}</Text>
          <Text style={styles.dueDate}>Due: {formattedDueDate}</Text>
        </View>
        <TouchableOpacity 
          onPress={onToggleCompletion} 
          style={styles.checkbox} 
          accessibilityRole="button" 
          accessibilityLabel="Toggle task completion"
        >
          <Ionicons 
            name={task.completed ? 'checkmark-circle' : 'ellipse-outline'} 
            size={24} 
            color={task.completed ? '#4CAF50' : '#999'} 
          />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  gradientBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  taskInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  dueDate: {
    fontSize: 14,
    color: '#fff',
  },
  checkbox: {
    padding: 10,
  },
});

export default TaskItem;