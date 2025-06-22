import React, {
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator, // Added for loading state
  Platform, // For potential platform-specific styling
  Pressable, // Add this import
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // Expo vector icons
import * as Haptics from 'expo-haptics'; // For haptic feedback
import { Pressable as RNPressable } from 'react-native';

// --- Constants ---
const FILTERS_STORAGE_KEY = 'FilterBarModal:filters';
const PRIORITY_OPTIONS = ['all', 'low', 'medium', 'high'] as const;
const CATEGORY_OPTIONS = [
  'all',
  'work',
  'personal',
  'school',
  'other',
] as const;
const SORT_OPTIONS = ['date', 'priority', 'completed'] as const;

// --- Types ---
type Priority = (typeof PRIORITY_OPTIONS)[number];
type Category = (typeof CATEGORY_OPTIONS)[number];
type SortOption = (typeof SORT_OPTIONS)[number];

/**
 * Defines the theme colors used by the FilterBarModal.
 */
interface ThemeColors {
  background: string; // Modal background
  text: string; // Default text color
  textSecondary: string; // Lighter text (e.g., summary)
  primary: string; // Highlight/selected text color
  selectedBackground: string; // Background for selected options
  separator: string; // Line separators
  closeButton: string; // Close button icon/text color
  clearButtonBackground: string; // Background for the clear button
  clearButtonText: string; // Text color for the clear button
  modalOverlay: string; // Background overlay color
}

/**
 * Props for the FilterBar component (internal content).
 */
interface FilterBarContentProps {
  selectedPriority: Priority;
  setSelectedPriority: (priority: Priority) => void;
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  colors: ThemeColors;
  onRequestClose: () => void;
}

/**
 * Props for the main exported FilterBar component.
 */
interface FilterBarModalProps
  extends Omit<
    FilterBarContentProps,
    'colors' | 'onRequestClose' // These are handled internally or passed differently
  > {
  visible: boolean;
  onRequestClose: () => void;
  /** Optional: Override the default theme colors */
  theme?: Partial<ThemeColors>;
}

// --- Modern Theme ---
const defaultTheme: ThemeColors = {
  background: '#f5f7fa', // Subtle gradient base
  text: '#1e293b', // Slate
  textSecondary: '#64748b', // Muted blue-gray
  primary: '#6366f1', // Indigo
  selectedBackground: '#e0e7ff', // Indigo-50
  separator: '#e2e8f0', // Light blue-gray
  closeButton: '#334155', // Darker blue-gray
  clearButtonBackground: '#f43f5e', // Rose-500
  clearButtonText: '#fff',
  modalOverlay: 'rgba(30, 41, 59, 0.18)', // Softer overlay
};

// --- Helper Functions ---

/**
 * Generates a human-readable summary of the active filters.
 */
const getFilterSummary = (
  priority: Priority,
  category: Category,
  sort: SortOption
): string => {
  const parts: string[] = [];
  if (priority !== 'all') {
    parts.push(`${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`);
  }
  if (category !== 'all') {
    parts.push(
      `${category.charAt(0).toUpperCase() + category.slice(1)} Tasks`
    );
  }
  if (sort !== 'date') {
    parts.push(
      `Sorted by ${sort.charAt(0).toUpperCase() + sort.slice(1)}`
    );
  }
  return parts.length > 0 ? parts.join(' • ') : 'Showing All Tasks'; // Use bullet for separator
};

// --- Section Icons (static, outside component) ---
const sectionIcons = {
  Priority: <MaterialIcons name="flag" size={20} color={defaultTheme.primary} style={{ marginRight: 6 }} />,
  Category: <Ionicons name="folder-open" size={20} color={defaultTheme.primary} style={{ marginRight: 6 }} />,
  'Sort By': <Ionicons name="swap-vertical" size={20} color={defaultTheme.primary} style={{ marginRight: 6 }} />,
};

// --- Modern Chip with Pressable, Icon, and Ripple ---
const getChipIcon = (label: string, section: string, color: string) => {
  if (section === 'Priority') {
    if (label === 'high') return <MaterialIcons name="priority-high" size={16} color={color} style={{ marginRight: 4 }} />;
    if (label === 'medium') return <MaterialIcons name="flag" size={16} color={color} style={{ marginRight: 4 }} />;
    if (label === 'low') return <MaterialIcons name="arrow-downward" size={16} color={color} style={{ marginRight: 4 }} />;
  }
  if (section === 'Category') {
    if (label === 'work') return <MaterialIcons name="work" size={16} color={color} style={{ marginRight: 4 }} />;
    if (label === 'personal') return <Ionicons name="person" size={16} color={color} style={{ marginRight: 4 }} />;
    if (label === 'school') return <Ionicons name="school" size={16} color={color} style={{ marginRight: 4 }} />;
    if (label === 'other') return <Ionicons name="ellipsis-horizontal" size={16} color={color} style={{ marginRight: 4 }} />;
  }
  if (section === 'Sort By') {
    if (label === 'date') return <Ionicons name="calendar" size={16} color={color} style={{ marginRight: 4 }} />;
    if (label === 'priority') return <MaterialIcons name="flag" size={16} color={color} style={{ marginRight: 4 }} />;
    if (label === 'completed') return <Ionicons name="checkmark-done" size={16} color={color} style={{ marginRight: 4 }} />;
  }
  return null;
};

const ModernChip: React.FC<{
  isSelected: boolean;
  label: string;
  section: string;
  onPress: () => void;
  colors: Pick<ThemeColors, 'text' | 'primary' | 'selectedBackground'>;
  accessibilityLabel: string;
  accessibilityHint: string;
}> = React.memo(({
  isSelected,
  label,
  section,
  onPress,
  colors,
  accessibilityLabel,
  accessibilityHint,
}) => (
  <RNPressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      isSelected && {
        backgroundColor: colors.selectedBackground,
        borderColor: colors.primary,
        elevation: 2,
      },
      pressed && { opacity: 0.85 },
    ]}
    android_ripple={{ color: colors.selectedBackground }}
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    accessibilityRole="button"
    accessibilityState={{ selected: isSelected }}
  >
    {getChipIcon(label, section, isSelected ? colors.primary : colors.text)}
    <Text
      style={[
        styles.chipText,
        { color: isSelected ? colors.primary : colors.text },
        isSelected && styles.selectedOptionText,
      ]}
    >
      {label}
    </Text>
    {isSelected && (
      <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
    )}
  </RNPressable>
));

