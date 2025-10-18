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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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

const DARK_COLORS = {
  background: ['#232526', '#414345'],
  card: '#18191a',
  accent: '#F44336',
  accent2: '#FF9800',
  accent3: '#43cea2',
  danger: '#F44336',
  success: '#4CAF50',
  warning: '#FFC107',
  text: '#feefe9',
  muted: '#888',
  border: '#333',
  shadow: '#000',
  fab: '#F44336',
};

const MODERN_COLORS = {
  background: ['#e0eafc', '#cfdef3'], // softer blue gradient
  card: '#fff',
  accent: '#6a11cb',
  accent2: '#2575fc',
  accent3: '#43cea2',
  danger: '#F44336',
  success: '#4CAF50',
  warning: '#FFC107',
  text: '#232946',
  muted: '#9a8c98',
  border: '#e0e0e0',
  shadow: '#000',
  fab: '#6a11cb',
};

const MODERN_FONT = {
  fontFamily: 'System',
  fontWeight: '500',
  letterSpacing: 0.1,
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
  const [darkMode, setDarkMode] = useState(false);

  // Progress bar for subtasks
  const completedCount = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length > 0 ? completedCount / subtasks.length : 0;

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

  useEffect(() => {
    const getDarkMode = async () => {
      try {
        const storedDarkMode = await AsyncStorage.getItem('darkMode');
        setDarkMode(storedDarkMode ? JSON.parse(storedDarkMode) : false);
      } catch {
        setDarkMode(false);
      }
    };
    getDarkMode();
  }, []);

  const COLORS = darkMode ? DARK_COLORS : MODERN_COLORS;

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
      <LinearGradient colors={COLORS.background} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </LinearGradient>
    );
  }

  if (!task) {
    return (
      <LinearGradient colors={COLORS.background} style={styles.container}>
        <Header />
        <View style={styles.taskContainer}>
          <Text style={[styles.errorText, { color: COLORS.danger } ]}>Task not found!</Text>
        </View>
        <NavBar />
      </LinearGradient>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient colors={COLORS.background} style={styles.safeArea}>
        <SafeAreaView style={{ flex: 1 }}>
          <Header />
          <Animated.View 
            style={[
              styles.taskContainer,
              { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
            ]}
          >
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <Animated.View style={[
                styles.modernCard,
                { backgroundColor: COLORS.card, borderColor: COLORS.border, shadowColor: COLORS.shadow }
              ]}>
                {/* Header with back button */}
                <View style={styles.header}>
                  <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: darkMode ? '#232526' : '#f3f6fa' }]}
                    onPress={() => navigation.goBack()}
                  >
                    <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
                    <Text style={[styles.backButtonText, { color: COLORS.accent }]}>Back</Text>
                  </TouchableOpacity>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: COLORS.card, borderColor: priorityColors[task.priority], borderWidth: 1 }
                  ]}>
                    <Ionicons 
                      name={priorityIcons[task.priority]} 
                      size={18} 
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
                    style={[styles.input, styles.titleInput, styles.modernInput]}
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                    placeholder="Task Title"
                    placeholderTextColor={COLORS.muted}
                  />
                ) : (
                  <Text style={[styles.title, { color: COLORS.text }]}>{task.title}</Text>
                )}

                {/* Category Picker in edit mode */}
                {isEditing && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={[styles.modernLabel, { color: COLORS.text }]}>Category:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                      {CATEGORY_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.name}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: editedCategory === opt.name ? opt.color : '#f0f0f0',
                            borderRadius: 16,
                            paddingHorizontal: 14,
                            paddingVertical: 7,
                            marginRight: 8,
                            marginBottom: 8,
                            borderWidth: editedCategory === opt.name ? 2 : 0,
                            borderColor: '#fff',
                          }}
                          onPress={() => {
                            setEditedCategory(opt.name);
                            if (opt.name !== 'Custom') setCustomCategory('');
                          }}
                        >
                          <Text style={{
                            color: editedCategory === opt.name ? '#fff' : opt.color,
                            fontWeight: '700',
                            fontSize: 15,
                          }}>
                            #{opt.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {editedCategory === 'Custom' && (
                      <TextInput
                        style={[styles.modernInput, { marginTop: 4 }]}
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
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        fontWeight: '700',
                        fontSize: 14,
                        marginRight: 8,
                        ...MODERN_FONT,
                        shadowColor: COLORS.shadow,
                        shadowOpacity: 0.13,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      #{task.category}
                    </Text>
                  </View>
                )}

                {/* Status Picker in edit mode */}
                {isEditing && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={[styles.modernLabel, { color: COLORS.text }]}>Status:</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      {(['not started', 'in progress', 'completed'] as Task['status'][]).map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={{
                            flex: 1,
                            marginHorizontal: 4,
                            paddingVertical: 12,
                            borderRadius: 8,
                            backgroundColor: editedStatus === status ? COLORS.accent2 : '#f0f0f0',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => setEditedStatus(status)}
                        >
                          <Text style={{
                            color: editedStatus === status ? '#fff' : COLORS.accent2,
                            fontWeight: '600',
                            fontSize: 15,
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
                    <Text style={[styles.modernLabel, { color: COLORS.text }]}>Priority:</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      {(['low', 'medium', 'high'] as Task['priority'][]).map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={{
                            flex: 1,
                            marginHorizontal: 4,
                            paddingVertical: 12,
                            borderRadius: 8,
                            backgroundColor: editedPriority === level ? priorityColors[level] : '#f0f0f0',
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                          }}
                          onPress={() => setEditedPriority(level)}
                        >
                          <Ionicons
                            name={priorityIcons[level]}
                            size={19}
                            color={editedPriority === level ? '#fff' : priorityColors[level]}
                            style={{ marginRight: 7 }}
                          />
                          <Text style={{
                            color: editedPriority === level ? '#fff' : priorityColors[level],
                            fontWeight: '600',
                            fontSize: 15,
                          }}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: COLORS.border }]} />

                {/* Task Description */}
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.descriptionInput, styles.modernInput]}
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    placeholder="Task Description"
                    multiline
                    placeholderTextColor={COLORS.muted}
                  />
                ) : (
                  <Text style={[styles.description, { color: COLORS.text }]}>{task.description}</Text>
                )}

                {/* Due Date Edit */}
                {isEditing && (
                  <View style={{ marginBottom: 16 }}>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: COLORS.accent2, marginBottom: 0 }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Edit Due Date</Text>
                    </TouchableOpacity>
                    <Text style={{ marginTop: 8, color: COLORS.text, textAlign: 'center' }}>
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
                    <Ionicons name="calendar-outline" size={20} color={COLORS.accent} />
                    <Text style={[styles.detailText, { color: COLORS.text }]}>
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
                          ? COLORS.success
                          : task.status === 'in progress'
                          ? COLORS.warning
                          : COLORS.muted
                      }
                    />
                    <Text style={[styles.detailText, { color: COLORS.text }]}>
                      Status: {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : (task.completed ? 'Completed' : 'Not Started')}
                    </Text>
                  </View>
                </View>

                {/* Subtask Progress Bar */}
                <View style={{ marginTop: 12, marginBottom: 8 }}>
                  <View style={{
                    height: 8,
                    borderRadius: 8,
                    backgroundColor: '#e0e0e0',
                    overflow: 'hidden',
                  }}>
                    <Animated.View style={{
                      width: `${progress * 100}%`,
                      height: 8,
                      backgroundColor: COLORS.accent3,
                      borderRadius: 8,
                    }} />
                  </View>
                  <Text style={{
                    fontSize: 13,
                    color: COLORS.muted,
                    marginTop: 4,
                    textAlign: 'right',
                  }}>
                    {completedCount} of {subtasks.length} subtasks completed
                  </Text>
                </View>

                {/* Subtasks Section */}
                <View style={[styles.subtasksCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, shadowColor: COLORS.shadow }]}>
                  <Text style={[styles.subtasksTitle, { color: COLORS.text }]}>Subtasks</Text>
                  {/* Move FAB here for visibility */}
                  <TouchableOpacity
                    style={[styles.fabInline, { backgroundColor: COLORS.fab }]}
                    onPress={() => setSubtaskModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={22} color="#fff" />
                   
                  </TouchableOpacity>
                  {subtasksLoading ? (
                    <ActivityIndicator size="small" color={COLORS.accent} style={{ marginTop: 24 }} />
                  ) : subtasks.length === 0 ? (
                    <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 24 }}>No subtasks found.</Text>
                  ) : (
                    <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                      {subtasks.map((s, i) => (
                        <Swipeable
                          key={s.id}
                          renderRightActions={() => renderRightActions(s)}
                          renderLeftActions={() => renderLeftActions(s)}
                          overshootRight={false}
                          overshootLeft={false}
                        >
                          <TouchableOpacity
                            style={[styles.subtaskItem, { backgroundColor: darkMode ? '#232526' : '#f7f7fa', borderColor: COLORS.border, shadowColor: COLORS.shadow }]}
                            onPress={() => handleSubtaskItemPress(s)}
                            activeOpacity={0.7}
                          >
                            <View style={{ padding: 2 }}>
                              <Ionicons
                                name={s.completed ? 'checkmark-circle' : 'ellipse-outline'}
                                size={22}
                                color={s.completed ? COLORS.success : COLORS.muted}
                              />
                            </View>
                            <View style={{ marginLeft: 14, flex: 1 }}>
                              <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: s.completed ? COLORS.muted : COLORS.text,
                                textDecorationLine: s.completed ? 'line-through' : 'none',
                                ...MODERN_FONT,
                              }}>
                                {s.title}
                              </Text>
                              {s.description ? (
                                <Text style={{
                                  fontSize: 13,
                                  color: COLORS.muted,
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

                {/* Subtask Creation Bottom Sheet */}
                <Modal
                  visible={subtaskModalVisible}
                  animationType="slide"
                  transparent
                  onRequestClose={() => setSubtaskModalVisible(false)}
                >
                  <BlurView intensity={60} tint="light" style={styles.blurOverlay}>
                    <Animated.View style={[styles.bottomSheet, { backgroundColor: COLORS.card, borderColor: COLORS.border, shadowColor: COLORS.shadow }]}>
                      <Text style={[styles.bottomSheetTitle, { color: COLORS.text }]}>New Subtask</Text>
                      <TextInput
                        style={[styles.modernInput, { marginBottom: 16 }]}
                        placeholder="Subtask title..."
                        value={newSubtaskTitle}
                        onChangeText={setNewSubtaskTitle}
                        editable={!addingSubtask}
                      />
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity
                          style={[styles.bottomSheetCancel, { backgroundColor: COLORS.muted }]}
                          onPress={() => {
                            setSubtaskModalVisible(false);
                            setNewSubtaskTitle('');
                          }}
                          disabled={addingSubtask}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.bottomSheetCreate, { backgroundColor: COLORS.accent, opacity: addingSubtask || !newSubtaskTitle.trim() ? 0.7 : 1 }]}
                          onPress={handleAddSubtask}
                          disabled={addingSubtask || !newSubtaskTitle.trim()}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600' }}>Create</Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  </BlurView>
                </Modal>

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
                  <BlurView intensity={60} tint="light" style={styles.blurOverlay}>
                    <View style={[styles.subtaskModalCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, shadowColor: COLORS.shadow }]}>
                      {selectedSubtask && (
                        <>
                          <Ionicons
                            name={selectedSubtask.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={32}
                            color={selectedSubtask.completed ? COLORS.success : COLORS.muted}
                            style={{ marginBottom: 12 }}
                          />
                          {editingSubtask ? (
                            <>
                              <TextInput
                                style={[styles.modernInput, styles.subtaskModalTitleInput]}
                                value={editSubtaskTitle}
                                onChangeText={setEditSubtaskTitle}
                                placeholder="Subtask Title"
                              />
                              <TextInput
                                style={[styles.modernInput, styles.subtaskModalDescInput]}
                                value={editSubtaskDescription}
                                onChangeText={setEditSubtaskDescription}
                                placeholder="Subtask Description"
                                multiline
                              />
                              <TouchableOpacity
                                style={[styles.subtaskModalSave, { backgroundColor: COLORS.success }]}
                                onPress={handleSaveSubtaskEdit}
                              >
                                <Text style={styles.subtaskModalSaveText}>Save</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.subtaskModalCancel, { backgroundColor: COLORS.muted }]}
                                onPress={() => setEditingSubtask(false)}
                              >
                                <Text style={styles.subtaskModalCancelText}>Cancel</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <>
                              <Text style={[styles.subtaskModalTitle, { color: COLORS.text }]}>
                                {selectedSubtask.title}
                              </Text>
                              <Text style={[styles.subtaskModalDesc, { color: COLORS.muted }]}>
                                {selectedSubtask.description || 'No description.'}
                              </Text>
                              <TouchableOpacity
                                style={[styles.subtaskModalEdit, { backgroundColor: COLORS.accent }]}
                                onPress={handleEditSubtask}
                              >
                                <Text style={styles.subtaskModalEditText}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.subtaskModalCancel, { backgroundColor: COLORS.muted }]}
                                onPress={() => setSelectedSubtask(null)}
                              >
                                <Text style={styles.subtaskModalCancelText}>Close</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </>
                      )}
                    </View>
                  </BlurView>
                </Modal>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  {isEditing ? (
                    <>
                      <TouchableOpacity
                        style={[styles.button, styles.saveButton, { backgroundColor: COLORS.success }]}
                        onPress={handleSaveEdit}
                      >
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Save Changes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.cancelButton, { backgroundColor: COLORS.muted }]}
                        onPress={() => setIsEditing(false)}
                      >
                        <Ionicons name="close" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.button, styles.editButton, { backgroundColor: COLORS.accent }]}
                        onPress={() => setIsEditing(true)}
                      >
                        <Ionicons name="create-outline" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Edit Task</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.completeButton, { backgroundColor: COLORS.success }]}
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
                        style={[styles.button, styles.deleteButton, { backgroundColor: COLORS.danger }]}
                        onPress={handleDelete}
                      >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Delete Task</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f8fb',
  },
  taskContainer: {
    flex: 1,
    padding: 0,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 0,
  },
  modernCard: {
    backgroundColor: MODERN_COLORS.card,
    borderRadius: 28,
    padding: 32,
    margin: 18,
    shadowColor: MODERN_COLORS.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f6fa',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: MODERN_COLORS.shadow,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  backButtonText: {
    fontSize: 18,
    marginLeft: 8,
    color: MODERN_COLORS.accent,
    fontWeight: '700',
    ...MODERN_FONT,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: MODERN_COLORS.card,
    shadowColor: MODERN_COLORS.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  priorityText: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 7,
    ...MODERN_FONT,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: MODERN_COLORS.text,
    marginBottom: 18,
    ...MODERN_FONT,
    letterSpacing: 0.2,
  },
  titleInput: {
    fontSize: 30,
    fontWeight: '900',
    padding: 16,
    borderColor: MODERN_COLORS.border,
    marginBottom: 18,
    ...MODERN_FONT,
    backgroundColor: '#f3f6fa',
  },
  modernInput: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    borderRadius: 12,
    fontSize: 17,
    color: MODERN_COLORS.text,
    backgroundColor: '#f3f6fa',
    padding: 14,
    ...MODERN_FONT,
    marginBottom: 4,
  },
  modernLabel: {
    fontWeight: '800',
    marginBottom: 8,
    color: MODERN_COLORS.text,
    fontSize: 16,
    ...MODERN_FONT,
  },
  divider: {
    height: 1.5,
    backgroundColor: MODERN_COLORS.border,
    marginVertical: 18,
    borderRadius: 1,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    color: MODERN_COLORS.text,
    marginBottom: 26,
    ...MODERN_FONT,
    fontWeight: '500',
  },
  descriptionInput: {
    minHeight: 110,
    textAlignVertical: 'top',
    padding: 16,
    borderColor: MODERN_COLORS.border,
    marginBottom: 26,
    lineHeight: 28,
    ...MODERN_FONT,
    backgroundColor: '#f3f6fa',
  },
  detailsContainer: {
    marginVertical: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailText: {
    fontSize: 17,
    marginLeft: 15,
    color: MODERN_COLORS.text,
    ...MODERN_FONT,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 34,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: MODERN_COLORS.shadow,
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  editButton: {
    backgroundColor: MODERN_COLORS.accent,
  },
  completeButton: {
    backgroundColor: MODERN_COLORS.success,
  },
  deleteButton: {
    backgroundColor: MODERN_COLORS.danger,
  },
  saveButton: {
    backgroundColor: MODERN_COLORS.success,
  },
  cancelButton: {
    backgroundColor: MODERN_COLORS.muted,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
    ...MODERN_FONT,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 17,
    color: MODERN_COLORS.text,
    ...MODERN_FONT,
    backgroundColor: '#f3f6fa',
  },
  errorText: {
    fontSize: 20,
    color: MODERN_COLORS.danger,
    textAlign: 'center',
    ...MODERN_FONT,
    fontWeight: '700',
  },
  subtasksCard: {
    backgroundColor: MODERN_COLORS.card,
    borderRadius: 22,
    padding: 24,
    marginTop: 34,
    marginBottom: 14,
    shadowColor: MODERN_COLORS.shadow,
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#f0f0f0',
  },
  subtasksTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: MODERN_COLORS.text,
    marginBottom: 18,
    ...MODERN_FONT,
    letterSpacing: 0.2,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7fa',
    borderRadius: 14,
    padding: 17,
    marginBottom: 13,
    shadowColor: MODERN_COLORS.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#f0f0f0',
  },
  fabInline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: MODERN_COLORS.fab,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginBottom: 16,
    marginTop: 2,
    shadowColor: MODERN_COLORS.shadow,
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 7,
    elevation: 2,
  },
  fabInlineText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 10,
    ...MODERN_FONT,
    letterSpacing: 0.2,
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(240,245,255,0.25)',
  },
  bottomSheet: {
    backgroundColor: MODERN_COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 32,
    width: '100%',
    shadowColor: MODERN_COLORS.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -10 },
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 0.5,
    borderColor: '#f0f0f0',
  },
  bottomSheetTitle: {
    fontWeight: '900',
    fontSize: 22,
    color: MODERN_COLORS.text,
    marginBottom: 22,
    textAlign: 'center',
    ...MODERN_FONT,
    letterSpacing: 0.2,
  },
  bottomSheetCancel: {
    backgroundColor: MODERN_COLORS.muted,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 26,
    marginRight: 10,
  },
  bottomSheetCreate: {
    backgroundColor: MODERN_COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 26,
  },
  subtaskModalCard: {
    backgroundColor: MODERN_COLORS.card,
    borderRadius: 24,
    padding: 32,
    width: '88%',
    shadowColor: MODERN_COLORS.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
    alignItems: 'center',
    marginBottom: 90,
    borderWidth: 0.5,
    borderColor: '#f0f0f0',
  },
  subtaskModalTitle: {
    fontWeight: '900',
    fontSize: 23,
    color: MODERN_COLORS.text,
    marginBottom: 14,
    textAlign: 'center',
    ...MODERN_FONT,
    letterSpacing: 0.2,
  },
  subtaskModalDesc: {
    fontSize: 17,
    color: MODERN_COLORS.muted,
    textAlign: 'center',
    marginBottom: 22,
    ...MODERN_FONT,
    fontWeight: '500',
  },
  subtaskModalTitleInput: {
    fontWeight: '800',
    fontSize: 20,
    color: MODERN_COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
    backgroundColor: '#f3f6fa',
  },
  subtaskModalDescInput: {
    fontSize: 16,
    color: MODERN_COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
    width: '100%',
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: '#f3f6fa',
  },
  subtaskModalSave: {
    backgroundColor: MODERN_COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginBottom: 12,
  },
  subtaskModalSaveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    ...MODERN_FONT,
  },
  subtaskModalEdit: {
    backgroundColor: MODERN_COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginBottom: 12,
  },
  subtaskModalEditText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    ...MODERN_FONT,
  },
  subtaskModalCancel: {
    backgroundColor: MODERN_COLORS.muted,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  subtaskModalCancelText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    ...MODERN_FONT,
  },
});

export default TaskDetail;