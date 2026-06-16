// src/navigation/index.jsx

import React, { useContext } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavDefault,
  DarkTheme as NavDark
} from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, TouchableOpacity, Text, StyleSheet } from 'react-native';

import { ThemeContext } from '../context/ThemeContext';
import { StoreContext } from '../context/StoreContext';

// screens
import { Home } from './screens/Home';
import { Updates } from './screens/Updates';
import { Settings } from './screens/Settings';
import Profile from './screens/Profile';
import { NotFound } from './screens/NotFound';
import { DealOptions } from './screens/DealOptions';
import { ItemOptions } from './screens/ItemOptions';
import { Cart } from './screens/Cart';
// import ProceedToCheckout from './screens/ProceedtoCheckout';
import OrderSuccess from './screens/OrderSuccess';
import { LocationSelection } from './screens/LocationSelection';
import { Login } from './screens/Login';
import TableSelection from './screens/TableSelection';
import { TodayOrders } from './screens/TodayOrders';

// assets
import menuIcon from '../assets/menu.png';
import downloadIcon from '../assets/download.png';
// import userIcon if you ever need it elsewhere

// custom components
import CustomNavBar from '../components/NavBar';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { View, ActivityIndicator } from 'react-native';

// ——— Bottom Tab Navigator ———
const Tab = createBottomTabNavigator();

function HomeTabs() {
  const { theme } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={{
        header: props => <CustomNavBar {...props} />,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        tabBarStyle: { backgroundColor: theme.colors.background },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <Image
              source={downloadIcon}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Updates"
        component={Updates}
        options={{
          headerShown: false,
          tabBarLabel: 'Menu',
          tabBarIcon: ({ size, color }) => (
            <Image
              source={menuIcon}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ——— Main Stack Navigator ———
const Stack = createNativeStackNavigator();

export function RootStackNavigator() {
  const { theme } = useContext(ThemeContext);
  const { selectedBranch, loading } = useContext(StoreContext);

  const headerStyle = { backgroundColor: theme.colors.background };
  const headerTintColor = theme.colors.text;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="LocationSelection" component={LocationSelection} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} />

      <Stack.Screen
        name="TableSelection"
        component={TableSelection}
        options={{
          headerShown: true,
          title: 'Select Table',
          headerStyle,
          headerTintColor,
        }}
      />

      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          headerShown: true,
          headerStyle,
          headerTintColor,
        }}
      />

      <Stack.Screen
        name="SettingsModal"
        component={Settings}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="DealOptions"
        component={DealOptions}
        options={{
          headerShown: true,
          title: 'Deal Options',
          headerStyle,
          headerTintColor,
        }}
      />

      <Stack.Screen
        name="ItemOptions"
        component={ItemOptions}
        options={{
          headerShown: true,
          title: 'Item Options',
          headerStyle,
          headerTintColor,
        }}
      />

      <Stack.Screen
        name="Cart"
        component={Cart}
        options={{
          headerShown: true,
          title: 'Cart',
          headerStyle,
          headerTintColor,
        }}
      />

      {/* 
      <Stack.Screen
        name="ProceedToCheckout"
        component={ProceedToCheckout}
        options={{
          headerShown: true,
          title: 'Proceed to Checkout',
          headerStyle,
          headerTintColor,
        }}
      />
      */}

      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccess}
        options={{
          headerShown: true,
          title: "Order Success",
          headerStyle,
          headerTintColor,
        }}
      />

      <Stack.Screen
        name="TodayOrders"
        component={TodayOrders}
        options={{
          headerShown: true,
          title: "Today's Orders",
          headerStyle,
          headerTintColor,
        }}
      />

      <Stack.Screen
        name="NotFound"
        component={NotFound}
        options={{
          title: '404',
          headerStyle,
          headerTintColor,
        }}
      />
    </Stack.Navigator>
  );
}

// ——— Drawer Navigator & App Container ———
const Drawer = createDrawerNavigator();

export function Navigation({ onReady }) {
  const { theme } = useContext(ThemeContext);
  const baseTheme = theme.dark ? NavDark : NavDefault;

  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.notification,
    },
    fonts: theme.fonts || {},
  };

  return (
    <NavigationContainer theme={navTheme} onReady={onReady}>
      <Drawer.Navigator
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Drawer.Screen name="Root" component={RootStackNavigator} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
