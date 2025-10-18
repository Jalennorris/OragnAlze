import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TaskItem from './taskItem';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface DateSectionProps {
  title: string; // Title of the section (e.g., "Today", "This Week")
  tasks: Task[]; // Array of tasks to display in this section
  onTaskPress: (taskId: string) => void; // Callback for when a task is pressed
  onToggleCompletion: (taskId: number) => void; // Callback for toggling task completion
  onDelete: (taskId: number) => void; // Callback for deleting a task
  getPriorityColor: (priority: 'low' | 'medium' | 'high') => string; // Function to get the color for a task's priority
  colors: {
    text: string;
  };
  icon?: React.ReactNode; // Optional icon to display when there are no tasks
  color?: string; // <-- Add this line
}

const DARK_COLORS = {
  text: '#f1f5f9',
};

const DateSection: React.FC<DateSectionProps> = ({
  title,
  tasks,
  onTaskPress,
  onToggleCompletion,
  onDelete,
  getPriorityColor,
  colors,
  icon, // Add icon prop
  color, // <-- Add this line
}) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchDarkMode = async () => {
      try {
        const stored = await AsyncStorage.getItem('darkMode');
        if (stored !== null) {
          setDarkMode(JSON.parse(stored));
        }
      } catch {
        setDarkMode(false);
      }
    };
    fetchDarkMode();
    const interval = setInterval(fetchDarkMode, 1000);
    return () => clearInterval(interval);
  }, []);

  const mergedColors = darkMode ? { ...colors, ...DARK_COLORS } : colors;

  // Determine extra spacing for Today/This Week
  const isSpecialSection = title === 'Today' || title === 'This Week';
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          { color: color || mergedColors.text || '#f1f5f9' }, // Use explicit color prop if provided
        ]}
      >
        {title}
      </Text>
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <View
            key={task.taskId.toString()}
            style={[
              styles.taskItemWrapper,
              isSpecialSection && styles.taskItemWrapperSpecial,
            ]}
          >
            <TaskItem
              task={task}
              onPress={() => onTaskPress(task.taskId.toString())}
              onToggleCompletion={() => onToggleCompletion(task.taskId)}
              onDelete={() => onDelete(task.taskId)}
              priorityColor={getPriorityColor(task.priority)}
            />
          </View>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>} {/* Render icon if provided */}
          <Text style={[styles.emptyStateText, { color: mergedColors.text }]}>No tasks for {title.toLowerCase()}!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  taskItemWrapper: {
    marginBottom: 18, // Increased spacing between TaskItems
  },
  taskItemWrapperSpecial: {
    marginBottom: 32, // More space for Today/This Week
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18, // More space below the section title
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  iconContainer: {
    marginBottom: 10, // Add spacing between the icon and the text
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DateSection;