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

  const [selectedFirstHalfInSlot, setSelectedFirstHalfInSlot] = useState({});
  const [selectedSecondHalfInSlot, setSelectedSecondHalfInSlot] = useState({});
  const [sharedCrustNameInSlot, setSharedCrustNameInSlot] = useState({});
  const [firstHalfSelectionsInSlot, setFirstHalfSelectionsInSlot] = useState({});
  const [secondHalfSelectionsInSlot, setSecondHalfSelectionsInSlot] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getEffectiveCrustPriceForSlot = (slotId, crustName) => {
    const firstHalf = selectedFirstHalfInSlot[slotId];
    const secondHalf = selectedSecondHalfInSlot[slotId];
    if (!firstHalf || !secondHalf) return 0;
    
    const firstPrice = parseFloat(firstHalf.price || firstHalf.extra_price || 0);
    const secondPrice = parseFloat(secondHalf.price || secondHalf.extra_price || 0);
    const higherHalf = secondPrice > firstPrice ? secondHalf : firstHalf;
    
    if (!higherHalf || !higherHalf.product || !higherHalf.product.variants) return 0;
    
    for (const v of higherHalf.product.variants) {
      if (v.name.toLowerCase().includes('size') && v.options) {
        const slotProd = selectedInSlots[slotId];
        const halfVariantOptIds = slotProd?.product?.halves_variant_option_ids || [];
        
        let targetOpt = v.options.find(o => halfVariantOptIds.includes(o.id.toString()));
        if (!targetOpt) targetOpt = v.options[0];
        
        if (targetOpt && targetOpt.items) {
           const match = targetOpt.items.find(i => i.name === crustName);
           if (match) {
              return parseFloat(match.price !== undefined && match.price !== null && match.price !== '' ? match.price : match.base_price || 0);
           }
        }
      }
    }
    return 0;
  };

  const getMatchedHalfProduct = (slotId, baseHalf, crustName) => {
      if (!baseHalf) return null;
      const slotProd = selectedInSlots[slotId];
      if (!slotProd) return baseHalf;
      const slot = dealSlots.find(s => String(s.id || `slot-${dealSlots.indexOf(s)}`) === String(slotId));
      const slotProds = slot ? getHalfProductsForSlot(slot) : [];
      
      const flavourName = baseHalf.product?.name || baseHalf.display_name.split(' ')[0] || 'Unknown';
      
      const match = slotProds.find(p => {
         const pFlavour = p.product?.name || p.display_name.split(' ')[0] || 'Unknown';
         if (pFlavour !== flavourName) return false;
         const pCrust = p.variant_items?.[0]?.name || p.display_name.replace(pFlavour, '').trim();
         return pCrust.toLowerCase().includes((crustName||'').toLowerCase());
      });
      return match || baseHalf;
  };

  const getHalfProductsForSlot = (slot) => {
     if (!slot) return [];
     const allProducts = (slot.categories && slot.categories.length > 0)
        ? slot.categories.flatMap(cat => cat.products || cat.items || [])
        : (slot.products || slot.items || slot.deal_products || []);
     return allProducts;
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
            if (existing.quantity > 0) {
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

  const handleToppingQuantityChange = (slotId, topping, heading = 'Customization', delta) => {
    setSelectedToppings(prev => {
      const slotToppings = prev[slotId] ? { ...prev[slotId] } : {};
      const isMulti = isHeadingMultiSelect(heading);
      const isDefault = isMulti && isDefaultNestedTopping(heading, topping);
      
      const existing = slotToppings[topping.id];
      const currentQty = existing ? existing.quantity : (isDefault ? 1 : 0);
      let newQty = currentQty + delta;

      if (isDefault) {
        if (newQty < -1) newQty = -1;
        slotToppings[topping.id] = { ...topping, heading, quantity: newQty, isDefault: true };
      } else {
        if (newQty <= 0) {
          delete slotToppings[topping.id];
        } else {
          slotToppings[topping.id] = { ...topping, heading, quantity: newQty };
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
      return selection.quantity >= 1;
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

    Object.keys(selectedInSlots).forEach(slotId => {
      const item = selectedInSlots[slotId];
      if (!item) return;

      if (item.product?.product_type === 'half_and_half') {
         const firstHalfBase = selectedFirstHalfInSlot[slotId];
         const secondHalfBase = selectedSecondHalfInSlot[slotId];
         const sCrust = sharedCrustNameInSlot[slotId];
         
         const firstHalf = getMatchedHalfProduct(slotId, firstHalfBase, sCrust) || firstHalfBase;
         const secondHalf = getMatchedHalfProduct(slotId, secondHalfBase, sCrust) || secondHalfBase;
         
         const firstPrice = firstHalf ? parseFloat(firstHalf.extra_price || 0) : 0;
         const secondPrice = secondHalf ? parseFloat(secondHalf.extra_price || 0) : 0;
         // The extra_price of the matched crust product already contains the upcharge (e.g. 300)
         calc += Math.max(firstPrice, secondPrice);
         
         const fToppings = firstHalfSelectionsInSlot[slotId] || {};
         Object.values(fToppings).forEach(t => {
            if (t.quantity > 0) {
              const rawPrice = t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price;
              const toppingPrice = parseFloat(rawPrice || 0);
              if (toppingPrice === 0) {
                 if (t.quantity > 1) calc += 170 * (t.quantity - 1) * 0.5;
              } else {
                 calc += toppingPrice * t.quantity * 0.5;
              }
            }
         });

         const sToppings = secondHalfSelectionsInSlot[slotId] || {};
         Object.values(sToppings).forEach(t => {
            if (t.quantity > 0) {
              const rawPrice = t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price;
              const toppingPrice = parseFloat(rawPrice || 0);
              if (toppingPrice === 0) {
                 if (t.quantity > 1) calc += 170 * (t.quantity - 1) * 0.5;
              } else {
                 calc += toppingPrice * t.quantity * 0.5;
              }
            }
         });
      } else {
        if (item.extra_price) {
          calc += parseFloat(item.extra_price);
        }
        // Add topping charges for regular items
        const toppings = selectedToppings[slotId];
        if (toppings) {
          Object.values(toppings).forEach(topping => {
            if (topping.quantity === undefined || topping.quantity > 0) {
              const rawPrice = (topping.price !== undefined && topping.price !== null && topping.price !== '') ? topping.price : topping.base_price;
              const priceVal = parseFloat(rawPrice !== undefined && rawPrice !== null ? rawPrice : 0);
              const qty = topping.quantity !== undefined ? topping.quantity : 1;
              
              if (priceVal === 0 && topping.isDefault) {
                  if (qty > 1) {
                      calc += 170 * (qty - 1);
                  }
              } else {
                  calc += priceVal * qty;
              }
            }
          });
        }
      }
    });

    setTotalPrice(calc * quantity);
  }, [basePrice, selectedInSlots, selectedToppings, quantity, selectedFirstHalfInSlot, selectedSecondHalfInSlot, sharedCrustNameInSlot, firstHalfSelectionsInSlot, secondHalfSelectionsInSlot]);

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

    if (!hasToppings && product?.product?.product_type !== 'half_and_half') {
      const currentIdx = dealSlots.findIndex(s => String(s.id || `slot-${dealSlots.indexOf(s)}`) === String(slotId));
      if (currentIdx !== -1) {
        if (currentIdx < dealSlots.length - 1) {
          const nextSlot = dealSlots[currentIdx + 1];
          const nextSlotId = nextSlot.id || `slot-${currentIdx + 1}`;
          setVisibleSlots(prev => ({
            ...prev,
            [slotId]: false,
            [nextSlotId]: true
          }));
        } else {
          setVisibleSlots(prev => ({ ...prev, [slotId]: false }));
        }
      }
    } else if (product?.product?.product_type === 'half_and_half') {
       setExpandedSections(prev => ({
         ...prev,
         [`${slotId}_half_1_pizza`]: true
       }));
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
    const prod = selectedInSlots[sId];
    if (!prod) return false;
    
    if (prod.product?.product_type === 'half_and_half') {
      return selectedFirstHalfInSlot[sId] && selectedSecondHalfInSlot[sId] && sharedCrustNameInSlot[sId];
    }
    return true;
  });

  const handleAddToCart = () => {
    const slotsWithToppings = {};

    Object.keys(selectedInSlots).forEach(slotId => {
      const prod = selectedInSlots[slotId];
      if (!prod) return;

      if (prod.product?.product_type === 'half_and_half') {
         const firstHalfBase = selectedFirstHalfInSlot[slotId];
         const secondHalfBase = selectedSecondHalfInSlot[slotId];
         const sCrust = sharedCrustNameInSlot[slotId];
         
         const firstHalf = getMatchedHalfProduct(slotId, firstHalfBase, sCrust) || firstHalfBase;
         const secondHalf = getMatchedHalfProduct(slotId, secondHalfBase, sCrust) || secondHalfBase;
         
         const mapTopping = (t, prefix) => {
            let toppingPrice = parseFloat(t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price || 0);
            if (toppingPrice === 0 && t.base_price) {
              toppingPrice = parseFloat(t.base_price || 0);
            }
            const isDefault = toppingPrice === 0 || t.isDefault;
            const qty = t.quantity !== undefined ? t.quantity : 1;

            if (isDefault) {
                if (qty === 1) {
                    return null;
                }
                if (qty <= 0) {
                    return {
                       variant_id: prefix + '_customization',
                       variant_name: prefix === 'half_1' ? '1st Half Customization' : '2nd Half Customization',
                       option_id: t.id,
                       option_name: t.heading || 'Topping',
                       heading: t.heading || '',
                       item_id: t.id,
                       item_name: t.name,
                       price: 0,
                       quantity: -1,
                       pos_code: t.pos_code || t.ref_code || '',
                       ref_code: t.ref_code || ''
                    };
                }
                return {
                   variant_id: prefix + '_customization',
                   variant_name: prefix === 'half_1' ? '1st Half Customization' : '2nd Half Customization',
                   option_id: t.id,
                   option_name: t.heading || 'Topping',
                   heading: t.heading || '',
                   item_id: t.id,
                   item_name: t.name,
                   price: 170 * (qty - 1),
                   quantity: qty,
                   pos_code: t.pos_code || t.ref_code || '',
                   ref_code: t.ref_code || ''
                };
            } else {
                if (qty <= 0) {
                    return null;
                }
                return {
                   variant_id: prefix + '_customization',
                   variant_name: prefix === 'half_1' ? '1st Half Customization' : '2nd Half Customization',
                   option_id: t.id,
                   option_name: t.heading || 'Topping',
                   heading: t.heading || '',
                   item_id: t.id,
                   item_name: t.name,
                   price: toppingPrice * qty,
                   quantity: qty,
                   pos_code: t.pos_code || t.ref_code || '',
                   ref_code: t.ref_code || ''
                };
            }
         };

         const fToppings = Object.values(firstHalfSelectionsInSlot[slotId] || {})
             .map(t => mapTopping(t, 'half_1'))
             .filter(t => t !== null);
         const sToppings = Object.values(secondHalfSelectionsInSlot[slotId] || {})
             .map(t => mapTopping(t, 'half_2'))
             .filter(t => t !== null);

         const firstPrice = parseFloat(firstHalf.extra_price || 0);
         const secondPrice = parseFloat(secondHalf.extra_price || 0);
         // higherPrice is only the extra_price of the matched product (which covers crust markup)
         const higherPrice = Math.max(firstPrice, secondPrice);
         // However, the payload needs the full crust price in the crust object
         const crustPrice = sCrust ? getEffectiveCrustPriceForSlot(slotId, sCrust) : 0;
         
         const higherHalf = secondPrice > firstPrice ? secondHalf : firstHalf;
         let crustPos = '';
         let crustRef = '';
         let crustId = 113; // default
         if (higherHalf?.product?.variants) {
             const sizeVar = higherHalf.product.variants.find(v => v.name.toLowerCase().includes('size'));
             const halfVariantOptIds = prod.product.halves_variant_option_ids || [];
             let sizeOpt = sizeVar?.options?.find(o => halfVariantOptIds.includes(o.id.toString()));
             if (!sizeOpt) sizeOpt = sizeVar?.options?.[0];
             const cItem = sizeOpt?.items?.find(i => i.name === sCrust);
             if (cItem) {
                 crustId = cItem.id;
                 crustPos = cItem.pos_code || '';
                 crustRef = cItem.ref_code || '';
             }
         }

         slotsWithToppings[slotId] = {
            id: prod.id,
            name: prod.product?.name || prod.display_name,
            price: higherPrice,
            ref_code: prod.ref_code || prod.product?.ref_code || '',
            pos_code: prod.pos_code || prod.product?.pos_code || '',
            isHalfAndHalf: true,
            firstHalf: {
                pizza: {
                    variant_id: 'half_1',
                    variant_name: '1st Half',
                    option_id: firstHalf.id,
                    option_name: 'Signature Pizzas',
                    item_id: firstHalf.id,
                    item_name: firstHalf.name || firstHalf.display_name || firstHalf.product?.name,
                    price: 0,
                    quantity: 0.5,
                    pos_code: firstHalf.pos_code || firstHalf.product?.pos_code || '',
                    ref_code: firstHalf.ref_code || firstHalf.product?.ref_code || ''
                },
                crust: sCrust ? {
                    variant_id: 'half_1_crust',
                    variant_name: 'Crust',
                    option_id: crustId,
                    option_name: 'Crust',
                    item_id: crustId,
                    item_name: sCrust,
                    price: 0,
                    quantity: 0.5,
                    pos_code: crustPos,
                    ref_code: crustRef
                } : null,
                toppings: fToppings
            },
            secondHalf: {
                pizza: {
                    variant_id: 'half_2',
                    variant_name: '2nd Half',
                    option_id: secondHalf.id,
                    option_name: 'Signature Pizzas',
                    item_id: secondHalf.id,
                    item_name: secondHalf.name || secondHalf.display_name || secondHalf.product?.name,
                    price: 0,
                    quantity: 0.5,
                    pos_code: secondHalf.pos_code || secondHalf.product?.pos_code || '',
                    ref_code: secondHalf.ref_code || secondHalf.product?.ref_code || ''
                },
                crust: sCrust ? {
                    variant_id: 'half_2_crust',
                    variant_name: 'Crust',
                    option_id: crustId,
                    option_name: 'Crust',
                    item_id: crustId,
                    item_name: sCrust,
                    price: 0,
                    quantity: 0.5,
                    pos_code: crustPos,
                    ref_code: crustRef
                } : null,
                toppings: sToppings
            }
         };
         return;
      }

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
        crust: crustItem ? {
            variant_id: 'crust',
            variant_name: 'Crust',
            option_id: crustItem.id,
            option_name: 'Crust',
            item_id: crustItem.id,
            item_name: crustItem.name,
            price: 0,
            quantity: 1,
            pos_code: crustItem.pos_code || crustItem.ref_code || '',
            ref_code: crustItem.ref_code || ''
        } : null,
        selected_toppings: Object.values(slotToppingsMap)
          .map(t => {
            let toppingPrice = parseFloat(t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price || 0);
            if (toppingPrice === 0 && t.base_price) {
              toppingPrice = parseFloat(t.base_price || 0);
            }
            const qty = t.quantity !== undefined ? t.quantity : 1;
            const isDefault = toppingPrice === 0 || t.isDefault;

            if (isDefault) {
                if (qty === 1) {
                    return null;
                }
                if (qty <= 0) {
                    return {
                      id: t.id,
                      name: t.name,
                      price: 0,
                      quantity: -1,
                      pos_code: t.pos_code || t.ref_code || '',
                      ref_code: t.ref_code || ''
                    };
                }
                // qty > 1
                return {
                  id: t.id,
                  name: t.name,
                  price: 170 * (qty - 1),
                  quantity: qty,
                  pos_code: t.pos_code || t.ref_code || '',
                  ref_code: t.ref_code || ''
                };
            } else {
                if (qty <= 0) {
                    return null;
                }
                return {
                  id: t.id,
                  name: t.name,
                  price: toppingPrice * qty,
                  quantity: qty,
                  pos_code: t.pos_code || t.ref_code || '',
                  ref_code: t.ref_code || ''
                };
            }
          })
          .filter(t => t !== null)
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

  
  const renderHalfAndHalfUI = (sId, product) => {
     const halfProds = getHalfProductsForSlot(dealSlots.find(s => (s.id || `slot-${dealSlots.indexOf(s)}`) === sId));
     let targetCategoryIds = [];
     if (product.product?.halves_category_id) {
         targetCategoryIds = product.product.halves_category_id.split(',').map(s => s.trim());
     } else if (product.product?.halves_category_ids) {
         targetCategoryIds = product.product.halves_category_ids.flatMap(id => id.toString().split(',')).map(s => s.trim());
     }
     
     const availableHalves = halfProds.filter(p => {
         const pCatId = p.product?.category_id?.toString();
         const isStandard = p.product?.product_type === 'standard' || p.product?.product_type === 'variable'; 
         // Assuming standard or variable are fine if category matches. The user said standard, so we'll check standard.
         const isTypeOk = p.product?.product_type === 'standard' || !p.product?.product_type; // fallback
         return isTypeOk && pCatId && targetCategoryIds.includes(pCatId);
     });
     
     const selectedFirstHalf = selectedFirstHalfInSlot[sId];
     const selectedSecondHalf = selectedSecondHalfInSlot[sId];
     const sharedCrustName = sharedCrustNameInSlot[sId];
     const firstHalfSelections = firstHalfSelectionsInSlot[sId] || {};
     const secondHalfSelections = secondHalfSelectionsInSlot[sId] || {};

     const firstPrice = selectedFirstHalf ? parseFloat(selectedFirstHalf.price || selectedFirstHalf.extra_price || 0) : 0;
     const secondPrice = selectedSecondHalf ? parseFloat(selectedSecondHalf.price || selectedSecondHalf.extra_price || 0) : 0;
     const higherHalf = (secondPrice > firstPrice) ? selectedSecondHalf : selectedFirstHalf;
     const sizeVar = higherHalf?.product?.variants?.find(v => v.name.toLowerCase().includes('size'));
     const sizeOpt = sizeVar?.options?.find(o => product.product?.halves_variant_option_ids?.includes(o.id.toString())) || sizeVar?.options?.[0];
     const crustOptions = sizeOpt?.items || [];
     
     const getCrustPrice = (crustName) => {
        const firstHalfActual = getMatchedHalfProduct(sId, selectedFirstHalf, crustName) || selectedFirstHalf;
        const secondHalfActual = getMatchedHalfProduct(sId, selectedSecondHalf, crustName) || selectedSecondHalf;
        
        const firstPrice = firstHalfActual ? parseFloat(firstHalfActual.extra_price || 0) : 0;
        const secondPrice = secondHalfActual ? parseFloat(secondHalfActual.extra_price || 0) : 0;
        const upgradedPrice = Math.max(firstPrice, secondPrice);
        
        const baseFirstPrice = selectedFirstHalf ? parseFloat(selectedFirstHalf.extra_price || 0) : 0;
        const baseSecondPrice = selectedSecondHalf ? parseFloat(selectedSecondHalf.extra_price || 0) : 0;
        const basePrice = Math.max(baseFirstPrice, baseSecondPrice);
        
        const diff = upgradedPrice - basePrice;
        return diff > 0 ? diff : 0;
     };

     const crustNameToShow = sharedCrustName || '';
     const selectedFirstHalfCrust = selectedFirstHalf ? getSelectedCrustItem(selectedFirstHalf) : null;
     const selectedSecondHalfCrust = selectedSecondHalf ? getSelectedCrustItem(selectedSecondHalf) : null;
     const firstHalfCrustOptions = selectedFirstHalfCrust?.options || [];
     const secondHalfCrustOptions = selectedSecondHalfCrust?.options || [];

     return (
        <View style={styles.variantContainer}>
             {/* 1st Half Selection */}
             <TouchableOpacity 
                 style={styles.variantHeader} 
                 onPress={() => toggleSection(`${sId}_half_1_pizza`)}
             >
                 <Text style={styles.variantTitle}>
                     1st Half Pizza {selectedFirstHalf ? `(${selectedFirstHalf.name || selectedFirstHalf.display_name})` : ''}
                 </Text>
                 {expandedSections[`${sId}_half_1_pizza`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
             </TouchableOpacity>
             
             {expandedSections[`${sId}_half_1_pizza`] && (
                 <View style={{ marginBottom: 24 }}>
                     <View style={styles.optionsWrapper}>
                         <View style={{ marginBottom: 16 }}>
                             <View style={styles.itemGrid}>
                                 {groupItemsByFlavour(availableHalves).map(group => {
                                     const isSelected = selectedFirstHalf?.product?.id === group.id || selectedFirstHalf?.id === group.id;
                                     const p = group.items[0];
                                     return (
                                         <TouchableOpacity
                                             key={group.id}
                                             style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                             onPress={() => {
                                                 setSelectedFirstHalfInSlot(prev => ({...prev, [sId]: p}));
                                                 setFirstHalfSelectionsInSlot(prev => ({...prev, [sId]: {}}));
                                                 
                                                 setExpandedSections(prev => ({
                                                     ...prev,
                                                     [`${sId}_half_1_pizza`]: false,
                                                     [`${sId}_half_2_pizza`]: !selectedSecondHalf ? true : false,
                                                     [`${sId}_half_shared_crust`]: selectedSecondHalf ? true : false
                                                 }));
                                             }}
                                         >
                                             <View style={styles.itemCardContent}>
                                                 <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{group.name}</Text>
                                                 <Text style={{fontSize: 10, color: 'red', marginTop: 4}}>{group.items.length} options</Text>
                                             </View>
                                             {isSelected && <View style={styles.checkCircle}><Check size={12} color="#fff" /></View>}
                                         </TouchableOpacity>
                                     )
                                 })}
                             </View>
                         </View>
                     </View>
                 </View>
             )}

             {/* 2nd Half Selection */}
             <TouchableOpacity 
                 style={styles.variantHeader} 
                 onPress={() => toggleSection(`${sId}_half_2_pizza`)}
             >
                 <Text style={styles.variantTitle}>
                     2nd Half Pizza {selectedSecondHalf ? `(${selectedSecondHalf.name || selectedSecondHalf.display_name})` : ''}
                 </Text>
                 {expandedSections[`${sId}_half_2_pizza`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
             </TouchableOpacity>
             
             {expandedSections[`${sId}_half_2_pizza`] && (
                 <View style={{ marginBottom: 24 }}>
                     <View style={styles.optionsWrapper}>
                         <View style={{ marginBottom: 16 }}>
                             <View style={styles.itemGrid}>
                                 {groupItemsByFlavour(availableHalves).map(group => {
                                     const isSelected = selectedSecondHalf?.product?.id === group.id || selectedSecondHalf?.id === group.id;
                                     const p = group.items[0];
                                     return (
                                         <TouchableOpacity
                                             key={group.id}
                                             style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                             onPress={() => {
                                                 setSelectedSecondHalfInSlot(prev => ({...prev, [sId]: p}));
                                                 setSecondHalfSelectionsInSlot(prev => ({...prev, [sId]: {}}));

                                                 setExpandedSections(prev => ({
                                                     ...prev,
                                                     [`${sId}_half_2_pizza`]: false,
                                                     [`${sId}_half_shared_crust`]: true
                                                 }));
                                             }}
                                         >
                                             <View style={styles.itemCardContent}>
                                                 <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{group.name}</Text>
                                                 <Text style={{fontSize: 10, color: 'red', marginTop: 4}}>{group.items.length} options</Text>
                                             </View>
                                             {isSelected && <View style={styles.checkCircle}><Check size={12} color="#fff" /></View>}
                                         </TouchableOpacity>
                                     )
                                 })}
                             </View>
                         </View>
                     </View>
                 </View>
             )}

             {/* Shared Crust Selection */}
             {selectedFirstHalf && crustOptions.length > 0 && (
                 <View style={{ marginBottom: 24, marginTop: -10 }}>
                     <TouchableOpacity 
                         style={[styles.variantHeader, { marginTop: 0 }]} 
                         onPress={() => toggleSection(`${sId}_half_shared_crust`)}
                     >
                         <Text style={styles.variantTitle}>
                             Pizza Crust {crustNameToShow ? `(${crustNameToShow})` : ''}
                         </Text>
                         {expandedSections[`${sId}_half_shared_crust`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                     </TouchableOpacity>
                     
                     {expandedSections[`${sId}_half_shared_crust`] && (
                         <View style={styles.optionGroup}>
                             <View style={styles.itemGrid}>
                                 {crustOptions.map(crust => {
                                     const isSelected = crustNameToShow === crust.name;
                                     return (
                                         <TouchableOpacity
                                             key={crust.id}
                                             style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                             onPress={() => {
                                                 setSharedCrustNameInSlot(prev => ({...prev, [sId]: crust.name}));
                                                 setFirstHalfSelectionsInSlot(prev => ({...prev, [sId]: {}}));
                                                 setSecondHalfSelectionsInSlot(prev => ({...prev, [sId]: {}}));
                                                 
                                                 setExpandedSections(prev => ({
                                                     ...prev,
                                                     [`${sId}_half_shared_crust`]: false,
                                                     [`${sId}_half_1_toppings`]: true
                                                 }));
                                             }}
                                         >
                                             <View style={styles.itemCardContent}>
                                                 <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{crust.name}</Text>
                                                 {getCrustPrice(crust.name) > 0 && <Text style={[styles.itemPrice, isSelected && styles.itemLabelSelected]}>+Rs {getCrustPrice(crust.name).toFixed(0)}</Text>}
                                             </View>
                                             {isSelected && <View style={styles.checkCircle}><Check size={12} color="#fff" /></View>}
                                         </TouchableOpacity>
                                     )
                                 })}
                             </View>
                         </View>
                     )}
                 </View>
             )}

             {/* 1st Half Toppings */}
             {firstHalfCrustOptions.length > 0 && (() => {
                 const grouped = {};
                 firstHalfCrustOptions.forEach(opt => {
                     const h = opt.heading || 'Customization';
                     if (!grouped[h]) grouped[h] = [];
                     grouped[h].push(opt);
                 });

                 const toppingHeadings = Object.keys(grouped).filter(h => h.toLowerCase().includes('topping'));
                 if (toppingHeadings.length === 0) return null;

                 return (
                     <View style={{ marginBottom: 24, marginTop: -10 }}>
                         <TouchableOpacity 
                             style={[styles.variantHeader, { marginTop: 0 }]} 
                             onPress={() => toggleSection(`${sId}_half_1_toppings`)}
                         >
                             <Text style={styles.variantTitle}>1st Half Toppings</Text>
                             {expandedSections[`${sId}_half_1_toppings`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                         </TouchableOpacity>

                         {expandedSections[`${sId}_half_1_toppings`] && toppingHeadings.map(heading => {
                             const isMulti = isHeadingMultiSelect(heading);
                             return (
                                 <View key={heading} style={styles.optionGroup}>
                                     <Text style={styles.optionSubTitle}>{heading}</Text>
                                     <View style={styles.itemGrid}>
                                         {grouped[heading].map(item => {
                                             const key = `nested_${item.id}`;
                                             const isTopping = true;
                                             const isDefault = isTopping && parseFloat(item.price||0) === 0;
                                             const isSelected = firstHalfSelections[key]?.quantity > 0 || (!firstHalfSelections[key] && isDefault);

                                             return (
                                                 <TouchableOpacity
                                                     key={item.id}
                                                     style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                                     onPress={() => {
                                                         setFirstHalfSelectionsInSlot(prev => {
                                                             const slotToppings = prev[sId] ? {...prev[sId]} : {};
                                                             if (isMulti) {
                                                                 if (isSelected) {
                                                                     const currentQty = slotToppings[key]?.quantity || (isDefault ? 1 : 0);
                                                                     if (isDefault) slotToppings[key] = { ...item, heading, quantity: Math.max(-1, currentQty - 1) };
                                                                     else if (currentQty <= 1) delete slotToppings[key];
                                                                     else slotToppings[key] = { ...item, heading, quantity: currentQty - 1 };
                                                                 } else {
                                                                     slotToppings[key] = { ...item, heading, quantity: 1 };
                                                                 }
                                                             } else {
                                                                 Object.keys(slotToppings).forEach(k => {
                                                                     if (grouped[heading].some(gItem => `nested_${gItem.id}` === k)) {
                                                                         delete slotToppings[k];
                                                                     }
                                                                 });
                                                                 slotToppings[key] = { ...item, heading, quantity: 1 };
                                                             }
                                                             return { ...prev, [sId]: slotToppings };
                                                         });
                                                     }}
                                                 >
                                                     <View style={styles.itemCardContent}>
                                                         <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{item.name}</Text>
                                                         
                                                         {(!isSelected) && Number(item.price) > 0 && (
                                                             <Text style={[styles.itemPrice, isSelected && styles.itemLabelSelected]}>
                                                                 +Rs {(Number(item.price)).toFixed(0)}
                                                             </Text>
                                                         )}

                                                         {isSelected && (() => {
                                                             const qty = firstHalfSelectionsInSlot[sId]?.[key]?.quantity || (isDefault ? 1 : 1);
                                                             let extraCharge = 0;
                                                             if (isDefault && qty > 1) {
                                                                 extraCharge = 170 * (qty - 1);
                                                             } else if (!isDefault && qty > 0) {
                                                                 extraCharge = parseFloat(item.price || 0) * qty;
                                                             }
                                                             return (
                                                                 <View>
                                                                     {extraCharge > 0 && (
                                                                         <Text style={[styles.itemPrice, styles.itemLabelSelected]}>
                                                                             +Rs {extraCharge.toFixed(0)}
                                                                         </Text>
                                                                     )}
                                                                     <View style={styles.toppingQtyContainer}>
                                                                         <TouchableOpacity 
                                                                             style={styles.toppingQtyBtn}
                                                                             onPress={() => {
                                                                                 setFirstHalfSelectionsInSlot(prev => {
                                                                                     const next = { ...prev };
                                                                                     const slotToppings = next[sId] ? { ...next[sId] } : {};
                                                                                     const currentQty = slotToppings[key]?.quantity || (isDefault ? 1 : 0);
                                                                                     if (isDefault) slotToppings[key] = { ...item, heading, quantity: Math.max(-1, currentQty - 1) };
                                                                                     else if (currentQty <= 1) delete slotToppings[key];
                                                                                     else slotToppings[key] = { ...item, heading, quantity: currentQty - 1 };
                                                                                     next[sId] = slotToppings;
                                                                                     return next;
                                                                                 });
                                                                             }}
                                                                         >
                                                                             <Minus size={14} color={theme.colors.primary} />
                                                                         </TouchableOpacity>
                                                                         <Text style={styles.toppingQtyText}>{qty}</Text>
                                                                         <TouchableOpacity 
                                                                             style={styles.toppingQtyBtn}
                                                                             onPress={() => {
                                                                                 setFirstHalfSelectionsInSlot(prev => {
                                                                                     const next = { ...prev };
                                                                                     const slotToppings = next[sId] ? { ...next[sId] } : {};
                                                                                     const currentQty = slotToppings[key]?.quantity || (isDefault ? 1 : 0);
                                                                                     slotToppings[key] = { ...item, heading, quantity: currentQty + 1 };
                                                                                     next[sId] = slotToppings;
                                                                                     return next;
                                                                                 });
                                                                             }}
                                                                         >
                                                                             <Plus size={14} color={theme.colors.primary} />
                                                                         </TouchableOpacity>
                                                                     </View>
                                                                 </View>
                                                             );
                                                         })()}
                                                     </View>

                                                 </TouchableOpacity>
                                             );
                                         })}
                                     </View>
                                 </View>
                             );
                         })}
                     </View>
                 );
             })()}

             {/* 2nd Half Toppings */}
             {secondHalfCrustOptions.length > 0 && (() => {
                 const grouped = {};
                 secondHalfCrustOptions.forEach(opt => {
                     const h = opt.heading || 'Customization';
                     if (!grouped[h]) grouped[h] = [];
                     grouped[h].push(opt);
                 });

                 const toppingHeadings = Object.keys(grouped).filter(h => h.toLowerCase().includes('topping'));
                 if (toppingHeadings.length === 0) return null;

                 return (
                     <View style={{ marginBottom: 24, marginTop: -10 }}>
                         <TouchableOpacity 
                             style={[styles.variantHeader, { marginTop: 0 }]} 
                             onPress={() => toggleSection(`${sId}_half_2_toppings`)}
                         >
                             <Text style={styles.variantTitle}>2nd Half Toppings</Text>
                             {expandedSections[`${sId}_half_2_toppings`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                         </TouchableOpacity>

                         {expandedSections[`${sId}_half_2_toppings`] && toppingHeadings.map(heading => {
                             const isMulti = isHeadingMultiSelect(heading);
                             return (
                                 <View key={heading} style={styles.optionGroup}>
                                     <Text style={styles.optionSubTitle}>{heading}</Text>
                                     <View style={styles.itemGrid}>
                                         {grouped[heading].map(item => {
                                             const key = `nested_${item.id}`;
                                             const isTopping = true;
                                             const isDefault = isTopping && parseFloat(item.price||0) === 0;
                                             const isSelected = secondHalfSelections[key]?.quantity > 0 || (!secondHalfSelections[key] && isDefault);

                                             return (
                                                 <TouchableOpacity
                                                     key={item.id}
                                                     style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                                     onPress={() => {
                                                         setSecondHalfSelectionsInSlot(prev => {
                                                             const slotToppings = prev[sId] ? {...prev[sId]} : {};
                                                             if (isMulti) {
                                                                 if (isSelected) {
                                                                     const currentQty = slotToppings[key]?.quantity || (isDefault ? 1 : 0);
                                                                     if (isDefault) slotToppings[key] = { ...item, heading, quantity: Math.max(-1, currentQty - 1) };
                                                                     else if (currentQty <= 1) delete slotToppings[key];
                                                                     else slotToppings[key] = { ...item, heading, quantity: currentQty - 1 };
                                                                 } else {
                                                                     slotToppings[key] = { ...item, heading, quantity: 1 };
                                                                 }
                                                             } else {
                                                                 Object.keys(slotToppings).forEach(k => {
                                                                     if (grouped[heading].some(gItem => `nested_${gItem.id}` === k)) {
                                                                         delete slotToppings[k];
                                                                     }
                                                                 });
                                                                 slotToppings[key] = { ...item, heading, quantity: 1 };
                                                             }
                                                             return { ...prev, [sId]: slotToppings };
                                                         });
                                                     }}
                                                 >
                                                     <View style={styles.itemCardContent}>
                                                         <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{item.name}</Text>
                                                         
                                                         {(!isSelected) && Number(item.price) > 0 && (
                                                             <Text style={[styles.itemPrice, isSelected && styles.itemLabelSelected]}>
                                                                 +Rs {(Number(item.price)).toFixed(0)}
                                                             </Text>
                                                         )}

                                                         {isSelected && (() => {
                                                             const qty = secondHalfSelectionsInSlot[sId]?.[key]?.quantity || (isDefault ? 1 : 1);
                                                             let extraCharge = 0;
                                                             if (isDefault && qty > 1) {
                                                                 extraCharge = 170 * (qty - 1) * 0.5;
                                                             } else if (!isDefault && qty > 0) {
                                                                 extraCharge = parseFloat(item.price || 0) * qty * 0.5;
                                                             }
                                                             return (
                                                                 <View>
                                                                     {extraCharge > 0 && (
                                                                         <Text style={[styles.itemPrice, styles.itemLabelSelected]}>
                                                                             +Rs {extraCharge.toFixed(0)}
                                                                         </Text>
                                                                     )}
                                                                     <View style={styles.toppingQtyContainer}>
                                                                         <TouchableOpacity 
                                                                             style={styles.toppingQtyBtn}
                                                                             onPress={() => {
                                                                                 setSecondHalfSelectionsInSlot(prev => {
                                                                                     const next = { ...prev };
                                                                                     const slotToppings = next[sId] ? { ...next[sId] } : {};
                                                                                     const currentQty = slotToppings[key]?.quantity || (isDefault ? 1 : 0);
                                                                                     if (isDefault) slotToppings[key] = { ...item, heading, quantity: Math.max(-1, currentQty - 1) };
                                                                                     else if (currentQty <= 1) delete slotToppings[key];
                                                                                     else slotToppings[key] = { ...item, heading, quantity: currentQty - 1 };
                                                                                     next[sId] = slotToppings;
                                                                                     return next;
                                                                                 });
                                                                             }}
                                                                         >
                                                                             <Minus size={14} color={theme.colors.primary} />
                                                                         </TouchableOpacity>
                                                                         <Text style={styles.toppingQtyText}>{qty}</Text>
                                                                         <TouchableOpacity 
                                                                             style={styles.toppingQtyBtn}
                                                                             onPress={() => {
                                                                                 setSecondHalfSelectionsInSlot(prev => {
                                                                                     const next = { ...prev };
                                                                                     const slotToppings = next[sId] ? { ...next[sId] } : {};
                                                                                     const currentQty = slotToppings[key]?.quantity || (isDefault ? 1 : 0);
                                                                                     slotToppings[key] = { ...item, heading, quantity: currentQty + 1 };
                                                                                     next[sId] = slotToppings;
                                                                                     return next;
                                                                                 });
                                                                             }}
                                                                         >
                                                                             <Plus size={14} color={theme.colors.primary} />
                                                                         </TouchableOpacity>
                                                                     </View>
                                                                 </View>
                                                             );
                                                         })()}
                                                     </View>

                                                 </TouchableOpacity>
                                             );
                                         })}
                                     </View>
                                 </View>
                             );
                         })}
                     </View>
                 );
             })()}
        </View>
     );
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
        <View>
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
                    const toppingCount = Object.values(selectedToppings[sId] || {}).filter(t => t.quantity > 0).length;
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

                          {selectedProduct.product?.product_type === 'half_and_half' ? (
                            renderHalfAndHalfUI(sId, selectedProduct)
                          ) : isProdPizza(selectedProduct) ? (
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

                                        const isDefault = priceVal === 0;
                                        const qty = selectedToppings[sId]?.[topping.id]?.quantity || (isDefault && isToppingSelected ? 1 : 0);
                                        
                                        return (
                                            <TouchableOpacity
                                              key={topping.id}
                                              style={[
                                                styles.toppingCard,
                                                isToppingSelected && styles.toppingCardSelected
                                              ]}
                                              onPress={() => {
                                                if (isToppingSelected) {
                                                    if (isDefault) handleToppingQuantityChange(sId, topping, heading, -1);
                                                    else if (qty <= 1) handleToggleTopping(sId, topping, heading);
                                                    else handleToppingQuantityChange(sId, topping, heading, -1);
                                                } else {
                                                    handleToggleTopping(sId, topping, heading);
                                                }
                                              }}
                                            >
                                              <View style={styles.toppingCardContent}>
                                                <Text style={[
                                                  styles.toppingLabel,
                                                  isToppingSelected && styles.toppingLabelSelected
                                                ]}>
                                                  {topping.name}
                                                </Text>
                                                
                                                {(!isToppingSelected) && priceVal > 0 && (
                                                  <Text style={styles.toppingPrice}>+ Rs {priceVal}</Text>
                                                )}

                                                {isToppingSelected && (() => {
                                                    let extraCharge = 0;
                                                    if (isDefault && qty > 1) {
                                                        extraCharge = 170 * (qty - 1);
                                                    } else if (!isDefault && qty > 0) {
                                                        extraCharge = priceVal * qty;
                                                    }
                                                    return (
                                                        <View>
                                                            {extraCharge > 0 && (
                                                                <Text style={[styles.toppingPrice, styles.toppingLabelSelected]}>
                                                                    +Rs {extraCharge.toFixed(0)}
                                                                </Text>
                                                            )}
                                                            <View style={styles.toppingQtyContainer}>
                                                                <TouchableOpacity 
                                                                    style={styles.toppingQtyBtn}
                                                                    onPress={() => {
                                                                        if (isDefault) handleToppingQuantityChange(sId, topping, heading, -1);
                                                                        else if (qty <= 1) handleToggleTopping(sId, topping, heading);
                                                                        else handleToppingQuantityChange(sId, topping, heading, -1);
                                                                    }}
                                                                >
                                                                    <Minus size={14} color={theme.colors.primary} />
                                                                </TouchableOpacity>
                                                                <Text style={styles.toppingQtyText}>{qty}</Text>
                                                                <TouchableOpacity 
                                                                    style={styles.toppingQtyBtn}
                                                                    onPress={() => handleToppingQuantityChange(sId, topping, heading, 1)}
                                                                >
                                                                    <Plus size={14} color={theme.colors.primary} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    );
                                                })()}
                                              </View>
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
                                    const isDefault = priceVal === 0;
                                    const qty = selectedToppings[sId]?.[topping.id]?.quantity || (isDefault && isToppingSelected ? 1 : 0);
                                    
                                    return (
                                      <TouchableOpacity
                                        key={topping.id}
                                        style={[
                                          styles.toppingCard,
                                          isToppingSelected && styles.toppingCardSelected
                                        ]}
                                        onPress={() => {
                                            if (isToppingSelected) {
                                                if (isDefault) handleToppingQuantityChange(sId, topping, 'Customization', -1);
                                                else if (qty <= 1) handleToggleTopping(sId, topping, 'Customization');
                                                else handleToppingQuantityChange(sId, topping, 'Customization', -1);
                                            } else {
                                                handleToggleTopping(sId, topping, 'Customization');
                                            }
                                        }}
                                      >
                                        <View style={styles.toppingCardContent}>
                                          <Text style={[
                                            styles.toppingLabel,
                                            isToppingSelected && styles.toppingLabelSelected
                                          ]}>
                                            {topping.name}
                                          </Text>
                                          
                                          {!isToppingSelected && priceVal > 0 && (
                                            <Text style={styles.toppingPrice}>+ Rs {priceVal}</Text>
                                          )}

                                          {isToppingSelected && (() => {
                                              let extraCharge = 0;
                                              if (isDefault && qty > 1) {
                                                  extraCharge = 170 * (qty - 1);
                                              } else if (!isDefault && qty > 0) {
                                                  extraCharge = priceVal * qty;
                                              }
                                              return (
                                                  <View>
                                                      {extraCharge > 0 && (
                                                          <Text style={[styles.toppingPrice, styles.toppingLabelSelected]}>
                                                              +Rs {extraCharge.toFixed(0)}
                                                          </Text>
                                                      )}
                                                      <View style={styles.toppingQtyContainer}>
                                                          <TouchableOpacity 
                                                              style={styles.toppingQtyBtn}
                                                              onPress={() => {
                                                                  if (isDefault) handleToppingQuantityChange(sId, topping, 'Customization', -1);
                                                                  else if (qty <= 1) handleToggleTopping(sId, topping, 'Customization');
                                                                  else handleToppingQuantityChange(sId, topping, 'Customization', -1);
                                                              }}
                                                          >
                                                              <Minus size={14} color={theme.colors.primary} />
                                                          </TouchableOpacity>
                                                          <Text style={styles.toppingQtyText}>{qty}</Text>
                                                          <TouchableOpacity 
                                                              style={styles.toppingQtyBtn}
                                                              onPress={() => handleToppingQuantityChange(sId, topping, 'Customization', 1)}
                                                          >
                                                              <Plus size={14} color={theme.colors.primary} />
                                                          </TouchableOpacity>
                                                      </View>
                                                  </View>
                                              );
                                          })()}
                                        </View>
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
                                    dealSlots.length === 2 && { width: '100%', marginHorizontal: 0 },
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
                                dealSlots.length === 2 && { width: '100%', marginHorizontal: 0 },
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
        </View>
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
  slotsRowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  slotColumn: {
    flex: 1,
    marginHorizontal: 5,
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
    width: '48%',
    margin: 4,
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
  },
  toppingQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 2,
    alignSelf: 'flex-start',
  },
  toppingQtyBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  toppingQtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginHorizontal: 12,
  }
});

export default DealOptions;
