import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { StoreContext } from '../context/StoreContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';

export const CustomNavBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const ctx = useContext(StoreContext) || {};
  const orderType = ctx.orderDetails?.orderType;
  const { selectedBranch } = ctx;
  const { theme } = useContext(ThemeContext);
  const takeawayIcon = require('../assets/pickup.png');
  const dineInIcon = require('../assets/DineIn.png');

  // read selectedTable and branch from current route params or context
  return (
    <View style={[styles.navBar, { backgroundColor: theme.colors.background }]}>
      {/* Left menu */}
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Image source={require('../assets/list.png')} style={styles.menuIcon} />
      </TouchableOpacity>

      {/* Center: Brand & Branch Info */}
      <View style={styles.centerWrap}>
        <Image source={require('../assets/logo-2x.png')} style={styles.logo} />
        {selectedBranch && (
          <Text style={[styles.branchName, { color: theme.colors.primary }]}>
            {selectedBranch.name.toUpperCase()}
          </Text>
        )}
      </View>

      {/* Right side: order-type badge */}
      <View style={styles.rightWrap}>
        <TouchableOpacity
          style={styles.orderTypeBadge}
          onPress={() => navigation.navigate('Profile')}
        >
          {orderType === 'Dine In' ? (
            <Image source={dineInIcon} style={styles.typeIcon} />
          ) : orderType === 'Takeaway' ? (
            <Image source={takeawayIcon} style={styles.typeIcon} />
          ) : (
            <View style={styles.bothIcons}>
              <Image source={dineInIcon} style={styles.typeIconSmall} />
              <Image source={takeawayIcon} style={styles.typeIconSmall} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 100,
    paddingHorizontal: 16,
    paddingTop: 45,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuIcon: { width: 28, height: 28 },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 120, height: 30, resizeMode: 'contain' },
  branchName: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 1.5,
  },
  rightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTypeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  typeIcon: { width: 24, height: 24 },
  typeIconSmall: { width: 16, height: 16, marginHorizontal: 1 },
  bothIcons: { flexDirection: 'row', alignItems: 'center' },
});

export default CustomNavBar;
