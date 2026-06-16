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
  const { addToCart, menuData } = useContext(StoreContext);
  const insets = useSafeAreaInsets();

  // Initial deal data from route params
  const {
    id,
    name,
    price: basePrice,
    image,
    ref_code,
    pos_code,
    attached_items, // These are the "slots" in the deal
    lines, // New payload structure uses lines
  } = params;

  const dealSlots = lines || attached_items || [];

  const [quantity, setQuantity] = useState(1);
  const [selectedInSlots, setSelectedInSlots] = useState({});
  const [selectedToppings, setSelectedToppings] = useState({}); // { [slotId]: { [toppingId]: toppingItem } }
  const [visibleSlots, setVisibleSlots] = useState({});
  const [activeFlavourInSlot, setActiveFlavourInSlot] = useState({}); // { [slotId]: flavourGroup }
  const [totalPrice, setTotalPrice] = useState(parseFloat(basePrice));
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isProdPizza = (prod) => {
    if (!prod) return false;
    const name = (prod.product?.name || prod.display_name || '').toLowerCase();
    const categoryName = (prod.product?.category?.name || prod.product?.category_name || prod.categoryName || '').toLowerCase();
    if (name.includes('pizza') || categoryName.includes('pizza')) return true;

    // Fallback: If it has a Size variant, treat it as a pizza
    if (prod.product && prod.product.variants) {
      return prod.product.variants.some(v => v.name.toLowerCase().includes('size'));
    }
    return false;
  };

  const getSelectedCrustItem = (prod) => {
    if (!prod) return null;

    // 1. Try variant_items first
    if (prod.variant_items && prod.variant_items[0] && prod.variant_items[0].options) {
      return prod.variant_items[0];
    }

    // 2. Fallback: Parse display_name to find matching Size option and Crust item in product.variants
    if (prod.product && prod.product.variants) {
      const displayName = (prod.display_name || '').toLowerCase();

      // Find the Size variant
      const sizeVariant = prod.product.variants.find(v => v.name.toLowerCase().includes('size'));
      if (sizeVariant && sizeVariant.options) {
        // Find matching size option (e.g. "small", "medium", "large")
        const matchingSizeOpt = sizeVariant.options.find(opt => 
          displayName.includes(opt.name.toLowerCase())
        );

        if (matchingSizeOpt && matchingSizeOpt.items) {
          // Find matching crust item (e.g. "original", "kabab crust", "authentic thin")
          const matchingCrust = matchingSizeOpt.items.find(item => 
            displayName.includes(item.name.toLowerCase())
          );

          if (matchingCrust) {
            return matchingCrust;
          }
        }
      }
    }

    return null;
  };

  const getPizzaNestedGroupedOptions = (prod) => {
    const grouped = {};
    const crustItem = getSelectedCrustItem(prod);
    if (!crustItem) return grouped;
    const options = crustItem.options || [];
    options.forEach(opt => {
      const heading = opt.heading || 'Customization';
      if (!grouped[heading]) {
        grouped[heading] = [];
      }
      grouped[heading].push(opt);
    });
    return grouped;
  };

  const isHeadingMultiSelect = (heading) => {
    const h = heading.toLowerCase();
    if (h.includes('portion') || h.includes('sauce') || h.includes('crust')) return false;
    return true;
  };

  const isDefaultNestedTopping = (heading, topping) => {
    const hName = heading.toLowerCase();
    const priceVal = parseFloat(topping.price || 0);
    return hName.includes('topping') && priceVal === 0;
  };

  const getToppingsOption = (product) => {
    if (!product || !product.product || !product.product.variants) return null;
    for (const variant of product.product.variants) {
      if (variant.name.toLowerCase().includes('customization') && variant.options) {
        const toppingOpt = variant.options.find(
          opt => opt.name.toLowerCase().includes('topping')
        );
        if (toppingOpt) return toppingOpt;
      }
    }
    return null;
  };

  const getDefaultToppings = (product) => {
    const defaults = {};
    if (!product) return defaults;

    if (isProdPizza(product)) {
      const crustItem = getSelectedCrustItem(product);
      const nestedOptions = crustItem ? (crustItem.options || []) : [];
      nestedOptions.forEach(opt => {
        const heading = opt.heading || 'Customization';
        if (isHeadingMultiSelect(heading) && isDefaultNestedTopping(heading, opt)) {
          defaults[opt.id] = { ...opt, heading, quantity: 1, isDefault: true };
        }
      });
    } else {
      const toppingsOption = getToppingsOption(product);
      if (toppingsOption && toppingsOption.items) {
        toppingsOption.items.forEach(topping => {
          const rawPrice = (topping.price !== undefined && topping.price !== null && topping.price !== '') ? topping.price : topping.base_price;
          const priceVal = parseFloat(rawPrice !== undefined && rawPrice !== null ? rawPrice : 0);
          if (priceVal === 0) {
            defaults[topping.id] = { ...topping, quantity: 1, isDefault: true };
          }
        });
      }
    }
    return defaults;
  };

  const handleToggleTopping = (slotId, topping, heading = 'Customization') => {
    setSelectedToppings(prev => {
      const slotToppings = prev[slotId] ? { ...prev[slotId] } : {};
      const isMulti = isHeadingMultiSelect(heading);
      const isDefault = isMulti && isDefaultNestedTopping(heading, topping);

      if (!isMulti) {
        // Radio button logic: remove any topping in this slot that has the same heading
        const existing = slotToppings[topping.id];
        Object.keys(slotToppings).forEach(tid => {
          if (slotToppings[tid].heading === heading) {
            delete slotToppings[tid];
          }
        });
        if (!existing) {
          slotToppings[topping.id] = { ...topping, heading, quantity: 1 };
        }
      } else {
        const existing = slotToppings[topping.id];
        if (isDefault) {
          if (existing) {
            if (existing.quantity === 1) {
              slotToppings[topping.id] = { ...topping, heading, quantity: -1, isDefault: true };
            } else {
              slotToppings[topping.id] = { ...topping, heading, quantity: 1, isDefault: true };
            }
          } else {
            slotToppings[topping.id] = { ...topping, heading, quantity: -1, isDefault: true };
          }
        } else {
          if (existing) {
            delete slotToppings[topping.id];
          } else {
            slotToppings[topping.id] = { ...topping, heading, quantity: 1 };
          }
        }
      }

      return {
        ...prev,
        [slotId]: slotToppings,
      };
    });
  };

  const isToppingSelectedHelper = (slotId, topping, heading) => {
    const isMulti = isHeadingMultiSelect(heading);
    const selection = selectedToppings[slotId]?.[topping.id];
    if (selection) {
      return selection.quantity === 1;
    }
    if (isMulti && isDefaultNestedTopping(heading, topping)) {
      return true;
    }
    return false;
  };

  // Initialize visible slots and handle auto-selections
  useEffect(() => {
    if (dealSlots && dealSlots.length > 0) {
      // Open first slot by default - handle missing id by using index
      const firstSlot = dealSlots[0];
      const firstSlotId = firstSlot.id || 'slot-0';
      setVisibleSlots({ [firstSlotId]: true });

      // Auto-selection for slots with only one item
      const autoSelections = {};
      const autoToppings = {};
      const initialExpanded = {};

      dealSlots.forEach((slot, index) => {
        const sId = slot.id || `slot-${index}`;
        const allProducts = (slot.categories && slot.categories.length > 0)
          ? slot.categories.flatMap(cat => cat.products || cat.items || [])
          : (slot.products || slot.items || slot.deal_products || []);

        if (allProducts && allProducts.length === 1) {
          const prod = allProducts[0];
          autoSelections[sId] = prod;
          autoToppings[sId] = getDefaultToppings(prod);

          if (isProdPizza(prod)) {
            const crustItem = getSelectedCrustItem(prod);
            const nestedOptions = crustItem ? (crustItem.options || []) : [];
            nestedOptions.forEach(opt => {
              const heading = opt.heading || 'Customization';
              initialExpanded[`${sId}_${heading}`] = true;
            });
          }
        }
      });

      if (Object.keys(autoSelections).length > 0) {
        setSelectedInSlots(prev => ({ ...prev, ...autoSelections }));
        setSelectedToppings(prev => ({ ...prev, ...autoToppings }));
      }
      setExpandedSections(prev => ({ ...prev, ...initialExpanded }));
    }
  }, [dealSlots]);

  // Price Calculation
  useEffect(() => {
    let calc = parseFloat(basePrice);

    // Add any extra charges from selected items if applicable
    Object.values(selectedInSlots).forEach(item => {
      if (item && item.extra_price) {
        calc += parseFloat(item.extra_price);
      }
    });

    // Add topping charges
    Object.entries(selectedToppings).forEach(([slotId, toppings]) => {
      if (selectedInSlots[slotId] && toppings) {
        Object.values(toppings).forEach(topping => {
          if (topping.quantity === undefined || topping.quantity > 0) {
            const rawPrice = (topping.price !== undefined && topping.price !== null && topping.price !== '') ? topping.price : topping.base_price;
            calc += parseFloat(rawPrice !== undefined && rawPrice !== null ? rawPrice : 0);
          }
        });
      }
    });

    setTotalPrice(calc * quantity);
  }, [basePrice, selectedInSlots, selectedToppings, quantity]);

  const toggleSlotVisibility = (slotId) => {
    setVisibleSlots(prev => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  const handleProductSelect = (slotId, product) => {
    setSelectedInSlots(prev => ({
      ...prev,
      [slotId]: product,
    }));
    setActiveFlavourInSlot(prev => ({ ...prev, [slotId]: null }));

    // Initialize default toppings with price 0
    const defaults = getDefaultToppings(product);
    setSelectedToppings(prev => ({
      ...prev,
      [slotId]: defaults,
    }));

    // Auto-expand pizza nested customization sections
    if (isProdPizza(product)) {
      const crustItem = getSelectedCrustItem(product);
      const nestedOptions = crustItem ? (crustItem.options || []) : [];
      setExpandedSections(prev => {
        const next = { ...prev };
        nestedOptions.forEach(opt => {
          const heading = opt.heading || 'Customization';
          next[`${slotId}_${heading}`] = true;
        });
        return next;
      });
    }

    // If product has no toppings, auto-advance to next slot
    let hasToppings = false;
    if (isProdPizza(product)) {
      const crustItem = getSelectedCrustItem(product);
      const nestedOptions = crustItem ? (crustItem.options || []) : [];
      hasToppings = nestedOptions.length > 0;
    } else {
      const toppingsOption = getToppingsOption(product);
      hasToppings = toppingsOption && toppingsOption.items && toppingsOption.items.length > 0;
    }

    if (!hasToppings) {
      const currentIdx = dealSlots.findIndex(s => (s.id || `slot-${dealSlots.indexOf(s)}`) === slotId);
      if (currentIdx !== -1) {
        if (currentIdx < dealSlots.length - 1) {
          const nextSlot = dealSlots[currentIdx + 1];
          const nextSlotId = nextSlot.id || `slot-${currentIdx + 1}`;
          setVisibleSlots(prev => ({
            ...prev,
            [slotId]: false,      // Close current
            [nextSlotId]: true    // Open next
          }));
        } else {
          setVisibleSlots(prev => ({ ...prev, [slotId]: false }));
        }
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

  const isAllSlotsFilled = dealSlots.every((slot, index) => {
    const sId = slot.id || `slot-${index}`;
    return !!selectedInSlots[sId];
  });

  const getToppingOriginalPrice = (t) => {
    if (!menuData || !menuData.categories) return 0;

    const tId = t.id;
    const tName = (t.name || '').toLowerCase().trim();
    const tRef = (t.ref_code || '').toLowerCase().trim();
    const tPos = (t.pos_code || '').toLowerCase().trim();

    for (const cat of menuData.categories) {
      const products = cat.products || cat.items || [];
      for (const prod of products) {
        if (!prod.variants) continue;
        for (const variant of prod.variants) {
          if (!variant.options) continue;
          for (const opt of variant.options) {
            // 1. Check direct items of variant option
            if (opt.items) {
              for (const item of opt.items) {
                const itemPrice = parseFloat(item.price !== undefined && item.price !== null && item.price !== '' ? item.price : item.base_price || 0);
                if (itemPrice > 0) {
                  if (item.id === tId) return itemPrice;
                  if (tRef && item.ref_code && item.ref_code.toLowerCase().trim() === tRef) return itemPrice;
                  if (tPos && item.pos_code && item.pos_code.toLowerCase().trim() === tPos) return itemPrice;
                  if (tName && item.name && item.name.toLowerCase().trim() === tName) return itemPrice;
                }

                // 2. Crust item can have nested options/toppings
                if (item.options) {
                  for (const nestedOpt of item.options) {
                    const nestedPrice = parseFloat(nestedOpt.price !== undefined && nestedOpt.price !== null && nestedOpt.price !== '' ? nestedOpt.price : nestedOpt.base_price || 0);
                    if (nestedPrice > 0) {
                      if (nestedOpt.id === tId) return nestedPrice;
                      if (tRef && nestedOpt.ref_code && nestedOpt.ref_code.toLowerCase().trim() === tRef) return nestedPrice;
                      if (tPos && nestedOpt.pos_code && nestedOpt.pos_code.toLowerCase().trim() === tPos) return nestedPrice;
                      if (tName && nestedOpt.name && nestedOpt.name.toLowerCase().trim() === tName) return nestedPrice;
                    }
                  }
                }
              }
            }

            // 3. Check variant option itself
            const optPrice = parseFloat(opt.price !== undefined && opt.price !== null && opt.price !== '' ? opt.price : opt.base_price || 0);
            if (optPrice > 0) {
              if (opt.id === tId) return optPrice;
              if (tRef && opt.ref_code && opt.ref_code.toLowerCase().trim() === tRef) return optPrice;
              if (tPos && opt.pos_code && opt.pos_code.toLowerCase().trim() === tPos) return optPrice;
              if (tName && opt.name && opt.name.toLowerCase().trim() === tName) return optPrice;
            }
          }
        }
      }
    }
    return 0;
  };

  const handleAddToCart = () => {
    if (!isAllSlotsFilled) {
      return Alert.alert('Incomplete Deal', 'Please make all selections before adding to cart.');
    }

    // Attach selected toppings inside each slot item as selected_toppings
    const slotsWithToppings = {};
    Object.keys(selectedInSlots).forEach(slotId => {
      const prod = selectedInSlots[slotId];

      const slotToppingsMap = { ...(selectedToppings[slotId] || {}) };
      if (isProdPizza(prod)) {
        const crustItem = getSelectedCrustItem(prod);
        const nestedOptions = crustItem ? (crustItem.options || []) : [];
        nestedOptions.forEach(opt => {
          const heading = opt.heading || 'Customization';
          if (isHeadingMultiSelect(heading) && isDefaultNestedTopping(heading, opt)) {
            const existing = slotToppingsMap[opt.id];
            if (!existing) {
              slotToppingsMap[opt.id] = { ...opt, heading, quantity: 1, isDefault: true };
            }
          }
        });
      } else {
        const toppingsOption = getToppingsOption(prod);
        if (toppingsOption && toppingsOption.items) {
          toppingsOption.items.forEach(topping => {
            const rawPrice = (topping.price !== undefined && topping.price !== null && topping.price !== '') ? topping.price : topping.base_price;
            const priceVal = parseFloat(rawPrice !== undefined && rawPrice !== null ? rawPrice : 0);
            if (priceVal === 0) {
              const existing = slotToppingsMap[topping.id];
              if (!existing) {
                slotToppingsMap[topping.id] = { ...topping, quantity: 1, isDefault: true };
              }
            }
          });
        }
      }

      const crustItem = getSelectedCrustItem(prod);
      slotsWithToppings[slotId] = {
        id: prod.id,
        name: prod.product?.name || prod.display_name,
        price: parseFloat(prod.extra_price || 0),
        ref_code: prod.ref_code || prod.product?.ref_code || crustItem?.ref_code || crustItem?.product?.ref_code || '',
        pos_code: prod.pos_code || prod.product?.pos_code || crustItem?.pos_code || crustItem?.product?.pos_code || '',
        selected_toppings: Object.values(slotToppingsMap)
          .map(t => {
            let toppingPrice = parseFloat(t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price || 0);
            if (toppingPrice === 0) {
              const originalPrice = getToppingOriginalPrice(t);
              if (originalPrice > 0) {
                toppingPrice = originalPrice;
              }
            }
            return {
              id: t.id,
              name: t.name,
              price: toppingPrice,
              quantity: t.quantity !== undefined ? t.quantity : 1,
              pos_code: t.pos_code || t.ref_code || '',
              ref_code: t.ref_code || ''
            };
          })
      };
    });

    const cartKey = `deal-${id}-${JSON.stringify(slotsWithToppings)}`;
    const details = {
      slots: slotsWithToppings,
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
        {dealSlots.map((slot, index) => {
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
                  {selectedInSlots[sId] && (() => {
                    const prod = selectedInSlots[sId];
                    const toppingCount = Object.values(selectedToppings[sId] || {}).filter(t => t.quantity === 1).length;
                    const productName = prod.product?.name || prod.display_name || 'Item';
                    return (
                      <View>
                        <Text style={styles.selectedIndicator}>
                          ✓ {productName}
                        </Text>
                        {toppingCount > 0 && (
                          <Text style={styles.selectedToppingsBadge}>
                            + {toppingCount} topping{toppingCount > 1 ? 's' : ''}
                          </Text>
                        )}
                      </View>
                    );
                  })()}
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
                    const selectedProduct = selectedInSlots[sId];
                    if (selectedProduct) {
                      const toppingsOption = getToppingsOption(selectedProduct);
                      return (
                        <View>
                          <View style={styles.selectedChoiceRow}>
                            <Text style={styles.selectedChoiceText}>
                              Choice: {selectedProduct.product?.name || selectedProduct.display_name}
                            </Text>
                            <TouchableOpacity
                              style={styles.changeChoiceBtn}
                              onPress={() => {
                                setSelectedInSlots(prev => {
                                  const next = { ...prev };
                                  delete next[sId];
                                  return next;
                                });
                                setSelectedToppings(prev => {
                                  const next = { ...prev };
                                  delete next[sId];
                                  return next;
                                });
                                setExpandedSections(prev => {
                                  const next = { ...prev };
                                  Object.keys(next).forEach(k => {
                                    if (k.startsWith(`${sId}_`)) {
                                      delete next[k];
                                    }
                                  });
                                  return next;
                                });
                                setActiveFlavourInSlot(prev => ({ ...prev, [sId]: null }));
                              }}
                            >
                              <Text style={styles.changeChoiceBtnText}>Change Choice</Text>
                            </TouchableOpacity>
                          </View>

                          {isProdPizza(selectedProduct) ? (
                            Object.keys(getPizzaNestedGroupedOptions(selectedProduct)).map((heading) => {
                              const headingToppings = getPizzaNestedGroupedOptions(selectedProduct)[heading];
                              const isMultiSelect = isHeadingMultiSelect(heading);
                              const sectionKey = `${sId}_${heading}`;
                              const isExpanded = !!expandedSections[sectionKey];

                              return (
                                <View key={heading} style={styles.nestedSectionContainer}>
                                  <TouchableOpacity
                                    style={styles.nestedSectionHeader}
                                    onPress={() => toggleSection(sectionKey)}
                                    activeOpacity={0.7}
                                  >
                                    <View style={styles.toppingsHeader}>
                                      <Text style={styles.toppingsHeading}>{heading}</Text>
                                      <View style={styles.optionalBadge}>
                                        <Text style={styles.optionalBadgeText}>Optional</Text>
                                      </View>
                                    </View>
                                    {isExpanded ? (
                                      <ChevronUp size={16} color={theme.colors.text} />
                                    ) : (
                                      <ChevronDown size={16} color={theme.colors.text} />
                                    )}
                                  </TouchableOpacity>

                                  {isExpanded && (
                                    <View style={styles.toppingsGrid}>
                                      {headingToppings.map(topping => {
                                        const rawPrice = (topping.price !== undefined && topping.price !== null && topping.price !== '') ? topping.price : topping.base_price;
                                        const priceVal = parseFloat(rawPrice !== undefined && rawPrice !== null ? rawPrice : 0);
                                        const isToppingSelected = isToppingSelectedHelper(sId, topping, heading);

                                        return (
                                          <TouchableOpacity
                                            key={topping.id}
                                            style={[
                                              styles.toppingCard,
                                              isToppingSelected && styles.toppingCardSelected
                                            ]}
                                            onPress={() => handleToggleTopping(sId, topping, heading)}
                                          >
                                            <View style={styles.toppingCardContent}>
                                              <Text style={[
                                                styles.toppingLabel,
                                                isToppingSelected && styles.toppingLabelSelected
                                              ]}>
                                                {topping.name}
                                              </Text>
                                              {priceVal > 0 && (
                                                <Text style={styles.toppingPrice}>+ Rs {priceVal}</Text>
                                              )}
                                            </View>
                                            {isToppingSelected && (
                                              <View style={styles.toppingCheckCircle}>
                                                <Check size={10} color="#fff" />
                                              </View>
                                            )}
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  )}
                                </View>
                              );
                            })
                          ) : (
                            toppingsOption && toppingsOption.items && toppingsOption.items.length > 0 && (
                              <View style={styles.toppingsContainer}>
                                <View style={styles.toppingsHeader}>
                                  <Text style={styles.toppingsHeading}>Add Toppings</Text>
                                  <View style={styles.optionalBadge}>
                                    <Text style={styles.optionalBadgeText}>Optional</Text>
                                  </View>
                                </View>
                                <View style={styles.toppingsGrid}>
                                  {toppingsOption.items.map(topping => {
                                    const rawPrice = (topping.price !== undefined && topping.price !== null && topping.price !== '') ? topping.price : topping.base_price;
                                    const priceVal = parseFloat(rawPrice !== undefined && rawPrice !== null ? rawPrice : 0);
                                    const isToppingSelected = isToppingSelectedHelper(sId, topping, 'Customization');
                                    return (
                                      <TouchableOpacity
                                        key={topping.id}
                                        style={[
                                          styles.toppingCard,
                                          isToppingSelected && styles.toppingCardSelected
                                        ]}
                                        onPress={() => handleToggleTopping(sId, topping, 'Customization')}
                                      >
                                        <View style={styles.toppingCardContent}>
                                          <Text style={[
                                            styles.toppingLabel,
                                            isToppingSelected && styles.toppingLabelSelected
                                          ]}>
                                            {topping.name}
                                          </Text>
                                          {priceVal > 0 && (
                                            <Text style={styles.toppingPrice}>+ Rs {priceVal}</Text>
                                          )}
                                        </View>
                                        {isToppingSelected && (
                                          <View style={styles.toppingCheckCircle}>
                                            <Check size={10} color="#fff" />
                                          </View>
                                        )}
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            )
                          )}

                          {/* Next/Close selection button */}
                          {index < dealSlots.length - 1 ? (
                            <TouchableOpacity
                              style={styles.nextSlotBtn}
                              onPress={() => {
                                const nextSlot = dealSlots[index + 1];
                                const nextSlotId = nextSlot.id || `slot-${index + 1}`;
                                setVisibleSlots({ [nextSlotId]: true });
                              }}
                            >
                              <Text style={styles.nextSlotBtnText}>Next Selection →</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.nextSlotBtn}
                              onPress={() => setVisibleSlots(prev => ({ ...prev, [sId]: false }))}
                            >
                              <Text style={styles.nextSlotBtnText}>Close Selection</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    }

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
  selectedToppingsBadge: {
    fontSize: 12,
    color: theme.colors.primary,
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
  },
  selectedChoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: theme.colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedChoiceText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  changeChoiceBtn: {
    backgroundColor: theme.colors.primary + '15',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  changeChoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  toppingsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  toppingsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  toppingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionalBadge: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  optionalBadgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  toppingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toppingCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toppingCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  toppingCardContent: {
    flex: 1,
  },
  toppingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  toppingLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  toppingPrice: {
    fontSize: 11,
    color: theme.colors.text,
    opacity: 0.5,
    marginTop: 2,
  },
  toppingCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  nestedSectionContainer: {
    marginBottom: 16,
  },
  nestedSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '30',
    marginBottom: 8,
  },
  requiredBadge: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  requiredBadgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  nextSlotBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  nextSlotBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  }
});

export default DealOptions;
