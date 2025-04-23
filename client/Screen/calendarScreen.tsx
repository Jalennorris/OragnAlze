import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, Dimensions, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Header from '@/components/header';
import NavBar from '@/components/Navbar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for the task structure
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
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
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: { dots: { key: string, color: string }[], marked: boolean } }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7) + '-01');
  const [comments, setComments] = useState<{ [key: string]: string }>({}); // State for comments by task ID
  const [commentInput, setCommentInput] = useState<string>(''); // State for comment input
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null); // State for selected task ID

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          throw new Error('User ID not found in AsyncStorage');
        }
        console.log('Fetching tasks for userId:', userId);

        const response = await fetch(`http://localhost:8080/api/tasks/user/${userId}?month=${currentMonth.slice(0, 7)}`);
        if (!response.ok) {
          console.error('API response error:', response.status, response.statusText);
          throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched tasks:', data);

        // Map the fetched tasks to match the expected structure
        const mappedTasks = data.map((task: any) => ({
          id: task.taskId,
          title: task.taskName,
          description: task.taskDescription,
          dueDate: task.deadline.split('T')[0], // Extract date part
          completed: task.completed,
          priority: task.priority.toLowerCase(), // Convert priority to lowercase
        }));

        setTasks(mappedTasks);
      } catch (err: any) {
        console.error('Error fetching tasks:', err.message);
        setError(err.message || 'Error fetching tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [currentMonth]);

  useEffect(() => {
    const datesWithTasks: { [key: string]: { dots: { key: string, color: string }[], marked: boolean } } = {};

    tasks.forEach(task => {
      if (datesWithTasks[task.dueDate]) {
        datesWithTasks[task.dueDate].dots.push({ key: task.id, color: getPriorityColor(task.priority) });
      } else {
        datesWithTasks[task.dueDate] = {
          marked: true,
          dots: [{ key: task.id, color: getPriorityColor(task.priority) }],
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

  const getPriorityColor = (priority: string) => {
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
    // Save comment logic here
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={[styles.taskItem, { borderLeftColor: getPriorityColor(item.priority) }]}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskDueDate}>Due: {item.dueDate}</Text>
      <TouchableOpacity
        style={styles.commentButton}
        onPress={() => {
          if (selectedTaskId === item.id) {
            setSelectedTaskId(null); // Unview comment if already selected
            setCommentInput('');
          } else {
            setSelectedTaskId(item.id);
            setCommentInput(comments[item.id] || '');
          }
        }}
      >
        <Text style={styles.commentButtonText}>
          {selectedTaskId === item.id ? 'Hide Comment' : 'Add/View Comment'}
        </Text>
      </TouchableOpacity>
      {selectedTaskId === item.id && comments[item.id] && (
        <Text style={styles.savedComment}>Comment: {comments[item.id]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}> {/* Add SafeAreaView */}
      <View style={styles.container}>
        <Header />
        <Animated.View style={[styles.calendarContainer, { opacity: fadeAnim }]}>
          {loading && (
            <Text style={{ textAlign: 'center', color: '#6a11cb', marginVertical: 10 }}>Loading tasks...</Text>
          )}
          {error && (
            <Text style={{ textAlign: 'center', color: '#F44336', marginVertical: 10 }}>{error}</Text>
          )}
          <Calendar
            current={currentMonth}
            markedDates={markedDates}
            markingType={'multi-dot'}
            onDayPress={(day) => handleDayPress(day.dateString)}
            onMonthChange={(month) => setCurrentMonth(`${month.year}-${String(month.month).padStart(2, '0')}-01`)}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#000', // Black for month and year
              selectedDayBackgroundColor: '#6a11cb', // Purple for selected day
              selectedDayTextColor: '#ffffff', // White text for selected day
              todayTextColor: '#6a11cb', // Purple for today
              dayTextColor: '#000', // Black for day numbers
              textDisabledColor: '#d1d1d6', // Light gray for disabled days
              dotColor: '#6a11cb', // Purple dots for events
              selectedDotColor: '#ffffff', // White dots for selected day
              arrowColor: '#000', // Black for navigation arrows
              monthTextColor: '#000', // Black for month text
              indicatorColor: '#6a11cb', // Purple for loading indicator
              textDayFontWeight: '500', // Regular weight for day numbers
              textMonthFontWeight: '600', // Semi-bold for month text
              textDayHeaderFontWeight: '600', // Semi-bold for day headers
              textDayFontSize: 16, // Standard size for day numbers
              textMonthFontSize: 20, // Larger size for month text
              textDayHeaderFontSize: 14, // Smaller size for day headers
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
                  width: Math.floor(Dimensions.get('window').width / 5) - 8, // 5 columns
                  height: Math.floor(Dimensions.get('window').height / 14),   // 12 rows + header + month
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  margin: 4,
                },
                selected: {
                  backgroundColor: '#6a11cb',
                  borderRadius: 8,
                },
                today: {
                  backgroundColor: '#f0e6ff',
                  borderRadius: 8,
                },
              },
            }}
            style={{ borderRadius: 12, margin: 8 }}
          />
        </Animated.View>
        <Modal
          isVisible={isModalVisible}
          onBackdropPress={() => setModalVisible(false)}
          useNativeDriver // Ensure smooth animations on iOS
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tasks for {selectedDate}</Text>
            {selectedDate && (
              <>
                <FlatList
                  data={tasks.filter(task => task.dueDate === selectedDate)} // Ensure dueDate matches selectedDate
                  renderItem={renderTaskItem}
                  keyExtractor={(item) => item.id} // Fixed missing closing parenthesis
                  contentContainerStyle={styles.taskList}
                />
                {selectedTaskId && (
                  <>
                    <Text style={styles.commentLabel}>Comment for Task:</Text>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Write a comment..."
                      value={commentInput}
                      onChangeText={setCommentInput}
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={saveComment}>
                      <Text style={styles.saveButtonText}>Save Comment</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
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
    marginTop: 10,
  },
  commentButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CalendarScreen;