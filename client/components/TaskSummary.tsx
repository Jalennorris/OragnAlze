import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TaskSummaryProps {
  totalTasks: number;
  completedTasks: number;
  colors: {
    text: string;
  };
}

const TaskSummary: React.FC<TaskSummaryProps> = ({ totalTasks, completedTasks, colors }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.text }]}>
        {totalTasks} tasks total, {completedTasks} completed
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TaskSummary;