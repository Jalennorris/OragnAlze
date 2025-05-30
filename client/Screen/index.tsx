import React, { useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  RefreshControl,
  FlatList,
  useColorScheme,
  Alert, // Add this import
  Share, // Add Share import
  ScrollView, // Add this import
  Dimensions, // Add this import
} from 'react-native';
import TaskItem from '../components/taskItem';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/header';
import Greeting from '@/components/Greeting';
import NavBar from '@/components/Navbar';
import tasksData from '../data/tasks.json';
import Icon from 'react-native-vector-icons/Ionicons';
import FilterComponent from '@/components/FilterComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MotivationalQuotes from '@/components/MotivationalQoutes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native'; // Replace useRouter with useNavigation
import SearchBar from '@/components/SearchBar';
import TaskSummary from '@/components/TaskSummary';
import FutureTask from '@/components/FutureTask';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState'; // Add this import
import Loader from '@/components/Loader'; // Add this import
import FilterBar from '@/components/FilterBar'; // Add this import
import axios from 'axios'; // Add axios for API requests
import { API_URL, OPENROUTER_API_KEY } from '@env'; // Ensure this import is correct
import OpenAI from 'openai'; // Add OpenAI import
import AskAIButton from '@/components/AskAIButton';
import config from '../src/config'; // Import the config file
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo

