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
  ScrollView,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/header';
import NavBar from '@/components/Navbar';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

interface Task {
  taskId: string;
  title: string;
  description: string;
  dueDateISO: string;   // ISO string for Date operations
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  status?: 'not started' | 'in progress' | 'completed'; // add status
  category?: string; // add category
}

interface Subtask {
  id: string; // changed from subtask_id to id
  title: string;
  completed: boolean;
  description?: string; // add optional description
}

const CATEGORY_OPTIONS = [
  { name: 'Work', color: '#6a11cb' },
  { name: 'Personal', color: '#ff9800' },
  { name: 'Shopping', color: '#43a047' },
  { name: 'Health', color: '#e91e63' },
  { name: 'Other', color: '#607d8b' },
  { name: 'Custom', color: '#888' },
];

const getCategoryColor = (category?: string) => {
  const found = CATEGORY_OPTIONS.find(opt => opt.name.toLowerCase() === (category || '').toLowerCase());
  return found ? found.color : '#888';
};

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
  const [slideAnim] = useState(new Animated.Value(300)); // <-- add this line
  const [editedDueDate, setEditedDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editedPriority, setEditedPriority] = useState<Task['priority']>('low');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskModalVisible, setSubtaskModalVisible] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtasksLoading, setSubtasksLoading] = useState(true);
  const [showSubtasksSheet, setShowSubtasksSheet] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('');
  const [editSubtaskDescription, setEditSubtaskDescription] = useState('');
  const [editingSubtask, setEditingSubtask] = useState(false);
  const [editedStatus, setEditedStatus] = useState<Task['status']>('not started');
  const [editedCategory, setEditedCategory] = useState<string>('Other');
  const [customCategory, setCustomCategory] = useState<string>('');

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
      setEditedStatus(task.status || (task.completed ? 'completed' : 'not started'));
      setEditedCategory(task.category || 'Other');
      setCustomCategory('');
    }
  }, [task]);

  const fetchSubtasks = async () => {
    try {
      setSubtasksLoading(true);
      const response = await axios.get(`http://localhost:8080/api/subtasks/task/${taskId}`);
      setSubtasks(response.data || []);
    } catch (error) {
      setSubtasks([]);
    } finally {
      setSubtasksLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  const handleSaveEdit = async () => {
    if (task) {
      try {
        const newDueDateISO = editedDueDate ? editedDueDate.toISOString() : task.dueDateISO;
        const categoryToSave = editedCategory === 'Custom' ? customCategory.trim() : editedCategory;
        await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
          taskName: editedTitle,
          taskDescription: editedDescription,
          deadline: newDueDateISO,
          priority: editedPriority,
          status: editedStatus,
          completed: editedStatus === 'completed', // keep completed in sync
          category: categoryToSave,
        });

        const updatedTask = { 
          ...task, 
          
          title: editedTitle, 
          description: editedDescription,
          dueDate: format(new Date(newDueDateISO), 'MMM dd, yyyy hh:mm a'),
          dueDateISO: newDueDateISO,
          priority: editedPriority,
          status: editedStatus,
          completed: editedStatus === 'completed',
          category: categoryToSave,
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

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      setAddingSubtask(true);
      await axios.post('http://localhost:8080/api/subtasks', {
        taskId: taskId,
        title: newSubtaskTitle.trim(),
        description: "", // add description field
        completed: false // add completed field
      });
      setNewSubtaskTitle('');
      setSubtaskModalVisible(false);
      Alert.alert('Success', 'Subtask created!');
      fetchSubtasks(); // <-- ensure subtasks are refreshed after creation
    } catch (error) {
      Alert.alert('Error', 'Failed to add subtask.');
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtaskCompletion = async (subtask: Subtask) => {
    console.log('handleToggleSubtaskCompletion called with:', subtask);
    if (!subtask.id) {
      console.error('Subtask ID is missing:', subtask);
      Alert.alert('Error', 'Subtask ID is missing.');
      return;
    }
    try {
      const url = `http://localhost:8080/api/subtasks/${subtask.id}`;
      const payload = {
        completed: !subtask.completed ? true : false,
      };
      console.log('PATCH URL:', url);
      console.log('PATCH payload:', payload);

      const response = await axios.patch(url, payload);
      console.log('PATCH response:', response?.data);

      setSubtasks((prev) => {
        const updated = prev.map((s) =>
          s.id === subtask.id ? { ...s, completed: !s.completed } : s
        );
        console.log('Updated subtasks after toggle:', updated);
        return updated;
      });
    } catch (error: any) {
      console.error('Failed to update subtask status:', error, error?.response?.data);
      Alert.alert('Error', 'Failed to update subtask status.');
    }
  };

  // Add a handler to use the subtask_id from the selected subtask
  const handleSubtaskItemPress = (subtask: Subtask) => {
    // Removed Alert.alert to prevent crash when opening modal
    setSelectedSubtask(subtask);
    setEditSubtaskTitle(subtask.title);
    setEditSubtaskDescription(subtask.description || '');
    setEditingSubtask(false);
  };

  const handleEditSubtask = () => {
    setEditingSubtask(true);
  };

  const handleSaveSubtaskEdit = async () => {
    if (!selectedSubtask) return;
    try {
      await axios.patch(`http://localhost:8080/api/subtasks/${selectedSubtask.id}`, {
        title: editSubtaskTitle,
        description: editSubtaskDescription,
      });
      setEditingSubtask(false);
      setSelectedSubtask(null);
      fetchSubtasks();
      Alert.alert('Success', 'Subtask updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update subtask.');
    }
  };

  const handleDeleteSubtask = async (subtask: Subtask) => {
    Alert.alert(
      'Delete Subtask',
      'Are you sure you want to delete this subtask?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`http://localhost:8080/api/subtasks/${subtask.id}`);
              fetchSubtasks();
              setSelectedSubtask(null);
              // No alert, no button needed
            } catch (error) {
              Alert.alert('Error', 'Failed to delete subtask.');
            }
          },
        },
      ]
    );
  };

  // Render left actions for subtask completion
  const renderLeftActions = (subtask: Subtask) => (
    <TouchableOpacity
      style={{
        backgroundColor: subtask.completed ? '#FFC107' : '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
      }}
      onPress={() => handleToggleSubtaskCompletion(subtask)}
    >
      <Ionicons
        name={subtask.completed ? 'refresh-outline' : 'checkmark-outline'}
        size={24}
        color="#fff"
      />
      <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 4 }}>
        {subtask.completed ? 'Undo' : 'Complete'}
      </Text>
    </TouchableOpacity>
  );

  const renderRightActions = (subtask: Subtask) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#F44336',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
      }}
      onPress={() => handleDeleteSubtask(subtask)}
    >
      <Ionicons name="trash-outline" size={24} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 4 }}>Delete</Text>
    </TouchableOpacity>
  );

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header />
          
          {/* Removed the Show My Task button */}

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

                {/* Category Picker in edit mode */}
                {isEditing && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontWeight: '600', marginBottom: 8, color: '#333' }}>Category:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                      {CATEGORY_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.name}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: editedCategory === opt.name ? opt.color : '#eee',
                            borderRadius: 16,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            marginRight: 8,
                            marginBottom: 8,
                          }}
                          onPress={() => {
                            setEditedCategory(opt.name);
                            if (opt.name !== 'Custom') setCustomCategory('');
                          }}
                        >
                          <Text style={{
                            color: editedCategory === opt.name ? '#fff' : opt.color,
                            fontWeight: '700',
                            fontSize: 14,
                          }}>
                            #{opt.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {editedCategory === 'Custom' && (
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#ddd',
                          borderRadius: 8,
                          padding: 10,
                          fontSize: 15,
                          marginTop: 4,
                          backgroundColor: '#fafafa',
                        }}
                        placeholder="Custom category..."
                        value={customCategory}
                        onChangeText={setCustomCategory}
                      />
                    )}
                  </View>
                )}

                {/* Category display in view mode */}
                {!isEditing && task.category && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text
                      style={{
                        color: '#fff',
                        backgroundColor: getCategoryColor(task.category),
                        borderRadius: 14,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        fontWeight: '700',
                        fontSize: 13,
                        marginRight: 8,
                      }}
                    >
                      #{task.category}
                    </Text>
                  </View>
                )}

                {/* Status Picker in edit mode */}
                {isEditing && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontWeight: '600', marginBottom: 8, color: '#333' }}>Status:</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      {(['not started', 'in progress', 'completed'] as Task['status'][]).map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={{
                            flex: 1,
                            marginHorizontal: 4,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: editedStatus === status ? '#03A9F4' : '#eee',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => setEditedStatus(status)}
                        >
                          <Text style={{
                            color: editedStatus === status ? '#fff' : '#03A9F4',
                            fontWeight: '600',
                            fontSize: 14,
                            textTransform: 'capitalize',
                          }}>
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
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
                      name={
                        (task.status === 'completed' || task.completed)
                          ? 'checkmark-circle'
                          : task.status === 'in progress'
                          ? 'time-outline'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={
                        (task.status === 'completed' || task.completed)
                          ? '#4CAF50'
                          : task.status === 'in progress'
                          ? '#FFC107'
                          : '#999'
                      }
                    />
                    <Text style={styles.detailText}>
                      Status: {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : (task.completed ? 'Completed' : 'Not Started')}
                    </Text>
                  </View>
                </View>

                {/* Subtask Creation Modal Trigger */}
                <View style={{ marginTop: 24 }}>
                  <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8, color: '#333' }}>
                    Create Subtask
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#6200EE',
                      borderRadius: 8,
                      padding: 12,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      marginTop: 8,
                    }}
                    onPress={() => setSubtaskModalVisible(true)}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>
                      New Subtask
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Subtask Creation Modal */}
                <Modal
                  visible={subtaskModalVisible}
                  animationType="slide"
                  transparent
                  onRequestClose={() => setSubtaskModalVisible(false)}
                >
                  <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <View style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: 24,
                      width: '85%',
                      shadowColor: '#000',
                      shadowOpacity: 0.2,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 8,
                      elevation: 8,
                    }}>
                      <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 16, color: '#333' }}>
                        New Subtask
                      </Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#ddd',
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 16,
                          marginBottom: 16,
                          backgroundColor: '#fafafa',
                        }}
                        placeholder="Subtask title..."
                        value={newSubtaskTitle}
                        onChangeText={setNewSubtaskTitle}
                        editable={!addingSubtask}
                      />
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#9E9E9E',
                            borderRadius: 8,
                            paddingVertical: 10,
                            paddingHorizontal: 18,
                            marginRight: 8,
                          }}
                          onPress={() => {
                            setSubtaskModalVisible(false);
                            setNewSubtaskTitle('');
                          }}
                          disabled={addingSubtask}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#6200EE',
                            borderRadius: 8,
                            paddingVertical: 10,
                            paddingHorizontal: 18,
                            opacity: addingSubtask || !newSubtaskTitle.trim() ? 0.7 : 1,
                          }}
                          onPress={handleAddSubtask}
                          disabled={addingSubtask || !newSubtaskTitle.trim()}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600' }}>Create</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>

                {/* Subtasks Section */}
                <View style={styles.subtasksCard}>
                  <Text style={styles.subtasksTitle}>Subtasks</Text>
                  {subtasksLoading ? (
                    <ActivityIndicator size="small" color="#6200EE" style={{ marginTop: 24 }} />
                  ) : subtasks.length === 0 ? (
                    <Text style={{ color: '#888', textAlign: 'center', marginTop: 24 }}>No subtasks found.</Text>
                  ) : (
                    <ScrollView style={{ maxHeight: 220 }}>
                      {subtasks.map((s, i) => (
                        <Swipeable
                          key={s.id}
                          renderRightActions={() => renderRightActions(s)}
                          renderLeftActions={() => renderLeftActions(s)}
                          overshootRight={false}
                          overshootLeft={false}
                        >
                          <TouchableOpacity
                            style={styles.subtaskItem}
                            onPress={() => handleSubtaskItemPress(s)}
                            // Removed onLongPress for completion
                            activeOpacity={0.7}
                          >
                            <View style={{ padding: 2 }}>
                              <Ionicons
                                name={s.completed ? 'checkmark-circle' : 'ellipse-outline'}
                                size={22}
                                color={s.completed ? '#4CAF50' : '#bbb'}
                              />
                            </View>
                            <View style={{ marginLeft: 14, flex: 1 }}>
                              <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: s.completed ? '#aaa' : '#222',
                                textDecorationLine: s.completed ? 'line-through' : 'none',
                              }}>
                                {s.title}
                              </Text>
                              {s.description ? (
                                <Text style={{
                                  fontSize: 13,
                                  color: '#888',
                                  marginTop: 2,
                                }}>
                                  {s.description}
                                </Text>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        </Swipeable>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Subtask Description Modal */}
                <Modal
                  visible={!!selectedSubtask}
                  transparent
                  animationType="fade"
                  onRequestClose={() => {
                    setSelectedSubtask(null);
                    setEditingSubtask(false);
                  }}
                >
                  <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <View style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: 24,
                      width: '85%',
                      shadowColor: '#000',
                      shadowOpacity: 0.2,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 8,
                      elevation: 8,
                      alignItems: 'center',
                    }}>
                      {selectedSubtask && (
                        <>
                          <Ionicons
                            name={selectedSubtask.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={32}
                            color={selectedSubtask.completed ? '#4CAF50' : '#bbb'}
                            style={{ marginBottom: 12 }}
                          />
                          {editingSubtask ? (
                            <>
                              <TextInput
                                style={{
                                  fontWeight: '700',
                                  fontSize: 20,
                                  color: '#222',
                                  marginBottom: 10,
                                  textAlign: 'center',
                                  borderWidth: 1,
                                  borderColor: '#ddd',
                                  borderRadius: 8,
                                  padding: 8,
                                  width: '100%',
                                }}
                                value={editSubtaskTitle}
                                onChangeText={setEditSubtaskTitle}
                                placeholder="Subtask Title"
                              />
                              <TextInput
                                style={{
                                  fontSize: 15,
                                  color: '#555',
                                  textAlign: 'center',
                                  marginBottom: 18,
                                  borderWidth: 1,
                                  borderColor: '#ddd',
                                  borderRadius: 8,
                                  padding: 8,
                                  width: '100%',
                                  minHeight: 60,
                                  textAlignVertical: 'top',
                                }}
                                value={editSubtaskDescription}
                                onChangeText={setEditSubtaskDescription}
                                placeholder="Subtask Description"
                                multiline
                              />
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#4CAF50',
                                  borderRadius: 8,
                                  paddingVertical: 10,
                                  paddingHorizontal: 32,
                                  marginBottom: 10,
                                }}
                                onPress={handleSaveSubtaskEdit}
                              >
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#9E9E9E',
                                  borderRadius: 8,
                                  paddingVertical: 10,
                                  paddingHorizontal: 32,
                                }}
                                onPress={() => setEditingSubtask(false)}
                              >
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <>
                              <Text style={{
                                fontWeight: '700',
                                fontSize: 20,
                                color: '#222',
                                marginBottom: 10,
                                textAlign: 'center',
                              }}>
                                {selectedSubtask.title}
                              </Text>
                              <Text style={{
                                fontSize: 15,
                                color: '#555',
                                textAlign: 'center',
                                marginBottom: 18,
                              }}>
                                {selectedSubtask.description || 'No description.'}
                              </Text>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#6200EE',
                                  borderRadius: 8,
                                  paddingVertical: 10,
                                  paddingHorizontal: 32,
                                  marginBottom: 10,
                                }}
                                onPress={handleEditSubtask}
                              >
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#9E9E9E',
                                  borderRadius: 8,
                                  paddingVertical: 10,
                                  paddingHorizontal: 32,
                                }}
                                onPress={() => setSelectedSubtask(null)}
                              >
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Close</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                </Modal>

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
    </GestureHandlerRootView>
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
  subtasksCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  subtasksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
});

export default TaskDetail;