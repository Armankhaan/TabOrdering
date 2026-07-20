import React, { useContext, useState } from 'react';
import { View, Text, Image, Button, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import { StoreContext } from '../context/StoreContext';
import { getDealDetails } from '../services/APIservice';

const DealItem = (props) => {
  const { id, name, final_price, price, image, pos_code, deal_items = [], attached_items = [] } = props;
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const { menuData } = useContext(StoreContext);
  const [loading, setLoading] = useState(false);

  const handleNavigateToModal = async () => {
    // Start with whatever we already have from the list API
    let dealData = { ...props };

    // Check if we already have deal lines/slots loaded
    const existingSlots = props.lines || props.attached_items || props.deal_items || props.slots || props.deal_product_slots || [];

    if (existingSlots.length === 0) {
      // Lazy fetch: get full deal details from API
      try {
        setLoading(true);
        const branch = menuData?.branch;
        const companyId = branch?.company_id;
        const branchId = branch?.id;

        if (companyId && branchId) {
          const detailRes = await getDealDetails(id, companyId, branchId);
          const fullDeal = detailRes?.data?.deal || detailRes?.deal || detailRes?.data || {};

          // Merge full deal data over basic props (keeps id, name etc but adds lines, variants etc)
          dealData = { ...dealData, ...fullDeal };
        }
      } catch (err) {
        console.error('Failed to fetch deal details:', err);
      } finally {
        setLoading(false);
      }
    }

    // Filter out non-serializable props like functions
    const { onAddToCart, ...serializableProps } = dealData;

    navigation.navigate("DealOptions", {
      ...serializableProps,
      price: serializableProps.final_price || serializableProps.price || final_price || price,
      attached_items: serializableProps.lines || serializableProps.attached_items || existingSlots,
    });
  };

  return (
    <View style={styles.dealContainer}>
      {/* <Image source={{ uri: imageUrl }} style={styles.dealImage} /> */}

      <TouchableOpacity
        style={styles.button}
        onPress={handleNavigateToModal}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Text style={styles.dealName}>{name}</Text>
            <Text style={styles.dealPrice}>Rs {final_price || price}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

function getStyles(theme) {
  return StyleSheet.create({
    dealContainer: {
      flex: 1,                // fill whatever width the parent gives you
      margin: 5,
      padding: 0,
      alignItems: 'center',
    },
    dealImage: {
      width: '100%',
      aspectRatio: 1,         // keeps it square
      resizeMode: 'cover',
      borderRadius: 5,
      marginBottom: 10,
    },
    dealName: {
      fontWeight: 'bold',
      fontSize: 13,
      flexWrap: 'wrap',
      color: theme.colors.text,
      textAlign: 'center',
    },
    dealPrice: {
      color: theme.colors.primary,
      fontWeight: 'bold',
      fontSize: 13,
      marginTop: 6,
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

export default DealItem;