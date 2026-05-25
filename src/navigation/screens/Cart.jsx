import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StoreContext } from '../../context/StoreContext';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import axios from 'axios';
import Config from '../../constants/Config';


// Component to render item details dynamically based on available fields
const RenderDetails = ({ details }) => {
  const sel = details || {};
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  return (
    <View style={styles.detailsContainer}>

      {/* Fries */}
      {sel.Fries && (
        <Text style={styles.detailLine}>
          <Text style={styles.detailLabel}>Fries: </Text>
          {sel.Fries.name}
        </Text>
      )}

      {/* Drink */}
      {sel.Drink && (
        <Text style={styles.detailLine}>
          <Text style={styles.detailLabel}>Drink: </Text>
          {sel.Drink.name}
        </Text>
      )}

      {/* Sizes */}
      {sel.Sizes && (
        <Text style={styles.detailLine}>
          <Text style={styles.detailLabel}>Size: </Text>
          {sel.Sizes.name}
        </Text>
      )}

      {/* Size Type */}
      {sel.SizeType && (
        <Text style={styles.detailLine}>
          <Text style={styles.detailLabel}>Choice: </Text>
          {sel.SizeType.type_name}
        </Text>
      )}

      {/* Products list */}
      {sel.products && (
        <>
          <Text style={styles.subHeading}>Products:</Text>
          {Object.entries(sel.products).map(([prodKey, prod]) => (
            <Text key={prodKey} style={styles.detailLine}>
              <Text style={styles.detailLabel}>{prod.name}</Text>
            </Text>
          ))}
        </>
      )}

      {/* Toppings */}
      {Array.isArray(sel.Toppings) && (
        <>
          <Text style={styles.subHeading}>Toppings:</Text>
          {sel.Toppings.map((t) => (
            <Text key={t.id} style={styles.detailLine}>
              <Text style={styles.detailLabel}>{t.option_key}</Text>
            </Text>
          ))}
        </>
      )}
    </View>
  );
};

export function Cart() {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const {
    cartItems,
    removeFromCart,
    updateCartQuantity,
    customerInfo,
    selectedBranch,
    orderDetails,
    clearCart
  } = useContext(StoreContext);
  const [showDetails, setShowDetails] = useState({});
  const entries = Object.values(cartItems);
  const navigation = useNavigation();
  const [quantities, setQuantities] = useState(
    entries.reduce((acc, item) => ({ ...acc, [item.key]: item.quantity }), {})
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuantities(
      Object.values(cartItems).reduce(
        (acc, item) => ({ ...acc, [item.key]: item.quantity }),
        {}
      )
    );
  }, [cartItems]);

  const handleQuantityChange = (key, change) => {
    setQuantities(prev => {
      const newQuantity = Math.max(1, prev[key] + change);
      updateCartQuantity(key, newQuantity);
      return { ...prev, [key]: newQuantity };
    });
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!customerInfo) return navigation.navigate('Login');
    if (!entries || !entries.length) return;

    setLoading(true);

    try {
      const payload = {
        company_id: selectedBranch?.company_id || Config.COMPANY_ID,
        branch_id: selectedBranch?.id || Config.DEFAULT_BRANCH_ID,
        order_info: {
          cart: cartItems,
          orderType: orderDetails?.orderType || "Dine In",
          table_id: orderDetails?.table_id || 3001,
          paymentMethod: 'Cash',
          customerInfo: customerInfo
        }
      };

      console.log('🚀 Sending Raw Cart Payload directly from Cart:', JSON.stringify(payload, null, 2));

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

  const toggleDetails = key => {
    setShowDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const total = entries.reduce(
    (sum, item) => sum + item.price * quantities[item.key],
    0
  );

  if (entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Your cart is empty!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {entries.map(item => (
          <View key={item.key} style={styles.cartItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <TouchableOpacity onPress={() => removeFromCart(item.key)}>
                <Image
                  source={require('../../assets/delete.png')}
                  style={styles.deleteIcon}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.price}>
              Rs {item.price} × {quantities[item.key]}
            </Text>

            <View style={styles.qtyContainer}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.key, -1)}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>–</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantities[item.key]}</Text>
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.key, 1)}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => toggleDetails(item.key)}
              style={styles.detailsBtn}
            >
              <Text style={styles.detailsBtnText}>
                {showDetails[item.key] ? 'Hide Details' : 'Show Details'}
              </Text>
            </TouchableOpacity>

            {showDetails[item.key] && item.details && (
              <RenderDetails details={item.details} />
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.totalBox}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total: Rs {total}</Text>

          {/* REPLACED button */}
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.proceedBtn, loading && { opacity: 0.7 }]}
            disabled={loading}
          >
            <Text style={styles.clearBtnText}>
              {loading ? 'Processing...' : 'Place Order Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const getStyles = theme => {
  const isDay = !theme.dark;  // light theme when theme.dark === false

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 120 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: theme.colors.text },

    cartItem: {
      backgroundColor: isDay ? '#fff' : '#1f1f1f',
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDay ? '#e0e0e0' : '#333',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },

    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    name: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
    deleteIcon: { width: 24, height: 24, tintColor: theme.colors.notification },
    price: { fontSize: 16, color: theme.colors.text, marginBottom: 8 },

    qtyContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    qtyBtn: {
      padding: 6,
      borderWidth: 1,
      borderColor: isDay ? theme.colors.border : '#555',
      borderRadius: 4,
      backgroundColor: isDay ? theme.colors.card : '#2a2a2a',
    },
    qtyBtnText: { fontSize: 18, width: 20, textAlign: 'center', color: theme.colors.text },
    qtyText: { fontSize: 16, marginHorizontal: 8, color: theme.colors.text },

    detailsBtn: {
      backgroundColor: theme.colors.primary,
      padding: 8,
      borderRadius: 6,
      alignItems: 'center',
      marginBottom: 8,
    },
    detailsBtnText: { color: theme.colors.background, fontWeight: '600' },

    totalBox: { marginBottom: 80, paddingHorizontal: 20 },
    totalContainer: {
      backgroundColor: isDay ? theme.colors.card : '#2a2a2a',
      padding: 16,
      borderRadius: 8,
      borderTopWidth: 1,
      borderColor: isDay ? theme.colors.border : '#444',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
    proceedBtn: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    clearBtnText: { color: theme.colors.background, fontWeight: '600' },

    // Details section styling
    detailsContainer: {
      backgroundColor: isDay ? '#f9f9f9' : '#333',
      padding: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    detailsTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 6,
      color: theme.colors.primary,
    },
    subHeading: {
      fontSize: 15,
      fontWeight: '500',
      marginVertical: 4,
      color: theme.colors.primary,
    },
    detailLine: {
      fontSize: 14,
      marginBottom: 4,
      color: theme.colors.text,
    },
    detailLabel: {
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
  });
};


export default Cart;
