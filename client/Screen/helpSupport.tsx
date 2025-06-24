import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Pressable,
  Dimensions,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const SUPPORT_EMAIL = 'support@organalze.com';
const { width } = Dimensions.get('window');

const HelpSupport: React.FC = () => {
  const navigation = useNavigation();

  const handleContactSupport = async () => {
    const subject = encodeURIComponent('Help & Support');
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No email client is available to send support requests.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to open email client.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back-ios" size={22} color="#6366f1" />
          </Pressable>
          <Text style={styles.title}>Help & Support</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Need help?</Text>
          <Text style={styles.cardDesc}>
            If you have any questions, issues, or feedback, please contact our support team. We're here to help!
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleContactSupport}>
            <Icon name="email" size={22} color="#fff" />
            <Text style={styles.buttonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
  container: {
    flex: 1,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 0,
    paddingTop: 0,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: Platform.OS === 'ios' ? 8 : 0,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#6366f1',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3730a3',
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    shadowColor: '#6366f1',
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 10,
    marginHorizontal: 0,
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
    width: '100%',
    alignSelf: 'center',
    minHeight: 320,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 14,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 17,
    color: '#18181b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '400',
    paddingHorizontal: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    marginLeft: 10,
    letterSpacing: 0.2,
  },
});

export default HelpSupport;
