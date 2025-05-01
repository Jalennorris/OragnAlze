import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TaskItem from '../components/taskItem';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from '../components/EmptyState';

// Define types for the task structure
interface Task {
  taskId: number;
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

interface FutureTaskProps {
  futureTasks: Task[];
  showFutureTasks: boolean;
  setShowFutureTasks: React.Dispatch<React.SetStateAction<boolean>>;
  handleTaskPress: (taskId: string) => void;
  toggleTaskCompletion: (taskId: number) => void;
  deleteTask: (taskId: number) => void;
  getPriorityColor: (priority: 'low' | 'medium' | 'high') => string;
  colors: { [key: string]: string };
}

const FutureTask: React.FC<FutureTaskProps> = ({
  futureTasks,
  showFutureTasks,
  setShowFutureTasks,
  handleTaskPress,
  toggleTaskCompletion,
  deleteTask,
  getPriorityColor,
  colors,
}) => {
  return (
    <View style={styles.futureSection}>
      <TouchableOpacity
        onPress={() => setShowFutureTasks(!showFutureTasks)}
        accessibilityLabel={showFutureTasks ? 'Hide future tasks' : 'Show future tasks'}
      >
        <Text style={[styles.futureHeader, { color: colors.text }]}>
          Future Tasks{' '}
          {showFutureTasks ? (
            <Icon name="chevron-up" size={18} color={colors.text} />
          ) : (
            <Icon name="chevron-down" size={18} color={colors.text} />
          )}
        </Text>
      </TouchableOpacity>
      {showFutureTasks && (
        futureTasks.length > 0 ? (
          futureTasks.map((task) => (
            <TaskItem
              key={task.taskId.toString()}
              task={task}
              onPress={() => handleTaskPress(task.taskId.toString())}
              onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
              onDelete={() => deleteTask(task.taskId)}
              priorityColor={getPriorityColor(task.priority)}
            />
          ))
        ) : (
          <EmptyState message="No future tasks!" colors={colors} />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  futureSection: {
    marginBottom: 20,
  },
  futureHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default FutureTask;
