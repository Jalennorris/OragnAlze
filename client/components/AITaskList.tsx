import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TaskEditRow from './TaskEditRow';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  suggestedDeadline?: string;
}

interface AITaskListProps {
  tasks: Task[];
  editingTaskId: string | null;
  editedTaskText: string;
  onStartEditing: (task: Task) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditText: (text: string) => void;
  onDeleteTask: (taskId: string) => void;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  resetToInitialState: () => void; // Add this prop
}

const AITaskList: React.FC<AITaskListProps> = ({
  tasks,
  editingTaskId,
  editedTaskText,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onChangeEditText,
  onDeleteTask,
  abortControllerRef,
  setIsLoading,
  resetToInitialState, // Destructure the prop
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("User stopped generation");
    }
    setIsLoading(false); // Use setIsLoading here
  }, [abortControllerRef, setIsLoading]);

  const handleAcceptAllTasksAndSync = async () => {
    setIsSyncing(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      if (!tasks || tasks.length === 0) {
        Alert.alert('Info', 'No tasks to sync');
        return;
      }

      const endpoint = tasks.length === 1 ? '/api/tasks' : '/api/tasks/batch';
      const payload = tasks.map(task => ({
        userId: parseInt(userId, 10),
        taskName: task.title || "Untitled Task",
        taskDescription: task.description || "No description provided",
        priority: "Medium",
        estimatedDuration: "1 hour",
        deadline: task.suggestedDeadline 
          ? format(new Date(task.suggestedDeadline), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
          : null,
        status: "In Progress",
        completed: false,
        category: "General",
        notes: null,
        createdAt: new Date().toISOString(),
      }));

      const res = await axios.post(`http://localhost:8080${endpoint}`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 200) {
        Alert.alert('Success', tasks.length > 1 ? 'Tasks synced successfully!' : 'Task synced successfully!');
      }
      resetToInitialState()
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', 'Failed to sync tasks. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetTasks = async () => {
    setIsResetting(true);
    try {
      handleStopGeneration(); // Stop generation before resetting tasks
      resetToInitialState(); // Reset AskAIButton state
 
    } catch (error) {
      console.error('Reset error:', error);
      Alert.alert('Error', 'Failed to reset tasks');
    } finally {
      setIsResetting(false);
    }
  };

  const confirmDelete = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => onDeleteTask(taskId), style: 'destructive' }
      ]
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={true} // Enable vertical scroll indicator
      keyboardShouldPersistTaps="handled" // Allow taps to dismiss the keyboard
    >
      {tasks.map((task, index) => (
        <View key={task.id} style={styles.taskCard}>
          {editingTaskId === task.id ? (
            <>
              {console.log('TaskEditRow Props:', {
                task,
                editedTaskText,
                onChangeText: onChangeEditText,
                onSave: onSaveEdit,
                onCancel: onCancelEdit,
              })}
              <TaskEditRow
                task={task}
                editedTaskText={editedTaskText}
                onChangeText={onChangeEditText}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
              />
            </>
          ) : (
            <>
              <View style={styles.taskHeader}>
                <Text style={styles.taskDay}>Day {index + 1}</Text>
                {task.suggestedDeadline && (
                  <Text style={styles.taskDeadline}>
                    Due: {format(new Date(task.suggestedDeadline), 'MMM dd, yyyy')}
                  </Text>
                )}
              </View>
              
              <Text style={styles.taskTitle}>{task.title}</Text>
              
              {task.description && (
                <Text style={styles.taskDescription}>{task.description}</Text>
              )}
              
              <View style={styles.taskActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onStartEditing(task)}
                >
                  <Ionicons name="create-outline" size={20} color="#FFC107" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => confirmDelete(task.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ))}

      {tasks.length > 0 && (
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[styles.footerButton, styles.syncButton]}
            onPress={handleAcceptAllTasksAndSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done-outline" size={20} color="#FFF" />
                <Text style={styles.footerButtonText}>Accept All Tasks</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, styles.resetButton]}
            onPress={handleResetTasks}
            disabled={isResetting}
          >
            {isResetting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color="#FFF" />
                <Text style={styles.footerButtonText}>Reset</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskDay: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  taskDeadline: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  actionButtonText: {
    marginLeft: 6,
    color: '#212121',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  syncButton: {
    backgroundColor: '#4CAF50',
  },
  resetButton: {
    backgroundColor: '#F44336',
  },
  footerButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AITaskList;