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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// --- Default Theme ---
const defaultTheme: ThemeColors = {
  background: '#ffffff', // White background
  text: '#333333', // Dark gray text
  textSecondary: '#666666', // Medium gray text
  primary: '#007AFF', // Blue primary (iOS style)
  selectedBackground: '#E0F2FE', // Light blue background for selected
  separator: '#e0e0e0', // Light gray separator
  closeButton: '#555555', // Darker gray for close icon
  clearButtonBackground: '#FF3B30', // Red clear button (iOS style)
  clearButtonText: '#ffffff', // White text on clear button
  modalOverlay: 'rgba(0, 0, 0, 0.4)', // Semi-transparent black overlay
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

// --- Components ---

/**
 * Represents a single tappable filter option.
 * Memoized for performance as props rarely change individually.
 */
const FilterOption: React.FC<{
  isSelected: boolean;
  label: string;
  onPress: () => void;
  colors: Pick<ThemeColors, 'text' | 'primary' | 'selectedBackground'>;
  accessibilityLabel: string;
  accessibilityHint: string;
}> = React.memo(
  ({
    isSelected,
    label,
    onPress,
    colors,
    accessibilityLabel,
    accessibilityHint,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterOptionButton,
        isSelected && { backgroundColor: colors.selectedBackground },
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: isSelected }}
    >
      <Text
        style={[
          styles.filterOptionText,
          { color: isSelected ? colors.primary : colors.text },
          isSelected && styles.selectedOptionText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
);

/**
 * The main content view of the filter modal.
 */
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
  const [isLoading, setIsLoading] = useState(true); // State for loading persisted filters

  // --- Filter Persistence ---
  // Load filters from storage on mount
  useEffect(() => {
    let isMounted = true;
    const loadFilters = async () => {
      try {
        const saved = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
        if (saved && isMounted) {
          const { priority, category, sort } = JSON.parse(saved);
          // Validate loaded values before setting state
          if (priority && PRIORITY_OPTIONS.includes(priority)) setSelectedPriority(priority);
          if (category && CATEGORY_OPTIONS.includes(category)) setSelectedCategory(category);
          if (sort && SORT_OPTIONS.includes(sort)) setSortBy(sort);
        }
      } catch (error) {
        console.error('FilterBarModal: Failed to load filters', error);
        // Optionally clear storage if parsing fails drastically
        // await AsyncStorage.removeItem(FILTERS_STORAGE_KEY);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFilters();

    return () => {
      isMounted = false; // Prevent state updates on unmounted component
    };
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep dependency array empty to load only once

  // Save filters to storage when they change
  useEffect(() => {
    // Don't save during initial load
    if (isLoading) return;

    const saveFilters = async () => {
      try {
        await AsyncStorage.setItem(
          FILTERS_STORAGE_KEY,
          JSON.stringify({
            priority: selectedPriority,
            category: selectedCategory,
            sort: sortBy,
          })
        );
      } catch (error) {
        console.error('FilterBarModal: Failed to save filters', error);
      }
    };
    saveFilters();
  }, [selectedPriority, selectedCategory, sortBy, isLoading]);

  // --- Event Handlers ---
  const handleClearFilters = useCallback(() => {
    setSelectedPriority('all');
    setSelectedCategory('all');
    setSortBy('date');
  }, [setSelectedPriority, setSelectedCategory, setSortBy]);

  const confirmAndClearFilters = useCallback(() => {
    // Check if any filter is active
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
        { cancelable: true } // Allow dismissing by tapping outside on Android
      );
    } else {
      // No need to confirm if already default
      handleClearFilters();
      // Optionally provide feedback that filters were already clear
      // Alert.alert('Filters Cleared', 'All filters were already set to default.');
    }
  }, [selectedPriority, selectedCategory, sortBy, handleClearFilters]);

  // --- Derived Data ---
  const filterSummary = useMemo(
    () => getFilterSummary(selectedPriority, selectedCategory, sortBy),
    [selectedPriority, selectedCategory, sortBy]
  );

  // --- Render Logic ---
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
    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {filterSummary}
        </Text>
        <TouchableOpacity
          onPress={onRequestClose}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
          accessibilityLabel="Close filter options"
          accessibilityRole="button"
        >
          <Text style={[styles.closeButtonText, { color: colors.closeButton }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Filters Body */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Priority Section */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Priority</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <FilterOption
                key={priority}
                isSelected={selectedPriority === priority}
                label={priority}
                onPress={() => setSelectedPriority(priority)}
                colors={colors}
                accessibilityLabel={`Set priority filter to ${priority}`}
                accessibilityHint={`Filters tasks by ${priority} priority. Currently ${
                  selectedPriority === priority ? 'selected' : 'not selected'
                }.`}
              />
            ))}
          </ScrollView>
        </View>

        {/* Category Section */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {CATEGORY_OPTIONS.map((category) => (
              <FilterOption
                key={category}
                isSelected={selectedCategory === category}
                label={category}
                onPress={() => setSelectedCategory(category)}
                colors={colors}
                accessibilityLabel={`Set category filter to ${category}`}
                accessibilityHint={`Filters tasks by ${category} category. Currently ${
                  selectedCategory === category ? 'selected' : 'not selected'
                }.`}
              />
            ))}
          </ScrollView>
        </View>

        {/* Sort By Section */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Sort By</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {SORT_OPTIONS.map((sortOption) => (
              <FilterOption
                key={sortOption}
                isSelected={sortBy === sortOption}
                label={sortOption}
                onPress={() => setSortBy(sortOption)}
                colors={colors}
                accessibilityLabel={`Sort tasks by ${sortOption}`}
                accessibilityHint={`Sorts tasks by ${sortOption}. Currently ${
                  sortBy === sortOption ? 'selected' : 'not selected'
                }.`}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.modalFooter, { borderTopColor: colors.separator }]}>
        <TouchableOpacity
          onPress={confirmAndClearFilters}
          style={[
            styles.clearButton,
            { backgroundColor: colors.clearButtonBackground },
          ]}
          accessibilityLabel="Clear all filters"
          accessibilityHint="Resets priority, category, and sorting to default"
          accessibilityRole="button"
        >
          <Text style={[styles.clearButtonText, { color: colors.clearButtonText }]}>
            Clear Filters
          </Text>
        </TouchableOpacity>
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
  ...filterProps // selectedPriority, setSelectedPriority, etc.
}) => {
  // Merge custom theme with defaults
  const mergedTheme = useMemo(
    () => ({ ...defaultTheme, ...theme }),
    [theme]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: mergedTheme.modalOverlay }]}
        onPress={onRequestClose}
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

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    paddingHorizontal: 15, // Add some horizontal padding to the overlay
    paddingVertical: 40, // Ensure modal doesn't touch screen edges vertically
  },
  modalContent: {
    width: '100%', // Take full width within overlay padding
    maxWidth: 500, // Max width for larger screens/tablets
    borderRadius: 12,
    padding: 0, // Padding handled by sections
    maxHeight: '90%', // Limit modal height
    overflow: 'hidden', // Clip content to rounded corners
    // Shadow/Elevation for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8, // Reduced bottom padding
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1, // Allow text to shrink if close button needs space
    marginRight: 8, // Space before close button
  },
  closeButton: {
    padding: 8, // Make touch target larger
    marginLeft: 'auto', // Push to the right if summary is short
  },
  closeButtonText: {
    fontSize: 24, // Larger '✕'
    fontWeight: 'bold',
    lineHeight: 24, // Ensure consistent height
    color: '#000', // Ensure black color
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1, // Add separator line
    borderColor: defaultTheme.separator, // Use default as fallback
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'capitalize', // e.g., "Priority"
  },
  scrollContentContainer: {
    paddingBottom: 4, // Add padding for scrollbar or visual spacing
    alignItems: 'center',
  },
  filterOptionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 16, // Pill shape
    borderWidth: 1,
    borderColor: 'transparent', // For layout consistency, color changes on select
  },
  filterOptionText: {
    fontSize: 14,
    textTransform: 'capitalize', // e.g., "low", "medium"
    textAlign: 'center',
  },
  selectedOptionText: {
    fontWeight: '600', // Bolder text when selected
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center', // Center clear button
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '50%', // Make button reasonably wide
    // Shadow/Elevation for the button
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  // Removed unused styles: filterContainer, stickyTop, stickyBottom, actionRow, headerCloseLabel, bottomCloseButton, bottomCloseButtonText, scrollWrapper etc.
});

export default FilterBar; // Export the main modal component