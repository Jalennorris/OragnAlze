import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, Dimensions, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Header from '@/components/header';
import NavBar from '@/components/Navbar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';
import { useColorScheme } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Define types for the task structure
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  category?: string;
}

// Configure locale for the calendar
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  dayNames: [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ],
  dayNamesShort: [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ],
  today: "Today"
};
LocaleConfig.defaultLocale = 'en';

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: { dots: { key: string, color: string }[], marked: boolean, customStyles?: any } }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7) + '-01');
  const [comments, setComments] = useState<{ [key: string]: string }>({}); // State for comments by task ID
  const [commentInput, setCommentInput] = useState<string>(''); // State for comment input
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null); // State for selected task ID
  const modalAnim = useRef(new Animated.Value(0)).current; // For modal fade animation
  const [pendingMonth, setPendingMonth] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filter, setFilter] = useState<{ priority?: string; status?: string }>({});
  const [isConnected, setIsConnected] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const effectiveDark = theme === 'system' ? isDark : theme === 'dark';

  // Debounced month change handler
  const debouncedSetCurrentMonth = useRef(
    debounce((month: string) => {
      setCurrentMonth(month);
    }, 400)
  ).current;

  // Improved error message mapping
  const getUserFriendlyError = (msg: string) => {
    if (msg.includes('User ID not found')) return 'User not found. Please log in again.';
    if (msg.includes('Failed to fetch')) return 'Unable to load tasks. Please check your connection.';
    if (msg.includes('Network request failed')) return 'Network error. Please check your internet connection.';
    return msg || 'An unexpected error occurred.';
  };

  // Fetch tasks with retry logic
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found in AsyncStorage');
      let url = `http://localhost:8080/api/tasks/user/${userId}?month=${currentMonth.slice(0, 7)}`;
      if (filter.priority) url += `&priority=${filter.priority}`;
      if (filter.status) url += `&status=${filter.status}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Unable to load tasks. Please check your connection.');
      const data = await response.json();
      const mappedTasks = data.map((task: any) => ({
        id: task.taskId,
        title: task.taskName,
        description: task.taskDescription,
        dueDate: task.deadline.split('T')[0],
        completed: task.completed,
        priority: task.priority.toLowerCase(),
        recurrence: task.recurrence || 'none',
        category: task.category,
      }));
      setTasks(mappedTasks);
    } catch (err: any) {
      setError(getUserFriendlyError(err.message || 'Error fetching tasks'));
      // Retry automatically up to 2 times with delay
      if (retryCount < 2) {
        setTimeout(() => setRetryCount(c => c + 1), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, filter, retryCount]);

  useEffect(() => {
    const datesWithTasks: { [key: string]: { dots: { key: string, color: string }[], marked: boolean, customStyles?: any } } = {};

    tasks.forEach(task => {
      const overdue = isOverdue(task.dueDate) && !task.completed;
      if (datesWithTasks[task.dueDate]) {
        datesWithTasks[task.dueDate].dots.push({ key: task.id, color: getPriorityColor(task.priority) });
      } else {
        datesWithTasks[task.dueDate] = {
          marked: true,
          dots: [{ key: task.id, color: getPriorityColor(task.priority) }],
          ...(overdue && {
            customStyles: {
              container: {
                borderColor: '#F44336',
                borderWidth: 2,
              },
            },
          }),
        };
      }
      // If any task for the date is overdue, mark the date as overdue
      if (overdue) {
        datesWithTasks[task.dueDate].customStyles = {
          container: {
            borderColor: '#F44336',
            borderWidth: 2,
          },
        };
      }
    });

    setMarkedDates(datesWithTasks);

    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [tasks]);

  useEffect(() => {
    const loadComments = async () => {
      try {
        const storedComments = await AsyncStorage.getItem('comments');
        if (storedComments) {
          setComments(JSON.parse(storedComments));
        }
      } catch (err) {
        console.error('Error loading comments:', err);
      }
    };
    loadComments();
  }, []);

  useEffect(() => {
    if (isModalVisible) {
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isModalVisible]);

  useEffect(() => {
    if (pendingMonth) {
      debouncedSetCurrentMonth(pendingMonth);
    }
  }, [pendingMonth]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
      if (state.isConnected) {
        syncOfflineQueue();
      }
    });
    return () => unsubscribe();
  }, []);

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    for (const action of offlineQueue) {
      try {
        if (action.type === 'delete') {
          await fetch(`http://localhost:8080/api/tasks/${action.taskId}`, { method: 'DELETE' });
        }
        // Add more action types as needed
      } catch (e) {
        // If sync fails, keep in queue
        return;
      }
    }
    setOfflineQueue([]);
  };

  const getPriorityColor = (priority: string) => {
    if (effectiveDark) {
      switch (priority) {
        case 'low':
          return '#AED581'; // lighter green
        case 'medium':
          return '#FFD54F'; // lighter yellow
        case 'high':
          return '#EF9A9A'; // lighter red
        default:
          return '#90caf9'; // lighter blue
      }
    }
    switch (priority) {
      case 'low':
        return '#8BC34A'; // Green
      case 'medium':
        return '#FFC107'; // Yellow
      case 'high':
        return '#F44336'; // Red
      default:
        return '#00adf5'; // Blue
    }
  };

  const handleDayPress = (date: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Haptic feedback
    console.log('Selected date:', date); // Debug log
    setSelectedDate(date);
    setModalVisible(true);
  };

  const saveComment = async () => {
    if (!selectedTaskId) return;
    try {
      const updated = { ...comments, [selectedTaskId]: commentInput };
      setComments(updated);
      await AsyncStorage.setItem('comments', JSON.stringify(updated));
      Alert.alert('Comment Saved', 'Your comment has been saved successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save comment.');
    }
  };

  const handleEditTask = (taskId: string) => {
    navigation.navigate('editTaskScreen', { taskId });
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      if (!isConnected) {
        setOfflineQueue(prev => [...prev, { type: 'delete', taskId }]);
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setComments(prev => {
          const updated = { ...prev };
          delete updated[taskId];
          AsyncStorage.setItem('comments', JSON.stringify(updated));
          return updated;
        });
        if (selectedTaskId === taskId) {
          setSelectedTaskId(null);
          setCommentInput('');
        }
        return;
      }
      const response = await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      setTasks(prev => prev.filter(task => task.id !== taskId));
      // Remove comment if exists
      setComments(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        AsyncStorage.setItem('comments', JSON.stringify(updated));
        return updated;
      });
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
        setCommentInput('');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting task');
    } finally {
      setLoading(false);
    }
  };

  const recurrenceIcon = (recurrence?: string) => {
    if (!recurrence || recurrence === 'none') return null;
    let icon = '';
    if (recurrence === 'daily') icon = 'repeat';
    else if (recurrence === 'weekly') icon = 'calendar-outline';
    else if (recurrence === 'monthly') icon = 'calendar-sharp';
    return (
      <Ionicons
        name={icon as any}
        size={16}
        color={effectiveDark ? '#FFD54F' : '#6a11cb'}
        style={{ marginLeft: 4 }}
        accessibilityLabel={`Recurring: ${recurrence}`}
      />
    );
  };

  const filteredTasksForDate = tasks
    .filter(task => task.dueDate === selectedDate)
    .filter(task => !filter.priority || task.priority === filter.priority)
    .filter(task => !filter.status || (filter.status === 'completed' ? task.completed : !task.completed));

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View
      style={[
        styles.taskItem,
        { borderLeftColor: getPriorityColor(item.priority), backgroundColor: effectiveDark ? '#232323' : '#ffffff' }
      ]}
      accessible={true}
      accessibilityLabel={`Task: ${item.title}${item.recurrence && item.recurrence !== 'none' ? ', Recurring' : ''}`}
      accessibilityHint={`Due on ${item.dueDate}. Priority: ${item.priority}. ${item.completed ? 'Completed.' : 'Not completed.'}${item.recurrence && item.recurrence !== 'none' ? `. Recurs ${item.recurrence}.` : ''}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.taskTitle, effectiveDark && { color: '#fff' }]} allowFontScaling>
          {item.title}
        </Text>
        {recurrenceIcon(item.recurrence)}
      </View>
      <Text style={[styles.taskDescription, effectiveDark && { color: '#ccc' }]} allowFontScaling>
        {item.description}
      </Text>
      <Text style={[styles.taskDueDate, effectiveDark && { color: '#bbb' }]} allowFontScaling>
        Due: {item.dueDate}
      </Text>
      <View style={styles.taskActionsRow}>
        <TouchableOpacity
          style={styles.commentButton}
          onPress={() => {
            if (selectedTaskId === item.id) {
              setSelectedTaskId(null);
              setCommentInput('');
            } else {
              setSelectedTaskId(item.id);
              setCommentInput(comments[item.id] || '');
            }
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={selectedTaskId === item.id ? 'Hide Comment' : 'Add or View Comment'}
          accessibilityHint="Opens comment input for this task"
        >
          <Text style={styles.commentButtonText} allowFontScaling>
            {selectedTaskId === item.id ? 'Hide Comment' : 'Add/View Comment'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditTask(item.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Edit Task"
          accessibilityHint={`Edit the task ${item.title}`}
        >
          <Ionicons name="create-outline" size={18} color="#fff" accessibilityLabel="Edit Icon" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTask(item.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Delete Task"
          accessibilityHint={`Delete the task ${item.title}`}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" accessibilityLabel="Delete Icon" />
        </TouchableOpacity>
      </View>
      {selectedTaskId === item.id && comments[item.id] && (
        <Text style={[styles.savedComment, effectiveDark && { color: '#bbb' }]} allowFontScaling>
          Comment: {comments[item.id]}
        </Text>
      )}
    </View>
  );

  // Theme switcher UI
  const ThemeSwitcher = () => (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-end', margin: 12 }}>
      {['system', 'light', 'dark'].map(opt => (
        <TouchableOpacity
          key={opt}
          style={{
            backgroundColor: theme === opt ? (effectiveDark ? '#FFD54F' : '#6a11cb') : (effectiveDark ? '#444' : '#eee'),
            padding: 8,
            borderRadius: 8,
            marginLeft: 6,
          }}
          onPress={() => setTheme(opt as any)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${opt} theme`}
          accessibilityHint={`Switch calendar to ${opt} mode`}
        >
          <Text style={{ color: theme === opt ? (effectiveDark ? '#232323' : '#fff') : (effectiveDark ? '#FFD54F' : '#6a11cb') }} allowFontScaling>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Overdue check
  const isOverdue = (date: string) => {
    const today = new Date();
    const d = new Date(date);
    return d < new Date(today.toISOString().slice(0, 10)) && d.toISOString().slice(0, 10) !== today.toISOString().slice(0, 10);
  };

  // Task summary for selected date
  const summary = (() => {
    if (!selectedDate) return null;
    const all = tasks.filter(t => t.dueDate === selectedDate);
    const completed = all.filter(t => t.completed);
    return { total: all.length, completed: completed.length };
  })();

  return (
    <SafeAreaView style={[styles.safeArea, effectiveDark && { backgroundColor: '#181818' }]}>
      <View style={[styles.container, effectiveDark && { backgroundColor: '#181818' }]}>
        <Header />
        {/* Theme Switcher */}
        <ThemeSwitcher />
        {/* Filter Button */}
        <TouchableOpacity
          style={{
            alignSelf: 'flex-end',
            margin: 12,
            backgroundColor: effectiveDark ? '#444' : '#eee',
            padding: 8,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => setFilterModalVisible(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Filter Tasks"
          accessibilityHint="Open filter options for tasks"
        >
          <Ionicons name="filter" size={18} color={effectiveDark ? '#FFD54F' : '#6a11cb'} />
          <Text style={{ color: effectiveDark ? '#FFD54F' : '#6a11cb', marginLeft: 4 }} allowFontScaling>Filter</Text>
        </TouchableOpacity>
        {/* Filter Modal */}
        <Modal
          isVisible={filterModalVisible}
          onBackdropPress={() => setFilterModalVisible(false)}
          useNativeDriver
          style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
        >
          <View style={[styles.modalContent, effectiveDark && { backgroundColor: '#232323' }]}>
            <Text style={[styles.modalTitle, effectiveDark && { color: '#FFD54F' }]} allowFontScaling>Filter Tasks</Text>
            <Text style={{ color: effectiveDark ? '#fff' : '#333', marginTop: 8 }} allowFontScaling>Priority:</Text>
            <View style={{ flexDirection: 'row', marginVertical: 8 }}>
              {['low', 'medium', 'high'].map(p => (
                <TouchableOpacity
                  key={p}
                  style={{
                    backgroundColor: filter.priority === p ? (effectiveDark ? '#FFD54F' : '#6a11cb') : (effectiveDark ? '#444' : '#eee'),
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                  onPress={() => setFilter(f => ({ ...f, priority: f.priority === p ? undefined : p }))}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${p} priority`}
                  accessibilityHint={`Show only ${p} priority tasks`}
                >
                  <Text style={{ color: filter.priority === p ? (effectiveDark ? '#232323' : '#fff') : (effectiveDark ? '#FFD54F' : '#6a11cb') }} allowFontScaling>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: effectiveDark ? '#fff' : '#333', marginTop: 8 }} allowFontScaling>Status:</Text>
            <View style={{ flexDirection: 'row', marginVertical: 8 }}>
              {['completed', 'pending'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={{
                    backgroundColor: filter.status === s ? (effectiveDark ? '#FFD54F' : '#6a11cb') : (effectiveDark ? '#444' : '#eee'),
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                  onPress={() => setFilter(f => ({ ...f, status: f.status === s ? undefined : s }))}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${s} status`}
                  accessibilityHint={`Show only ${s} tasks`}
                >
                  <Text style={{ color: filter.status === s ? (effectiveDark ? '#232323' : '#fff') : (effectiveDark ? '#FFD54F' : '#6a11cb') }} allowFontScaling>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.saveButton, { marginTop: 12 }]}
              onPress={() => setFilterModalVisible(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Apply Filter"
              accessibilityHint="Apply selected filters"
            >
              <Text style={styles.saveButtonText} allowFontScaling>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeButton, { marginTop: 8 }]}
              onPress={() => { setFilter({}); setFilterModalVisible(false); }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear Filter"
              accessibilityHint="Clear all filters"
            >
              <Text style={styles.closeButtonText} allowFontScaling>Clear</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        <Animated.View style={[styles.calendarContainer, effectiveDark && { backgroundColor: '#232323' }, { opacity: fadeAnim }]}>
          {loading && (
            <Text style={{ textAlign: 'center', color: effectiveDark ? '#90caf9' : '#6a11cb', marginVertical: 10 }} allowFontScaling>
              Loading tasks...
            </Text>
          )}
          {error && (
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <Text style={{ textAlign: 'center', color: effectiveDark ? '#EF9A9A' : '#F44336', marginBottom: 8 }} allowFontScaling>
                {error}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: effectiveDark ? '#FFD54F' : '#6a11cb',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                onPress={() => { setRetryCount(c => c + 1); setError(null); }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Retry"
                accessibilityHint="Retry loading tasks"
              >
                <Text style={{ color: effectiveDark ? '#232323' : '#fff', fontWeight: 'bold' }} allowFontScaling>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Calendar
            current={currentMonth}
            markedDates={markedDates}
            markingType={'multi-dot'}
            onDayPress={(day) => handleDayPress(day.dateString)}
            onMonthChange={(month) => {
              const monthStr = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
              setPendingMonth(monthStr);
            }}
            theme={{
              backgroundColor: effectiveDark ? '#181818' : '#ffffff',
              calendarBackground: effectiveDark ? '#181818' : '#ffffff',
              textSectionTitleColor: effectiveDark ? '#fff' : '#000',
              selectedDayBackgroundColor: effectiveDark ? '#90caf9' : '#22223b',
              selectedDayTextColor: effectiveDark ? '#181818' : '#ffffff',
              todayTextColor: effectiveDark ? '#90caf9' : '#6a11cb',
              dayTextColor: effectiveDark ? '#fff' : '#000',
              textDisabledColor: effectiveDark ? '#757575' : '#6a11cb',
              dotColor: effectiveDark ? '#90caf9' : '#6a11cb',
              selectedDotColor: effectiveDark ? '#181818' : '#ffffff',
              arrowColor: effectiveDark ? '#fff' : '#000',
              monthTextColor: effectiveDark ? '#fff' : '#000',
              indicatorColor: effectiveDark ? '#90caf9' : '#6a11cb',
              textDayFontWeight: '500',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 14,
              'stylesheet.calendar.main': {
                container: {
                  padding: 0,
                  flex: 1,
                },
                week: {
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                  marginVertical: 2,
                  width: Dimensions.get('window').width,
                },
              },
              'stylesheet.day.basic': {
                base: {
                  width: Math.floor(Dimensions.get('window').width / 5) - 8,
                  height: Math.floor(Dimensions.get('window').height / 14),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: effectiveDark ? '#333' : '#e0e0e0',
                  margin: 4,
                  backgroundColor: effectiveDark ? '#232323' : '#fff',
                },
                selected: {
                  backgroundColor: effectiveDark ? '#90caf9' : '#6a11cb',
                  borderRadius: 8,
                },
                today: {
                  backgroundColor: effectiveDark ? '#232323' : '#f0e6ff',
                  borderRadius: 8,
                },
              },
            }}
            style={{ borderRadius: 12, margin: 8 }}
            accessible={true}
            accessibilityLabel="Calendar"
            accessibilityHint="Displays your tasks by date"
            accessibilityRole="adjustable"
            // Add accessibility props to calendar days
            dayComponent={({ date, state, marking }) => {
              // Overdue highlight
              const overdue = isOverdue(date.dateString) && tasks.some(t => t.dueDate === date.dateString && !t.completed);
              return (
                <TouchableOpacity
                  onPress={() => handleDayPress(date.dateString)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${date.day}, ${date.dateString}${marking?.dots?.some(dot => {
                    const task = tasks.find(t => t.id === dot.key);
                    return task && task.recurrence && task.recurrence !== 'none';
                  }) ? ', Has recurring tasks' : ''}${overdue ? ', Overdue tasks' : ''}`}
                  accessibilityHint={marking?.marked ? 'Has tasks' : 'No tasks'}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: Math.floor(Dimensions.get('window').width / 5) - 8,
                    height: Math.floor(Dimensions.get('window').height / 14),
                    backgroundColor:
                      state === 'today'
                        ? (effectiveDark ? '#232323' : '#f0e6ff')
                        : state === 'selected'
                        ? (effectiveDark ? '#90caf9' : '#6a11cb')
                        : (effectiveDark ? '#232323' : '#fff'),
                    borderRadius: 8,
                    borderWidth: overdue ? 2 : 1,
                    borderColor: overdue ? '#F44336' : (effectiveDark ? '#333' : '#e0e0e0'),
                    margin: 4,
                  }}
                >
                  <Text
                    style={{
                      color:
                        state === 'disabled'
                          ? (effectiveDark ? '#757575' : '#6a11cb')
                          : (effectiveDark ? '#fff' : '#000'),
                      fontWeight: '500',
                      fontSize: 16,
                    }}
                    allowFontScaling
                  >
                    {date.day}
                  </Text>
                  {/* Render dots for tasks */}
                  {marking?.dots && (
                    <View style={{ flexDirection: 'row', marginTop: 2 }}>
                      {marking.dots.map((dot, idx) => {
                        const task = tasks.find(t => t.id === dot.key);
                        return (
                          <View
                            key={dot.key || idx}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: dot.color,
                              marginHorizontal: 1,
                              borderWidth: (task && task.recurrence && task.recurrence !== 'none') ? 1 : 0,
                              borderColor: (task && task.recurrence && task.recurrence !== 'none') ? (effectiveDark ? '#FFD54F' : '#6a11cb') : 'transparent',
                            }}
                            accessible={false}
                          />
                        );
                      })}
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
        <Modal
          isVisible={isModalVisible}
          onBackdropPress={() => setModalVisible(false)}
          useNativeDriver
          backdropTransitionOutTiming={0}
          style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
          animationInTiming={0}
          animationOutTiming={0}
          accessible={true}
          accessibilityLabel="Task Modal"
          accessibilityHint="Shows tasks and actions for the selected date"
        >
          <Animated.View
            style={[
              styles.modalContent,
              effectiveDark && { backgroundColor: '#232323' },
              {
                opacity: modalAnim,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.modalTitle, effectiveDark && { color: '#90caf9' }]} allowFontScaling>
              Tasks for {selectedDate}
            </Text>
            {/* Task Summary */}
            {selectedDate && summary && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
                <Text style={{ color: effectiveDark ? '#FFD54F' : '#6a11cb', fontWeight: 'bold', marginRight: 12 }} allowFontScaling>
                  Total: {summary.total}
                </Text>
                <Text style={{ color: effectiveDark ? '#8BC34A' : '#388e3c', fontWeight: 'bold' }} allowFontScaling>
                  Completed: {summary.completed}
                </Text>
              </View>
            )}
            {selectedDate && (
              <>
                {filteredTasksForDate.length === 0 ? (
                  <Text style={[styles.emptyStateText, effectiveDark && { color: '#bbb' }]} allowFontScaling>
                    No tasks for this date. Add one now!
                  </Text>
                ) : (
                  <FlatList
                    data={filteredTasksForDate}
                    renderItem={renderTaskItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.taskList}
                    getItemLayout={(_, index) => ({
                      length: 110,
                      offset: 110 * index,
                      index,
                    })}
                    accessible={true}
                    accessibilityLabel="Task List"
                    accessibilityHint="List of tasks for the selected date"
                  />
                )}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('addTaskScreen')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Add Task"
                  accessibilityHint="Navigate to add a new task"
                >
                  <Text style={styles.addButtonText} allowFontScaling>
                    Add Task
                  </Text>
                </TouchableOpacity>
                {selectedTaskId && (
                  <>
                    <Text style={[styles.commentLabel, effectiveDark && { color: '#fff' }]} allowFontScaling>
                      Comment for Task:
                    </Text>
                    <TextInput
                      style={[
                        styles.commentInput,
                        { minHeight: 60, maxHeight: 160 },
                        effectiveDark && { backgroundColor: '#181818', color: '#fff', borderColor: '#444' }
                      ]}
                      placeholder="Write a comment..."
                      placeholderTextColor={effectiveDark ? '#888' : '#999'}
                      value={commentInput}
                      onChangeText={setCommentInput}
                      multiline
                      textAlignVertical="top"
                      allowFontScaling
                      accessible={true}
                      accessibilityLabel="Comment Input"
                      accessibilityHint="Write or edit your comment for this task"
                    />
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={saveComment}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Save Comment"
                      accessibilityHint="Save your comment for this task"
                    >
                      <Text style={styles.saveButtonText} allowFontScaling>
                        Save Comment
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close Modal"
              accessibilityHint="Close the task modal"
            >
              <Text style={styles.closeButtonText} allowFontScaling>
                Close
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
        <NavBar />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Ensure SafeAreaView fills the screen
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Ensure content stretches to fill the screen
  },
  calendarContainer: {
    width: '96%',
    height: Dimensions.get('window').height * 0.9, // Increased height
    backgroundColor: '#fff',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6a11cb',
    marginBottom: 15,
    textAlign: 'center',
  },
  taskList: {
    paddingBottom: 20,
  },
  taskItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  taskDueDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: '#6a11cb',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    maxHeight: 160,
  },
  saveButton: {
    backgroundColor: '#6a11cb',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  savedComment: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  commentButton: {
    backgroundColor: '#6a11cb',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  commentButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#FFC107',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 4,
  },
  taskActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: '#6a11cb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default CalendarScreen;