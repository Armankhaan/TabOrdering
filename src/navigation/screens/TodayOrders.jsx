import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getTodayOrders } from '../../services/APIservice';
import { ThemeContext } from '../../context/ThemeContext';
import { RefreshCw, ClipboardList, AlertCircle, Calendar } from 'lucide-react-native';
import getErrorMessage from '../../utils/errorHelper';

export function TodayOrders() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getTodayOrders();
      // Ensure data is array
      if (Array.isArray(data)) {
        // Sort by id descending (newest first)
        const sorted = data.sort((a, b) => b.id - a.id);
        setOrders(sorted);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders in screen:", err);
      const apiMessage = getErrorMessage(err, "Failed to fetch today's orders. Please try again.");
      setError(apiMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    fetchOrders(true);
  };

  const parseOrderInfo = (orderInfo) => {
    if (!orderInfo) return null;
    if (typeof orderInfo === 'string') {
      try {
        return JSON.parse(orderInfo);
      } catch (e) {
        return { items: orderInfo };
      }
    }
    return orderInfo;
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pending')) return '#FF9800'; // Orange
    if (s.includes('preparing') || s.includes('cook') || s.includes('progress')) return '#2196F3'; // Blue
    if (s.includes('complete') || s.includes('deliver') || s.includes('serve')) return '#4CAF50'; // Green
    if (s.includes('cancel') || s.includes('reject')) return '#F44336'; // Red
    return '#9E9E9E'; // Grey
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const renderOrderItems = (orderInfo) => {
    const parsed = parseOrderInfo(orderInfo);
    if (!parsed) return <Text style={styles.noItemsText}>No items info available</Text>;

    // Case 1: Standard structured cart
    if (parsed.cart && typeof parsed.cart === 'object') {
      const cartItems = Object.values(parsed.cart);
      if (cartItems.length === 0) return <Text style={styles.noItemsText}>Empty cart</Text>;

      return cartItems.map((item, index) => {
        const slots = item.details?.slots ? Object.values(item.details.slots) : [];
        const quantity = item.quantity || 1;

        return (
          <View key={item.key || index} style={styles.itemRow}>
            <Text style={styles.itemTitle}>
              {quantity}x {item.name}
            </Text>
            {slots.length > 0 && (
              <View style={styles.slotsContainer}>
                {slots.map((slot, sIdx) => (
                  <Text key={slot.id || sIdx} style={styles.slotText}>
                    • {slot.name || slot.product?.name || slot.display_name}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      });
    }

    // Case 2: Flattened items string/fallback
    const itemString = parsed.items || JSON.stringify(parsed);
    if (typeof itemString === 'string') {
      return <Text style={styles.itemTitle}>{itemString}</Text>;
    }

    return <Text style={styles.noItemsText}>Invalid items structure</Text>;
  };

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const orderTime = formatTime(item.created_at || item.updated_at);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumberLabel}>Order ID</Text>
            <Text style={styles.orderNumber}>#{item.order_number || item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status ? item.status.toUpperCase() : 'PENDING'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.itemsBlock}>
          {renderOrderItems(item.order_info)}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.footerTimeRow}>
            <Calendar size={14} color={theme.colors.text + '80'} />
            <Text style={styles.timeText}>{orderTime || 'Today'}</Text>
          </View>
          {item.table_id && (
            <Text style={styles.tableBadge}>Table {item.table_id}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <AlertCircle size={48} color={theme.colors.primary} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()}>
          <RefreshCw size={18} color="#FFF" style={styles.retryIcon} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => (item.id || item.order_number).toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardList size={64} color={theme.colors.text + '30'} />
            <Text style={styles.emptyText}>No orders placed today.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrders()}>
              <Text style={styles.refreshBtnText}>Check Again</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (theme) => {
  const isDark = theme.dark;
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const borderCol = isDark ? '#2D2D2D' : '#EAEAEA';
  const textCol = theme.colors.text;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    errorText: {
      fontSize: 16,
      color: textCol,
      opacity: 0.8,
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 20,
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },
    retryIcon: {
      marginRight: 8,
    },
    retryText: {
      color: '#FFF',
      fontWeight: '700',
      fontSize: 15,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: borderCol,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    orderNumberLabel: {
      fontSize: 11,
      color: textCol,
      opacity: 0.5,
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    orderNumber: {
      fontSize: 20,
      fontWeight: '800',
      color: textCol,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1.5,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    cardDivider: {
      height: 1,
      backgroundColor: borderCol,
      marginVertical: 12,
    },
    itemsBlock: {
      paddingVertical: 4,
    },
    itemRow: {
      marginBottom: 10,
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: textCol,
    },
    slotsContainer: {
      paddingLeft: 16,
      marginTop: 4,
    },
    slotText: {
      fontSize: 13,
      color: textCol,
      opacity: 0.7,
      marginBottom: 2,
    },
    noItemsText: {
      fontSize: 14,
      color: textCol,
      opacity: 0.5,
      fontStyle: 'italic',
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timeText: {
      fontSize: 13,
      color: textCol,
      opacity: 0.6,
      fontWeight: '500',
    },
    tableBadge: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      overflow: 'hidden',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: textCol,
      opacity: 0.4,
      marginTop: 16,
      marginBottom: 24,
    },
    refreshBtn: {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    refreshBtnText: {
      color: theme.colors.primary,
      fontWeight: '700',
      fontSize: 14,
    },
  });
};

export default TodayOrders;
