import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface FilterBarProps {
  selectedPriority: 'all' | 'low' | 'medium' | 'high';
  setSelectedPriority: (priority: 'all' | 'low' | 'medium' | 'high') => void;
  selectedCategory: 'all' | 'work' | 'personal' | 'school' | 'other';
  setSelectedCategory: (category: 'all' | 'work' | 'personal' | 'school' | 'other') => void;
  sortBy: 'date' | 'priority' | 'completed';
  setSortBy: (sort: 'date' | 'priority' | 'completed') => void;
  colors: {
    text: string;
  };
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedPriority,
  setSelectedPriority,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  colors,
}) => {
  const onClearFilters = () => {
    setSelectedPriority('all');
    setSelectedCategory('all');
    setSortBy('date');
  };

  return (
    <View style={styles.filterContainer}>
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Priority:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'low', 'medium', 'high'].map((priority) => (
            <TouchableOpacity
              key={priority}
              onPress={() => setSelectedPriority(priority as 'all' | 'low' | 'medium' | 'high')}
            >
              <Text
                style={[
                  styles.filterOption,
                  selectedPriority === priority && styles.selectedOption,
                  { color: selectedPriority === priority ? '#f44336' : colors.text },
                ]}
              >
                {priority}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'work', 'personal', 'school', 'other'].map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category as 'all' | 'work' | 'personal' | 'school' | 'other')}
            >
              <Text
                style={[
                  styles.filterOption,
                  selectedCategory === category && styles.selectedOption,
                  { color: selectedCategory === category ? '#f44336' : colors.text },
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Sort By:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['date', 'priority', 'completed'].map((sortOption) => (
            <TouchableOpacity key={sortOption} onPress={() => setSortBy(sortOption as 'date' | 'priority' | 'completed')}>
              <Text
                style={[
                  styles.filterOption,
                  sortBy === sortOption && styles.selectedOption,
                  { color: sortBy === sortOption ? '#f44336' : colors.text },
                ]}
              >
                {sortOption}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity onPress={onClearFilters} style={styles.clearButton}>
        <Text style={styles.clearButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    marginBottom: 20,
    padding: 15, // Increased padding for better spacing
    borderRadius: 10,
    backgroundColor: '#f1f1f1',
  },
  filterSection: {
    marginBottom: 15, // Increased margin for better separation
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8, // Adjusted for better spacing
  },
  filterOption: {
    fontSize: 14,
    marginRight: 15, // Increased spacing between options
    textTransform: 'capitalize',
  },
  selectedOption: {
    fontWeight: 'bold',
  },
  clearButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f44336', // Or another suitable color
    borderRadius: 5,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff', // White text for contrast
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default FilterBar;
