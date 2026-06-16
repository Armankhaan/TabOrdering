import React, { useContext, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native'
import { ThemeContext } from '../../context/ThemeContext'
import { StoreContext } from '../../context/StoreContext'
import Toast from 'react-native-toast-message'

export default function OrderSuccess() {
  const navigation = useNavigation()
  const { apiData } = useRoute().params || {}
  const { theme } = useContext(ThemeContext)
  const { updateOrderDetails } = useContext(StoreContext) || {}
  const styles = getStyles(theme)

  useEffect(() => {
    if (apiData && apiData.message) {
      Toast.show({
        type: 'success',
        text1: 'Order Placed!',
        text2: apiData.message,
        position: 'top',
      })
    }
    if (updateOrderDetails) {
      updateOrderDetails(null)
    }
  }, [apiData, updateOrderDetails])

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🎉</Text>
      </View>
      
      <Text style={styles.title}>Order Placed!</Text>
      
      <View style={styles.responseContainer}>
        {apiData ? (
          <View style={styles.successDetails}>
            <Text style={styles.messageText}>
              {apiData.message || 'Order placed successfully'}
            </Text>
            {apiData.order_number ? (
              <View style={styles.orderNumberContainer}>
                <Text style={styles.orderNumberLabel}>Order Number</Text>
                <Text style={styles.orderNumberText}>{apiData.order_number}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.responseText}>No response data available.</Text>
        )}
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
      <Toast />
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
      marginBottom: 32,
      color: text,
      textAlign: 'center',
    },
    responseContainer: {
      width: '100%',
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 24,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: isLight ? '#E0E0E0' : '#333',
      alignItems: 'center',
      justifyContent: 'center',
    },
    successDetails: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    messageText: {
      fontSize: 18,
      fontWeight: '600',
      color: text,
      textAlign: 'center',
      marginBottom: 20,
    },
    orderNumberContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backgroundColor: isLight ? '#FFF' : '#2A2A2A',
      borderRadius: 12,
      width: '100%',
      borderWidth: 1,
      borderColor: isLight ? '#E0E0E0' : '#444',
    },
    orderNumberLabel: {
      fontSize: 12,
      color: isLight ? '#666' : '#AAA',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      fontWeight: '700',
      marginBottom: 6,
    },
    orderNumberText: {
      fontSize: 36,
      fontWeight: '900',
      color: primary,
      textAlign: 'center',
    },
    responseText: {
      fontSize: 14,
      color: isLight ? '#666' : '#AAA',
      textAlign: 'center',
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