// --- Modern FilterBarContent with fade-in animation and sticky header ---
const FilterBarContent: React.FC<FilterBarContentProps> = ({
  selectedPriority,
  setSelectedPriority,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  colors,
  onRequestClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // --- Filter Persistence ---
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(FILTERS_STORAGE_KEY)
      .then(saved => {
        if (saved && isMounted) {
          const { priority, category, sort } = JSON.parse(saved);
          if (priority && PRIORITY_OPTIONS.includes(priority) && priority !== selectedPriority) setSelectedPriority(priority);
          if (category && CATEGORY_OPTIONS.includes(category) && category !== selectedCategory) setSelectedCategory(category);
          if (sort && SORT_OPTIONS.includes(sort) && sort !== sortBy) setSortBy(sort);
        }
      })
      .catch(error => {
        console.error('FilterBarModal: Failed to load filters', error);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        priority: selectedPriority,
        category: selectedCategory,
        sort: sortBy,
      })
    ).catch(error => {
      console.error('FilterBarModal: Failed to save filters', error);
    });
  }, [selectedPriority, selectedCategory, sortBy, isLoading]);

  // --- Event Handlers ---
  const handleChipPress = (value: string, selected: string, setSelected: (v: any) => void) => {
    if (value !== selected) {
      Haptics.selectionAsync?.();
      setSelected(value);
    }
  };

  const handleClearFilters = () => {
    setSelectedPriority('all');
    setSelectedCategory('all');
    setSortBy('date');
  };

  const confirmAndClearFilters = () => {
    const isAnyFilterActive =
      selectedPriority !== 'all' ||
      selectedCategory !== 'all' ||
      sortBy !== 'date';
    if (isAnyFilterActive) {
      Alert.alert(
        'Clear All Filters?',
        'Are you sure you want to reset all filters and sorting?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: handleClearFilters,
          },
        ],
        { cancelable: true }
      );
    } else {
      handleClearFilters();
    }
  };

  const filterSummary = getFilterSummary(selectedPriority, selectedCategory, sortBy);

  // --- Render Filter Chips (simple map, not FlatList) ---
  const renderChips = (options: readonly string[], selected: string, setSelected: (v: any) => void, colors: ThemeColors, section: string) =>
    <View style={styles.chipList}>
      {options.map(option => (
        <ModernChip
          key={option}
          isSelected={selected === option}
          label={option}
          section={section}
          onPress={() => handleChipPress(option, selected, setSelected)}
          colors={colors}
          accessibilityLabel={`Set ${section.toLowerCase()} filter to ${option}`}
          accessibilityHint={`Filters tasks by ${option} ${section.toLowerCase()}.`}
        />
      ))}
    </View>;

  if (isLoading) {
    return (
      <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading Filters...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.modalContent, { backgroundColor: colors.background }]}
      accessible
      accessibilityViewIsModal
    >
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {filterSummary}
        </Text>
        <RNPressable
          onPress={onRequestClose}
          style={styles.iconButton}
          accessibilityLabel="Close filter options"
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={28} color={colors.closeButton} />
        </RNPressable>
      </View>
      <View style={styles.divider} />
      {/* Filters Body */}
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Priority Section */}
        <View style={styles.filterSection}>
          <View style={styles.sectionLabelRow}>
            {sectionIcons.Priority}
            <Text style={[styles.filterLabel, { color: colors.text }]}>Priority</Text>
          </View>
          {renderChips(PRIORITY_OPTIONS, selectedPriority, setSelectedPriority, colors, 'Priority')}
        </View>
        <View style={styles.divider} />
        {/* Category Section */}
        <View style={styles.filterSection}>
          <View style={styles.sectionLabelRow}>
            {sectionIcons.Category}
            <Text style={[styles.filterLabel, { color: colors.text }]}>Category</Text>
          </View>
          {renderChips(CATEGORY_OPTIONS, selectedCategory, setSelectedCategory, colors, 'Category')}
        </View>
        <View style={styles.divider} />
        {/* Sort By Section */}
        <View style={styles.filterSection}>
          <View style={styles.sectionLabelRow}>
            {sectionIcons['Sort By']}
            <Text style={[styles.filterLabel, { color: colors.text }]}>Sort By</Text>
          </View>
          {renderChips(SORT_OPTIONS, sortBy, setSortBy, colors, 'Sort By')}
        </View>
      </ScrollView>
      {/* Footer */}
      <View style={[styles.modalFooter, { borderTopColor: colors.separator }]}>
        <RNPressable
          onPress={confirmAndClearFilters}
          style={({ pressed }) => [
            styles.clearButton,
            { backgroundColor: colors.clearButtonBackground, flexDirection: 'row', marginBottom: 10 },
            pressed && { opacity: 0.85 },
          ]}
          accessibilityLabel="Clear all filters"
          accessibilityHint="Resets priority, category, and sorting to default"
          accessibilityRole="button"
        >
          <MaterialIcons name="delete-sweep" size={20} color={colors.clearButtonText} style={{ marginRight: 6 }} />
          <Text style={[styles.clearButtonText, { color: colors.clearButtonText }]}>
            Clear Filters
          </Text>
        </RNPressable>
        <RNPressable
          onPress={onRequestClose}
          style={({ pressed }) => [
            styles.doneButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.85 },
          ]}
          accessibilityLabel="Done"
          accessibilityRole="button"
        >
          <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={[styles.doneButtonText, { color: '#fff' }]}>Done</Text>
        </RNPressable>
      </View>
    </View>
  );
};

