// src/components/FoodDisplay.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { StoreContext } from '../context/StoreContext';
import { useNavigation } from '@react-navigation/native';
import FoodItem from './FoodItem';
import DealItem from './DealItem';
import { ThemeContext } from '../context/ThemeContext';

const FoodDisplay = ({ category }) => {
  const { cartItems = {}, menuData = {}, orderDetails: od, loading, addToCart } = useContext(StoreContext);
  const { categories: rawCategories = [], deals = [], branch } = menuData;
  const categories = deals.length > 0 
    ? [{ id: 'deals-cat', name: 'Deals', products: deals.map(d => ({ ...d, is_deal: true })) }, ...rawCategories]
    : rawCategories;
  const orderDetails = od || {};
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  // Initial category selection
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  // layout math
  const { width } = useWindowDimensions();
  const numCols = width > 900 ? 4 : width > 600 ? 3 : 2;
  const itemWidth = (width - 20 - (numCols - 1) * 10) / numCols;

  // cart totals
  const values = Object.values(cartItems);
  const itemCount = values.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = values.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);

  // scroll refs
  const scrollViewRef = useRef(null);
  const offsets = useRef({});

  const scrollTo = (catName) => {
    setSelectedCategory(catName);
    const y = offsets.current[catName.toLowerCase()] || 0;
    scrollViewRef.current.scrollTo({ x: 0, y, animated: true });
  };

  const onSectionLayout = (e, catName) => {
    offsets.current[catName.toLowerCase()] = e.nativeEvent.layout.y;
  };

  if (loading && categories.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: theme.colors.text, opacity: 0.6, textAlign: 'center' }}>
          No menu available. Please ensure a valid branch is assigned to your account.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Category Navbar */}
      <View style={{ height: 60 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryNavbar}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                selectedCategory === cat.name && styles.activeCategoryButton,
              ]}
              onPress={() => scrollTo(cat.name)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === cat.name && { color: '#fff' },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.mainContent}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 100 }}
      >
        {categories.map(cat => (
          <View
            key={cat.id}
            onLayout={e => onSectionLayout(e, cat.name)}
            style={styles.section}
          >
            <Text style={styles.categoryheading}>{cat.name}</Text>
            <View style={styles.row}>
              {cat.products && cat.products.map(item => (
                <View key={item.id} style={[styles.itemContainer, { width: itemWidth }]}>
                  {/* Assuming Deals might be products too or handled differently */}
                  {item.is_deal 
                    ? <DealItem {...item} onAddToCart={() => addToCart(item, true)} />
                    : <FoodItem {...item} categoryName={cat.name} onAddToCart={() => addToCart(item, false)} />
                  }
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Cart Footer */}
      {itemCount > 0 && (
        <View style={styles.cartBar}>
          <Text style={styles.cartText}>
            {itemCount} item{itemCount > 1 ? 's' : ''} • Rs {totalAmount}
          </Text>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() =>
              navigation.navigate('Cart')
            }
          >
            <Text style={styles.cartButtonText}>View Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
const getStyles = (theme) =>
  StyleSheet.create({
    categoryNavbar: {
      flexGrow: 0,
      paddingVertical: 10,
      backgroundColor: theme.colors.background,
    },
    categoryButton: {
      marginRight: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#bbb',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeCategoryButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    mainContent: {
      marginTop: 20,
      marginBottom: 60,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    itemContainer: {
      marginBottom: 10,
    },
    section: {
      marginTop: 15,
    },
    categoryheading: {
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 10,
      textAlign: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      color: '#FFFFFF',
      paddingVertical: 8,
      elevation: 3,
    },
    cartBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      elevation: 8,
    },
    cartText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    cartButton: {
      backgroundColor: theme.colors.background,
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 6,
    },
    cartButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default FoodDisplay;
