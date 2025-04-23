import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import axios from 'axios';

// Define types for the task structure
interface Task {
  taskId: number;
  userId: number;
  taskName: string;
  taskDescription: string;
  estimatedDuration: number;
  deadline: string;
  completed: boolean;
  status: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

interface TaskItemProps {
  key: string; 
  task: Task; // Make the task prop required
  onPress: () => void;
  onToggleCompletion: () => void;
  onDelete: () => void;
  priorityColor?: string;
}

const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'low':
      return '#A0A0A0'; // Neutral gray
    case 'medium':
      return '#808080'; // Darker gray
    case 'high':
      return '#606060'; // Even darker gray
    default:
      return '#A0A0A0'; // Default to neutral gray
  }
};

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onPress,
  onToggleCompletion,
  onDelete,
  priorityColor = getPriorityColor(task.priority), // Ensure default color is applied
}) => {
  // Format due date for better readability

  
  const formattedDueDate = task.deadline
  ? new Date(task.deadline).toLocaleDateString('en-US', {
      timeZone: 'America/Chicago', // Adjust this to your desired timezone
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  : 'No due date';
  
  console.log('Raw deadline:', task.deadline);
  console.log('Parsed deadline:', new Date(task.deadline));



  // Check if the task is overdue
  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false;
  // Define gradient colors based on priority
  const gradientColors: { [key: string]: string[] } = {
    low: ['#A0A0A0', '#B0B0B0'], // Neutral gray gradient
    medium: ['#808080', '#909090'], // Darker gray gradient
    high: ['#606060', '#707070'], // Even darker gray gradient
  };

  // Ensure the gradient colors for the task priority exist
  const taskGradientColors = gradientColors[task.priority] || ['#F0F0F0', '#F0F0F0']; // Default to neutral gradient

  // Handle task deletion with Axios
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/tasks/${task.taskId}`);
      onDelete();
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete the task. Please try again.');
    }
  };

  // Handle task completion toggle with Axios
  const handleToggleCompletion = async () => {
    try {
      await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
        completed: !task.completed,
      });
      onToggleCompletion();
    } catch (error) {
      console.error('Error toggling task completion:', error);
      Alert.alert('Error', 'Failed to update the task. Please try again.');
    }
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
              { text: 'Delete', onPress: handleDelete, style: 'destructive' },
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
        accessibilityLabel={`Task: ${task.taskName}. Due: ${formattedDueDate}. Priority: ${task.priority}`}
      >
        <View style={styles.row}>
          {/* Priority Indicator Line */}
          <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
          <LinearGradient
            colors={['#FFFFFF', '#FFFFFF']} // Always white background
            style={styles.gradientBackground}
            start={[0, 0]}
            end={[1, 1]}
          >
            {/* Task Information */}
            <View style={styles.taskInfo}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: '#000' }]} numberOfLines={1} ellipsizeMode="tail">
                  {task.taskName}
                </Text>
                <Ionicons
                  name={task.priority === 'high' ? 'alert-circle' : task.priority === 'medium' ? 'alert' : 'checkmark-circle'}
                  size={16}
                  color={priorityColor}
                />
              </View>
              <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
                {task.taskDescription}
              </Text>
              <Text style={styles.category} numberOfLines={1} ellipsizeMode="tail">
                {`#${task.category}`}
              </Text>
              <View style={styles.dueDateContainer}>
                <Ionicons name="time-outline" size={14} color={isOverdue ? '#000' : '#000'} />
                <Text style={[styles.dueDate, { color: isOverdue ? '#000' : '#000' }]}>
                  Due: {task.deadline ?   formattedDueDate : 'No due date'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {/* Completion Toggle Button */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  handleToggleCompletion();
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
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const TaskList: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <View style={styles.noTasksContainer}>
        <Text style={styles.noTasksText}>No tasks available. Add a new task to get started!</Text>
      </View>
    );
  }

  return (
    <>
      {tasks.map((task) => (
        <TaskItem
          key={task.taskId.toString()}
          task={task}
          onPress={() => console.log('Task pressed')}
          onToggleCompletion={() => console.log('Toggle completion')}
          onDelete={() => console.log('Delete task')}
          priorityColor={getPriorityColor(task.priority.toLowerCase() as 'low' | 'medium' | 'high')} // Ensure lowercase priority
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#808080', // Neutral shadow color
    shadowOpacity: 0.3, // Reduced opacity for a softer shadow
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4, // Softer shadow radius
    elevation: 2, // Reduced elevation for a subtle effect
    width: '95%',
    backgroundColor: '#FFFFFF', // Changed to white
    boxShadow: '0 2px 4px rgba(128, 128, 128, 0.3)', // Neutral shadow
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray border
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
    lineHeight: 20,
    color: '#000',
    marginBottom: 5,
    opacity: 0.9,
  },
  category: {
    fontSize: 14,
    color: '#C0C0C0',
   transform: [{translateY:20}],
    opacity: 0.8,
    fontWeight: 'bold',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  dueDate: {
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    fontSize: 14,
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
  noTasksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  noTasksText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  priorityIndicator: {
    width: 6, // Width of the priority line
    height: '100%',
    shadowColor: '#000', // Black shadow
    shadowOpacity: 0.2, // Slightly visible shadow
    shadowOffset: { width: 2, height: 0 }, // Horizontal shadow
    shadowRadius: 3, // Blur radius
    elevation: 3, // Android shadow
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default TaskItem;