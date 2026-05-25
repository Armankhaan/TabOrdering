// src/App.jsx
import React from 'react'
import { useColorScheme } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import StoreContextProvider from './context/StoreContext'
import { ThemeProvider } from './context/ThemeContext'

import { Navigation } from './navigation'
import { Asset } from 'expo-asset'
import * as SplashScreen from 'expo-splash-screen'
import { Assets as NavAssets } from '@react-navigation/elements'

// Preload nav assets and keep splash screen visible until navigation is ready
Asset.loadAsync([...NavAssets])
SplashScreen.preventAutoHideAsync()

export default function App() {
  const scheme = useColorScheme()        // 'light' or 'dark'
  const isDark = scheme === 'dark'

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
      <SafeAreaProvider>
        {/* paint only the top notch/status‐bar area */}
        <SafeAreaView
          edges={['top']}
          style={{ backgroundColor: isDark ? '#000' : '#fff' }}
        />

        {/* Expo status bar: white icons on dark, dark icons on light */}
        <ExpoStatusBar style={isDark ? 'light' : 'dark'} translucent />

        <StoreContextProvider>
          <Navigation onReady={() => SplashScreen.hideAsync()} />
        </StoreContextProvider>
      </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

