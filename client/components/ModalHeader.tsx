import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  onExpand?: () => void;
  isFullSize?: boolean;
  style?: any;
  titleStyle?: any;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  onExpand,
  isFullSize,
  style,
  titleStyle,
}) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', padding: 12 }, style]}>
    {onExpand && (
      <TouchableOpacity
        style={{ padding: 8 }}
        onPress={onExpand}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={isFullSize ? "Collapse modal" : "Expand modal"}
      >
        <Ionicons name={isFullSize ? "chevron-down" : "chevron-up"} size={24} color="#fff" />
      </TouchableOpacity>
    )}
    <Text style={[{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#fff', fontSize: 18 }, titleStyle]}>
      {title}
    </Text>
    <TouchableOpacity
      style={{ padding: 8 }}
      onPress={onClose}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Close modal"
    >
      <Ionicons name="close" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
);

export default ModalHeader;
