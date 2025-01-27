import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';

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
  task: Task; // Make the task prop required
  onPress: () => void;
  onToggleCompletion: () => void;
  onDelete: () => void;
  priorityColor: string;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onPress,
  onToggleCompletion,
  onDelete,
  priorityColor,
}) => {
  // Format due date for better readability
  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString()
    : 'No due date';

  // Check if the task is overdue
  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;

  // Define gradient colors based on priority
  const gradientColors: { [key: string]: string[] } = {
    low: ['#8BC34A', '#CDDC39'], // Green gradient
    medium: ['#FF9800', '#FFC107'], // Orange gradient
    high: ['#F44336', '#E57373'], // Red gradient
  };

  // Swipeable delete action
  const renderRightActions = (progress: Animated.AnimatedInterpolation, dragX: Animated.AnimatedInterpolation) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', onPress: onDelete, style: 'destructive' },
            ]
          );
        }}
        style={styles.deleteButton}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Task: ${task.title}. Due: ${formattedDueDate}. Priority: ${task.priority}`}
      >
        <LinearGradient
          colors={gradientColors[task.priority]}
          style={styles.gradientBackground}
          start={[0, 0]}
          end={[1, 1]}
        >
          {/* Task Information */}
          <View style={styles.taskInfo}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: priorityColor }]} numberOfLines={1} ellipsizeMode="tail">
                {task.title}
              </Text>
              <Ionicons
                name={task.priority === 'high' ? 'alert-circle' : task.priority === 'medium' ? 'alert' : 'checkmark-circle'}
                size={16}
                color={priorityColor}
              />
            </View>
            <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
              {task.description}
            </Text>
            <View style={styles.dueDateContainer}>
              <Ionicons name="time-outline" size={14} color={isOverdue ? '#FF4444' : '#FFF'} />
              <Text style={[styles.dueDate, { color: isOverdue ? '#FF4444' : '#FFF' }]}>
                Due: {formattedDueDate}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Completion Toggle Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onToggleCompletion();
              }}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
            >
              <Ionicons
                name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={task.completed ? '#4CAF50' : '#999'}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Swipeable>
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
    marginRight: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
    opacity: 0.9,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginVertical: 8,
  },
});

export default TaskItem;