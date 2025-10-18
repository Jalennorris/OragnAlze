import React from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { StyleSheet } from 'react-native';

type Props = {
  onLogin: (credential: AppleAuthentication.AppleAuthenticationCredential) => void;
  disabled?: boolean;
};

export default function AppleSignInButton({ onLogin, disabled }: Props) {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={18}
      style={styles.appleButton}
      onPress={async () => {
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          onLogin(credential);
        } catch (e: any) {
          if (e.code === 'ERR_CANCELED') return;
          alert('Apple Sign-In failed');
        }
      }}
      disabled={disabled}
    />
  );
}

const styles = StyleSheet.create({
  appleButton: {
    width: '100%',
    height: 44,
    marginVertical: 8,
  },
});