import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StoreContext } from '../../context/StoreContext';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import axios from 'axios';
import Config from '../../constants/Config';


const RenderDetails = ({ details }) => {
  const sel = details || {};
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  return (
    <View style={styles.detailsContainer}>

      {/* Selected Size */}
      {sel.size && (
        <Text style={styles.detailLine}>
          <Text style={styles.detailLabel}>Size: </Text>
          {sel.size.item_name} {Number(sel.size.price) > 0 ? `(Rs ${Number(sel.size.price).toFixed(0)})` : ''}
        </Text>
      )}

      {/* Slots & Toppings (for Deal Items) */}
      {sel.slots && (
        <>
          <Text style={styles.subHeading}>Selections:</Text>
          {Object.entries(sel.slots).map(([slotId, prod]) => {
            const slotToppings = prod.selected_toppings || [];
            return (
              <View key={slotId} style={{ marginBottom: 6, paddingLeft: 8 }}>
                <Text style={[styles.detailLine, { fontWeight: '700' }]}>
                  • {prod.name || prod.product?.name || prod.display_name}
                </Text>
                {slotToppings
                  .map(t => {
                    const isRemoved = t.quantity === -1;
                    return (
                      <Text key={t.id} style={[styles.detailLine, { paddingLeft: 12, fontSize: 13, opacity: isRemoved ? 0.5 : 0.8, textDecorationLine: isRemoved ? 'line-through' : 'none' }]}>
                        {isRemoved ? '– [Removed] ' : '+ '} {t.name} {Number(t.price) > 0 ? `(Rs ${t.price})` : ''}
                      </Text>
                    );
                  })}
              </View>
            );
          })}
        </>
      )}

      {/* Customizations / Options */}
      {sel.customizations && sel.customizations.length > 0 && (
        <>
          <Text style={styles.subHeading}>Options:</Text>
          {sel.customizations.map((item, idx) => {
            const isRemoved = item.quantity === -1;
            return (
              <Text key={item.item_id || idx} style={[styles.detailLine, { paddingLeft: 8, opacity: isRemoved ? 0.5 : 1, textDecorationLine: isRemoved ? 'line-through' : 'none' }]}>
                {isRemoved ? '– [Removed] ' : '• '} {item.item_name} {Number(item.price) > 0 ? `(Rs ${Number(item.price).toFixed(0)})` : ''}
              </Text>
            );
          })}
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
  const isFocused = useIsFocused();
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

  useEffect(() => {
    if (isFocused && !orderDetails?.table_id) {
      navigation.navigate('Profile');
    }
  }, [orderDetails, navigation, isFocused]);

  const handleQuantityChange = (key, change) => {
    const currentQty = quantities[key] || cartItems[key]?.quantity || 1;
    const newQuantity = Math.max(1, currentQty + change);
    setQuantities(prev => ({ ...prev, [key]: newQuantity }));
    updateCartQuantity(key, newQuantity);
  };

  const transformCartItems = (cart) => {
    const transformed = {};
    Object.keys(cart).forEach(key => {
      const item = cart[key];
      if (key.startsWith('deal-') || (item.details && item.details.slots)) {
        transformed[key] = item;
      } else {
        const productIdStr = key.split('-')[0];
        const productId = parseInt(productIdStr) || item.details?.size?.item_id || 1;
        transformed[key] = {
          ...item,
          details: {
            id: productId,
            name: item.name,
            price: parseFloat(item.details?.size?.price || 0),
            pos_code: item.details?.size?.pos_code || item.pos_code || null,
            ref_code: item.details?.size?.ref_code || item.ref_code || '',
            selected_toppings: (item.details?.customizations || []).map(c => ({
              id: c.item_id || c.id,
              name: c.item_name || c.name,
              price: parseFloat(c.price || 0),
              pos_code: c.pos_code || '',
              quantity: c.quantity !== undefined ? c.quantity : 1,
              ref_code: c.ref_code || ''
            }))
          }
        };
      }
    });
    return transformed;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!customerInfo) return navigation.navigate('Login');
    if (!entries || !entries.length) return;

    setLoading(true);

    try {
      const transformedCart = transformCartItems(cartItems);

      const payload = {
        company_id: customerInfo?.company_id || selectedBranch?.company_id,
        branch_id: selectedBranch?.id,
        username: customerInfo?.username || customerInfo?.name,
        email: customerInfo?.email,
        employee_id: customerInfo?.employee_id,
        order_info: {
          cart: transformedCart,
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
