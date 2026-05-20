import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from "react-native";
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { StoreContext } from '../../context/StoreContext';
import { ThemeContext } from '../../context/ThemeContext';
import Config from '../../constants/Config';

const RED = '#D32F2F';

const PlaceOrderScreen = () => {
  const navigation = useNavigation();
  const { cartItems, customerInfo, orderDetails, clearCart, selectedBranch } =
    useContext(StoreContext);
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);

  const getTotalCartAmount = () =>
    Math.round(
      Object.values(cartItems).reduce(
        (sum, item) =>
          sum + (parseFloat(item.price) || 0) * (item.quantity || 1),
        0
      )
    );

  const handleSubmit = async () => {
    if (loading) return;
    if (!customerInfo) return navigation.navigate('Login');
    if (!cartItems || !Object.keys(cartItems).length) return navigation.navigate('Home');
    if (!paymentMethod)
      return Alert.alert('Error', 'Please select a payment method!');

    setLoading(true);

    try {
      const payload = {
        company_id: selectedBranch?.company_id || Config.COMPANY_ID,
        branch_id: selectedBranch?.id || Config.DEFAULT_BRANCH_ID,
        order_info: {
          cart: cartItems,
          orderType: orderDetails?.orderType || "Takeaway",
          table_id: orderDetails?.table_id || 3001,
          paymentMethod: paymentMethod,
          customerInfo: customerInfo
        }
      };

      console.log('🚀 Sending Raw Cart Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        'https://api-krc.shabanbabar.com/api/public/orders',
        payload
      );

      clearCart();
      navigation.navigate('OrderSuccess', { apiData: response.data || null });
    } catch (err) {
      console.error('Order Placement Error:', err);
      Alert.alert('Error', 'An error occurred while placing the order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.methodRow}>
          {[
            { id: 'Cash', label: 'Cash', icon: '💵' },
            { id: 'Card', label: 'Card', icon: '💳' }
          ].map(method => (
            <TouchableOpacity
              key={method.id}
              onPress={() => setPaymentMethod(method.id)}
              activeOpacity={0.7}
              style={[
                styles.methodTile,
                paymentMethod === method.id && styles.methodTileSelected
              ]}
            >
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <Text style={[
                styles.methodText,
                paymentMethod === method.id && styles.methodTextSelected
              ]}>
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sub Total</Text>
          <Text style={styles.summaryValue}>Rs {getTotalCartAmount()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>Free</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>Rs {getTotalCartAmount()}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        activeOpacity={0.8}
        style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]}
        disabled={loading}
      >
        <Text style={styles.placeOrderText}>
          {loading ? 'Processing...' : 'Place Order Now'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const getStyles = theme => {
  const isLight = !theme.dark;
  const cardBg = isLight ? '#FFFFFF' : '#1E1E1E';
  const borderColor = isLight ? '#E0E0E0' : '#333333';
  const secondaryText = theme.colors.text + 'B3';

  return StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: isLight ? '#F8F9FA' : '#121212',
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
      color: theme.colors.text,
    },
    methodRow: {
      flexDirection: 'row',
      gap: 12,
    },
    methodTile: {
      flex: 1,
      height: 90,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: borderColor,
      backgroundColor: cardBg,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    methodTileSelected: {
      borderColor: RED,
      backgroundColor: RED + '08',
    },
    methodIcon: {
      fontSize: 24,
    },
    methodText: {
      fontSize: 14,
      fontWeight: '600',
      color: secondaryText,
    },
    methodTextSelected: {
      color: RED,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 4,
    },
    summaryLabel: {
      fontSize: 14,
      color: secondaryText,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: borderColor,
      marginVertical: 12,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: '800',
      color: RED,
    },
    placeOrderBtn: {
      backgroundColor: RED,
      borderRadius: 14,
      padding: 18,
      alignItems: 'center',
      marginTop: 24,
      elevation: 6,
    },
    placeOrderText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });
};

export default PlaceOrderScreen;
