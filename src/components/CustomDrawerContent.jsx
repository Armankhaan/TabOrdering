// src/components/CustomDrawerContent.jsx
import React, { useContext } from 'react';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Switch,
} from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { StoreContext } from '../context/StoreContext';
import { ThemeContext } from '../context/ThemeContext';
import Toast from 'react-native-toast-message';

export function CustomDrawerContent({ navigation, ...props }) {
  const { username, customerInfo, selectedBranch, clearCustomerInfo, orderDetails } = useContext(StoreContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleLogout = () => {
    clearCustomerInfo();
    navigation.dispatch(DrawerActions.closeDrawer());
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Root',
          state: {
            routes: [{ name: 'Login' }],
          },
        },
      ],
    });
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../assets/Kruncheese.png')} style={styles.logo} resizeMode="contain" />

        {customerInfo ? (
          <View style={styles.profileBlock}>
            <View style={styles.profileRow}>
              <TouchableOpacity
                style={[styles.profileCircle, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.profileInitial}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </TouchableOpacity>
              <View style={styles.nameBlock}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>
                  {customerInfo.name}
                </Text>
                {selectedBranch && (
                  <Text style={[styles.branchText, { color: theme.colors.primary }]}>
                    {selectedBranch.name}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: theme.colors.primary, marginTop: 16 }]}
              onPress={handleLogout}
            >
              <Text style={[styles.signInText, { color: '#fff' }]}>
                LOGOUT
              </Text>
              <Image
                source={require('../assets/login.png')}
                style={[styles.signInIcon, { tintColor: '#fff' }]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Login To KRUNCHEESE
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text }]}>
              Unlock offers & discounts
            </Text>
            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                navigation.dispatch(DrawerActions.closeDrawer());
                navigation.navigate('Root', {
                  screen: 'HomeTabs',
                  params: { screen: 'Account' },
                });
              }}
            >
              <Text style={[styles.signInText, { color: theme.colors.text }]}>
                SIGN IN
              </Text>
              <Image
                source={require('../assets/login.png')}
                style={styles.signInIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.primary }]} />

      {/* Explore Menu */}
      <View style={styles.exploreWrapper}>
        <TouchableOpacity
          style={[styles.exploreCard, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            navigation.dispatch(DrawerActions.closeDrawer());
            if (!orderDetails?.orderType) {
              Toast.show({
                type: 'info',
                text1: 'Order Type Required',
                text2: 'Please select Dine In first.',
                position: 'bottom'
              });
              navigation.navigate('Root', { screen: 'Profile' });
            } else {
              navigation.navigate('Root', {
                screen: 'HomeTabs',
                params: { screen: 'Updates', params: { category: 'All' } },
              });
            }
          }}
        >
          <Text style={[styles.exploreText, { color: theme.colors.text }]}>
            Explore Menu
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      {/* Theme toggle */}
      <View style={styles.themeRow}>
        <Text style={[styles.themeText, { color: theme.colors.text }]}>
          {theme.dark ? 'Dark Mode' : 'Light Mode'}
        </Text>
        <Switch
          value={theme.dark}
          onValueChange={toggleTheme}
          trackColor={{ true: '#888', false: '#ccc' }}
        />
      </View>

      {/* Terms & Version */}
      <View style={styles.infoRow}>
        <TouchableOpacity onPress={() => { /* open T&C */ }}>
          <Text style={[styles.infoText, { color: theme.colors.primary }]}>
            Terms & Conditions
          </Text>
        </TouchableOpacity>
        <Text style={[styles.infoText, { color: theme.colors.primary }]}>
          V-1.1-U
        </Text>
      </View>

      {/* Contact Us */}
      <TouchableOpacity
        style={[styles.contactBar, { backgroundColor: theme.colors.primary }]}
        onPress={() => Linking.openURL('tel:(042)111434434')}
      >
        <Text style={[styles.contactText, { color: theme.colors.text }]}>
          CONTACT US
        </Text>
        <Image
          source={require('../assets/phone-call.png')}
          style={styles.contactIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 20, paddingHorizontal: 16 },
  logo: { width: 60, height: 60, marginBottom: 12 },

  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },

  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  signInText: { fontSize: 16, fontWeight: '700' },
  signInIcon: { width: 20, height: 20, marginLeft: 'auto' },

  profileBlock: { alignItems: 'flex-start', paddingVertical: 16, width: '100%' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameBlock: { flex: 1 },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  profileName: { fontSize: 18, fontWeight: '700' },
  branchText: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  
  divider: { height: 1, marginVertical: 8 },

  exploreWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  exploreCard: {
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  exploreText: { fontSize: 16, fontWeight: '600' },

  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeText: { fontSize: 16, fontWeight: '600' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoText: { fontSize: 13 },

  contactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  contactText: { fontSize: 16, fontWeight: '700' },
  contactIcon: { width: 20, height: 20, marginLeft: 'auto' },
});