/**
 * A modal component for selecting task filters (priority, category) and sorting options.
 * Persists selected filters across app sessions.
 */
export const FilterBar: React.FC<FilterBarModalProps> = ({
  visible,
  onRequestClose,
  theme,
  ...filterProps
}) => {
  const mergedTheme = useMemo(
    () => ({ ...defaultTheme, ...theme }),
    [theme]
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: mergedTheme.modalOverlay }]}
        onPress={onRequestClose}
        accessibilityLabel="Close filter modal"
        accessibilityRole="button"
      >
        <Pressable onPress={() => {}} style={{ width: '100%', alignItems: 'center' }}>
          <FilterBarContent
            {...filterProps}
            colors={mergedTheme}
            onRequestClose={onRequestClose}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// --- Modern Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 40,
    backgroundColor: 'rgba(30,41,59,0.18)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 22,
    padding: 0,
    maxHeight: '92%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  stickyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 8,
    letterSpacing: 0.1,
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    width: '100%',
    opacity: 0.7,
  },
  filterSection: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 4,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#f1f5f9',
    elevation: 1,
  },
  chipText: {
    fontSize: 15,
    textTransform: 'capitalize',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  selectedOptionText: {
    fontWeight: '700',
  },
  modalFooter: {
    padding: 18,
    borderTopWidth: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.90)',
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '60%',
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#f43f5e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '60%',
    backgroundColor: defaultTheme.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: defaultTheme.textSecondary,
  },
});

export default FilterBar;