import React, { useContext, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoreContext } from '../../context/StoreContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { ChevronDown, ChevronUp, Check, Plus, Minus } from 'lucide-react-native';

export function DealOptions() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const { addToCart } = useContext(StoreContext);
  const insets = useSafeAreaInsets();

  // Initial deal data from route params
  const {
    id,
    name,
    price: basePrice,
    image,
    ref_code,
    pos_code,
    attached_items = [], // These are the "slots" in the deal
  } = params;

  const [quantity, setQuantity] = useState(1);
  const [selectedInSlots, setSelectedInSlots] = useState({});
  const [visibleSlots, setVisibleSlots] = useState({});
  const [activeFlavourInSlot, setActiveFlavourInSlot] = useState({}); // { [slotId]: flavourGroup }
  const [totalPrice, setTotalPrice] = useState(parseFloat(basePrice));

  // Initialize visible slots and handle auto-selections
  useEffect(() => {
    if (attached_items && attached_items.length > 0) {
      // Open first slot by default - handle missing id by using index
      const firstSlot = attached_items[0];
      const firstSlotId = firstSlot.id || 'slot-0';
      setVisibleSlots({ [firstSlotId]: true });

      // Auto-selection for slots with only one item
      const autoSelections = {};
      attached_items.forEach((slot, index) => {
        const sId = slot.id || `slot-${index}`;
        const allProducts = (slot.categories && slot.categories.length > 0)
          ? slot.categories.flatMap(cat => cat.products || cat.items || [])
          : (slot.products || slot.items || slot.deal_products || []);

        if (allProducts && allProducts.length === 1) {
          autoSelections[sId] = allProducts[0];
        }
      });

      if (Object.keys(autoSelections).length > 0) {
        setSelectedInSlots(prev => ({ ...prev, ...autoSelections }));
      }
    }
  }, [attached_items]);

  // Price Calculation
  useEffect(() => {
    let calc = parseFloat(basePrice);

    // Add any extra charges from selected items if applicable
    Object.values(selectedInSlots).forEach(item => {
      if (item && item.extra_price) {
        calc += parseFloat(item.extra_price);
      }
    });

    setTotalPrice(calc * quantity);
  }, [basePrice, selectedInSlots, quantity]);

  const toggleSlotVisibility = (slotId) => {
    setVisibleSlots(prev => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  const handleProductSelect = (slotId, product) => {
    setSelectedInSlots(prev => ({
      ...prev,
      [slotId]: product,
    }));
    setActiveFlavourInSlot(prev => ({ ...prev, [slotId]: null }));

    // Auto-toggle logic: close current and open next
    const currentIdx = attached_items.findIndex(s => (s.id || `slot-${attached_items.indexOf(s)}`) === slotId);
    if (currentIdx !== -1) {
      if (currentIdx < attached_items.length - 1) {
        const nextSlot = attached_items[currentIdx + 1];
        const nextSlotId = nextSlot.id || `slot-${currentIdx + 1}`;
        setVisibleSlots(prev => ({
          ...prev,
          [slotId]: false,      // Close previous
          [nextSlotId]: true    // Open next
        }));
      } else {
        // Last slot selected, just close current to focus on cart button
        setVisibleSlots(prev => ({ ...prev, [slotId]: false }));
      }
    }
  };

  const handleFlavourSelect = (slotId, flavourGroup) => {
    if (flavourGroup.items.length === 1) {
      // Only one option, select it directly
      handleProductSelect(slotId, flavourGroup.items[0]);
    } else {
      // Multiple options, show crust selection
      setActiveFlavourInSlot(prev => ({ ...prev, [slotId]: flavourGroup }));
    }
  };

  const groupItemsByFlavour = (items) => {
    const groups = {};
    items.forEach(item => {
      const productName = item.product?.name || item.display_name.split(' ')[0] || 'Unknown';
      const productId = item.product?.id || productName;
      
      if (!groups[productId]) {
        groups[productId] = {
          id: productId,
          name: productName,
          items: []
        };
      }
      groups[productId].items.push(item);
    });
    return Object.values(groups);
  };

  const isAllSlotsFilled = attached_items.every((slot, index) => {
    const sId = slot.id || `slot-${index}`;
    return !!selectedInSlots[sId];
  });

  const handleAddToCart = () => {
    if (!isAllSlotsFilled) {
      return Alert.alert('Incomplete Deal', 'Please make all selections before adding to cart.');
    }
    const cartKey = `deal-${id}-${JSON.stringify(selectedInSlots)}`;
    const details = {
      slots: selectedInSlots,
      basePrice,
      quantity,
    };
    addToCart(cartKey, totalPrice, name, image, pos_code || ref_code, details, quantity);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}>
        <View style={styles.headerPanel}>
          {image && <Image source={{ uri: image }} style={styles.heroImage} />}
          <View style={styles.infoBox}>
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.priceDisplay}>Rs {totalPrice.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.qtyPanel}>
          <Text style={styles.sectionLabel}>Deal Quantity</Text>
          <View style={styles.qtyControl}>
            <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
              <Minus size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.qtyBtn}>
              <Plus size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Slot Selections */}
        {attached_items.map((slot, index) => {
          const sId = slot.id || `slot-${index}`;
          const sName = slot.label || `Selection ${index + 1}`;

          return (
            <View key={sId} style={styles.slotContainer}>
              <TouchableOpacity
                style={styles.slotHeader}
                onPress={() => toggleSlotVisibility(sId)}
              >
                <View style={styles.slotHeaderLeft}>
                  <Text style={styles.slotTitle}>{sName}</Text>
                  {selectedInSlots[sId] && (
                    <Text style={styles.selectedIndicator}>
                      Selected: {selectedInSlots[sId].name || selectedInSlots[sId].display_name || selectedInSlots[sId].title || 'Item'}
                    </Text>
                  )}
                </View>
                {visibleSlots[sId] ? (
                  <ChevronUp size={20} color={theme.colors.text} />
                ) : (
                  <ChevronDown size={20} color={theme.colors.text} />
                )}
              </TouchableOpacity>

              {visibleSlots[sId] && (
                <View style={styles.slotContent}>
                  {(() => {
                    const allProducts = (slot.categories && slot.categories.length > 0)
                      ? slot.categories.flatMap(cat => cat.products || cat.items || [])
                      : (slot.products || slot.items || slot.deal_products || []);
                    
                    const flavourGroups = groupItemsByFlavour(allProducts);
                    const activeFlavour = activeFlavourInSlot[sId];

                    if (activeFlavour) {
                      return (
                        <View>
                          <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => setActiveFlavourInSlot(prev => ({ ...prev, [sId]: null }))}
                          >
                            <Text style={styles.backButtonText}>← Back to flavours</Text>
                          </TouchableOpacity>
                          <Text style={styles.subTitle}>Select Crust for {activeFlavour.name}</Text>
                          <View style={styles.itemGrid}>
                            {activeFlavour.items.map((prod) => {
                              const isSelected = selectedInSlots[sId]?.id === prod.id;
                              const crustName = prod.variant_items?.[0]?.name || prod.display_name.replace(activeFlavour.name, '').trim();
                              
                              return (
                                <TouchableOpacity
                                  key={prod.id}
                                  style={[
                                    styles.itemCard,
                                    isSelected && styles.itemCardSelected
                                  ]}
                                  onPress={() => handleProductSelect(sId, prod)}
                                >
                                  <Text style={[
                                    styles.itemLabel,
                                    isSelected && styles.itemLabelSelected
                                  ]}>
                                    {crustName}
                                  </Text>
                                  {prod.extra_price > 0 && (
                                    <Text style={styles.extraPriceText}>+ Rs {prod.extra_price}</Text>
                                  )}
                                  {isSelected && (
                                    <View style={styles.checkBadge}>
                                      <Check size={10} color="#fff" />
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    }

                    return (
                      <View style={styles.itemGrid}>
                        {flavourGroups.map((group) => {
                          const isAnyItemSelected = group.items.some(item => selectedInSlots[sId]?.id === item.id);

                          return (
                            <TouchableOpacity
                              key={group.id}
                              style={[
                                styles.itemCard,
                                isAnyItemSelected && styles.itemCardSelected
                              ]}
                              onPress={() => handleFlavourSelect(sId, group)}
                            >
                              <Text style={[
                                styles.itemLabel,
                                isAnyItemSelected && styles.itemLabelSelected
                              ]}>
                                {group.name}
                              </Text>
                              {group.items.length > 1 && !isAnyItemSelected && (
                                <Text style={styles.optionCountText}>{group.items.length} options</Text>
                              )}
                              {isAnyItemSelected && (
                                <View style={styles.checkBadge}>
                                  <Check size={10} color="#fff" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })()}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, !isAllSlotsFilled && styles.confirmBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!isAllSlotsFilled}
        >
          <Text style={styles.confirmBtnText}>
            {isAllSlotsFilled ? `Add Deal to Cart • Rs ${totalPrice.toFixed(0)}` : 'Complete Selections'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerPanel: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  infoBox: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  priceDisplay: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  qtyPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 4,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  qtyText: {
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  slotContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: theme.colors.card || (theme.dark ? '#1A1A1A' : '#F9F9F9'),
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border || (theme.dark ? '#333' : '#EEE'),
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.card,
  },
  slotHeaderLeft: {
    flex: 1,
  },
  slotTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  selectedIndicator: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  slotContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  categoryGroup: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    opacity: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 1,
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.card || (theme.dark ? '#1A1A1A' : '#FFF'),
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border || (theme.dark ? '#333' : '#EEE'),
    position: 'relative',
  },
  itemCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  itemLabelSelected: {
    color: theme.colors.primary,
  },
  optionCountText: {
    fontSize: 10,
    color: theme.colors.primary,
    opacity: 0.8,
    marginTop: 2,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  backButton: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  extraPriceText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  confirmBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  }
});

export default DealOptions;
