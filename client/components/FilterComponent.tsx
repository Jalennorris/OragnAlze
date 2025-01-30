import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const animate = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  React.useEffect(() => {
    animate();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <Animated.View
      style={[
        styles.filterContainer,
        { backgroundColor: colors.background, transform: [{ translateY }] },
      ]}
    >
      {/* Priority Filter */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Ionicons name="flag-outline" size={20} color={colors.primary} />
          <Text style={[styles.filterLabel, { color: colors.text, marginLeft: 8 }]}>Priority</Text>
        </View>
        <View style={styles.filterOptions}>
          {['all', 'low', 'medium', 'high'].map((priority) => (
            <TouchableOpacity
              key={priority}
              onPress={() => setSelectedPriority(priority as 'all' | 'low' | 'medium' | 'high')}
              style={[
                styles.filterOption,
                selectedPriority === priority && styles.selectedFilterOption,
              ]}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  { color: selectedPriority === priority ? colors.primary : colors.text },
                ]}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.separator} />

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Ionicons name="list-outline" size={20} color={colors.primary} />
          <Text style={[styles.filterLabel, { color: colors.text, marginLeft: 8 }]}>Category</Text>
        </View>
        <View style={styles.filterOptions}>
          {['all', 'work', 'personal', 'school', 'other'].map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category as 'all' | 'work' | 'personal' | 'school' | 'other')}
              style={[
                styles.filterOption,
                selectedCategory === category && styles.selectedFilterOption,
              ]}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  { color: selectedCategory === category ? colors.primary : colors.text },
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.separator} />

      {/* Sort By */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Ionicons name="swap-vertical-outline" size={20} color={colors.primary} />
          <Text style={[styles.filterLabel, { color: colors.text, marginLeft: 8 }]}>Sort by</Text>
        </View>
        <View style={styles.filterOptions}>
          {['date', 'priority', 'completed'].map((sortOption) => (
            <TouchableOpacity
              key={sortOption}
              onPress={() => setSortBy(sortOption as 'date' | 'priority' | 'completed')}
              style={[
                styles.filterOption,
                sortBy === sortOption && styles.selectedFilterOption,
              ]}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  { color: sortBy === sortOption ? colors.primary : colors.text },
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
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
    fontWeight: '600',
  },
  filterOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedFilterOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
});

export default FilterComponent;