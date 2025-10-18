import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TaskEditRowProps {
  task: { id: string; title: string; description?: string };
  editedTaskText: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const TaskEditRow: React.FC<TaskEditRowProps> = ({
  task,
  editedTaskText,
  onChangeText,
  onSave,
  onCancel,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={editedTaskText}
        onChangeText={onChangeText}
        placeholder="Edit task title"
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    marginRight: 4,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default TaskEditRow;
