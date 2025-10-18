import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_COLORS = {
  text: '#f3f4f6',
  background: '#18181b',
  placeholder: '#52525b',
  primary: '#818cf8',    // Indigo
  card: '#232336',
  border: '#232336',
  muted: '#a1a1aa',
  accent: '#818cf8',
  accent2: '#fbbf24',
  accent3: '#34d399',
  selected: 'rgba(129,140,248,0.22)', // Indigo with alpha
};

interface FilterComponentProps {
  selectedPriority: 'all' | 'low' | 'medium' | 'high';
  setSelectedPriority: (priority: 'all' | 'low' | 'medium' | 'high') => void;
  selectedCategory: 'all' | 'work' | 'personal' | 'school' | 'other';
  setSelectedCategory: (category: 'all' | 'work' | 'personal' | 'school' | 'other') => void;
  sortBy: 'date' | 'priority' | 'completed';
  setSortBy: (sortBy: 'date' | 'priority' | 'completed') => void;
  colors: {
    text: string;
    background: string;
    placeholder: string;
    primary: string;
  };
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  selectedPriority,
  setSelectedPriority,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  colors,
}) => {
  const animatedValue = new Animated.Value(0);

  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    const getDarkMode = async () => {
      try {
        const storedDarkMode = await AsyncStorage.getItem('darkMode');
        setDarkMode(storedDarkMode ? JSON.parse(storedDarkMode) : false);
      } catch {
        setDarkMode(false);
      }
    };
    getDarkMode();
    animate();
  }, []);

  const animate = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  // Use dark colors if darkMode is enabled
  const themeColors = darkMode ? DARK_COLORS : colors;

  return (
    <Animated.View
      style={[
        styles.filterContainer,
        {
          backgroundColor: themeColors.card || themeColors.background,
          transform: [{ translateY }],
          borderColor: darkMode ? themeColors.border : '#e0e0e0',
          borderWidth: 1,
        },
        darkMode && styles.filterContainerDark,
      ]}
    >
      <Text style={{
        color: themeColors.text,
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: 'bold',
        letterSpacing: 0.2,
      }}>
        {darkMode ? 'Dark mode is enabled' : 'Dark mode is disabled'}
      </Text>
      {/* Priority Filter */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Ionicons name="flag-outline" size={20} color={themeColors.primary} />
          <Text style={[styles.filterLabel, { color: themeColors.text, marginLeft: 8 }]}>Priority</Text>
        </View>
        <View style={styles.filterOptions}>
          {['all', 'low', 'medium', 'high'].map((priority) => (
            <TouchableOpacity
              key={priority}
              onPress={() => setSelectedPriority(priority as 'all' | 'low' | 'medium' | 'high')}
              style={[
                styles.filterOption,
                selectedPriority === priority && [
                  styles.selectedFilterOption,
                  {
                    backgroundColor: selectedPriority === priority
                      ? (darkMode ? themeColors.selected : 'rgba(244,67,54,0.13)')
                      : undefined,
                  },
                ],
              ]}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  {
                    color: selectedPriority === priority
                      ? themeColors.primary
                      : themeColors.text,
                  },
                ]}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.separator, { backgroundColor: darkMode ? themeColors.border : '#e0e0e0' }]} />

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Ionicons name="list-outline" size={20} color={themeColors.primary} />
          <Text style={[styles.filterLabel, { color: themeColors.text, marginLeft: 8 }]}>Category</Text>
        </View>
        <View style={styles.filterOptions}>
          {['all', 'work', 'personal', 'school', 'other'].map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category as 'all' | 'work' | 'personal' | 'school' | 'other')}
              style={[
                styles.filterOption,
                selectedCategory === category && [
                  styles.selectedFilterOption,
                  {
                    backgroundColor: selectedCategory === category
                      ? (darkMode ? themeColors.selected : 'rgba(244,67,54,0.13)')
                      : undefined,
                  },
                ],
              ]}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  {
                    color: selectedCategory === category
                      ? themeColors.primary
                      : themeColors.text,
                  },
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.separator, { backgroundColor: darkMode ? themeColors.border : '#e0e0e0' }]} />

      {/* Sort By */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Ionicons name="swap-vertical-outline" size={20} color={themeColors.primary} />
          <Text style={[styles.filterLabel, { color: themeColors.text, marginLeft: 8 }]}>Sort by</Text>
        </View>
        <View style={styles.filterOptions}>
          {['date', 'priority', 'completed'].map((sortOption) => (
            <TouchableOpacity
              key={sortOption}
              onPress={() => setSortBy(sortOption as 'date' | 'priority' | 'completed')}
              style={[
                styles.filterOption,
                sortBy === sortOption && [
                  styles.selectedFilterOption,
                  {
                    backgroundColor: sortBy === sortOption
                      ? (darkMode ? themeColors.selected : 'rgba(244,67,54,0.13)')
                      : undefined,
                  },
                ],
              ]}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  {
                    color: sortBy === sortOption
                      ? themeColors.primary
                      : themeColors.text,
                  },
                ]}
              >
                {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 7,
  },
  filterContainerDark: {
    shadowColor: '#000',
    shadowOpacity: 0.22,
    borderColor: '#23242B',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  filterOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  selectedFilterOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.13)',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
    borderRadius: 1,
  },
});

export default FilterComponent;