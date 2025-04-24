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
import FutureTask from './FutureTask';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState'; // Add this import
import Loader from '@/components/Loader'; // Add this import
import FilterBar from '@/components/FilterBar'; // Add this import
import axios from 'axios'; // Add axios for API requests
import Modal from 'react-native-modal'; // Add Modal for user interaction
import { API_URL, OPENROUTER_API_KEY } from '@env'; // Import API_URL and OPENROUTER_API_KEY from .env

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
  const [data, setData] = useState<Task[]>([]);
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
  const [aiModalVisible, setAiModalVisible] = useState(false); // State for AI modal
  const [aiQuery, setAiQuery] = useState(''); // State for user query
  const [aiResponse, setAiResponse] = useState(''); // State for AI response
  const [aiLoading, setAiLoading] = useState(false); // State for AI loading
  
  const onSearch = useCallback((query: string) => {
    setSearchQuery(query); // Update the search query state
  },);


  const getTasks = async () => {
    try {
      console.log('Fetching userId from AsyncStorage...');
      const userId = await AsyncStorage.getItem('userId'); // Await is needed
      console.log(`userId: ${userId}`);
  
      if (!userId) {
        console.error("User ID not found in AsyncStorage. Redirecting to login...");
        navigation.navigate("login"); 
        
        throw new Error("User ID not found in AsyncStorage");
      }
      
      console.log(`User ID retrieved: ${userId}`);
      const apiUrl = `${API_URL}/tasks/user/${userId}`; // Use API_URL from .env
      console.log(`Fetching tasks from: ${apiUrl}`);
  
      // Clear tasks state before fetching new data
      setTasks([]);
      setData([]);
      setError(''); // Clear any existing error before fetching
  
      const response = await fetch(apiUrl);
  
      console.log(`Response status: ${response.status}`);
  
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No tasks found for the user. Please add tasks.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Raw response JSON:', JSON.stringify(data, null, 2));
  
      setData(data);
      console.log('Data successfully stored in state.');
  
      loadTasks(data);
      console.log('loadTasks function executed with fetched data.');
  
    } catch (err) {
      const errorMessage = (err as Error).message || 'An unknown error occurred';
      setError(errorMessage); // Set a user-friendly error message
      console.error('Failed to load tasks:', errorMessage);
    } finally {
      console.log('getTasks execution completed.');
      setLoading(false);
      setRefreshing(false); // Ensure refreshing is stopped
    }
  };


  useEffect(() => {
    getTasks();
  }, []);

  //loading Task

  const loadTasks = (tasksData?: Task[]) => {
    try {
      if (tasksData && Array.isArray(tasksData)) {
        setTasks(tasksData);
      } else {
        throw new Error('Tasks data is not properly formatted');
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to load tasks data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  //refresh

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(''); // Clear any existing error
    getTasks(); // Reload tasks
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
    navigation.navigate('taskDetail', { taskId }); // Replace router.push with navigation.navigate
  }, [navigation]);

  // Function to toggle task completion
  const toggleTaskCompletion = useCallback((taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.taskId === taskId ? { ...task, completed: !task.completed } : task))
    );
  }, []);

  //delete task function
  const deleteTask = useCallback((taskId: number) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.taskId !== taskId));
  }, []);

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
}> = ({ title, tasks, handleTaskPress, toggleTaskCompletion, deleteTask, getPriorityColor, icon }) => (
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

  // Handler for the "Ask AI" button
  const handleAskAI = useCallback(() => {
    setAiModalVisible(true); // Show the AI modal
  }, []);

  const fetchAIResponse = async () => {
    try {
      console.log('Starting fetchAIResponse...');
      setAiLoading(true);
      setAiResponse(''); // Clear previous response

      const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      const headers = {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`, // Use OPENROUTER_API_KEY from .env
        "Content-Type": "application/json",
      };

      console.log('API URL:', apiUrl);
      console.log('Headers:', headers);

      const body = JSON.stringify({
        model: "deepseek/deepseek-r1-zero:free",
        messages: [
          {
            role: "user",
            content: aiQuery, // Use the user's query
          },
        ],
      });

      console.log('Request Body:', body);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body,
      });

      console.log('Response Status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response Data:', data);

      setAiResponse(data.choices[0].message.content.trim());
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setAiResponse('Failed to get a response. Please try again.');
    } finally {
      setAiLoading(false);
      console.log('fetchAIResponse execution completed.');
    }
  };
  // Add these animations
const handlePressIn = () => {
  setIsAIPressed(true);
  Animated.spring(scaleAnim, {
    toValue: 0.9,
    useNativeDriver: true,
  }).start();
};

const handlePressOut = () => {
  setIsAIPressed(false);
  Animated.spring(scaleAnim, {
    toValue: 1,
    useNativeDriver: true,
  }).start();
};

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
        <Header />
        <Greeting />
        <MotivationalQuotes colors={COLORS} /> {/* Add MotivationalQuotes component */}
        <View style={styles.taskcontainer}>
          {loading && !refreshing ? ( // Show loader only if not refreshing
            <Loader colors={COLORS} />
          ) : error && !refreshing ? ( // Show error only if not refreshing
            <ErrorState 
              errorMessage="Something went wrong!" 
              onRetry={() => {
                setError('');
                getTasks();
              }} 
              colors={COLORS} 
            />
          ) : tasks.length > 0 ? ( // Show tasks only if there are tasks
            <>
              <View style={styles.iconsContainer}>
                <SearchBar 
                  searchQuery={searchQuery} 
                  setSearchQuery={onSearch} // Pass the onSearch function here
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
                  selectedPriority={selectedPriority}
                  setSelectedPriority={setSelectedPriority}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  colors={COLORS}
                />
              }

              <TaskList
                tasks={filteredTasks} // Pass filteredTasks here
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
                          icon={<Ionicons name="calendar-outline" size={32} color={COLORS.text} />} // Add icon for "Today"
                        />
                        <DateSection
                          title="This Week"
                          tasks={currentWeekTasks}
                          handleTaskPress={handleTaskPress}
                          toggleTaskCompletion={toggleTaskCompletion}
                          deleteTask={deleteTask}
                          getPriorityColor={getPriorityColor}
                          icon={<Ionicons name="time-outline" size={32} color={COLORS.text} />} // Add icon for "This Week"
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
                searchQuery={searchQuery} // Pass searchQuery to TaskList
              />
            </>
          ) : null /* Render nothing if there are no tasks */}
          <TouchableOpacity
            style={[styles.askAIButton, { transform: [{ scale: scaleAnim }] }]} // Replace with Animated.View
            onPress={handleAskAI} // Fix: Uncomment onPress
            onPressIn={handlePressIn} // Fix: Uncomment onPressIn
            onPressOut={handlePressOut} // Fix: Uncomment onPressOut
            accessibilityLabel="Ask AI for assistance"
          >
            <View style={styles.cartoonButton}> {/* Wrap the face inside cartoonButton */}
              <View style={styles.faceContainer}>
                {/* Eyes */}
                <View style={styles.eyes}>
                  <View style={[styles.eye, isAIPressed && styles.eyeSquint]} />
                  <View style={[styles.eye, isAIPressed && styles.eyeSquint, { marginLeft: 10 }]} />
                </View>
                
                {/* Mouth - changes when pressed */}
                {isAIPressed ? (
                  <View style={styles.mouthOpen} />
                ) : (
                  <View style={styles.mouthClosed} />
                )}
                
                {/* Sparkles */}
                <Ionicons name="sparkles" size={16} color="#FFD700" style={styles.sparkle1} />
                <Ionicons name="sparkles" size={16} color="#FFD700" style={styles.sparkle2} />
              </View>
            </View>
          </TouchableOpacity>

          {/* AI Modal */}
          <Modal
            isVisible={aiModalVisible}
            onBackdropPress={() => setAiModalVisible(false)}
            onBackButtonPress={() => setAiModalVisible(false)}
            style={styles.modalWrapper} // Add wrapper style
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAiModalVisible(false)}
                accessibilityLabel="Close modal"
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Ask AI</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Type your question..."
                value={aiQuery}
                onChangeText={setAiQuery}
                placeholderTextColor="#aaa" // Modern placeholder color
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={fetchAIResponse}
                disabled={aiLoading}
              >
                <Text style={styles.modalButtonText}>{aiLoading ? 'Loading...' : 'Submit'}</Text>
              </TouchableOpacity>
              <View style={styles.modalResponseContainer}>
                {aiResponse ? (
                  <Text style={styles.modalResponse}>{aiResponse}</Text>
                ) : (
                  <Text style={styles.modalPlaceholder}>
                    {aiLoading ? 'Fetching response...' : 'Your AI response will appear here.'}
                  </Text>
                )}
              </View>
            </View>
          </Modal>
          <NavBar />  
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskcontainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 80, // Ensure space for the navbar
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateSection: {
   
    marginBottom: 20,
  },
  dateText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  todayText: {
    color: '#f44336',
  },
  noTasksText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 40,
    marginTop: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#f44336',
  },
  searchContainer: {
    overflow: 'hidden',
    height: 40,
    borderRadius: 20,
    borderColor: '#ccc',
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  searchInput: {
    fontSize: 16,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 10,
  },
  futureSection: {
    marginBottom: 20,
  },
  futureHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  priorityFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 16,
    color: '#000',  // Default text color
  },
  selectedCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',  // Red color for the selected category
  },
  priorityText: {
    fontSize: 16,
  },
  selectedPriority: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',  // Red color for the selected priority
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sortLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  sortText: {
    fontSize: 16,
    marginRight: 10,
  },
  selectedSort: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336', // Red for selected sort option
    marginRight: 10,
  },
  taskSummary: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    color: '#f44336', // Red for retry text
    fontSize: 16,
    marginTop: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  askAIButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    backgroundColor: '#000', // Black background
  },
  cartoonButton: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: '#fff', // White inner button
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', // Box shadow for inner button
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  faceContainer: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  eyes: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  eye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
  },
  eyeSquint: {
    height: 6,
    marginTop: 4,
  },
  mouthClosed: {
    width: 20,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center',
  },
  mouthOpen: {
    width: 20,
    height: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#FF6B6B',
    alignSelf: 'center',
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    left: -10,
    transform: [{ rotate: '-20deg' }],
  },
  sparkle2: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    transform: [{ rotate: '20deg' }],
  },
  modalWrapper: {
    justifyContent: 'flex-end', // Align modal at the bottom
    margin: 0, // Remove default margin
  },
  modalContainer: {
    backgroundColor: '#1e1e1e', // Dark background for modern look
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: '#444',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    marginBottom: 15,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalResponseContainer: {
    maxHeight: 200, // Limit height for scrollable area
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  modalResponse: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  modalPlaceholder: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});
export default HomeScreen;