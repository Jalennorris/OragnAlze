import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  useColorScheme,
  Alert,
  Share,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import TaskItem from '../components/taskItem';
import Header from '../components/header';
import Greeting from '@/components/Greeting';
import NavBar from '@/components/Navbar';
import FilterBar from '@/components/FilterBar';
import MotivationalQuotes from '@/components/MotivationalQoutes';
import SearchBar from '@/components/SearchBar';
import TaskSummary from '@/components/TaskSummary';
import FutureTask from '@/components/FutureTask';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import Loader from '@/components/Loader';
import AskAIButton from '@/components/AskAIButton';

import { useAuth } from '../Provider/AuthProvider';
import {router} from 'expo-router';

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

const LIGHT_COLORS = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336',
  today: '#F44336',
  text: '#000',
  background: '#fff',
  searchBackground: '#f1f1f1',
  placeholder: '#888',
};

const DARK_COLORS = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336',
  today: '#F44336',
  text: '#feefe9',
  background: '#121212',
  searchBackground: '#333',
  placeholder: '#888',
};

const TASK_ITEM_HEIGHT = 80;

const TaskList: React.FC<{
  tasks: Task[];
  handleTaskPress: (taskId: string) => void;
  toggleTaskCompletion: (taskId: number) => void;
  deleteTask: (taskId: number) => void;
  getPriorityColor: (priority: 'low' | 'medium' | 'high') => string;
  refreshing: boolean;
  onRefresh: () => void;
  ListHeaderComponent: React.ReactNode;
  searchQuery: string;
  isOffline?: boolean;
}> = ({
  tasks,
  handleTaskPress,
  toggleTaskCompletion,
  deleteTask,
  getPriorityColor,
  refreshing,
  onRefresh,
  ListHeaderComponent,
  searchQuery,
  isOffline = false,
}) => {
  const filteredTasks = searchQuery
    ? tasks.filter(
        (task) =>
          task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.taskDescription.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  const getItemLayout = useCallback(
    (_: Task[] | null | undefined, index: number) => ({
      length: TASK_ITEM_HEIGHT,
      offset: TASK_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={filteredTasks}
      keyExtractor={(item) => item.taskId.toString()}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          onPress={() => handleTaskPress(item.taskId.toString())}
          onToggleCompletion={() => toggleTaskCompletion(item.taskId)}
          onDelete={() => deleteTask(item.taskId)}
          priorityColor={getPriorityColor(item.priority)}
          isOffline={isOffline}
        />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={searchQuery ? null : ListHeaderComponent}
      getItemLayout={getItemLayout}
      windowSize={11}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      removeClippedSubviews
      ItemSeparatorComponent={() => <View style={{ height: 30 }} />}
    />
  );
};

const CompletedTasksSection: React.FC<{
  completedTasks: Task[];
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
  handleTaskPress: (taskId: string) => void;
  toggleTaskCompletion: (taskId: number) => void;
  deleteTask: (taskId: number) => void;
  getPriorityColor: (priority: 'low' | 'medium' | 'high') => string;
  isOffline: boolean;
  shareTask: (task: Task) => void;
  colors: typeof LIGHT_COLORS | typeof DARK_COLORS;
}> = ({
  completedTasks,
  showCompleted,
  setShowCompleted,
  handleTaskPress,
  toggleTaskCompletion,
  deleteTask,
  getPriorityColor,
  isOffline,
  shareTask,
  colors,
}) => {
  if (!completedTasks.length) return null;
  return (
    <View style={styles.completedSection}>
      <TouchableOpacity
        style={styles.completedHeader}
        onPress={() => setShowCompleted(!showCompleted)}
        accessibilityRole="button"
        accessibilityLabel="Toggle completed tasks"
      >
        <Ionicons
          name={showCompleted ? 'chevron-down' : 'chevron-forward'}
          size={24}
          color={colors.text}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.completedTitle}>
          Completed Tasks ({completedTasks.length})
        </Text>
      </TouchableOpacity>
      {showCompleted && (
        <View style={styles.completedList}>
          {completedTasks.map((task) => (
            <TaskItem
              key={task.taskId.toString()}
              task={task}
              onPress={() => handleTaskPress(task.taskId.toString())}
              onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
              onDelete={() => deleteTask(task.taskId)}
              priorityColor={getPriorityColor(task.priority)}
              isOffline={isOffline}
              onShare={() => shareTask(task)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userId, signOut } = useAuth();
  // const colorScheme = useColorScheme();
  // const COLORS = colorScheme === 'light' ? LIGHT_COLORS : DARK_COLORS;

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const COLORS = colorScheme === 'light' ? LIGHT_COLORS : DARK_COLORS;

  // Listen for navigation focus to update dark mode immediately after settings change
  useEffect(() => {
    const updateColorScheme = async () => {
      const storedDarkMode = await AsyncStorage.getItem('darkMode');
      if (storedDarkMode !== null) {
        setColorScheme(JSON.parse(storedDarkMode) ? 'dark' : 'light');
      }
    };
    updateColorScheme();
    const unsubscribe = navigation.addListener('focus', updateColorScheme);
    return unsubscribe;
  }, [navigation]);

  const [showFutureTasks, setShowFutureTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'completed'>('date');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'work' | 'personal' | 'school' | 'other'>('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const isInitialLoad = useRef(true);
  const [showSpinner, setShowSpinner] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const PAGE_WIDTH = Dimensions.get('window').width;

  const onSearch = useCallback((query: string) => setSearchQuery(query), []);

  const loadTasksFromCache = async () => {
    try {
      const cachedTasks = await AsyncStorage.getItem('cachedTasks');
      if (cachedTasks) {
        const parsedTasks: Task[] = JSON.parse(cachedTasks);
        setTasks(parsedTasks);
        setError('');
        return true;
      }
      return false;
    } catch (cacheError) {
      setError('Failed to load cached tasks.');
      return false;
    }
  };

  const syncOfflineChanges = useCallback(async () => {
    try {
      const offlineChanges = await AsyncStorage.getItem('offlineChanges');
      if (!offlineChanges) return;

      const changes = JSON.parse(offlineChanges);
      const netInfoState = await NetInfo.fetch();
      const online = netInfoState.isConnected && netInfoState.isInternetReachable;

      if (!online) return;

      if (!userId) return;

      const apiUrl = `http://localhost:8080/api/tasks/user/${userId}/sync`;
      const response = await axios.post(apiUrl, { changes });

      if (response.status === 200) {
        await AsyncStorage.removeItem('offlineChanges');
      }
    } catch (error) {
      console.error('Error syncing offline changes:', error);
    }
  }, [userId]);

  const getTasks = useCallback(
    async (forceRefresh = false, showLoader = true) => {
      if (showLoader) setShowSpinner(true);
      setError('');

      try {
        if (!userId) {
          navigation.navigate("login");
          throw new Error("User ID not found");
        }

        const apiUrl = `http://localhost:8080/api/tasks/user/${userId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          if (response.status === 404) {
            setTasks([]);
            await AsyncStorage.removeItem('cachedTasks');
            setError("No tasks found. Add some!");
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          const fetchedTasks: Task[] = await response.json();
          const offlineChanges = await AsyncStorage.getItem('offlineChanges');
          const changes = offlineChanges ? JSON.parse(offlineChanges) : [];

          const resolvedTasks = fetchedTasks.map((task) => {
            const conflict = changes.find((change) => change.taskId === task.taskId);
            if (conflict) {
              if (conflict.type === 'edit') {
                return { ...task, ...conflict.updatedTask };
              }
            }
            return task;
          });

          setTasks(resolvedTasks);
          await AsyncStorage.setItem('cachedTasks', JSON.stringify(resolvedTasks));
        }
      } catch (err) {
        const errorMessage = (err as Error).message || 'An unknown error occurred';
        const cacheLoaded = await loadTasksFromCache();
        if (cacheLoaded) {
          setError('Failed to fetch tasks. Showing cached data.');
        } else {
          setError(`Failed to fetch tasks: ${errorMessage}`);
          setTasks([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        }
        setShowSpinner(false);
      }
    },
    [navigation, userId]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const initializeTasks = async () => {
      try {
        if (!userId) {
          navigation.navigate("login"); // Directly navigate to login
          return; // Stop further execution
        }

        await getTasks();
        syncOfflineChanges();

        // Set up interval only if userId exists
        interval = setInterval(() => {
          getTasks(false, false);
        }, 10000);
      } catch (error) {
        console.error("Error initializing tasks:", error);
      }
    };

    initializeTasks();

    return () => {
      if (interval) clearInterval(interval); // Clear interval on component unmount
    };
  }, [getTasks, syncOfflineChanges, navigation, userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError('');
    getTasks(true, true);
  }, [getTasks]);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatLocalDate = (dateString: string) => {
    try {
      if (!dateString) return 'Invalid Date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { timeZone: 'America/Chicago' });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  const today = new Date();
  const todayString = today.toLocaleDateString('en-US', { timeZone: 'America/Chicago' });

  const startOfWeek = new Date(today);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const handleTaskPress = useCallback(
    (taskId: string): void => {
      if (taskId) {
        navigation.navigate('taskDetail', { taskId });
      }
    },
    [navigation]
  );

  const toggleTaskCompletion = useCallback(async (taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.taskId === taskId ? { ...task, completed: !task.completed } : task
      )
    );

    const netInfoState = await NetInfo.fetch();
    const online = !!netInfoState.isConnected;

    if (!online) {
      const offlineChanges = await AsyncStorage.getItem('offlineChanges');
      const changes = offlineChanges ? JSON.parse(offlineChanges) : [];
      changes.push({ type: 'edit', taskId, updatedTask: { completed: true } });
      await AsyncStorage.setItem('offlineChanges', JSON.stringify(changes));
      Alert.alert("Offline Action", "Task status changed locally. Syncing requires internet connection.");
    } else {
      try {
        const task = tasks.find((t) => t.taskId === taskId);
        const newCompleted = task ? !task.completed : true;
        await axios.patch(`http://localhost:8080/api/tasks/${taskId}`, { completed: newCompleted });
      } catch (error) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.taskId === taskId ? { ...task, completed: !task.completed } : task
          )
        );
        Alert.alert('Error', 'Failed to update task status on server.');
      }
    }
  }, [tasks]);

  const deleteTask = useCallback((taskId: number) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            const netInfoState = await NetInfo.fetch();
            const online = netInfoState.isConnected && netInfoState.isInternetReachable;

            setTasks((prevTasks) => prevTasks.filter((task) => task.taskId !== taskId));

            if (!online) {
              const offlineChanges = await AsyncStorage.getItem('offlineChanges');
              const changes = offlineChanges ? JSON.parse(offlineChanges) : [];
              changes.push({ type: 'delete', taskId });
              await AsyncStorage.setItem('offlineChanges', JSON.stringify(changes));
              Alert.alert("Offline Action", "Task deleted locally. Syncing requires internet connection.");
            } else {
              try {
                await axios.delete(`http://localhost:8080/api/tasks/${taskId}`);
              } catch (error: any) {
                try {
                  const response = await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) {
                    const errorText = await response.text();
                    Alert.alert('Error', `Failed to delete task from server. Server says: ${errorText}`);
                  }
                } catch (fetchError) {
                  Alert.alert('Error', 'Failed to delete task from server. Please check connection and server logs.');
                }
              }
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  }, []);

  const getPriorityColor = useCallback((priority: 'low' | 'medium' | 'high') => {
    return COLORS[priority] || COLORS.text;
  }, [COLORS]);

  const groupTasksByDate = useCallback((tasks: Task[]) => {
    const groupedTasks: { today: Task[]; week: { [date: string]: Task[] } } = {
      today: [],
      week: {},
    };

    tasks.forEach((task) => {
      const localDate = formatLocalDate(task.deadline);

      if (localDate === todayString) {
        groupedTasks.today.push(task);
      } else if (new Date(task.deadline) >= startOfWeek && new Date(task.deadline) <= endOfWeek) {
        if (!groupedTasks.week[localDate]) {
          groupedTasks.week[localDate] = [];
        }
        groupedTasks.week[localDate].push(task);
      }
    });

    return groupedTasks;
  }, [todayString, startOfWeek, endOfWeek]);

  const groupedTasks = useMemo(() => groupTasksByDate(tasks), [tasks]);

  const getDayName = useCallback((dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }, []);

  const filteredTasksByPriority = useMemo(() => {
    if (!tasks) return [];
    if (selectedPriority === 'all') return tasks;
    return tasks.filter((task) => task.priority === selectedPriority);
  }, [tasks, selectedPriority]);

  const filteredTasksByCategory = useMemo(() => {
    if (!filteredTasksByPriority) return [];
    if (selectedCategory === 'all') return filteredTasksByPriority;
    return filteredTasksByPriority.filter((task) => task.category === selectedCategory);
  }, [filteredTasksByPriority, selectedCategory]);

  const sortedTasks = useMemo(() => {
    if (!filteredTasksByCategory) return [];
    const tasksToSort = Array.isArray(filteredTasksByCategory) ? [...filteredTasksByCategory] : [];
    switch (sortBy) {
      case 'date':
        return tasksToSort.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      case 'priority':
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return tasksToSort.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      case 'completed':
        return tasksToSort.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
      default:
        return tasksToSort;
    }
  }, [filteredTasksByCategory, sortBy]);

  const currentWeekTasks = useMemo(() => {
    if (!sortedTasks) return [];
    return Array.isArray(sortedTasks)
      ? sortedTasks
          .filter((task) => {
            const taskDate = new Date(task.deadline);
            return taskDate >= startOfWeek && taskDate <= endOfWeek;
          })
          .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      : [];
  }, [sortedTasks, startOfWeek, endOfWeek]);

  const futureTasks = useMemo(() => {
    if (!sortedTasks) return [];
    return Array.isArray(sortedTasks) ? sortedTasks.filter((task) => new Date(task.deadline) > endOfWeek) : [];
  }, [sortedTasks, endOfWeek]);

  const todayTasks = useMemo(() => {
    if (!sortedTasks) return [];
    return Array.isArray(sortedTasks) ? sortedTasks.filter((task) => formatLocalDate(task.deadline) === todayString) : [];
  }, [sortedTasks, todayString]);

  const filteredTasks = useMemo(() => {
    if (!sortedTasks) return [];
    return Array.isArray(sortedTasks)
      ? sortedTasks.filter(
          (task) =>
            task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.taskDescription.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];
  }, [sortedTasks, searchQuery]);

  const completedTasksCount = useMemo(() => (Array.isArray(tasks) ? tasks.filter((task) => task.completed).length : 0), [tasks]);

  const DateSection: React.FC<{
    title: string;
    tasks: Task[];
    handleTaskPress: (taskId: string) => void;
    toggleTaskCompletion: (taskId: number) => void;
    deleteTask: (taskId: number) => void;
    getPriorityColor: (priority: 'low' | 'medium' | 'high') => string;
    icon?: React.ReactNode;
    onShare: (task: Task) => void;
    showSection?: boolean;
    setShowSection?: (show: boolean) => void;
    color?: string; // <-- Add this line
  }> = ({
    title,
    tasks,
    handleTaskPress,
    toggleTaskCompletion,
    deleteTask,
    getPriorityColor,
    icon,
    onShare,
    showSection,
    setShowSection,
    color, // <-- Add this line
  }) => {
    const isCollapsible = title === 'Today' || title === 'This Week';
    const isOpen = showSection === undefined ? true : showSection;
    return (
      <View style={styles.dateSection}>
        <TouchableOpacity
          disabled={!isCollapsible}
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => setShowSection && setShowSection(!isOpen)}
        >
          {isCollapsible && (
            <Ionicons
              name={isOpen ? 'chevron-down' : 'chevron-forward'}
              size={22}
              color={COLORS.text}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={[
            styles.dateText,
            title === 'Today' && styles.todayText,
            color && { color }, // <-- Use color prop if provided
          ]}>
            {title}
          </Text>
          {icon && (
            <View style={{ marginLeft: 15, marginRight: 5 }}>{icon}</View>
          )}
        </TouchableOpacity>
        {isOpen ? (
          tasks.length > 0 ? (
            tasks.map((task) =>
              isCollapsible ? (
                <View key={task.taskId.toString()} style={styles.specialTaskItemWrapper}>
                  <TaskItem
                    task={task}
                    onPress={() => handleTaskPress(task.taskId.toString())}
                    onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
                    onDelete={() => deleteTask(task.taskId)}
                    priorityColor={getPriorityColor(task.priority)}
                    onShare={() => onShare(task)}
                  />
                </View>
              ) : (
                <TaskItem
                  key={task.taskId.toString()}
                  task={task}
                  onPress={() => handleTaskPress(task.taskId.toString())}
                  onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
                  onDelete={() => deleteTask(task.taskId)}
                  priorityColor={getPriorityColor(task.priority)}
                  onShare={() => onShare(task)}
                />
              )
            )
          ) : (
            <EmptyState
              message={`No tasks for ${title.toLowerCase()}!`}
              colors={COLORS}
              showIcon={title === 'Today'}
            />
          )
        ) : null}
      </View>
    );
  };

  const [showCompleted, setShowCompleted] = useState(false);
  const [showToday, setShowToday] = useState(true);
  const [showThisWeek, setShowThisWeek] = useState(true);

  const handleTaskAccept = (tasks: string[]) => {
    setTasks((prevTasks) => [
      ...prevTasks,
      ...tasks.map((task, index) => ({
        taskId: Date.now() + index,
        userId: 1,
        taskName: task,
        taskDescription: '',
        estimatedDuration: 0,
        deadline: new Date().toISOString(),
        completed: false,
        status: 'pending',
        createdAt: new Date(),
        priority: 'low',
      })),
    ]);
  };

  const shareTask = useCallback(async (task: Task) => {
    try {
      const message = `Task: ${task.taskName}\nDescription: ${task.taskDescription}\nDue: ${task.deadline}\nPriority: ${task.priority}`;
      await Share.share({
        message,
        title: `Task: ${task.taskName}`,
      });
    } catch (error) {
      Alert.alert('Share Failed', 'Unable to share the task.');
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'greeting' | 'quote'>('greeting');

  const completedTasks = useMemo(
    () => (Array.isArray(sortedTasks) ? sortedTasks.filter((task) => task.completed) : []),
    [sortedTasks]
  );

  const incompleteTasks = useMemo(
    () => (Array.isArray(sortedTasks) ? sortedTasks.filter((task) => !task.completed) : []),
    [sortedTasks]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
        <Header />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.horizontalSwipeContainer}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalSwipeContent}
              onScroll={e => setCurrentPage(Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH))}
              scrollEventThrottle={16}
            >
              <View style={[styles.horizontalSwipePage, { width: PAGE_WIDTH }]}>
                <Greeting />
              </View>
              <View style={[styles.horizontalSwipePage, { width: PAGE_WIDTH }]}>
                <MotivationalQuotes />
              </View>
            </ScrollView>
            <View style={styles.tabSwipeIndicatorRow}>
              {[0, 1].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.tabSwipeIndicator,
                    currentPage === i && styles.tabSwipeIndicatorActive,
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.taskcontainer}>
            {showSpinner && !refreshing ? (
              <Loader colors={COLORS} />
            ) : error && !refreshing && tasks.length > 0 ? (
              <ErrorState
                errorMessage="Something went wrong!"
                onRetry={() => {
                  setError('');
                  getTasks(true, true);
                }}
                colors={COLORS}
              />
            ) : tasks.length > 0 || tasks.length === 0 ? (
              <>
                <View style={styles.iconsContainer}>
                  <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={onSearch}
                    colors={COLORS}
                  />
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setShowFilterOptions((prev) => !prev)}
                    accessibilityLabel="Filter tasks"
                  >
                    <Ionicons name="filter" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                {showFilterOptions && (
                  <FilterBar
                    visible={showFilterOptions}
                    onRequestClose={() => setShowFilterOptions(false)}
                    selectedPriority={selectedPriority}
                    setSelectedPriority={setSelectedPriority}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                  />
                )}
                <TaskList
                  tasks={filteredTasks}
                  handleTaskPress={handleTaskPress}
                  toggleTaskCompletion={toggleTaskCompletion}
                  deleteTask={deleteTask}
                  getPriorityColor={getPriorityColor}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  ListHeaderComponent={
                    searchQuery
                      ? null
                      : <>
                          <TaskSummary
                            totalTasks={tasks.length}
                            completedTasks={completedTasksCount}
                            colors={COLORS}
                          />
                          <DateSection
                            title="Today"
                            tasks={todayTasks}
                            handleTaskPress={handleTaskPress}
                            toggleTaskCompletion={toggleTaskCompletion}
                            deleteTask={deleteTask}
                            getPriorityColor={getPriorityColor}
                            icon={<Ionicons name="calendar-outline" size={32} color={COLORS.text} />}
                            onShare={shareTask}
                            showSection={showToday}
                            setShowSection={setShowToday}
                          />
                          <DateSection
                            title="This Week"
                            tasks={currentWeekTasks}
                            handleTaskPress={handleTaskPress}
                            toggleTaskCompletion={toggleTaskCompletion}
                            deleteTask={deleteTask}
                            getPriorityColor={getPriorityColor}
                            icon={<Ionicons name="time-outline" size={32} color={COLORS.text} />}
                            onShare={shareTask}
                            showSection={showThisWeek}
                            setShowSection={setShowThisWeek}
                            color={COLORS.background === '#121212' ? '#fff' : COLORS.text} // <-- Add this line
                          />
                          <FutureTask
                            futureTasks={futureTasks}
                            showFutureTasks={showFutureTasks}
                            setShowFutureTasks={setShowFutureTasks}
                            handleTaskPress={handleTaskPress}
                            toggleTaskCompletion={toggleTaskCompletion}
                            deleteTask={deleteTask}
                            getPriorityColor={getPriorityColor}
                            colors={COLORS}
                          />
                          <Text style={[styles.dateText, { color: COLORS.text }]}>All Tasks</Text>
                          {incompleteTasks.length === 0 && (
                            <EmptyState
                              message="No incomplete tasks!"
                              colors={COLORS}
                              showIcon={false}
                            />
                          )}
                          {incompleteTasks.map((task) => (
                            <TaskItem
                              key={task.taskId.toString()}
                              task={task}
                              onPress={() => handleTaskPress(task.taskId.toString())}
                              onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
                              onDelete={() => deleteTask(task.taskId)}
                              priorityColor={getPriorityColor(task.priority)}
                              isOffline={isOffline}
                              onShare={() => shareTask(task)}
                            />
                          ))}
                        </>
                  }
                  searchQuery={searchQuery}
                  isOffline={isOffline}
                />
              </>
            ) : null}
            <CompletedTasksSection
              completedTasks={completedTasks}
              showCompleted={showCompleted}
              setShowCompleted={setShowCompleted}
              handleTaskPress={handleTaskPress}
              toggleTaskCompletion={toggleTaskCompletion}
              deleteTask={deleteTask}
              getPriorityColor={getPriorityColor}
              isOffline={isOffline}
              shareTask={shareTask}
              colors={COLORS}
            />
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <AskAIButton onTaskAccept={handleTaskAccept} />
        </View>
        <NavBar />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  taskcontainer: {
    flex: 1,
    padding: 28,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 28,
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 32,
  },
  dateText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 14,
    marginTop: 20,
  },
  todayText: {
    color: '#f44336',
  },
  noTasksText: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 48,
    marginTop: 28,
    paddingTop: 28,
    paddingBottom: 28,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 22,
    color: '#f44336',
  },
  searchContainer: {
    overflow: 'hidden',
    height: 54,
    borderRadius: 27,
    borderColor: '#ccc',
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  searchInput: {
    fontSize: 20,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 18,
  },
  futureSection: {
    marginBottom: 32,
  },
  futureHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  priorityFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 28,
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 28,
  },
  categoryText: {
    fontSize: 20,
    color: '#000',
  },
  selectedCategory: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
  },
  priorityText: {
    fontSize: 20,
  },
  selectedPriority: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  sortLabel: {
    fontSize: 20,
    marginRight: 14,
  },
  sortText: {
    fontSize: 20,
    marginRight: 14,
  },
  selectedSort: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
    marginRight: 14,
  },
  taskSummary: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 28,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    color: '#f44336',
    fontSize: 20,
    marginTop: 14,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 54,
  },
  emptyStateImage: {
    width: 200,
    height: 200,
    marginBottom: 28,
  },
  emptyStateText: {
    fontSize: 20,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  askAIButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: 'absolute',
    bottom: 120,
    right: 28,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    backgroundColor: '#000',
  },
  cartoonButton: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  faceContainer: {
    width: 54,
    height: 54,
    position: 'relative',
  },
  eyes: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  eye: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#333',
  },
  eyeSquint: {
    height: 8,
    marginTop: 6,
  },
  mouthClosed: {
    width: 28,
    height: 7,
    borderRadius: 3,
    backgroundColor: '#333',
    alignSelf: 'center',
  },
  mouthOpen: {
    width: 28,
    height: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#FF6B6B',
    alignSelf: 'center',
  },
  sparkle1: {
    position: 'absolute',
    top: -14,
    left: -14,
    transform: [{ rotate: '-20deg' }],
  },
  sparkle2: {
    position: 'absolute',
    bottom: -14,
    right: -14,
    transform: [{ rotate: '20deg' }],
  },
  syncHistoryContainer: {
    marginTop: 28,
    padding: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 14,
  },
  syncHistoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  syncHistoryItem: {
    marginBottom: 8,
  },
  syncHistoryText: {
    fontSize: 18,
    color: '#333',
  },
  syncHistoryToggle: {
    marginTop: 28,
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ddd',
    borderRadius: 8,
  },
  syncHistoryToggleText: {
    fontSize: 20,
    color: '#333',
  },
  offlineQueueContainer: {
    marginTop: 28,
    padding: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 14,
  },
  offlineQueueTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  offlineQueueItem: {
    marginBottom: 8,
  },
  offlineQueueText: {
    fontSize: 18,
    color: '#333',
  },
  retryButton: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#f44336',
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  offlineQueueToggle: {
    marginTop: 28,
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ddd',
    borderRadius: 8,
  },
  offlineQueueToggleText: {
    fontSize: 20,
    color: '#333',
  },
  horizontalSwipeContainer: {
    height: 300,
    marginBottom: 0,
    marginTop: -5,
  },
  horizontalSwipeContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  horizontalSwipePage: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  tabSwipeIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  tabSwipeIndicator: {
    width: 30,
    height: 5,
    borderRadius: 7,
    backgroundColor: '#ccc',
    marginHorizontal: 14,
    marginTop: 0,
  },
  tabSwipeIndicatorActive: {
    backgroundColor: '#f44336',
  },
  offlineIndicator: {
    backgroundColor: '#ff9800',
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 14,
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  specialTaskItemWrapper: {
    marginBottom: 32,
  },
  completedSection: {
    marginTop: 32,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  completedList: {
    marginTop: 8,
  },
});

export default HomeScreen;