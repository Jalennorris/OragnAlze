import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  TextInput,
  Animated,
  Easing,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/header';
import NavBar from '@/components/Navbar';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Task {
  taskId: string;
  title: string;
  description: string;
  dueDate: string;      // formatted for display
  dueDateISO: string;   // ISO string for Date operations
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const TaskDetail: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId, userId } = route.params as { taskId: string; userId?: string };
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300));
  const [editedDueDate, setEditedDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editedPriority, setEditedPriority] = useState<Task['priority']>('low');

  // Animation effects
  useEffect(() => {
    if (task) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [task]);

  const saveTaskToStorage = async (task: Task) => {
    try {
      await AsyncStorage.setItem(`task_${task.taskId}`, JSON.stringify(task));
    } catch (error) {
      console.error('Failed to save task to storage:', error);
    }
  };

  const loadTaskFromStorage = async (taskId: string) => {
    try {
      const storedTask = await AsyncStorage.getItem(`task_${taskId}`);
      if (storedTask) {
        setTask(JSON.parse(storedTask));
      }
    } catch (error) {
      console.error('Failed to load task from storage:', error);
    }
  };

  useEffect(() => {
    const fetchTask = async () => {
      try {
        await loadTaskFromStorage(taskId);
        const response = await axios.get(`http://localhost:8080/api/tasks/${taskId}`);
        const data = response.data;
        const deadlineISO = data.deadline;
        const TaskDetail: Task = {
          taskId: taskId,
          title: data.taskName,
          description: data.taskDescription,
          dueDate: format(new Date(deadlineISO), 'MMM dd, yyyy hh:mm a'),
          dueDateISO: deadlineISO,
          completed: data.completed,
          priority: data.priority,
        };
        setTask(TaskDetail);
        await saveTaskToStorage(TaskDetail);
      } catch (error) {
        console.error('Failed to fetch task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description);
      setEditedDueDate(task.dueDateISO ? new Date(task.dueDateISO) : null);
      setEditedPriority(task.priority);
    }
  }, [task]);

  const handleSaveEdit = async () => {
    if (task) {
      try {
        const newDueDateISO = editedDueDate ? editedDueDate.toISOString() : task.dueDateISO;
        await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
          taskName: editedTitle,
          taskDescription: editedDescription,
          deadline: newDueDateISO,
          priority: editedPriority,
        });

        const updatedTask = { 
          ...task, 
          title: editedTitle, 
          description: editedDescription,
          dueDate: format(new Date(newDueDateISO), 'MMM dd, yyyy hh:mm a'),
          dueDateISO: newDueDateISO,
          priority: editedPriority,
        };
        setTask(updatedTask);
        await saveTaskToStorage(updatedTask);
        setIsEditing(false);
        
        // Success animation
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();
      } catch (error) {
        console.error('Failed to update task:', error);
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      }
    }
  };

  const priorityColors = {
    low: '#8BC34A',
    medium: '#FFC107',
    high: '#F44336',
  };

  const priorityIcons: Record<Task['priority'], keyof typeof Ionicons.glyphMap> = {
      low: 'flag-outline',
      medium: 'warning-outline',
      high: 'alert-circle-outline'
  };

  const handleToggleCompletion = async () => {
    if (task) {
      try {
        await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
          completed: !task.completed,
        });

        const updatedTask = { ...task, completed: !task.completed };
        setTask(updatedTask);
        await saveTaskToStorage(updatedTask);
        
        // Completion animation
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();
      } catch (error) {
        console.error('Failed to toggle task completion:', error);
        Alert.alert('Error', 'Failed to update task status. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (task) {
              try {
                await axios.delete(`http://localhost:8080/api/tasks/${task.taskId}`);
                await AsyncStorage.removeItem(`task_${task.taskId}`);
                
                // Exit animation
                Animated.parallel([
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                  Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 300,
                    useNativeDriver: true,
                  })
                ]).start(() => navigation.goBack());
              } catch (error) {
                console.error('Failed to delete task:', error);
                Alert.alert('Error', 'Failed to delete the task. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.taskContainer}>
          <Text style={styles.errorText}>Task not found!</Text>
        </View>
        <NavBar />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header />
        
        <Animated.View 
          style={[
            styles.taskContainer,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
              {/* Header with back button */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color="#6200EE" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                
                <View style={styles.priorityBadge}>
                  <Ionicons 
                    name={priorityIcons[task.priority]} 
                    size={16} 
                    color={priorityColors[task.priority]} 
                  />
                  <Text style={[styles.priorityText, { color: priorityColors[task.priority] }]}>
                    {task.priority.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Task Title */}
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.titleInput]}
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  placeholder="Task Title"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.title}>{task.title}</Text>
              )}

              {/* Priority Picker in edit mode */}
              {isEditing && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 8, color: '#333' }}>Priority:</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {(['low', 'medium', 'high'] as Task['priority'][]).map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={{
                          flex: 1,
                          marginHorizontal: 4,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: editedPriority === level ? priorityColors[level] : '#eee',
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'center',
                        }}
                        onPress={() => setEditedPriority(level)}
                      >
                        <Ionicons
                          name={priorityIcons[level]}
                          size={18}
                          color={editedPriority === level ? '#fff' : priorityColors[level]}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={{
                          color: editedPriority === level ? '#fff' : priorityColors[level],
                          fontWeight: '600',
                          fontSize: 14,
                        }}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Divider */}
              <View style={styles.divider} />

              {/* Task Description */}
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  placeholder="Task Description"
                  multiline
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.description}>{task.description}</Text>
              )}

              {/* Due Date Edit */}
              {isEditing && (
                <View style={{ marginBottom: 16 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#03A9F4', marginBottom: 0 }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Edit Due Date</Text>
                  </TouchableOpacity>
                  <Text style={{ marginTop: 8, color: '#333', textAlign: 'center' }}>
                    {editedDueDate
                      ? format(editedDueDate, 'MMM dd, yyyy hh:mm a')
                      : ''}
                  </Text>
                  {showDatePicker && (
                    <DateTimePicker
                      value={editedDueDate || new Date()}
                      mode="datetime"
                      display="default"
                      onChange={(_, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) setEditedDueDate(selectedDate);
                      }}
                    />
                  )}
                </View>
              )}

              {/* Task Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#6200EE" />
                  <Text style={styles.detailText}>
                    Due: {isEditing && editedDueDate
                      ? format(editedDueDate, 'MMM dd, yyyy hh:mm a')
                      : task.dueDate}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={task.completed ? '#4CAF50' : '#999'}
                  />
                  <Text style={styles.detailText}>
                    Status: {task.completed ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton]}
                      onPress={handleSaveEdit}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Save Changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => setIsEditing(false)}
                    >
                      <Ionicons name="close" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.editButton]}
                      onPress={() => setIsEditing(true)}
                    >
                      <Ionicons name="create-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Edit Task</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.completeButton]}
                      onPress={handleToggleCompletion}
                    >
                      <Ionicons 
                        name={task.completed ? 'refresh-outline' : 'checkmark-outline'} 
                        size={20} 
                        color="#fff" 
                      />
                      <Text style={styles.buttonText}>
                        {task.completed ? 'Mark Pending' : 'Mark Complete'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.deleteButton]}
                      onPress={handleDelete}
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Delete Task</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
        
        <NavBar />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  taskContainer: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#6200EE',
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    padding: 12,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 20,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 12,
    borderColor: '#ddd',
    marginBottom: 20,
    lineHeight: 24,
  },
  detailsContainer: {
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  editButton: {
    backgroundColor: '#6200EE',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
  },
});

export default TaskDetail;