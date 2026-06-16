// src/screens/Updates.jsx
import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import FoodDisplay from '../../components/FoodDisplay';
import NavBar from '../../components/NavBar';
import { ThemeContext } from '../../context/ThemeContext';
import { StoreContext } from '../../context/StoreContext';
import Toast from 'react-native-toast-message';

export function Updates() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { theme } = useContext(ThemeContext);
  const { customerInfo, selectedBranch, orderDetails } = useContext(StoreContext);

  const [category, setCategory] = useState('All');
  const selectedTable = route.params?.table || null; // Still support table if passed from elsewhere

  useEffect(() => {
    const categoryFromUrl = route.params?.category;
    if (categoryFromUrl) {
      setCategory(categoryFromUrl);
    }
  }, [route.params]);

  // If no branch is selected somehow, go to location selection (unless Dine In is selected)
  useEffect(() => {
    if (!isFocused) return;

    if (!selectedBranch && orderDetails?.orderType !== 'Dine In') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'LocationSelection' }],
      });
      return;
    }

    // NEW: If no order type is selected, go to Profile (Order Type Selection)
    if (!orderDetails?.orderType) {
      navigation.navigate('Profile');
      return;
    }

    // NEW: If table number is not selected, redirect to Profile
    if (!orderDetails?.table_id) {
      Toast.show({
        type: 'info',
        text1: 'Table Required',
        text2: 'Please select a table first.',
        position: 'bottom',
      });
      navigation.navigate('Profile');
    }
  }, [selectedBranch, orderDetails, navigation, isFocused]);

  return (
    <>
      <NavBar />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FoodDisplay category={category} table={selectedTable} />
      </View>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    marginBottom: 0,
  },
});

export default Updates;
