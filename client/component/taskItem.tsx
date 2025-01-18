import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Define types for the TaskItem props
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}

interface TaskItemProps {
  task: Task;
  onPress: (id: string) => void;  // Function to handle task press, takes an id
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onPress }) => {
  return (
    <TouchableOpacity style={styles.taskItem} onPress={() => onPress(task.id)}>
      <View>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskDescription}>{task.description}</Text>
        <Text style={styles.taskDueDate}>Due: {task.dueDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#555',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#888',
  },
});

export default TaskItem;