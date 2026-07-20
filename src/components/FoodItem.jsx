import React, { useContext, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import { StoreContext } from '../context/StoreContext';
import { getProductDetails } from '../services/APIservice';

const FoodItem = (props) => {
  const {
    id, name, price, description, image, ref_number, sizes = [],
    toppings = [], crusts = [], options = [], optionTypes = [], flavours = [],
    variants = [], modifier_groups = []
  } = props;
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const { menuData } = useContext(StoreContext);
  const [loading, setLoading] = useState(false);

  const handleNavigate = async () => {
    let itemData = { ...props };

    // Check if we already have detailed arrays (variants, modifier_groups etc)
    const hasDetails = (variants && variants.length > 0) ||
      (modifier_groups && modifier_groups.length > 0) ||
      (optionTypes && optionTypes.length > 0) ||
      (sizes && sizes.length > 0);

    if (!hasDetails) {
      try {
        setLoading(true);
        const branch = menuData?.branch;
        const companyId = branch?.company_id;
        const branchId = branch?.id;

        if (companyId && branchId) {
          const detailRes = await getProductDetails(id, companyId, branchId);
          const fullProduct = detailRes?.data?.product || detailRes?.product || detailRes?.data || {};

          // Merge full product data over the basic props
          itemData = { ...itemData, ...fullProduct };
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setLoading(false);
      }
    }

    // Filter out non-serializable props like functions
    const { onAddToCart, ...serializableProps } = itemData;

    navigation.navigate("ItemOptions", {
      ...serializableProps
    });
  };

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.button} onPress={handleNavigate} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Text style={styles.itemName}>{name}</Text>
            <Text style={styles.itemPrice}>Rs {price}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

function getStyles(theme) {
  return StyleSheet.create({
    itemContainer: {
      flex: 1,                // fill whatever width the parent gives you
      margin: 5,
      padding: 0,
      alignItems: 'center',
    },
    itemImage: {
      width: '100%',
      aspectRatio: 1,         // keeps it square
      resizeMode: 'cover',
      borderRadius: 5,
      marginBottom: 10,
    },
    itemName: {
      fontWeight: 'bold',
      fontSize: 13,
      textAlign: 'center',
      marginVertical: 5,
      color: theme.colors.text,
    },
    itemPrice: {
      color: theme.colors.primary,
      fontWeight: 'bold',
      fontSize: 13,
      marginTop: 5,
    },
    button: {
      backgroundColor: theme.colors.card,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 15,
      alignSelf: 'stretch',
      height: 110,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
      textAlign: 'center',
    },
  });
}

export default FoodItem;