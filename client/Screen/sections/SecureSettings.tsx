import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as LocalAuthentication from 'expo-local-authentication';

const SecureSettings: React.FC = () => {
  const navigation = useNavigation();
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometricSupported(hasHardware && supportedTypes.length > 0);
      // Optionally, load saved biometricEnabled state from storage here
    })();
  }, []);

  const handleToggle = async () => {
    if (!biometricSupported) {
      Alert.alert('Not Supported', 'Biometric authentication is not available on this device.');
      return;
    }
    if (!biometricEnabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
      });
      if (result.success) {
        setBiometricEnabled(true);
        // Optionally, save state to storage
      }
    } else {
      setBiometricEnabled(false);
      // Optionally, save state to storage
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <Ionicons
            name="arrow-back"
            size={28}
            color="#a78bfa"
            style={{ marginRight: 12 }}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          />
          <Text style={styles.pageTitle}>Secure Settings</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.content}>
          <View style={styles.card}>
            <Ionicons
              name={biometricSupported ? 'finger-print' : 'lock-closed'}
              size={38}
              color={biometricSupported ? '#a78bfa' : '#bbb'}
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.cardTitle}>Biometric Authentication</Text>
            <Text style={styles.cardDesc}>
              {biometricSupported
                ? 'Enable Face ID, Touch ID, or fingerprint unlock for extra security.'
                : 'Biometric authentication is not available on this device.'}
            </Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Enable Biometrics</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggle}
                disabled={!biometricSupported}
                trackColor={{ false: '#d1d5db', true: '#a78bfa' }}
                thumbColor={biometricEnabled ? '#a78bfa' : '#f4f3f4'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ede9fe',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginHorizontal: 10,
    marginTop: 10,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  pageTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    color: '#a78bfa',
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Roboto', default: undefined }),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#a78bfa',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  cardDesc: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ede9fe',
  },
  rowLabel: {
    fontSize: 16,
    color: '#18181b',
    fontWeight: '600',
  },
});

export default SecureSettings;
