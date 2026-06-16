import React, { useContext } from 'react';
import { View, Text, Image, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
const DealItem = (props) => {
  const { id, name, final_price, price, image, pos_code, deal_items = [], attached_items = [] } = props;
  const navigation = useNavigation();
  const imageUrl = `https://krc.shabanbabar.com/storage/${image}`;
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const handleNavigateToModal = () => {
    // Filter out non-serializable props like functions
    const { onAddToCart, ...serializableProps } = props;

    // Combine all possible slot-related fields into attached_items for the detail screen
    const slots = props.attached_items || props.deal_items || props.lines || props.slots || props.deal_product_slots || [];

    navigation.navigate("DealOptions", {
      ...serializableProps,
      price: final_price || price,
      attached_items: slots,
    });
  };

  return (
    <View style={styles.dealContainer}>
      {/* <Image source={{ uri: imageUrl }} style={styles.dealImage} /> */}

      <TouchableOpacity
        style={styles.button}
        onPress={handleNavigateToModal}
      >
        <Text style={styles.dealName}>{name}</Text>
        <Text style={styles.dealPrice}>Rs {final_price || price}</Text>
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


