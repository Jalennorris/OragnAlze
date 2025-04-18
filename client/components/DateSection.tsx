import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TaskItem from './taskItem';

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
}

const DateSection: React.FC<DateSectionProps> = ({
  title,
  tasks,
  onTaskPress,
  onToggleCompletion,
  onDelete,
  getPriorityColor,
  colors,
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <TaskItem
            key={task.taskId.toString()}
            task={task}
            onPress={() => onTaskPress(task.taskId.toString())}
            onToggleCompletion={() => onToggleCompletion(task.taskId)}
            onDelete={() => onDelete(task.taskId)}
            priorityColor={getPriorityColor(task.priority)}
          />
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>No tasks for {title.toLowerCase()}!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DateSection;