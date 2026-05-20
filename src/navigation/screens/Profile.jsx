// src/screens/Profile.jsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { StoreContext } from '../../context/StoreContext';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';

const deliveryIcon = require('../../assets/pickup.png');
const pickupIcon   = require('../../assets/DineIn.png');

export default function Profile() {
  const navigation = useNavigation();
  const { orderDetails, updateOrderDetails } = useContext(StoreContext);
  const { theme } = useContext(ThemeContext);
  const styles = makeStyles(theme);

  const [orderType, setOrderType] = useState(orderDetails?.orderType ?? '');

  const onDone = () => {
    if (!orderType) {
      Toast.show({
        type: 'error',
        text1: 'Missing info',
        text2: 'Please select Dine In or Takeaway.',
        position: 'bottom',
      });
      return;
    }

    if (orderType === 'Dine In') {
      updateOrderDetails({ orderType });
      navigation.navigate('TableSelection');
    } else {
      // Takeaway
      updateOrderDetails({ orderType, table_id: 3001 });
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTabs', params: { screen: 'Updates' } }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose Order Type</Text>

      <View style={styles.row}>
        {['Dine In', 'Takeaway'].map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeBtn,
              orderType === type && styles.typeBtnActive,
            ]}
            onPress={() => setOrderType(type)}
          >
            <Image
              source={type === 'Takeaway' ? deliveryIcon : pickupIcon}
              style={styles.icon}
            />
            <Text style={styles.typeText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>

      <Toast />
    </View>
  );
}

const makeStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 36,
  },
  typeBtn: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 6,
    width: 120,
  },
  typeBtnActive: {
    backgroundColor: 'red',
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  doneBtn: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background,
  },
});
