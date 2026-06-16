import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
const FoodItem = (props) => {
  const {
    id, name, price, description, image, ref_number, sizes = [],
    toppings = [], crusts = [], options = [], optionTypes = [], flavours = []
  } = props;
  const navigation = useNavigation();
  const imageUrl = `https://krc.shabanbabar.com/storage/${image}`;
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const handleNavigate = () => {
    // Filter out non-serializable props like functions
    const { onAddToCart, ...serializableProps } = props;
    navigation.navigate("ItemOptions", {
      ...serializableProps
    });
  };

  return (
    <View style={styles.itemContainer}>
      {/* <Image source={{ uri: imageUrl }} style={styles.itemImage} /> */}

      <TouchableOpacity style={styles.button} onPress={handleNavigate}>
        <Text style={styles.itemName}>{name}</Text>
        <Text style={styles.itemPrice}>Rs {price}</Text>
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
