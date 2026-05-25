import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';
import NavBar from '../../components/NavBar';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { StoreContext } from '../../context/StoreContext';
import { MapPin, ArrowRight, Settings as SettingsIcon } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export function Home() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { selectedBranch, banners, username, orderDetails } = useContext(StoreContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <NavBar />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>{username || 'Guest'}</Text>
        </View>

        {/* Banners Carousel */}
        {banners.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerScroll}
          >
            {banners.map((banner, index) => (
              <View key={index} style={styles.bannerContainer}>
                <Image
                  source={{ uri: banner.image }}
                  style={styles.bannerImage}
                  defaultSource={require('../../assets/Kruncheese.png')}
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Selected Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <MapPin size={24} color={theme.colors.primary} />
            <Text style={styles.locationTitle}>Your Nearest Branch</Text>
          </View>

          <View style={styles.branchInfo}>
            <Text style={styles.branchName}>{selectedBranch?.name || 'Loading branch...'}</Text>
            <Text style={styles.branchAddress}>{selectedBranch?.address || 'Pakistan'}</Text>
          </View>

          <TouchableOpacity
            style={styles.changeLocationBtn}
            onPress={() => navigation.navigate('LocationSelection')}
          >
            {/* <Text style={styles.changeLocationText}>Change Location</Text> */}
            {/* <ArrowRight size={16} color={theme.colors.primary} /> */}
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              if (!orderDetails?.orderType) {
                Toast.show({
                  type: 'info',
                  text1: 'Order Type Required',
                  text2: 'Please select Dine In first.',
                  position: 'bottom'
                });
                navigation.navigate('Profile');
              } else {
                navigation.navigate('Updates');
              }
            }}
          >
            <Text style={styles.actionBtnText}>Explore Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>My Account</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Items Placeholder / Extra space */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

export default Home;

function getStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    welcomeBox: {
      paddingHorizontal: 24,
      paddingTop: 24,
      marginBottom: 20,
    },
    welcomeText: {
      fontSize: 16,
      color: theme.colors.text,
      opacity: 0.7,
      fontFamily: theme.fonts?.medium,
      fontWeight: '600',
    },
    usernameText: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.colors.text,
      fontFamily: theme.fonts?.bold,
      letterSpacing: -0.5,
    },
    bannerScroll: {
      marginVertical: 10,
    },
    bannerContainer: {
      width: width,
      paddingHorizontal: 20,
    },
    bannerImage: {
      width: width - 40,
      height: 180,
      borderRadius: 20,
      resizeMode: 'cover',
      backgroundColor: theme.colors.card,
    },
    locationCard: {
      margin: 20,
      padding: 24,
      backgroundColor: theme.colors.card,
      borderRadius: 24,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    locationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 10,
    },
    locationTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.text,
      opacity: 0.5,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      fontFamily: theme.fonts?.bold,
    },
    branchInfo: {
      marginBottom: 20,
    },
    branchName: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 4,
      fontFamily: theme.fonts?.bold,
      letterSpacing: -0.2,
    },
    branchAddress: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.6,
      fontWeight: '500',
      fontFamily: theme.fonts?.medium,
    },
    changeLocationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    changeLocationText: {
      color: theme.colors.primary,
      fontWeight: '700',
      fontSize: 15,
      fontFamily: theme.fonts?.bold,
    },
    actionsGrid: {
      paddingHorizontal: 20,
      gap: 12,
    },
    actionBtn: {
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
    actionBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
      fontFamily: theme.fonts?.bold,
    }
  });
}
