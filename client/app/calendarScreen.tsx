import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Button } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Header from '@/components/header';
import NavBar from '@/components/Navbar';

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
    { id: '9', title: 'Eating ', description: 'Task 8 description', dueDate: '2025-01-31', completed: false, priority: 'high' },
    { id: '9', title: 'Eating ', description: 'Task 8 description', dueDate: '2025-01-31', completed: false, priority: 'high' },
    // Add more tasks as needed
  ]);

  const [markedDates, setMarkedDates] = useState<{ [key: string]: { dots: { key: string, color: string }[], marked: boolean } }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const datesWithTasks: { [key: string]: { dots: { key: string, color: string }[], marked: boolean } } = {};

    tasks.forEach(task => {
      if (datesWithTasks[task.dueDate]) {
        datesWithTasks[task.dueDate].dots.push({ key: task.id, color: 'blue' });
      } else {
        datesWithTasks[task.dueDate] = {
          marked: true,
          dots: [{ key: task.id, color: 'blue' }],
        };
      }
    });

    setMarkedDates(datesWithTasks);
  }, [tasks]);

  const renderDay = (day: any) => {
    const dateStr = day.dateString;
    const tasksForDay = tasks.filter(task => task.dueDate === dateStr);

    return (
      <TouchableOpacity onPress={() => handleDayPress(dateStr)}>
        <View style={styles.dayContainer}>
          <Text style={styles.dayText}>{day.day}</Text>
          {tasksForDay.map(task => (
            <View key={task.id} style={styles.taskBlock}>
              <Text style={styles.taskText}>{task.title}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    setModalVisible(true);
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text>{item.description}</Text>
    </View>
  );

  return (

    <View style={styles.container}>
      <Header/>
     
      <View style={styles.calendarContainer}>
        <Calendar
          markedDates={markedDates}
          markingType={'multi-dot'}
          dayComponent={({ date }) => renderDay(date)}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#00adf5',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#00adf5',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#00adf5',
            selectedDotColor: '#ffffff',
            arrowColor: 'orange',
            disabledArrowColor: '#d9e1e8',
            monthTextColor: 'blue',
            indicatorColor: 'blue',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 16,
          }}
        />
      </View>
      <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tasks for {selectedDate}</Text>
          <FlatList
            data={tasks.filter(task => task.dueDate === selectedDate)}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
          />
          <Button title="Close" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
      <NavBar/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  calendarContainer: {
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskBlock: {
    backgroundColor: 'lightblue',
    borderRadius: 4,
    padding: 2,
    marginVertical: 1,
  },
  taskText: {
    fontSize: 10,
    color: '#000',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  taskItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CalendarScreen;