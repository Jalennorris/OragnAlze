import React, { useRef, useCallback, useState, memo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, TextInput, Modal, Pressable, ActivityIndicator, useColorScheme, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';
import { Easing } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { format, parse } from 'date-fns';

// --- Modern Color & Spacing Constants ---
const COLORS = {
  cardBgLight: '#F9FAFB',
  cardBgDark: '#23272F',
  borderLight: '#E5E7EB',
  borderDark: '#2D333B',
  textPrimary: '#222',
  textSecondary: '#6B7280',
  accent: '#6366F1',
  accentDark: '#818CF8',
  error: '#EF4444',
  warning: '#F59E42',
  success: '#22C55E',
  shadow: '#000',
  selection: '#E0E7FF',
  selectionDark: '#3730A3',
  overlay: 'rgba(0,0,0,0.18)',
};
const SPACING = {
  card: 18,
  inner: 14,
  radius: 16,
  icon: 22,
  indicator: 7,
  shadow: 8,
};

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
  onRefresh?: () => void; // Add onRefresh prop for auto refresh
  isOffline?: boolean; // Add isOffline prop
  onPress?: () => void; // <-- Add this line
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

// Throttle helper
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  let lastArgs: any;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  } as T;
}

// Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 20 }}>
          <Text style={{ color: 'red', fontWeight: 'bold' }}>Something went wrong.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleCompletion,
  onDelete,
  priorityColor, // Remove default assignment, always expect from parent
  isSelected, // Destructure new prop
  onSelectToggle, // Destructure new prop
  isSelectionModeActive, // Destructure new prop

  onEdit = () => {}, // <-- Default to no-op function
  onShare, // Destructure new prop
  onRefresh, // Destructure new prop
  isOffline = false, // Destructure isOffline, default to false
  onPress, // <-- Add this line
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
      }) +
      ' ' +
      new Date(task.deadline).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago',
      })
    : 'No due date';

  // --- Modern Card Animation ---
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: pressed ? 0.97 : 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  }, [pressed]);

  // Check if the task is overdue
  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false;
  // Define gradient colors based on priority
  const gradientColors: { [key: string]: string[] } = {
    low: [COLORS.cardBgLight, '#E0F7FA'],
    medium: [COLORS.cardBgLight, '#FEF9C3'],
    high: [COLORS.cardBgLight, '#FEE2E2'],
  };

  // Ensure the gradient colors for the task priority exist
  const taskGradientColors = gradientColors[task.priority] || [COLORS.cardBgLight, COLORS.cardBgLight];

  // Animate deletion
  const animateDelete = useCallback((callback: () => void) => {
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(animatedHeight, {
        toValue: 0,
        duration: 300,
        easing: Easing.elastic(1),
        useNativeDriver: false,
      }),
    ]).start(() => callback());
  }, [animatedOpacity, animatedHeight]);

  // Loading state for actions
  const [isLoading, setIsLoading] = useState(false);

  // Handle task deletion with Axios and animation
  const handleDelete = useCallback(async () => {
    if (isOffline) {
      Toast.show({
        type: 'error',
        text1: 'Offline',
        text2: 'Cannot delete task while offline.',
        position: 'bottom',
      });
      return;
    }
    setIsLoading(true);
    try {
      animateDelete(async () => {
        try {
          await axios.delete(`http://localhost:8080/api/tasks/${task.taskId}`);
          onDelete(task.taskId);
          Toast.show({
            type: 'success',
            text1: 'Task Deleted',
            text2: `Task "${task.taskName}" was successfully deleted.`,
            position: 'bottom',
          });
          if (onRefresh) onRefresh(); // Auto refresh after delete
        } catch (error: any) {
          // ...existing code...
          animatedOpacity.setValue(1);
          animatedHeight.setValue(150);
        } finally {
          setIsLoading(false);
        }
      });
    } catch (error) {
      // ...existing code...
      setIsLoading(false);
    }
  }, [task.taskId, task.taskName, onDelete, animateDelete, animatedOpacity, animatedHeight, onRefresh, isOffline]);

  // Handle task completion toggle with Axios
  const handleToggleCompletion = async () => {
    if (isOffline) {
      Toast.show({
        type: 'error',
        text1: 'Offline',
        text2: 'Cannot update task while offline.',
        position: 'bottom',
      });
      return;
    }
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
      if (onRefresh) onRefresh(); // Auto refresh after completion toggle
      // No need to call onToggleCompletion again here if it was called optimistically
    } catch (error: any) {
      console.error('Error toggling task completion:', error);
      // Since the app is online, this should rarely fail.
      // Optionally, you can notify the user of the error.
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update the task. Please try again.';
       Toast.show({
         type: 'error',
         text1: 'Update Failed',
         text2: errorMessage,
         position: 'bottom',
       });
      // If you want to handle rare network errors, you could revert the UI here.
    }
  };

  const [editName, setEditName] = useState(task.taskName);
  const [editDescription, setEditDescription] = useState(task.taskDescription);
  const [editDeadline, setEditDeadline] = useState(task.deadline);

  // Format for display and editing (date and time)
  const displayDate = editDeadline
    ? format(new Date(editDeadline), 'MMM dd, yyyy hh:mm a')
    : '';

  // Update backend when due date changes (onBlur)
  const handleDeadlineBlur = async () => {
    // Try to parse the date in "MMM dd, yyyy HH:mm" format
    let isoDate = task.deadline;
    try {
      const parsed = parse(editDeadline, 'MMM dd, yyyy HH:mm', new Date());
      if (!isNaN(parsed.getTime())) {
        isoDate = parsed.toISOString();
      }
    } catch {
      // fallback: keep previous value
    }
    if (isoDate !== task.deadline) {
      try {
        await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
          deadline: isoDate,
        });
        onEdit(task.taskId, { deadline: isoDate });
        Toast.show({
          type: 'success',
          text1: 'Task Updated',
          text2: `Due date updated.`,
          position: 'bottom',
        });
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Could not update due date.',
          position: 'bottom',
        });
      }
    }
  };

  // Subtasks state for editing/adding (local UI only, sync with backend as needed)
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Throttled subtask update
  const throttledSubtaskUpdate = useRef(throttle(async (subtaskId: number, completed: boolean) => {
    try {
      await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}/subtasks/${subtaskId}`, {
        completed,
      });
      onEdit(task.taskId, { subtasks });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Subtask Update Failed',
        text2: 'Could not update subtask status.',
        position: 'bottom',
      });
      setSubtasks(subtasks);
    }
  }, 1000)).current;

  // Toggle subtask completion
  const handleToggleSubtask = (subtaskId: number) => {
    const updatedSubtasks = subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updatedSubtasks);
    const completed = updatedSubtasks.find(st => st.id === subtaskId)?.completed ?? false;
    throttledSubtaskUpdate(subtaskId, completed);
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
    if (isOffline) {
      Toast.show({
        type: 'error',
        text1: 'Offline',
        text2: 'Cannot add subtask while offline.',
        position: 'bottom',
      });
      return;
    }
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

  // State for More menu
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);

  // Subtask count state
  const [subtaskCount, setSubtaskCount] = useState<number>(0);

  // Fetch subtask count from API
  useEffect(() => {
    const fetchSubtaskCount = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/subtasks/${task.taskId}`);
        setSubtaskCount(Array.isArray(response.data) ? response.data.length : 0);
      } catch (error) {
        setSubtaskCount(0);
      }
    };
    fetchSubtaskCount();
  }, [task.taskId]);

  // Memoized SubtaskRow
  const SubtaskRow = memo(({ subtask }: { subtask: Subtask }) => (
    <View key={subtask.id} style={styles.subtaskRow}>
      <TouchableOpacity
        style={styles.subtaskCheckbox}
        onPress={() => handleToggleSubtask(subtask.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: subtask.completed }}
        accessibilityHint="Toggles subtask completion"
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
        allowFontScaling
      />
    </View>
  ));

  // Swipe gesture indicators
  const SwipeIndicator = ({ direction }: { direction: 'left' | 'right' }) => (
    <View style={{ alignItems: 'center', margin: 4 }}>
      <Ionicons
        name={direction === 'left' ? 'arrow-back-circle-outline' : 'arrow-forward-circle-outline'}
        size={18}
        color="#888"
        accessibilityLabel={direction === 'left' ? 'Swipe left to complete' : 'Swipe right to delete'}
      />
    </View>
  );

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
        accessibilityRole="button"
        accessibilityLabel="Delete Task"
        accessibilityHint="Deletes this task"
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="#FFF" />
          <SwipeIndicator direction="right" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Swipeable complete/incomplete action (Swipe Left)
  const renderLeftActions = (progress: Animated.AnimatedInterpolation, dragX: Animated.AnimatedInterpolation) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    // Invert logic: show "Incomplete" (red) if completed, "Complete" (green) if not
    const isCurrentlyCompleted = task.completed;
    const actionLabel = isCurrentlyCompleted ? 'Mark as Incomplete' : 'Mark as Complete';
    const actionText = isCurrentlyCompleted ? 'Incomplete' : 'Complete';
    const actionColor = isCurrentlyCompleted ? '#FF4444' : '#4CAF50';
    const actionIcon = isCurrentlyCompleted ? "close-circle-outline" : "checkmark-circle-outline";

    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          handleToggleCompletion();
        }}
        style={[styles.completeButton, { backgroundColor: actionColor }]}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        accessibilityHint="Toggles task completion"
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={actionIcon} size={24} color="#FFF" />
          <Text style={styles.actionText} allowFontScaling>
            {actionText}
          </Text>
          <SwipeIndicator direction="left" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Determine background colors based on selection
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColors = isSelected
    ? [isDark ? COLORS.selectionDark : COLORS.selection, isDark ? COLORS.selectionDark : COLORS.selection]
    : [isDark ? COLORS.cardBgDark : COLORS.cardBgLight, isDark ? COLORS.cardBgDark : COLORS.cardBgLight];

  const handleNameBlur = async () => {
    if (editName.trim() && editName !== task.taskName) {
      try {
        await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
          taskName: editName,
        });
        setEditName(editName); // ensure local state is up to date
        onEdit(task.taskId, { taskName: editName });
        Toast.show({
          type: 'success',
          text1: 'Task Updated',
          text2: 'Task name updated.',
          position: 'bottom',
        });
      } catch (error: any) {
        setEditName(task.taskName); // revert to previous value on error
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Could not update task name.',
          position: 'bottom',
        });
      }
    } else if (!editName.trim()) {
      setEditName(task.taskName); // revert to previous value if input is empty
    }
  };

  const handleDescriptionBlur = async () => {
    if (editDescription.trim() && editDescription !== task.taskDescription) {
      try {
        await axios.patch(`http://localhost:8080/api/tasks/${task.taskId}`, {
          taskDescription: editDescription,
        });
        onEdit(task.taskId, { taskDescription: editDescription });
        Toast.show({
          type: 'success',
          text1: 'Task Updated',
          text2: 'Task description updated.',
          position: 'bottom',
        });
      } catch (error: any) {
        setEditDescription(task.taskDescription); // revert to previous value on error
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Could not update task description.',
          position: 'bottom',
        });
      }
    } else if (!editDescription.trim()) {
      setEditDescription(task.taskDescription); // revert to previous value if input is empty
    }
  };

  const TITLE_MAX_LENGTH = 25; // Minimum length before truncating title
  const DESCRIPTION_MAX_LENGTH = 60;

  return (
    <ErrorBoundary>
      <Animated.View
        style={{
          opacity: animatedOpacity,
          height: animatedHeight,
          overflow: 'hidden',
          transform: [{ scale: scaleAnim }],
        }}
      >
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
          enabled={!isSelectionModeActive && !isOffline} // Disable swipe actions when in selection mode or offline
        >
          <TouchableOpacity
            style={[
              styles.card,
              isDark && styles.cardDark,
              isOffline && { opacity: 0.6 },
              isSelected && (isDark ? styles.selectedDark : styles.selected),
              pressed && styles.pressed,
            ]}
            disabled={isOffline}
            onPress={onPress} // <-- Add this line
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSelectToggle(task.taskId); // Initiate selection mode on long press
            }}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            accessibilityRole="button"
            accessibilityLabel={`Task: ${task.taskName}. Due: ${formattedDueDate}. Priority: ${task.priority}. ${isSelected ? 'Selected' : 'Not selected'}`}
            accessibilityHint={isSelectionModeActive ? "Toggles selection" : "Opens task details"}
            activeOpacity={0.93}
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
                      size={SPACING.icon}
                      color={isSelected ? COLORS.accent : COLORS.borderLight}
                    />
                  </View>
                )}
                {/* Task Information */}
                <View style={styles.taskInfo}>
                  {isLoading && (
                    <View style={{ alignItems: 'center', marginBottom: 8 }}>
                      <ActivityIndicator size="small" color={COLORS.accent} />
                    </View>
                  )}
                  {/* Always editable title and description */}
                  <View style={styles.header}>
                    <TextInput
                      style={[styles.title, { color: isDark ? '#FFF' : COLORS.textPrimary }]} // removed borderBottomWidth and borderColor
                      value={
                        editName.length > TITLE_MAX_LENGTH
                          ? editName.slice(0, TITLE_MAX_LENGTH) + '...'
                          : editName
                      }
                      onChangeText={setEditName}
                      onBlur={handleNameBlur}
                      placeholder="Task Name"
                      editable={!isOffline}
                      placeholderTextColor={COLORS.textSecondary}
                    />
                    <Ionicons
                      name={task.priority === 'high' ? 'alert-circle' : task.priority === 'medium' ? 'alert' : 'checkmark-circle'}
                      size={18}
                      color={priorityColor}
                      style={{ marginLeft: 2 }}
                    />
                    {/* More button (three dots) */}
                    {!isSelectionModeActive && (
                      <TouchableOpacity
                        onPress={() => setIsMoreMenuVisible(true)}
                        style={{ marginLeft: 8, padding: 2 }}
                        accessibilityLabel="More Options"
                      >
                        <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={[styles.description, { color: isDark ? '#EEE' : COLORS.textSecondary }]} // removed borderBottomWidth and borderColor
                    value={
                      editDescription.length > DESCRIPTION_MAX_LENGTH
                        ? editDescription.slice(0, DESCRIPTION_MAX_LENGTH) + '...'
                        : editDescription
                    }
                    onChangeText={setEditDescription}
                    onBlur={handleDescriptionBlur}
                    placeholder="Task Description"
                    multiline
                    editable={!isOffline}
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <Text style={styles.category} numberOfLines={1} ellipsizeMode="tail">
                    {task.category ? `#${task.category}` : ''}
                  </Text>
                  {/* Due date with gray shadow box */}
                  <View style={styles.dueDateShadowBox}>
                    <View style={styles.dueDateContainer}>
                      <Ionicons name="time-outline" size={14} color={isOverdue ? COLORS.error : COLORS.textPrimary} />
                      <TextInput
                        style={[
                          styles.dueDate,
                          { color: isOverdue ? COLORS.error : (isDark ? '#FFF' : COLORS.textPrimary), minWidth: 160 },
                        ]}
                        value={displayDate}
                        onChangeText={setEditDeadline}
                        onBlur={handleDeadlineBlur}
                        placeholder="Apr 27, 2024 02:30 PM"
                        editable={!isOffline}
                        placeholderTextColor={COLORS.textSecondary}
                      />
                    </View>
                  </View>
                  {/* Subtask count only, fetched from API, hidden if 0 */}
                  {subtaskCount > 0 && (
                    <View style={styles.subtasksContainer}>
                      <Text style={{ fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : COLORS.textPrimary }}>
                        {subtaskCount} subtask{subtaskCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                  )}
                  {isOffline && (
                    <View style={styles.offlineBanner}>
                      <Text style={styles.offlineBannerText}>
                        Offline: Actions disabled
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    </ErrorBoundary>
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

  // Add a real onEdit handler (replace with your logic)
  const handleEdit = (taskId: number, updatedFields: Partial<Task>) => {
    // Update your state or call your API here
    console.log('Edit task', taskId, updatedFields);
  };

  // Add a real onShare handler (replace with your logic)
  const handleShare = (task: Task) => {
    // Implement your share logic here, e.g., using Share API or custom logic
    console.log('Share task', task);
    Toast.show({
      type: 'info',
      text1: 'Share',
      text2: `Sharing "${task.taskName}"...`,
      position: 'bottom',
    });
  };

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
          onEdit={handleEdit} // <-- Pass a real function here
          onShare={() => handleShare(task)} // <-- Pass share handler
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.card,
    marginBottom: SPACING.card + 2,
    borderRadius: SPACING.radius,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBgLight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 135,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: SPACING.shadow,
    elevation: Platform.OS === 'android' ? 2 : 4,
    transition: 'background-color 0.2s',
  },
  cardDark: {
    backgroundColor: COLORS.cardBgDark,
    borderColor: COLORS.borderDark,
    shadowColor: COLORS.shadow,
  },
  selected: {
    backgroundColor: COLORS.selection,
    borderColor: COLORS.accent,
  },
  selectedDark: {
    backgroundColor: COLORS.selectionDark,
    borderColor: COLORS.accentDark,
  },
  pressed: {
    opacity: 0.97,
  },
  gradientBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.inner,
    paddingLeft: SPACING.inner + 2,
    paddingRight: 5,
  },
  selectionIndicator: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    marginRight: 8,
    flex: 1,
    backgroundColor: 'transparent',
    allowFontScaling: true,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 5,
    opacity: 0.92,
    backgroundColor: 'transparent',
    allowFontScaling: true,
  },
  category: {
    fontSize: 13,
    color: COLORS.accent,
    marginTop: 2,
    fontWeight: 'bold',
    opacity: 0.85,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  dueDate: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
    opacity: 0.85,
    backgroundColor: 'transparent',
  },
  dueDateShadowBox: {
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    marginBottom: 4,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-end',
    minWidth: 180,
  },
  priorityIndicator: {
    width: SPACING.indicator,
    height: '100%',
    borderTopLeftRadius: SPACING.radius,
    borderBottomLeftRadius: SPACING.radius,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    borderRadius: SPACING.radius,
    overflow: 'hidden',
  },
  subtasksContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  offlineBanner: {
    padding: 8,
    backgroundColor: COLORS.warning,
    borderRadius: 6,
    marginBottom: 6,
    alignSelf: 'stretch',
  },
  offlineBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 13,
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
    allowFontScaling: true,
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