import React, { useContext } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native'
import { ThemeContext } from '../../context/ThemeContext'
import { StoreContext } from '../../context/StoreContext'

export default function OrderSuccess() {
  const navigation = useNavigation()
  const { apiData } = useRoute().params || {}
  const { theme } = useContext(ThemeContext)
  const { updateOrderDetails } = useContext(StoreContext) || {}
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🎉</Text>
      </View>
      
      <Text style={styles.title}>Order Placed!</Text>
      <Text style={styles.subtitle}>API Server Response:</Text>
      
      <View style={styles.responseContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.responseText}>
            {apiData ? JSON.stringify(apiData, null, 2) : 'No response data available.'}
          </Text>
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          // Clear previous order details (like orderType, table_id)
          if (updateOrderDetails) {
             updateOrderDetails(null);
          }
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Profile' }],
            })
          )
        }}
      >
        <Text style={styles.buttonText}>Start New Order</Text>
      </TouchableOpacity>
    </View>
  )
}

const getStyles = theme => {
  const isLight = !theme.dark
  const cardBg = isLight ? '#F5F5F5' : '#1E1E1E'
  const text = theme.colors.text
  const primary = theme.colors.primary

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    iconContainer: {
      marginBottom: 16,
    },
    icon: {
      fontSize: 64,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 8,
      color: text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      color: theme.colors.primary,
      opacity: 0.9,
    },
    responseContainer: {
      width: '100%',
      height: 300,
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: isLight ? '#E0E0E0' : '#333',
    },
    scrollView: {
      flex: 1,
    },
    responseText: {
      fontSize: 13,
      fontFamily: 'Courier', // If available, otherwise default
      color: isLight ? '#333' : '#CCC',
      lineHeight: 18,
    },
    button: {
      width: '100%',
      padding: 18,
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonText: {
      color: '#FFF',
      fontWeight: '700',
      fontSize: 16,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  })
}
