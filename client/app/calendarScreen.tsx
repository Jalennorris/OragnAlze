import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Header from '@/components/header';
import NavBar from '@/components/Navbar';
import * as Haptics from 'expo-haptics';

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
  today: "Today's date"
};
LocaleConfig.defaultLocale = 'en';

const CalendarScreen: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Task 1', description: 'Task 1 description', dueDate: '2025-01-20', completed: false, priority: 'medium' },
    { id: '2', title: 'Task 2', description: 'Task 2 description', dueDate: '2025-01-21', completed: false, priority: 'high' },
    { id: '3', title: 'Task 3', description: 'Task 3 description', dueDate: '2025-01-22', completed: false, priority: 'low' },
    { id: '4', title: 'Task 4', description: 'Task 4 description', dueDate: '2025-01-23', completed: false, priority: 'medium' },
    { id: '5', title: 'Task 5', description: 'Task 5 description', dueDate: '2025-01-24', completed: false, priority: 'high' },
    { id: '6', title: 'Task 6', description: 'Task 6 description', dueDate: '2025-01-25', completed: false, priority: 'low' },
    { id: '7', title: 'Task 7', description: 'Task 7 description', dueDate: '2025-01-26', completed: false, priority: 'medium' },
    { id: '8', title: 'Task 8', description: 'Task 8 description', dueDate: '2025-02-02', completed: false, priority: 'high' },
    { id: '9', title: 'Eating', description: 'Task 8 description', dueDate: '2025-01-31', completed: false, priority: 'high' },
  ]);

  const [markedDates, setMarkedDates] = useState<{ [key: string]: { dots: { key: string, color: string }[], marked: boolean } }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation

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
    setSelectedDate(date);
    setModalVisible(true);
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={[styles.taskItem, { borderLeftColor: getPriorityColor(item.priority) }]}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskDueDate}>Due: {item.dueDate}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <Animated.View style={[styles.calendarContainer, { opacity: fadeAnim }]}>
        <Calendar
          markedDates={markedDates}
          markingType={'multi-dot'}
          onDayPress={(day) => handleDayPress(day.dateString)}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#6a11cb',
            selectedDayBackgroundColor: '#6a11cb',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#6a11cb',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#6a11cb',
            selectedDotColor: '#ffffff',
            arrowColor: '#6a11cb',
            disabledArrowColor: '#d9e1e8',
            monthTextColor: '#6a11cb',
            indicatorColor: '#6a11cb',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </Animated.View>
      <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tasks for {selectedDate}</Text>
          <FlatList
            data={tasks.filter(task => task.dueDate === selectedDate)}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.taskList}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  calendarContainer: {
    paddingHorizontal: 10,
    paddingVertical: 20,
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
});

export default CalendarScreen;