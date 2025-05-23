import React, { useRef, useCallback, useState } from 'react'; // Added useState
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, TextInput, Modal, Pressable } from 'react-native'; // Added TextInput, Modal, Pressable
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import axios from 'axios';
import Toast from 'react-native-toast-message'; // Import Toast

// Define types for the task structure
interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

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
  subtasks?: Subtask[]; // Add subtasks
}

interface TaskItemProps {
  key: string; 
  task: Task; // Make the task prop required
  onToggleCompletion: () => void;
  onDelete: (taskId: number) => void; // Ensure taskId is passed to onDelete
  priorityColor?: string;
  isSelected: boolean; // New prop for selection state
  onSelectToggle: (taskId: number) => void; // New prop to handle selection toggle
  isSelectionModeActive: boolean; // New prop to know if selection mode is active
  onEdit: (taskId: number, updatedFields: Partial<Task>) => void; // Add onEdit prop
  onShare?: () => void; // Add onShare prop
}

const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'low':
      return '#4CAF50'; // Green for low priority
    case 'medium':
      return '#FF9800'; // Orange for medium priority
    case 'high':
      return '#F44336'; // Red for high priority
    default:
      return '#4CAF50'; // Default to green for low priority
  }
};

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleCompletion,
  onDelete,
  priorityColor = getPriorityColor(task.priority), // Ensure default color is applied
  isSelected, // Destructure new prop
  onSelectToggle, // Destructure new prop
  isSelectionModeActive, // Destructure new prop
  onEdit, // Destructure new prop
  onShare, // Destructure new prop
}) => {
  // Animation values
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  const animatedHeight = useRef(new Animated.Value(150)).current; // Adjust initial height if needed

  // Format due date for better readability
  const formattedDueDate = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-US', {
        timeZone: 'America/Chicago', // Adjust this to your desired timezone
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No due date';

  console.log('Raw deadline:', task.deadline);
  console.log('Parsed deadline:', new Date(task.deadline));

  // Check if the task is overdue
  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false;
  // Define gradient colors based on priority
  const gradientColors: { [key: string]: string[] } = {
    low: ['#A0A0A0', '#B0B0B0'], // Neutral gray gradient
    medium: ['#808080', '#909090'], // Darker gray gradient
    high: ['#606060', '#707070'], // Even darker gray gradient
  };

  // Ensure the gradient colors for the task priority exist
  const taskGradientColors = gradientColors[task.priority] || ['#F0F0F0', '#F0F0F0']; // Default to neutral gradient

  // Animate deletion
  const animateDelete = useCallback((callback: () => void) => {
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false, // Height animation not supported by native driver
      }),
      Animated.timing(animatedHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => callback()); // Execute callback after animation
  }, [animatedOpacity, animatedHeight]);

  // Handle task deletion with Axios and animation
  const handleDelete = useCallback(async () => {
    try {
      // Optimistically start animation
      animateDelete(async () => {
        try {
          await axios.delete(`http://localhost:8080/api/tasks/${task.taskId}`);
          onDelete(task.taskId); // Call onDelete prop after animation and API call
          Toast.show({
            type: 'success',
            text1: 'Task Deleted',
            text2: `Task "${task.taskName}" was successfully deleted.`,
            position: 'bottom',
          });
        } catch (error: any) {
           // If API fails after animation, maybe show an error or revert?
           console.error('Error deleting task from API after animation:', error);
           const errorMessage = error.response?.data?.message || error.message || 'Failed to delete the task from server.';
           Toast.show({
             type: 'error',
             text1: 'Deletion Failed',
             text2: errorMessage,
             position: 'bottom',
           });
           // Reset animation if deletion failed
           animatedOpacity.setValue(1);
           animatedHeight.setValue(150); // Reset to original height
        }
      });
    } catch (error) {
        // Catch potential errors before starting animation (less likely here)
        console.error('Error initiating task deletion:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Could not start task deletion.',
          position: 'bottom',
        });
    }
  }, [task.taskId, task.taskName, onDelete, animateDelete, animatedOpacity, animatedHeight]);

  // Handle task completion toggle with Axios
  const handleToggleCompletion = async () => {
    const previousCompleted = task.completed; // Store previous state for potential rollback
    try {
      // Optimistically update UI first (or let parent handle it via onToggleCompletion)
      onToggleCompletion(); // Assuming this updates the parent state

      await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
        completed: !task.completed,
      });
      Toast.show({
        type: 'success',
        text1: 'Task Updated',
        text2: `Task "${task.taskName}" marked as ${!task.completed ? 'complete' : 'incomplete'}.`,
        position: 'bottom',
      });
      // No need to call onToggleCompletion again here if it was called optimistically
    } catch (error: any) {
      console.error('Error toggling task completion:', error);
      // Revert optimistic UI update if API call fails
      // This might require the parent component to handle reverting state
      // For now, just show an error toast.
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update the task. Please try again.';
       Toast.show({
         type: 'error',
         text1: 'Update Failed',
         text2: errorMessage,
         position: 'bottom',
       });
       // Consider calling a revert function passed via props if optimistic UI update needs rollback
    }
  };

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.taskName);
  const [editDescription, setEditDescription] = useState(task.taskDescription);

  // Subtasks state for editing/adding (local UI only, sync with backend as needed)
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Toggle subtask completion
  const handleToggleSubtask = async (subtaskId: number) => {
    const updatedSubtasks = subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updatedSubtasks);
    try {
      await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}/subtasks/${subtaskId}`, {
        completed: updatedSubtasks.find(st => st.id === subtaskId)?.completed,
      });
      // Optionally, update parent via onEdit
      onEdit(task.taskId, { subtasks: updatedSubtasks });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Subtask Update Failed',
        text2: 'Could not update subtask status.',
        position: 'bottom',
      });
      setSubtasks(subtasks); // revert
    }
  };

  // Edit subtask title
  const handleEditSubtaskTitle = async (subtaskId: number, title: string) => {
    const updatedSubtasks = subtasks.map(st =>
      st.id === subtaskId ? { ...st, title } : st
    );
    setSubtasks(updatedSubtasks);
    try {
      await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}/subtasks/${subtaskId}`, {
        title,
      });
      onEdit(task.taskId, { subtasks: updatedSubtasks });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Subtask Update Failed',
        text2: 'Could not update subtask title.',
        position: 'bottom',
      });
      setSubtasks(subtasks); // revert
    }
  };

  // Add new subtask
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      const response = await axios.post(`http://localhost:8080/api/tasks/${task.taskId}/subtasks`, {
        title: newSubtaskTitle,
      });
      const newSubtask: Subtask = response.data;
      const updatedSubtasks = [...subtasks, newSubtask];
      setSubtasks(updatedSubtasks);
      setNewSubtaskTitle('');
      onEdit(task.taskId, { subtasks: updatedSubtasks });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Add Subtask Failed',
        text2: 'Could not add subtask.',
        position: 'bottom',
      });
    }
  };

  // Save edit handler
  const handleSaveEdit = async () => {
    try {
      await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
        taskName: editName,
        taskDescription: editDescription,
      });
      onEdit(task.taskId, { taskName: editName, taskDescription: editDescription });
      Toast.show({
        type: 'success',
        text1: 'Task Updated',
        text2: `Task "${editName}" updated successfully.`,
        position: 'bottom',
      });
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update the task.';
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: errorMessage,
        position: 'bottom',
      });
    }
  };

  // Cancel edit handler
  const handleCancelEdit = () => {
    setEditName(task.taskName);
    setEditDescription(task.taskDescription);
    setIsEditing(false);
  };

  // State for More menu
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);

  // Swipeable delete action
  const renderRightActions = (progress: Animated.AnimatedInterpolation, dragX: Animated.AnimatedInterpolation) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert(
            'Delete Task',
            `Are you sure you want to delete "${task.taskName}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', onPress: handleDelete, style: 'destructive' },
            ]
          );
        }}
        style={styles.deleteButton}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Swipeable complete action (Swipe Left)
  const renderLeftActions = (progress: Animated.AnimatedInterpolation, dragX: Animated.AnimatedInterpolation) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100], // Swiping from left to right
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          handleToggleCompletion();
        }}
        style={styles.completeButton}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={task.completed ? "close-circle-outline" : "checkmark-circle-outline"} size={24} color="#FFF" />
          <Text style={styles.actionText}>{task.completed ? 'Incomplete' : 'Complete'}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Determine background colors based on selection
  const backgroundColors = isSelected ? ['#E0E0E0', '#E0E0E0'] : ['#FFFFFF', '#FFFFFF']; // Grayish when selected, white otherwise

  return (
    <Animated.View style={{ opacity: animatedOpacity, height: animatedHeight, overflow: 'hidden' }}>
      {/* More Menu Modal */}
      <Modal
        transparent
        visible={isMoreMenuVisible}
        animationType="fade"
        onRequestClose={() => setIsMoreMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsMoreMenuVisible(false)}>
          <View style={styles.moreMenu}>
            <TouchableOpacity
              style={styles.moreMenuItem}
              onPress={() => {
                setIsMoreMenuVisible(false);
                setIsEditing(true);
              }}
            >
              <Ionicons name="pencil-outline" size={18} color="#333" style={{ marginRight: 8 }} />
              <Text style={styles.moreMenuText}>Edit</Text>
            </TouchableOpacity>
            {onShare && (
              <TouchableOpacity
                style={styles.moreMenuItem}
                onPress={() => {
                  setIsMoreMenuVisible(false);
                  onShare();
                }}
              >
                <Ionicons name="share-social-outline" size={18} color="#333" style={{ marginRight: 8 }} />
                <Text style={styles.moreMenuText}>Share</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
      <Swipeable
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        enabled={!isSelectionModeActive} // Disable swipe actions when in selection mode
      >
        <TouchableOpacity
          style={styles.container}
          onPress={() => {
            if (isSelectionModeActive) {
              onSelectToggle(task.taskId); // Toggle selection if mode is active
            } else {
              // Handle regular press action (e.g., navigate to details)
              console.log('Regular task press:', task.taskId);
              // You might want to re-introduce the original onPress logic here
              // or handle navigation/details view differently.
            }
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelectToggle(task.taskId); // Initiate selection mode on long press
          }}
          accessibilityRole="button"
          accessibilityLabel={`Task: ${task.taskName}. Due: ${formattedDueDate}. Priority: ${task.priority}. ${isSelected ? 'Selected' : 'Not selected'}`}
        >
          <View style={styles.row}>
            {/* Priority Indicator Line */}
            <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
            <LinearGradient
              colors={backgroundColors} // Use dynamic background colors
              style={styles.gradientBackground}
              start={[0, 0]}
              end={[1, 1]}
            >
              {/* Selection Indicator */}
              {isSelectionModeActive && (
                <View style={styles.selectionIndicator}>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isSelected ? '#4CAF50' : '#CCCCCC'}
                  />
                </View>
              )}
              {/* Task Information */}
              <View style={styles.taskInfo}>
                {isEditing ? (
                  <>
                    <View style={styles.header}>
                      <TextInput
                        style={[styles.title, { color: '#000', borderBottomWidth: 1, borderColor: '#E0E0E0' }]}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Task Name"
                        autoFocus
                      />
                    </View>
                    <TextInput
                      style={[styles.description, { color: '#000', borderBottomWidth: 1, borderColor: '#E0E0E0' }]}
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="Task Description"
                      multiline
                    />
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <TouchableOpacity onPress={handleSaveEdit} style={[styles.actionButton, { backgroundColor: '#4CAF50', borderRadius: 6 }]}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEdit} style={[styles.actionButton, { backgroundColor: '#E0E0E0', borderRadius: 6, marginLeft: 10 }]}>
                        <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.header}>
                      <Text style={[styles.title, { color: '#000' }]} numberOfLines={1} ellipsizeMode="tail">
                        {task.taskName}
                      </Text>
                      <Ionicons
                        name={task.priority === 'high' ? 'alert-circle' : task.priority === 'medium' ? 'alert' : 'checkmark-circle'}
                        size={16}
                        color={priorityColor}
                      />
                      {/* More button (three dots) */}
                      {!isSelectionModeActive && (
                        <TouchableOpacity
                          onPress={() => setIsMoreMenuVisible(true)}
                          style={{ marginLeft: 8, padding: 2 }}
                          accessibilityLabel="More Options"
                        >
                          <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
                      {task.taskDescription}
                    </Text>
                    <Text style={styles.category} numberOfLines={1} ellipsizeMode="tail">
                      {`#${task.category}`}
                    </Text>
                    <View style={styles.dueDateContainer}>
                      <Ionicons name="time-outline" size={14} color={isOverdue ? '#000' : '#000'} />
                      <Text style={[styles.dueDate, { color: isOverdue ? '#000' : '#000' }]}>
                        Due: {task.deadline ? formattedDueDate : 'No due date'}
                      </Text>
                    </View>
                    {/* Subtasks */}
                    {subtasks && subtasks.length > 0 && (
                      <View style={styles.subtasksContainer}>
                        {subtasks.map((subtask) => (
                          <View key={subtask.id} style={styles.subtaskRow}>
                            <TouchableOpacity
                              style={styles.subtaskCheckbox}
                              onPress={() => handleToggleSubtask(subtask.id)}
                            >
                              <Ionicons
                                name={subtask.completed ? 'checkbox-outline' : 'square-outline'}
                                size={20}
                                color={subtask.completed ? '#4CAF50' : '#888'}
                              />
                            </TouchableOpacity>
                            <TextInput
                              style={[
                                styles.subtaskText,
                                subtask.completed && { textDecorationLine: 'line-through', color: '#aaa' },
                              ]}
                              value={subtask.title}
                              onChangeText={text => handleEditSubtaskTitle(subtask.id, text)}
                              editable={!isEditing}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                    {/* Add new subtask */}
                    {!isEditing && (
                      <View style={styles.addSubtaskRow}>
                        <TextInput
                          style={styles.subtaskText}
                          value={newSubtaskTitle}
                          onChangeText={setNewSubtaskTitle}
                          placeholder="Add subtask..."
                          onSubmitEditing={handleAddSubtask}
                          returnKeyType="done"
                        />
                        <TouchableOpacity onPress={handleAddSubtask} style={styles.addSubtaskButton}>
                          <Ionicons name="add-circle-outline" size={22} color="#4CAF50" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
};

// Define props for TaskList, including selection state and handler
interface TaskListProps {
  tasks: Task[];
  selectedTaskIds: number[];
  onSelectToggle: (taskId: number) => void;
  isSelectionModeActive: boolean;
  // Add handlers for bulk actions if needed, e.g., onBulkDelete, onBulkComplete
}

const TaskList: React.FC<TaskListProps> = ({ tasks, selectedTaskIds, onSelectToggle, isSelectionModeActive }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <View style={styles.noTasksContainer}>
        <Text style={styles.noTasksText}>No tasks available. Add a new task to get started!</Text>
      </View>
    );
  }

  return (
    <>
      {tasks.map((task) => (
        <TaskItem
          key={task.taskId.toString()}
          task={task}
          onToggleCompletion={() => console.log('Toggle completion')} // Placeholder - real logic needed in parent
          onDelete={() => console.log('Delete task')} // Placeholder - real logic needed in parent
          priorityColor={getPriorityColor(task.priority.toLowerCase() as 'low' | 'medium' | 'high')} // Ensure lowercase priority
          isSelected={selectedTaskIds.includes(task.taskId)} // Pass selection status
          onSelectToggle={onSelectToggle} // Pass selection handler
          isSelectionModeActive={isSelectionModeActive} // Pass selection mode status
          onEdit={(taskId, updatedFields) => console.log('Edit task', taskId, updatedFields)} // Placeholder - real logic needed in parent
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
    marginRight: 10, // Added marginRight for consistency
    marginBottom: 8, // Keep bottom margin for spacing between items
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#808080', // Neutral shadow color
    shadowOpacity: 0.3, // Reduced opacity for a softer shadow
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4, // Softer shadow radius
    elevation: 2, // Reduced elevation for a subtle effect
    width: '95%',
    backgroundColor: '#FFFFFF', // Changed to white
    boxShadow: '0 2px 4px rgba(128, 128, 128, 0.3)', // Neutral shadow
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray border
  },
  gradientBackground: {
    flex: 1, // Ensure gradient fills the row space after indicator
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15, // Keep vertical padding
    paddingLeft: 15, // Standard padding left
    paddingRight: 5, // Reduced padding right to make space for potential selection indicator
  },
  selectionIndicator: {
    paddingRight: 10, // Space between indicator and task info
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000',
    marginBottom: 5,
    opacity: 0.9,
  },
  category: {
    fontSize: 14,
    color: '#C0C0C0',
    transform: [{ translateY: 20 }],
    opacity: 0.8,
    fontWeight: 'bold',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  dueDate: {
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
    opacity: 0.8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    // Removed borderRadius and marginVertical as Animated.View handles outer shape/spacing
    // Ensure the height matches the item or is flexible
  },
  completeButton: {
    backgroundColor: '#4CAF50', // Green for complete
    justifyContent: 'center',
    alignItems: 'center',
    width: 100, // Adjust width as needed
    // Removed borderRadius and marginVertical
    marginLeft: 10, // Add margin to separate from the edge
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 2,
  },
  noTasksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  noTasksText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  priorityIndicator: {
    width: 6, // Width of the priority line
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch', // Make items stretch to fill height
    backgroundColor: '#FFFFFF', // Ensure row has a background for the priority indicator height
    borderRadius: 12, // Match container border radius
    overflow: 'hidden', // Clip the priority indicator
  },
  subtasksContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subtaskCheckbox: {
    marginRight: 8,
  },
  subtaskText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addSubtaskButton: {
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMenu: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 140,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  moreMenuText: {
    fontSize: 16,
    color: '#333',
  },
});

export default TaskItem;