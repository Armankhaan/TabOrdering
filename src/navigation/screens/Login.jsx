// src/navigation/screens/Login.jsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StoreContext } from '../../context/StoreContext';
import { ThemeContext } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Config from '../../constants/Config';

export const Login = () => {
  const [username, setInputUsername] = useState(Config.ADMIN_USERNAME);
  const [password, setInputPassword] = useState(Config.ADMIN_PASSWORD);
  const { loginStub } = useContext(StoreContext);
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const styles = getStyles(theme);

  const handleLogin = async () => {
    const res = await loginStub(username, password);
    if (res && res.success) {
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: 'Welcome back!',
      });
      navigation.navigate('Profile');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: res && res.message ? res.message : `Invalid credentials. Use ${Config.ADMIN_USERNAME}/${Config.ADMIN_PASSWORD}`,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo-2x.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>Please login to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Username</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={username}
              onChangeText={setInputUsername}
              placeholder="Enter username"
              placeholderTextColor="#888"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={password}
              onChangeText={setInputPassword}
              placeholder="Enter password"
              placeholderTextColor="#888"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleLogin}
          >
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </KeyboardAvoidingView>
  );
};

const getStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: theme.fonts?.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    fontFamily: theme.fonts?.medium,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: theme.fonts?.bold,
    opacity: 0.8,
  },
  input: {
    height: 60,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: theme.colors.card,
    fontFamily: theme.fonts?.regular,
  },
  loginBtn: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: theme.fonts?.bold,
    letterSpacing: 0.5,
  },
});