// Define types for the task structure
interface Task {
  taskId: number; // Use 'number' instead of 'Number'
  userId: number; // Use 'number' instead of 'Number'
  taskName: string;
  taskDescription: string;
  estimatedDuration: number; // Use 'number' instead of 'Number'
  deadline: string;
  completed: boolean;
  status: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

// Constants for colors and styles
const LIGHT_COLORS = {
  low: '#000', // black
  medium: '#ff9800', // orange
  high: '#f44336', // red
  today: '#f44336', // red
  text: '#000',
  background: '#fff', // light blue
  searchBackground: '#f1f1f1',
  placeholder: '#888',
};

const DARK_COLORS = {
  low: '#388e3c', // dark green
  medium: '#f57c00', // dark orange
  high: '#d32f2f', // dark red
  today: '#d32f2f', // dark red
  text: '#feefe9',
  background: '#121212',
  searchBackground: '#333',
  placeholder: '#888',
};

// Define an estimated height for TaskItem. Adjust this based on your actual item height.
// If your TaskItem height is dynamic, getItemLayout might not be suitable or accurate.
const TASK_ITEM_HEIGHT = 80; // Example height, adjust as needed

// New TaskList component
const TaskList: React.FC<{
  tasks: Task[];
  handleTaskPress: (taskId: string) => void;
  toggleTaskCompletion: (taskId: number) => void;
  deleteTask: (taskId: number) => void;
  getPriorityColor: (priority: 'low' | 'medium' | 'high') => string;
  refreshing: boolean;
  onRefresh: () => void;
  ListHeaderComponent: React.ReactNode;
  searchQuery: string; // Add searchQuery prop
}> = ({
  tasks,
  handleTaskPress,
  toggleTaskCompletion,
  deleteTask,
  getPriorityColor,
  refreshing,
  onRefresh,
  ListHeaderComponent,
  searchQuery, // Destructure searchQuery
}) => {
  const filteredTasks = searchQuery
    ? tasks.filter(
        (task) =>
          task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.taskDescription.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  // getItemLayout tells the FlatList how to measure items without rendering them.
  // Crucial for performance with large lists and fixed-height items.
  const getItemLayout = useCallback(
    (data: Task[] | null | undefined, index: number) => ({
      length: TASK_ITEM_HEIGHT,
      offset: TASK_ITEM_HEIGHT * index,
      index,
    }),
    [] // No dependencies as TASK_ITEM_HEIGHT is constant
  );

  return (
    <FlatList
      data={filteredTasks} // Use filteredTasks here
      keyExtractor={(item) => item.taskId.toString()}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          onPress={() => handleTaskPress(item.taskId.toString())}
          onToggleCompletion={() => toggleTaskCompletion(item.taskId)}
          onDelete={() => deleteTask(item.taskId)}
          priorityColor={getPriorityColor(item.priority)}
        />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={searchQuery ? null : ListHeaderComponent} // Hide header if searching
      // Performance Optimizations
      getItemLayout={getItemLayout} // Add getItemLayout
      windowSize={11} // Render items within 5 viewports (adjust as needed)
      initialNumToRender={10} // Render initial 10 items
      maxToRenderPerBatch={10} // Render 10 items per batch during scroll
      removeClippedSubviews={true} // Can improve performance on Android (use with caution)
      // updateCellsBatchingPeriod={50} // Optional: Adjust batching frequency
      // legacyImplementation={false} // Optional: Use newer implementation if available
    />
  );
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation(); // Use navigation instead of router
  const colorScheme = useColorScheme();
  console.log(colorScheme)
  const COLORS = colorScheme === 'light' ? LIGHT_COLORS : DARK_COLORS;


  const [showFutureTasks, setShowFutureTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'completed'>('date');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'work' | 'personal' | 'school'| 'other'>('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isAIPressed, setIsAIPressed] = useState(false); // Add this state
  const scaleAnim = useRef(new Animated.Value(1)).current; // Add this state
  const [isOffline, setIsOffline] = useState(false); // State for offline status
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial load
  const [syncHistory, setSyncHistory] = useState<{ type: string; taskId: number; status: string }[]>([]); // Add sync history state
  const [showSyncHistory, setShowSyncHistory] = useState(false); // Add state to toggle sync history visibility
  const [offlineQueue, setOfflineQueue] = useState<{ type: string; taskId: number }[]>([]); // Add state for offline queue
  const [showOfflineQueue, setShowOfflineQueue] = useState(false); // Add state to toggle offline queue visibility

  // Track current page for indicator
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const PAGE_WIDTH = Dimensions.get('window').width;

  const onSearch = useCallback((query: string) => {
    setSearchQuery(query); // Update the search query state
  },);

  // Function to load tasks from cache
  const loadTasksFromCache = async () => {
    try {
      console.log('Attempting to load tasks from cache...');
      const cachedTasks = await AsyncStorage.getItem('cachedTasks'); // Changed
      if (cachedTasks) {
        const parsedTasks: Task[] = JSON.parse(cachedTasks);
        console.log(`Loaded ${parsedTasks.length} tasks from cache.`);
        setTasks(parsedTasks);
        setError(''); // Clear previous errors if cache is loaded
        return true; // Indicate success
      } else {
        console.log('No tasks found in cache.');
        return false; // Indicate cache miss
      }
    } catch (cacheError) {
      console.error('Failed to load tasks from cache:', cacheError);
      setError('Failed to load cached tasks.');
      return false; // Indicate failure
    }
  };

  const syncOfflineChanges = useCallback(async () => {
    try {
      const offlineChanges = await AsyncStorage.getItem('offlineChanges'); // Changed
      if (!offlineChanges) {
        console.log('No offline changes to sync.');
        setOfflineQueue([]); // Clear offline queue if no changes
        return;
      }
  
      const changes = JSON.parse(offlineChanges);
      const netInfoState = await NetInfo.fetch();
      const online = netInfoState.isConnected && netInfoState.isInternetReachable;
  
      if (!online) {
        console.log('Still offline. Cannot sync changes.');
        setOfflineQueue(changes); // Update offline queue
        return;
      }
  
      console.log('Syncing offline changes...');
      const userId = await AsyncStorage.getItem('userId'); // Changed
      if (!userId) {
        console.error("User ID not found in AsyncStorage. Cannot sync changes.");
        return;
      }
  
      const apiUrl = `http://localhost:8080/api/tasks/user/${userId}/sync`;
      const response = await axios.post(apiUrl, { changes });
  
      if (response.status === 200) {
        console.log('Offline changes synced successfully.');
        setOfflineQueue([]); // Clear offline queue after successful sync
        await AsyncStorage.removeItem('offlineChanges'); // Changed
      } else {
        console.error('Failed to sync offline changes:', response.status);
        setOfflineQueue(changes); // Keep offline queue if sync fails
      }
    } catch (error) {
      console.error('Error syncing offline changes:', error);
      const offlineChanges = await AsyncStorage.getItem('offlineChanges'); // Changed
      if (offlineChanges) {
        const changes = JSON.parse(offlineChanges);
        setOfflineQueue(changes); // Update offline queue on error
      }
    }
  }, []);

  const getTasks = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      const netInfoState = await NetInfo.fetch();
      const online = netInfoState.isConnected && netInfoState.isInternetReachable;
      setIsOffline(!online); // Update offline state

      if (online) {
        console.log('App is online. Fetching tasks from API...');
        const userId = await AsyncStorage.getItem('userId'); // Changed
        if (!userId) {
          console.error("User ID not found in AsyncStorage. Redirecting to login...");
          navigation.navigate("login");
          throw new Error("User ID not found");
        }

        const apiUrl = `http://localhost:8080/api/tasks/user/${userId}`;
        console.log(`Fetching tasks from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No tasks found for the user on the server.");
            setTasks([]); // Clear tasks if none found on server
            await AsyncStorage.removeItem('cachedTasks'); // Changed
            setError("No tasks found. Add some!"); // User-friendly message
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          const fetchedTasks: Task[] = await response.json();
          const offlineChanges = await AsyncStorage.getItem('offlineChanges'); // Changed
          const changes = offlineChanges ? JSON.parse(offlineChanges) : [];

          // Resolve conflicts
          const resolvedTasks = fetchedTasks.map((task) => {
            const conflict = changes.find((change) => change.taskId === task.taskId);
            if (conflict) {
              if (conflict.type === 'edit') {
                console.log(`Resolving conflict for task ${task.taskId}. Using offline changes.`);
                return { ...task, ...conflict.updatedTask };
              }
            }
            return task;
          });

          setTasks(resolvedTasks);
          await AsyncStorage.setItem('cachedTasks', JSON.stringify(resolvedTasks)); // Changed
          console.log('Tasks successfully cached.');
        }
      } else {
        console.log('App is offline. Attempting to load from cache...');
        setError('You are offline. Showing cached tasks.'); // Inform user
        const cacheLoaded = await loadTasksFromCache();
        if (!cacheLoaded && isInitialLoad) {
           // Only set error if initial load fails and cache is empty
           setError('Offline and no cached tasks available.');
           setTasks([]); // Ensure tasks are empty if cache load fails
        }
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'An unknown error occurred';
      console.error('Failed to get tasks:', errorMessage);
      // Try loading from cache as a fallback if API call failed for reasons other than 404
      if (!errorMessage.includes("No tasks found")) {
          const cacheLoaded = await loadTasksFromCache();
          if (cacheLoaded) {
              setError('Failed to fetch tasks. Showing cached data.');
          } else {
              setError(`Failed to fetch tasks: ${errorMessage}`);
              setTasks([]); // Clear tasks if fetch and cache fail
          }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsInitialLoad(false); // Mark initial load as complete
      console.log('getTasks execution completed.');
    }
  }, [navigation, isInitialLoad]); // Add isInitialLoad dependency

  useEffect(() => {
    // Initial fetch
    getTasks();
    syncOfflineChanges(); // Attempt to sync offline changes on app start

    // Subscribe to network status changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const currentlyOffline = !(state.isConnected && state.isInternetReachable);
      if (isOffline !== currentlyOffline) { // Only update if status changed
          setIsOffline(currentlyOffline);
          console.log("Network status changed. Offline:", currentlyOffline);
          if (!currentlyOffline) {
              // If connection is restored, try fetching fresh data
              console.log("Connection restored. Re-fetching tasks...");
              syncOfflineChanges(); // Sync changes when connection is restored
              getTasks();
              // Add logic here later to sync offline changes if implemented
          } else {
              // If connection is lost, ensure user knows
              setError("You are offline. Showing cached tasks.");
          }
      }
    });

    return () => {
      // Unsubscribe from network status listener on component unmount
      unsubscribe();
    };
  }, [getTasks, syncOfflineChanges]); // Rerun effect if getTasks changes (due to navigation dependency)

  //refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(''); // Clear any existing error
    getTasks(true); // Force refresh from API if online
  }, [getTasks]);

  // Get the user's local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Helper function to format dates in the user's local timezone
  const formatLocalDate = (dateString: string) => {
    try {
      if (!dateString) {
        console.error('❌ Error: dateString is null or undefined');
        return 'Invalid Date';
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.error(`❌ Error: Invalid date received: ${dateString}`);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', { timeZone: 'America/Chicago' });
    } catch (err) {
      console.error('❌ Error formatting date:', err);
      return 'Invalid Date';
    }
  };
  
  // Get today's date in the user's local timezone
  const today = new Date();
  console.log('Today:', today.toDateString());
  const todayString = today.toLocaleDateString('en-US', { timeZone: 'America/Chicago' });
  console.log('Today in local timezone:', todayString);
  
  // Calculate the start and end of the current week (Monday to Sunday)
  const startOfWeek = new Date(today);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  console.log('Start of the week:', startOfWeek.toDateString());
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  console.log('End of week:', endOfWeek.toDateString());



  //Router routes
  //
  const handleTaskPress = useCallback((taskId: string): void => {
    console.log('handleTaskPress called with:', taskId);
    console.log('navigation object:', navigation);
    if (taskId) {
      // Get userId from AsyncStorage and navigate with both taskId and userId
      AsyncStorage.getItem('userId').then((userId) => { // Changed
        if (userId) {
          navigation.navigate('taskDetail', { taskId, userId });
        } else {
          console.warn('User ID not found');
        }
      });
    } else {
      console.warn('Invalid taskId provided');
    }
  }, [navigation]);

  // Function to toggle task completion
  const toggleTaskCompletion = useCallback((taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.taskId === taskId ? { ...task, completed: !task.completed } : task))
    );
    Alert.alert("Offline Action", "Task status changed locally. Syncing requires internet connection."); // Temporary feedback
  }, []);

  //delete task function with confirmation
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
          onPress: async () => { // Make onPress async
            const netInfoState = await NetInfo.fetch();
            const online = netInfoState.isConnected && netInfoState.isInternetReachable;

            setTasks((prevTasks) => prevTasks.filter((task) => task.taskId !== taskId));

            if (!online) {
              console.log('Offline. Queuing deletion for sync.');
              const offlineChanges = await AsyncStorage.getItem('offlineChanges'); // Changed
              const changes = offlineChanges ? JSON.parse(offlineChanges) : [];
              changes.push({ type: 'delete', taskId });
              await AsyncStorage.setItem('offlineChanges', JSON.stringify(changes)); // Changed
              Alert.alert("Offline Action", "Task deleted locally. Syncing requires internet connection.");
            } else {
              try {
                await axios.delete(`http://localhost:8080/api/tasks/${taskId}`);
                console.log('Task deleted on server.');
              } catch (error) {
                console.error('Error deleting task via API:', error);
                Alert.alert('Error', 'Failed to delete task from server. Please check connection.');
              }
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  }, []); // Removed tasks dependency as it's handled optimistically

  //priority color function
  const getPriorityColor = useCallback((priority: 'low' | 'medium' | 'high') => {
    return COLORS[priority] || COLORS.text;
  }, [COLORS]);

  // Helper function to group tasks by date
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
  
  // Group tasks by date (compent)
  const groupedTasks = useMemo(() => groupTasksByDate(tasks), [tasks]);

  //memo**
  

  // Helper function to get the name of the day from a date string
  const getDayName = useCallback((dateString: string) => {
    const date = new Date(dateString);
    if(isNaN(date.getTime())) return 'Invalid Date';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    //0-6
    return days[date.getDay()];
    // get day 0-6 sun-satin2
    //getDay
  }, []);

  // Filter tasks by priority
  const filteredTasksByPriority = useMemo(() => {
    if (!tasks) return [];
    if (selectedPriority === 'all') return tasks;
    return tasks.filter((task) => task.priority === selectedPriority);
  }, [tasks, selectedPriority]);

  // Filter tasks by category
  const filteredTasksByCategory = useMemo(() => {
    if (!filteredTasksByPriority) return [];
    if (selectedCategory === 'all') return filteredTasksByPriority;
    return filteredTasksByPriority.filter((task) => task.category === selectedCategory);
  }, [filteredTasksByPriority, selectedCategory]);

  // Sort tasks
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

  // Filter tasks for the current week and future
  const currentWeekTasks = useMemo(() => {
    //is no sortTask return empty array
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
  // Filter tasks for today
  const todayTasks = useMemo(() => {
    if (!sortedTasks) return [];
    return Array.isArray(sortedTasks) ? sortedTasks.filter((task) => formatLocalDate(task.deadline) === todayString) : [];
  }, [sortedTasks, todayString]);

  // Filter tasks by search query
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



  // Task count summary(components)
  const completedTasksCount = useMemo(() => (Array.isArray(tasks) ? tasks.filter((task) => task.completed).length : 0), [tasks]);

  // New DateSection component
const DateSection: React.FC<{
  title: string;
  tasks: Task[];
  handleTaskPress: (taskId: string) => void;
  toggleTaskCompletion: (taskId: number) => void;
  deleteTask: (taskId: number) => void;
  getPriorityColor: (priority: 'low' | 'medium' | 'high') => string;
  icon?: React.ReactNode; // Add icon prop
  onShare: (task: Task) => void; // Add onShare prop
}> = ({ title, tasks, handleTaskPress, toggleTaskCompletion, deleteTask, getPriorityColor, icon, onShare }) => (
  <View style={styles.dateSection}>
    <Text style={[styles.dateText, title === 'Today' && styles.todayText]}>{title}</Text>
    {icon && <View style={styles.iconContainer}>{icon}</View>} {/* Render icon if provided */}
    {tasks.length > 0 ? (
      tasks.map((task) => (
        <TaskItem
          key={task.taskId.toString()}
          task={task}
          onPress={() => handleTaskPress(task.taskId.toString())}
          onToggleCompletion={() => toggleTaskCompletion(task.taskId)}
          onDelete={() => deleteTask(task.taskId)}
          priorityColor={getPriorityColor(task.priority)}
          onShare={() => onShare(task)} // Add onShare prop
        />
      ))
    ) : (
      <EmptyState 
        message={`No tasks for ${title.toLowerCase()}!`} 
        colors={COLORS} 
        showIcon={title === 'Today'} 
      />
    )}
  </View>
);

  const handleTaskAccept = (tasks: string[]) => {
    console.log('Accepted tasks:', tasks);
    // Add logic to handle the accepted tasks, e.g., save them to state or send to a server
    setTasks((prevTasks) => [
      ...prevTasks,
      ...tasks.map((task, index) => ({
        taskId: Date.now() + index, // Generate unique task IDs
        userId: 1, // Replace with the actual user ID
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

  // Add a component to display sync history
const SyncHistory: React.FC<{ history: { type: string; taskId: number; status: string }[] }> = ({ history }) => (
  <View style={styles.syncHistoryContainer}>
    <Text style={styles.syncHistoryTitle}>Sync History</Text>
    {history.length > 0 ? (
      history.map((entry, index) => (
        <View key={index} style={styles.syncHistoryItem}>
          <Text style={styles.syncHistoryText}>
            Task ID: {entry.taskId} | Action: {entry.type} | Status: {entry.status}
          </Text>
        </View>
      ))
    ) : (
      <Text style={styles.syncHistoryText}>No sync history available.</Text>
    )}
  </View>
);

// Add a component to display the offline queue
const OfflineQueue: React.FC<{
  queue: { type: string; taskId: number }[];
  onRetry: () => void;
}> = ({ queue, onRetry }) => (
  <View style={styles.offlineQueueContainer}>
    <Text style={styles.offlineQueueTitle}>Offline Task Queue</Text>
    {queue.length > 0 ? (
      <>
        {queue.map((entry, index) => (
          <View key={index} style={styles.offlineQueueItem}>
            <Text style={styles.offlineQueueText}>
              Task ID: {entry.taskId} | Action: {entry.type}
            </Text>
          </View>
        ))}
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry Sync</Text>
        </TouchableOpacity>
      </>
    ) : (
      <Text style={styles.offlineQueueText}>No offline tasks waiting to sync.</Text>
    )}
  </View>
);

  // Share task handler
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

  // Add state for tab switching
  const [activeTab, setActiveTab] = useState<'greeting' | 'quote'>('greeting');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
        <Header />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Swipeable horizontal scroll for Greeting and Motivation with indicator */}
          <View style={styles.horizontalSwipeContainer}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalSwipeContent}
              onScroll={e => {
                const page = Math.round(
                  e.nativeEvent.contentOffset.x / PAGE_WIDTH
                );
                setCurrentPage(page);
              }}
              scrollEventThrottle={16}
            >
              <View style={[styles.horizontalSwipePage, { width: PAGE_WIDTH }]}>
                <Greeting />
              </View>
              <View style={[styles.horizontalSwipePage, { width: PAGE_WIDTH }]}>
                <MotivationalQuotes colors={COLORS} />
              </View>
            </ScrollView>
            <View style={styles.tabSwipeIndicatorRow}>
              <View
                style={[
                  styles.tabSwipeIndicator,
                  currentPage === 0 && styles.tabSwipeIndicatorActive,
                ]}
              />
              <View
                style={[
                  styles.tabSwipeIndicator,
                  currentPage === 1 && styles.tabSwipeIndicatorActive,
                ]}
              />
            </View>
          </View>
          {/* End swipeable horizontal scroll with indicator */}
          {isOffline && (
              <View style={styles.offlineIndicator}>
                  <Text style={styles.offlineText}>Offline Mode</Text>
              </View>
          )}
          <View style={styles.taskcontainer}>
            {loading && !refreshing ? (
              <Loader colors={COLORS} />
            ) : error && !refreshing ? (
              <ErrorState 
                errorMessage="Something went wrong!" 
                onRetry={() => {
                  setError('');
                  getTasks();
                }} 
                colors={COLORS} 
              />
            ) : tasks.length > 0 ? (
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

                {showFilterOptions && 
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
                }

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
                        </>
                  }
                  searchQuery={searchQuery}
                />
              </>
            ) : null}
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
    position: 'relative', // Ensure absolute children are relative to this
  },
  taskcontainer: {
    flex: 1,
    padding: 28, // Increased padding
    paddingBottom: 100, // More space for navbar
  },
  title: {
    fontSize: 32, // Larger title
    fontWeight: 'bold',
    marginBottom: 28,
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 32, // More space
  },
  dateText: {
    fontSize: 28, // Larger section title
    fontWeight: 'bold',
    marginBottom: 14,
  },
  todayText: {
    color: '#f44336',
  },
  noTasksText: {
    textAlign: 'center',
    fontSize: 22, // Larger
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
    height: 54, // Taller search bar
    borderRadius: 27,
    borderColor: '#ccc',
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  searchInput: {
    fontSize: 20, // Larger input
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
    paddingBottom: 20, // Adjust this value to move the button up or down
  },
  askAIButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: 'absolute',
    bottom: 120, // Adjust this value so the button sits above the NavBar and does not block it
    right: 28,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    backgroundColor: '#000',
    // Remove marginBottom if present
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
    height: 300, // Increased height for larger swipe area
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
    marginTop: 18,
    marginBottom: 12,
  },
  tabSwipeIndicator: {
    width: 30,         // Even larger
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
});

export default HomeScreen;