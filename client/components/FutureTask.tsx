import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskItem from './taskItem';

interface Task {
  taskId: number;
  taskName: string;
  taskDescription: string;
  deadline: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface FutureTasksProps {
  futureTasks: Task[];
  onTaskPress: (taskId: string) => void;
  onToggleCompletion: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  getPriorityColor: (priority: 'low' | 'medium' | 'high') => string;
  colors: {
    text: string;
  };
}

const FutureTasks: React.FC<FutureTasksProps> = ({
  futureTasks,
  onTaskPress,
  onToggleCompletion,
  onDelete,
  getPriorityColor,
  colors,
}) => {
  const [showFutureTasks, setShowFutureTasks] = useState(false);

  return (
    <View style={styles.futureSection}>
      <TouchableOpacity
        onPress={() => setShowFutureTasks(!showFutureTasks)}
        accessibilityLabel={showFutureTasks ? 'Hide future tasks' : 'Show future tasks'}
      >
        <Text style={[styles.futureHeader, { color: colors.text }]}>
          Future Tasks{' '}
          {showFutureTasks ? (
            <Ionicons name="chevron-up" size={18} color={colors.text} />
          ) : (
            <Ionicons name="chevron-down" size={18} color={colors.text} />
          )}
        </Text>
      </TouchableOpacity>
      {showFutureTasks &&
        (futureTasks.length > 0 ? (
          futureTasks.map((task) => (
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
            <Ionicons name="cloud-outline" size={50} color={colors.text} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>No tasks for today!</Text>
            <Ionicons name="calendar-outline" size={50} color={colors.text} style={{ marginTop: 10 }} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>No tasks for this week!</Text>
          </View>
        ))}
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
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default FutureTasks;