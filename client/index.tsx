import React from 'react';
import { View, StyleSheet } from 'react-native';
import DateSection from './components/DateSection';

const App = () => {
  const tasks = [
    { taskId: 1, title: 'Task 1', priority: 'high' },
    { taskId: 2, title: 'Task 2', priority: 'medium' },
  ];

  const handleTaskPress = (taskId: string) => {
    console.log(`Task pressed: ${taskId}`);
  };

  const handleToggleCompletion = (taskId: number) => {
    console.log(`Toggle completion for task: ${taskId}`);
  };

  const handleDelete = (taskId: number) => {
    console.log(`Delete task: ${taskId}`);
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low':
        return 'green';
      case 'medium':
        return 'orange';
      case 'high':
        return 'red';
      default:
        return 'gray';
    }
  };

  const colors = {
    text: 'black',
  };

  return (
    <View style={styles.container}>
      <DateSection
        title="Today"
        tasks={tasks}
        onTaskPress={handleTaskPress}
        onToggleCompletion={handleToggleCompletion}
        onDelete={handleDelete}
        getPriorityColor={getPriorityColor}
        colors={colors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});

export default App;
