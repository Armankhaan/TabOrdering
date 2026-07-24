import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoreContext } from '../../context/StoreContext';
import { ThemeContext } from '../../context/ThemeContext';
import { ChevronDown, ChevronUp, Plus, Minus, Check } from 'lucide-react-native';

export function ItemOptions({ route }) {
    const navigation = useNavigation();
    const { addToCart, selectedBranch, loading: contextLoading } = useContext(StoreContext);
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);
    const insets = useSafeAreaInsets();

    // Initial product data from route params
    const product = route.params || {};
    const { id, name, price, description, image, ref_code, variants = [] } = product;

    const [totalPrice, setTotalPrice] = useState(parseFloat(price));
    const [selectedSelections, setSelectedSelections] = useState({});
    const [quantity, setQuantity] = useState(1);

    const [expandedSections, setExpandedSections] = useState({});

    // Half & Half State
    const isHalfAndHalf = product.product_type === 'half_and_half';
    const [selectedFirstHalf, setSelectedFirstHalf] = useState(null);
    const [sharedCrustName, setSharedCrustName] = useState(null);
    const [selectedSecondHalf, setSelectedSecondHalf] = useState(null);
    const [firstHalfSelections, setFirstHalfSelections] = useState({});
    const [secondHalfSelections, setSecondHalfSelections] = useState({});

    // Find selected size and selected crust
    const sizeVariant = variants.find(v => v.name.toLowerCase().includes('size'));
    let selectedCrustItem = null;
    let selectedSizeOption = null;
    if (sizeVariant) {
        sizeVariant.options?.forEach(opt => {
            const selection = selectedSelections[`${sizeVariant.id}_${opt.id}`];
            if (selection) {
                selectedCrustItem = selection;
                selectedSizeOption = opt;
            }
        });
    }

    let selectedFirstHalfCrust = null;
    let selectedSecondHalfCrust = null;

    if (isHalfAndHalf) {
        const firstPrice = selectedFirstHalf ? parseFloat(selectedFirstHalf.price || 0) : 0;
        const secondPrice = selectedSecondHalf ? parseFloat(selectedSecondHalf.price || 0) : 0;
        const mainSizeName = selectedSizeOption?.name?.toLowerCase();

        if (firstPrice >= secondPrice) {
            if (selectedFirstHalf) {
                const sizeVar = selectedFirstHalf.variants?.find(v => v.name.toLowerCase().includes('size'));
                const sizeOpt = (mainSizeName && sizeVar?.options?.find(o => o.name?.toLowerCase() === mainSizeName)) || sizeVar?.options?.[0];
                selectedFirstHalfCrust = sizeOpt?.items?.find(i => i.name === sharedCrustName) || sizeOpt?.items?.find(i => i.is_default_selected) || sizeOpt?.items?.[0];
            }

            if (selectedSecondHalf) {
                const sizeVar2 = selectedSecondHalf.variants?.find(v => v.name.toLowerCase().includes('size'));
                const sizeOpt2 = (mainSizeName && sizeVar2?.options?.find(o => o.name?.toLowerCase() === mainSizeName)) || sizeVar2?.options?.[0];
                const targetCrustName = sharedCrustName || selectedFirstHalfCrust?.name;
                selectedSecondHalfCrust = sizeOpt2?.items?.find(i => i.name === targetCrustName) || sizeOpt2?.items?.find(i => i.is_default_selected) || sizeOpt2?.items?.[0];
            }
        } else {
            if (selectedSecondHalf) {
                const sizeVar2 = selectedSecondHalf.variants?.find(v => v.name.toLowerCase().includes('size'));
                const sizeOpt2 = (mainSizeName && sizeVar2?.options?.find(o => o.name?.toLowerCase() === mainSizeName)) || sizeVar2?.options?.[0];
                selectedSecondHalfCrust = sizeOpt2?.items?.find(i => i.name === sharedCrustName) || sizeOpt2?.items?.find(i => i.is_default_selected) || sizeOpt2?.items?.[0];
            }

            if (selectedFirstHalf) {
                const sizeVar = selectedFirstHalf.variants?.find(v => v.name.toLowerCase().includes('size'));
                const sizeOpt = (mainSizeName && sizeVar?.options?.find(o => o.name?.toLowerCase() === mainSizeName)) || sizeVar?.options?.[0];
                const targetCrustName = sharedCrustName || selectedSecondHalfCrust?.name;
                selectedFirstHalfCrust = sizeOpt?.items?.find(i => i.name === targetCrustName) || sizeOpt?.items?.find(i => i.is_default_selected) || sizeOpt?.items?.[0];
            }
        }
    }

    const getEffectiveCrustPrice = (crustName) => {
        if (!selectedFirstHalf) return 0;

        const mainSizeName = selectedSizeOption?.name?.toLowerCase();

        const sizeVar1 = selectedFirstHalf?.variants?.find(v => v.name.toLowerCase().includes('size'));
        const sizeOpt1 = (mainSizeName && sizeVar1?.options?.find(o => o.name?.toLowerCase() === mainSizeName)) || sizeVar1?.options?.[0];
        const crust1 = sizeOpt1?.items?.find(i => i.name === crustName);
        const crust1Price = crust1 ? parseFloat(crust1.price || 0) : 0;

        let crust2Price = 0;
        if (selectedSecondHalf) {
            const sizeVar2 = selectedSecondHalf?.variants?.find(v => v.name.toLowerCase().includes('size'));
            const sizeOpt2 = (mainSizeName && sizeVar2?.options?.find(o => o.name?.toLowerCase() === mainSizeName)) || sizeVar2?.options?.[0];
            const crust2 = sizeOpt2?.items?.find(i => i.name === crustName);
            crust2Price = crust2 ? parseFloat(crust2.price || 0) : 0;
        }

        if (selectedFirstHalf && selectedSecondHalf) {
            return (crust1Price + crust2Price) / 2;
        } else {
            return crust1Price || crust2Price;
        }
    };

    // Toggle section visibility
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Categorization
    const categoryName = (product.categoryName || product.category?.name || product.category_name || '').toLowerCase();
    const isPizza = categoryName.includes('pizza') || name.toLowerCase().includes('pizza');
    const isBurger = categoryName.includes('burger');

    // Helper to determine if a nested topping heading is multi-select
    const isHeadingMultiSelect = (heading) => {
        const h = heading.toLowerCase();
        if (h.includes('portion') || h.includes('sauce') || h.includes('crust')) return false;
        return true;
    };

    // Helper to determine if a nested topping is default selected (heading contains "topping", price is 0)
    const isDefaultNestedTopping = (heading, topping) => {
        const hName = heading.toLowerCase();
        const priceVal = parseFloat(topping.price || 0);
        return hName.includes('topping') && priceVal === 0;
    };

    // Group nested options of the selected crust by heading
    const nestedGroupedOptions = {};
    if (selectedCrustItem && selectedCrustItem.options) {
        selectedCrustItem.options.forEach(opt => {
            const heading = opt.heading || 'Customization';
            if (!nestedGroupedOptions[heading]) {
                nestedGroupedOptions[heading] = [];
            }
            nestedGroupedOptions[heading].push(opt);
        });
    }

    // Pizza size status
    const anySizePicked = isPizza && !!selectedCrustItem;

    // Expand size and meal by default
    useEffect(() => {
        const initialExpanded = {};
        if (isHalfAndHalf) {
            initialExpanded['half_1_pizza'] = true;
        }
        variants.forEach(v => {
            const vName = v.name.toLowerCase();
            if (vName.includes('size') || vName.includes('meal')) {
                initialExpanded[v.id] = true;
            }
        });
        setExpandedSections(initialExpanded);
    }, [variants, isHalfAndHalf]);

    // Auto-select nested options and expand headings by default when a size/crust is selected
    useEffect(() => {
        if (selectedCrustItem && selectedCrustItem.options) {
            // Auto expand nested customization sections
            setExpandedSections(prev => {
                const next = { ...prev };
                selectedCrustItem.options.forEach(opt => {
                    const heading = opt.heading || 'Customization';
                    next[heading] = true;
                });
                return next;
            });
        }
    }, [selectedCrustItem]);

    // Auto-selection for mandatory items with only 1 choice and default price 0 customization options (only toppings)
    useEffect(() => {
        if (variants.length > 0) {
            const autoPick = {};
            variants.forEach(v => {
                const vn = v.name.toLowerCase();
                if (vn.includes('customization') || vn.includes('add on') || vn.includes('addon')) {
                    v.options?.forEach(opt => {
                        // Only process options that are toppings
                        const optName = (opt.name || '').toLowerCase();
                        if (!optName.includes('topping')) return;
                        opt.items?.forEach(item => {
                            const priceVal = parseFloat(item.price || 0);
                            if (priceVal === 0) {
                                autoPick[`${v.id}_${opt.id}_${item.id}`] = {
                                    ...item,
                                    variantId: v.id,
                                    optionId: opt.id,
                                    quantity: 1,
                                    isDefault: true
                                };
                            }
                        });
                    });
                    return;
                }
                if (v.options?.length === 1 && v.options[0].items?.length === 1) {
                    const opt = v.options[0];
                    const item = opt.items[0];
                    autoPick[`${v.id}_${opt.id}`] = { ...item, variantId: v.id, optionId: opt.id };
                }
            });
            if (Object.keys(autoPick).length > 0) {
                setSelectedSelections(prev => ({ ...prev, ...autoPick }));
            }
        }
    }, [variants]);

    // Burger meal status
    const getBurgerMealStatus = () => {
        let hasDrink = false;
        let hasFry = false;
        variants.forEach(v => {
            if (v.name.toLowerCase().includes('meal')) {
                v.options?.forEach(opt => {
                    const oName = opt.name.toLowerCase();
                    const isOptSelected = !!selectedSelections[`${v.id}_${opt.id}`];
                    if (oName.includes('drink')) hasDrink = isOptSelected;
                    if (oName.includes('frie')) hasFry = isOptSelected;
                });
            }
        });
        return { hasDrink, hasFry };
    };

    const { hasDrink, hasFry } = isBurger ? getBurgerMealStatus() : { hasDrink: false, hasFry: false };

    // Sorting Logic
    const displayVariants = [...variants].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        if (aName.includes('customization')) return 1;
        if (bName.includes('customization')) return -1;
        if (aName.includes('size')) return -1;
        if (bName.includes('size')) return 1;
        return 0;
    });


    // Validation
    const isProductIncomplete = () => {
        if (isHalfAndHalf) {
            if (!selectedFirstHalf || !selectedSecondHalf) return true;
            return false;
        }

        let incomplete = false;
        variants.forEach(v => {
            const vName = v.name.toLowerCase();
            if (vName.includes('size')) {
                const hasSelection = v.options?.some(o => selectedSelections[`${v.id}_${o.id}`]);
                if (!hasSelection) incomplete = true;
            }
        });
        if (isBurger && (hasDrink || hasFry) && !(hasDrink && hasFry)) incomplete = true;
        return incomplete;
    };


    // Handle selection with multi-select and radio logic
    const handleSelectOptionItem = (variantId, optionId, item, isRadio, isMultiSelect) => {
        const key = isMultiSelect ? `${variantId}_${optionId}_${item.id}` : `${variantId}_${optionId}`;
        let isNewSelection = false;

        setSelectedSelections(prev => {
            const next = { ...prev };
            const priceVal = parseFloat(item.price || 0);
            const currentVariant = variants.find(v => v.id === variantId);
            const option = currentVariant?.options?.find(o => o.id === optionId);
            const optName = (option?.name || '').toLowerCase();
            const isDefault = isMultiSelect && priceVal === 0 && optName.includes('topping');

            if (isDefault) {
                const existing = next[key];
                if (existing) {
                    if (existing.quantity > 0) {
                        next[key] = { ...item, variantId, optionId, quantity: -1, isDefault: true };
                    } else {
                        next[key] = { ...item, variantId, optionId, quantity: 1, isDefault: true };
                        isNewSelection = true;
                    }
                } else {
                    next[key] = { ...item, variantId, optionId, quantity: -1, isDefault: true };
                }
            } else {
                if (isMultiSelect ? next[key] : next[key]?.id === item.id) {
                    delete next[key];
                } else {
                    if (isRadio) {
                        Object.keys(next).forEach(k => {
                            if (k.startsWith(`${variantId}_`)) delete next[k];
                        });
                        // Clear nested selections on size/crust change
                        Object.keys(next).forEach(k => {
                            if (k.startsWith('nested_')) delete next[k];
                        });
                    }
                    next[key] = { ...item, variantId, optionId, quantity: 1 };
                    isNewSelection = true;
                }
            }

            // --- Auto Toggle Logic ---
            if (isNewSelection) {
                const currentVariant = variants.find(v => v.id === variantId);
                const vName = (currentVariant?.name || '').toLowerCase();

                let shouldClose = false;

                // 1. Size Auto-Next
                if (vName.includes('size')) {
                    shouldClose = true;
                }

                // 2. Meal Auto-Next (Check if finalized: Drink + Fries)
                if (vName.includes('meal')) {
                    let localHasDrink = false;
                    let localHasFry = false;
                    currentVariant.options?.forEach(opt => {
                        const optName = (opt.name || '').toLowerCase();
                        if (optName.includes('drink')) localHasDrink = !!next[`${variantId}_${opt.id}`];
                        if (optName.includes('frie')) localHasFry = !!next[`${variantId}_${opt.id}`];
                    });
                    if (localHasDrink && localHasFry) {
                        shouldClose = true;
                    }
                }

                if (shouldClose) {
                    const customizationVariant = variants.find(v => v.name.toLowerCase().includes('customization'));
                    setExpandedSections(prevExp => ({
                        ...prevExp,
                        [variantId]: false, // Close current
                        [customizationVariant?.id]: customizationVariant ? true : prevExp[customizationVariant?.id || 'none']
                    }));
                }
            }

            return { ...next };
        });
    };

    // Handle selection for nested toppings/options
    const handleSelectNestedTopping = (heading, topping) => {
        if (!selectedSizeOption || !selectedCrustItem || !sizeVariant) return;

        const isMulti = isHeadingMultiSelect(heading);
        const sizeVariantId = sizeVariant.id;
        const sizeOptionId = selectedSizeOption.id;
        const crustItemId = selectedCrustItem.id;

        const baseKey = `nested_${sizeVariantId}_${sizeOptionId}_${crustItemId}_${heading}`;
        const key = isMulti ? `${baseKey}_${topping.id}` : baseKey;
        const isDefault = isMulti && isDefaultNestedTopping(heading, topping);

        setSelectedSelections(prev => {
            const next = { ...prev };
            if (isDefault) {
                const existing = next[key];
                if (existing) {
                    if (existing.quantity > 0) {
                        next[key] = {
                            ...topping,
                            variantId: sizeVariantId,
                            optionId: sizeOptionId,
                            crustItemId: crustItemId,
                            heading: heading,
                            isNested: true,
                            quantity: -1,
                            isDefault: true
                        };
                    } else {
                        next[key] = {
                            ...topping,
                            variantId: sizeVariantId,
                            optionId: sizeOptionId,
                            crustItemId: crustItemId,
                            heading: heading,
                            isNested: true,
                            quantity: 1,
                            isDefault: true
                        };
                    }
                } else {
                    next[key] = {
                        ...topping,
                        variantId: sizeVariantId,
                        optionId: sizeOptionId,
                        crustItemId: crustItemId,
                        heading: heading,
                        isNested: true,
                        quantity: -1,
                        isDefault: true
                    };
                }
            } else {
                if (isMulti) {
                    if (next[key]) {
                        delete next[key];
                    } else {
                        next[key] = {
                            ...topping,
                            variantId: sizeVariantId,
                            optionId: sizeOptionId,
                            crustItemId: crustItemId,
                            heading: heading,
                            isNested: true,
                            quantity: 1
                        };
                    }
                } else {
                    // Radio button logic: delete all selections under this baseKey
                    Object.keys(next).forEach(k => {
                        if (k.startsWith(baseKey)) delete next[k];
                    });
                    next[key] = {
                        ...topping,
                        variantId: sizeVariantId,
                        optionId: sizeOptionId,
                        crustItemId: crustItemId,
                        heading: heading,
                        isNested: true,
                        quantity: 1
                    };
                }
            }
            return next;
        });
    };

    // Handle quantity change for regular toppings (+/- buttons)
    const handleToppingQuantityChange = (variantId, optionId, item, delta, isMultiSelect) => {
        const key = isMultiSelect ? `${variantId}_${optionId}_${item.id}` : `${variantId}_${optionId}`;
        const variant = variants.find(v => v.id === variantId);
        const option = variant?.options?.find(o => o.id === optionId);
        const optName = (option?.name || '').toLowerCase();
        const priceVal = parseFloat(item.price || 0);
        const isDefault = isMultiSelect && priceVal === 0 && optName.includes('topping');

        setSelectedSelections(prev => {
            const next = { ...prev };
            const existing = next[key];
            const currentQty = existing ? existing.quantity : (isDefault ? 1 : 0);
            let newQty = currentQty + delta;

            if (isDefault) {
                // 0-price default: min is -1 (removed)
                if (newQty < -1) newQty = -1;
                next[key] = { ...item, variantId, optionId, quantity: newQty, isDefault: true };
            } else {
                // Paid topping: min is 0 (removed)
                if (newQty <= 0) {
                    delete next[key];
                } else {
                    next[key] = { ...(existing || item), ...item, variantId, optionId, quantity: newQty };
                }
            }
            return { ...next };
        });
    };

    // Handle quantity change for nested pizza toppings (+/- buttons)
    const handleNestedToppingQuantityChange = (heading, topping, delta) => {
        if (!selectedSizeOption || !selectedCrustItem || !sizeVariant) return;

        const isMulti = isHeadingMultiSelect(heading);
        const sizeVariantId = sizeVariant.id;
        const sizeOptionId = selectedSizeOption.id;
        const crustItemId = selectedCrustItem.id;

        const baseKey = `nested_${sizeVariantId}_${sizeOptionId}_${crustItemId}_${heading}`;
        const key = isMulti ? `${baseKey}_${topping.id}` : baseKey;
        const isDefault = isMulti && isDefaultNestedTopping(heading, topping);

        setSelectedSelections(prev => {
            const next = { ...prev };
            const existing = next[key];
            const currentQty = existing ? existing.quantity : (isDefault ? 1 : 0);
            let newQty = currentQty + delta;

            if (isDefault) {
                if (newQty < -1) newQty = -1;
                next[key] = {
                    ...topping,
                    variantId: sizeVariantId,
                    optionId: sizeOptionId,
                    crustItemId: crustItemId,
                    heading: heading,
                    isNested: true,
                    quantity: newQty,
                    isDefault: true
                };
            } else {
                if (newQty <= 0) {
                    delete next[key];
                } else {
                    next[key] = {
                        ...topping,
                        variantId: sizeVariantId,
                        optionId: sizeOptionId,
                        crustItemId: crustItemId,
                        heading: heading,
                        isNested: true,
                        quantity: newQty
                    };
                }
            }
            return next;
        });
    };


    // Calculate total price accurately
    useEffect(() => {
        let calc = 0;

        if (isHalfAndHalf) {
            let firstPrice = 0;
            if (selectedFirstHalf) {
                firstPrice = parseFloat(selectedFirstHalf.price || 0) + (selectedFirstHalfCrust ? parseFloat(selectedFirstHalfCrust.price || 0) : 0);
            }
            let secondPrice = 0;
            if (selectedSecondHalf) {
                secondPrice = parseFloat(selectedSecondHalf.price || 0) + (selectedSecondHalfCrust ? parseFloat(selectedSecondHalfCrust.price || 0) : 0);
            }



            if (selectedFirstHalf && selectedSecondHalf) {
                calc = (firstPrice + secondPrice) / 2;

            } else if (selectedFirstHalf) {
                calc = firstPrice / 2;

            } else if (selectedSecondHalf) {
                calc = secondPrice / 2;

            }

            // Add toppings prices for first half (half quantities)
            let toppingsTotal1 = 0;
            Object.values(firstHalfSelections).forEach(item => {
                if (item.quantity === undefined || item.quantity > 0) {
                    const itemPrice = parseFloat(item.price || 0);
                    const qty = item.quantity !== undefined ? item.quantity : 1;
                    if (itemPrice === 0) {
                        if (qty > 1) toppingsTotal1 += 170 * (qty - 1);
                    } else {
                        toppingsTotal1 += itemPrice * qty;
                    }
                }
            });

            calc += toppingsTotal1;

            // Add toppings prices for second half (half quantities)
            let toppingsTotal2 = 0;
            Object.values(secondHalfSelections).forEach(item => {
                if (item.quantity === undefined || item.quantity > 0) {
                    const itemPrice = parseFloat(item.price || 0);
                    const qty = item.quantity !== undefined ? item.quantity : 1;
                    if (itemPrice === 0) {
                        if (qty > 1) toppingsTotal2 += 170 * (qty - 1);
                    } else {
                        toppingsTotal2 += itemPrice * qty;
                    }
                }
            });

            calc += toppingsTotal2;

        } else {
            calc = parseFloat(price);
            Object.values(selectedSelections).forEach(item => {
                if (item.quantity === undefined || item.quantity > 0) {
                    const itemPrice = parseFloat(item.price || 0);
                    const qty = item.quantity !== undefined ? item.quantity : 1;
                    if (itemPrice === 0 && item.isDefault) {
                        // 0-price default topping: charge 170 per extra unit beyond 1
                        if (qty > 1) {
                            calc += 170 * (qty - 1);
                        }
                    } else {
                        calc += itemPrice * qty;
                    }
                }
            });
        }

        setTotalPrice(calc * quantity);
    }, [price, selectedSelections, quantity, isHalfAndHalf, selectedFirstHalf, selectedSecondHalf, firstHalfSelections, secondHalfSelections, sharedCrustName]);


    const handleAddToCart = () => {
        if (isHalfAndHalf) {
            const customizationsSelections = [];

            const firstPrice = (selectedFirstHalf ? parseFloat(selectedFirstHalf.price || 0) : 0) + (selectedFirstHalfCrust ? parseFloat(selectedFirstHalfCrust.price || 0) : 0);
            const secondPrice = (selectedSecondHalf ? parseFloat(selectedSecondHalf.price || 0) : 0) + (selectedSecondHalfCrust ? parseFloat(selectedSecondHalfCrust.price || 0) : 0);

            let finalFirstHalfSelections = {};
            if (selectedFirstHalf) {
                // Add the half product
                customizationsSelections.push({
                    variant_id: 'half_1',
                    variant_name: '1st Half',
                    option_id: selectedFirstHalf.id,
                    option_name: selectedFirstHalf.category?.name || 'Pizza',
                    item_id: selectedFirstHalf.id,
                    item_name: selectedFirstHalf.name,
                    price: firstPrice,
                    quantity: 0.5,
                    pos_code: selectedFirstHalf.pos_code || selectedFirstHalf.ref_code || '',
                    ref_code: selectedFirstHalf.ref_code || ''
                });
                // Prepare final selections for first half (including any default toppings from crust)
                finalFirstHalfSelections = { ...firstHalfSelections };

                // Add crust for 1st half
                if (selectedFirstHalfCrust) {
                    customizationsSelections.push({
                        variant_id: 'half_1_crust',
                        variant_name: 'Crust',
                        option_id: selectedFirstHalfCrust.id,
                        option_name: 'Crust',
                        item_id: selectedFirstHalfCrust.id,
                        item_name: selectedFirstHalfCrust.name,
                        price: firstPrice,
                        quantity: 0.5,
                        pos_code: selectedFirstHalfCrust.pos_code || selectedFirstHalfCrust.ref_code || '',
                        ref_code: selectedFirstHalfCrust.ref_code || ''
                    });



                    selectedFirstHalfCrust.options?.forEach(opt => {
                        const hName = (opt.heading || '').toLowerCase();
                        if (hName.includes('topping') && parseFloat(opt.price || 0) === 0) {
                            const key = `nested_${opt.id}`;
                            // Ensure the topping is added (override if already present)
                            if (!finalFirstHalfSelections[key]) {
                                finalFirstHalfSelections[key] = { ...opt, heading: opt.heading, quantity: 1 };
                            }
                        }
                    });

                    Object.values(finalFirstHalfSelections).forEach(selItem => {
                        // Include selections with -1 quantity for removal
                        customizationsSelections.push({
                            variant_id: 'half_1_customization',
                            variant_name: '1st Half Customization',
                            option_id: selItem.id,
                            option_name: selItem.heading || 'Topping',
                            heading: selItem.heading || '',
                            item_id: selItem.id,
                            item_name: selItem.name,
                            quantity: selItem.quantity === -1 ? -1 : (selItem.quantity || 1),
                            pos_code: selItem.pos_code || selItem.ref_code || '',
                            ref_code: selItem.ref_code || ''
                        });
                    });
                }
            }

            // Initialize final selections for second half (including any default toppings from crust)
            const finalSecondHalfSelections = { ...secondHalfSelections };

            if (selectedSecondHalf) {
                // Add the half product
                customizationsSelections.push({
                    variant_id: 'half_2',
                    variant_name: '2nd Half',
                    option_id: selectedSecondHalf.id,
                    option_name: selectedSecondHalf.category?.name || 'Pizza',
                    item_id: selectedSecondHalf.id,
                    item_name: selectedSecondHalf.name,
                    price: secondPrice,
                    quantity: 0.5,
                    pos_code: selectedSecondHalf.pos_code || selectedSecondHalf.ref_code || '',
                    ref_code: selectedSecondHalf.ref_code || ''
                });

                if (selectedSecondHalfCrust) {
                    customizationsSelections.push({
                        variant_id: 'half_2_crust',
                        variant_name: 'Crust',
                        option_id: selectedSecondHalfCrust.id,
                        option_name: 'Crust',
                        item_id: selectedSecondHalfCrust.id,
                        item_name: selectedSecondHalfCrust.name,
                        price: secondPrice,
                        quantity: 0.5,
                        pos_code: selectedSecondHalfCrust.pos_code || selectedSecondHalfCrust.ref_code || '',
                        ref_code: selectedSecondHalfCrust.ref_code || ''
                    });

                    // finalSecondHalfSelections already defined above

                    // Push default toppings for 2nd half
                    selectedSecondHalfCrust.options?.forEach(opt => {
                        const hName = (opt.heading || '').toLowerCase();
                        if (hName.includes('topping') && parseFloat(opt.price || 0) === 0) {
                            const key = `nested_${opt.id}`;
                            if (!finalSecondHalfSelections[key]) {
                                finalSecondHalfSelections[key] = { ...opt, heading: opt.heading, quantity: 1 };
                            }
                        }
                    });

                    Object.values(finalSecondHalfSelections).forEach(selItem => {
                        // Include selections with -1 quantity for removal
                        customizationsSelections.push({
                            variant_id: 'half_2_customization',
                            variant_name: '2nd Half Customization',
                            option_id: selItem.id,
                            option_name: selItem.heading || 'Topping',
                            heading: selItem.heading || '',
                            item_id: selItem.id,
                            item_name: selItem.name,
                            price: parseFloat(selItem.price || 0),
                            pos_code: selItem.pos_code || selItem.ref_code || '',
                            ref_code: selItem.ref_code || '',
                            quantity: selItem.quantity === -1 ? -1 : (selItem.quantity || 1),
                        });
                    });
                }
            }

            // Build detailed payload separating first and second half information
            const mapHalfTopping = (t, prefix) => {
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

            const fToppings = Object.values(finalFirstHalfSelections)
                .map(t => mapHalfTopping(t, 'half_1'))
                .filter(t => t !== null);

            const sToppings = Object.values(finalSecondHalfSelections)
                .map(t => mapHalfTopping(t, 'half_2'))
                .filter(t => t !== null);

            const firstHalfDetail = {
                pizza: {
                    variant_id: 'half_1',
                    variant_name: '1st Half',
                    option_id: selectedFirstHalf.id,
                    option_name: selectedFirstHalf.category?.name || 'Pizza',
                    item_id: selectedFirstHalf.id,
                    item_name: selectedFirstHalf.name,
                    price: firstPrice,
                    quantity: 0.5,
                    pos_code: selectedFirstHalf.pos_code || selectedFirstHalf.ref_code || '',
                    ref_code: selectedFirstHalf.ref_code || ''
                },
                crust: selectedFirstHalfCrust ? {
                    variant_id: 'half_1_crust',
                    variant_name: 'Crust',
                    option_id: selectedFirstHalfCrust.id,
                    option_name: 'Crust',
                    item_id: selectedFirstHalfCrust.id,
                    item_name: selectedFirstHalfCrust.name,
                    price: firstPrice,
                    quantity: 0.5,
                    pos_code: selectedFirstHalfCrust.pos_code || selectedFirstHalfCrust.ref_code || '',
                    ref_code: selectedFirstHalfCrust.ref_code || ''
                } : null,
                toppings: fToppings
            };

            const secondHalfDetail = {
                pizza: {
                    variant_id: 'half_2',
                    variant_name: '2nd Half',
                    option_id: selectedSecondHalf.id,
                    option_name: selectedSecondHalf.category?.name || 'Pizza',
                    item_id: selectedSecondHalf.id,
                    item_name: selectedSecondHalf.name,
                    price: secondPrice,
                    quantity: 0.5,
                    pos_code: selectedSecondHalf.pos_code || selectedSecondHalf.ref_code || '',
                    ref_code: selectedSecondHalf.ref_code || ''
                },
                crust: selectedSecondHalfCrust ? {
                    variant_id: 'half_2_crust',
                    variant_name: 'Crust',
                    option_id: selectedSecondHalfCrust.id,
                    option_name: 'Crust',
                    item_id: selectedSecondHalfCrust.id,
                    item_name: selectedSecondHalfCrust.name,
                    price: secondPrice,
                    quantity: 0.5,
                    pos_code: selectedSecondHalfCrust.pos_code || selectedSecondHalfCrust.ref_code || '',
                    ref_code: selectedSecondHalfCrust.ref_code || ''
                } : null,
                toppings: sToppings
            };

            const baseDetails = {
                basePrice: price,
                price: (firstPrice + secondPrice) / 2,
                size: { item_name: name },
                firstHalf: firstHalfDetail,
                secondHalf: secondHalfDetail
            };
            const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;
            const cartKey = `${id}-${JSON.stringify(baseDetails)}`;
            addToCart(cartKey, unitPrice, name, image, product.pos_code || ref_code, baseDetails, quantity);
            navigation.goBack();
            return;
        }

        // Ensure all price 0 customization options are present in selections
        const finalSelections = { ...selectedSelections };
        variants.forEach(v => {
            const vn = v.name.toLowerCase();
            if (vn.includes('customization') || vn.includes('add on') || vn.includes('addon')) {
                v.options?.forEach(opt => {
                    const optName = (opt.name || '').toLowerCase();
                    if (!optName.includes('topping')) return;
                    opt.items?.forEach(item => {
                        const priceVal = parseFloat(item.price || 0);
                        if (priceVal === 0) {
                            const key = `${v.id}_${opt.id}_${item.id}`;
                            if (!finalSelections[key]) {
                                finalSelections[key] = {
                                    ...item,
                                    variantId: v.id,
                                    optionId: opt.id,
                                    quantity: 1,
                                    isDefault: true
                                };
                            }
                        }
                    });
                });
            }
        });

        // Ensure nested price 0 customization options (toppings) are present in selections
        if (isPizza && selectedCrustItem && selectedCrustItem.options && sizeVariant && selectedSizeOption) {
            selectedCrustItem.options.forEach(opt => {
                const heading = opt.heading || 'Customization';
                if (isHeadingMultiSelect(heading) && isDefaultNestedTopping(heading, opt)) {
                    const baseKey = `nested_${sizeVariant.id}_${selectedSizeOption.id}_${selectedCrustItem.id}_${heading}`;
                    const key = `${baseKey}_${opt.id}`;
                    if (!finalSelections[key]) {
                        finalSelections[key] = {
                            ...opt,
                            variantId: sizeVariant.id,
                            optionId: selectedSizeOption.id,
                            crustItemId: selectedCrustItem.id,
                            heading: heading,
                            isNested: true,
                            quantity: 1,
                            isDefault: true
                        };
                    }
                }
            });
        }

        // Parse and structure size vs customizations/addons
        let sizeSelection = null;
        const customizationsSelections = [];

        Object.values(finalSelections).forEach(selItem => {
            if (selItem.isNested) {
                const nestedPrice = parseFloat(selItem.price || 0);
                const nestedQty = selItem.quantity !== undefined ? selItem.quantity : 1;
                const isTopping = (selItem.heading || '').toLowerCase().includes('topping');
                const isDefault = isTopping && (nestedPrice === 0 || selItem.isDefault);

                if (isDefault) {
                    if (nestedQty === 1) {
                        return; // do not include default topping with normal qty
                    }
                    if (nestedQty <= 0) {
                        customizationsSelections.push({
                            variant_id: selItem.variantId,
                            variant_name: "Customization",
                            option_id: selItem.id,
                            option_name: selItem.heading,
                            item_id: selItem.id,
                            item_name: selItem.name,
                            price: 0,
                            quantity: -1,
                            pos_code: selItem.pos_code || selItem.ref_code || '',
                            ref_code: selItem.ref_code || ''
                        });
                        return;
                    }
                    // nestedQty > 1
                    customizationsSelections.push({
                        variant_id: selItem.variantId,
                        variant_name: "Customization",
                        option_id: selItem.id,
                        option_name: selItem.heading,
                        item_id: selItem.id,
                        item_name: selItem.name,
                        price: 170 * (nestedQty - 1),
                        quantity: nestedQty,
                        pos_code: selItem.pos_code || selItem.ref_code || '',
                        ref_code: selItem.ref_code || ''
                    });
                    return;
                } else if (isTopping) {
                    if (nestedQty <= 0) {
                        return; // do not include unselected paid toppings
                    }
                    // nestedQty > 0
                    customizationsSelections.push({
                        variant_id: selItem.variantId,
                        variant_name: "Customization",
                        option_id: selItem.id,
                        option_name: selItem.heading,
                        item_id: selItem.id,
                        item_name: selItem.name,
                        price: nestedPrice * nestedQty,
                        quantity: nestedQty,
                        pos_code: selItem.pos_code || selItem.ref_code || '',
                        ref_code: selItem.ref_code || ''
                    });
                    return;
                } else {
                    // Not a topping (e.g. sauce, crust, etc.) - keep original logic
                    customizationsSelections.push({
                        variant_id: selItem.variantId,
                        variant_name: "Customization",
                        option_id: selItem.id,
                        option_name: selItem.heading,
                        item_id: selItem.id,
                        item_name: selItem.name,
                        price: nestedPrice * nestedQty,
                        quantity: nestedQty,
                        pos_code: selItem.pos_code || selItem.ref_code || '',
                        ref_code: selItem.ref_code || ''
                    });
                    return;
                }
            }

            const variant = variants.find(v => v.id === selItem.variantId);
            const option = variant?.options?.find(o => o.id === selItem.optionId);

            if (variant && option) {
                const isSize = variant.name.toLowerCase().includes('size');
                const optName = (option.name || '').toLowerCase();
                const itemPrice = parseFloat(selItem.price || 0);
                const itemQty = selItem.quantity !== undefined ? selItem.quantity : 1;

                const isTopping = optName.includes('topping');
                const isDefault = isTopping && (itemPrice === 0 || selItem.isDefault);

                if (isDefault) {
                    if (itemQty === 1) {
                        return;
                    }
                    if (itemQty <= 0) {
                        customizationsSelections.push({
                            variant_id: variant.id,
                            variant_name: variant.name,
                            option_id: option.id,
                            option_name: option.name,
                            item_id: selItem.id,
                            item_name: selItem.name || selItem.title || selItem.product_name,
                            price: 0,
                            quantity: -1,
                            pos_code: selItem.pos_code || selItem.ref_code || option.pos_code || option.ref_code || variant.pos_code || variant.ref_code || '',
                            ref_code: selItem.ref_code || option.ref_code || variant.ref_code || ''
                        });
                        return;
                    }
                    // itemQty > 1
                    customizationsSelections.push({
                        variant_id: variant.id,
                        variant_name: variant.name,
                        option_id: option.id,
                        option_name: option.name,
                        item_id: selItem.id,
                        item_name: selItem.name || selItem.title || selItem.product_name,
                        price: 170 * (itemQty - 1),
                        quantity: itemQty,
                        pos_code: selItem.pos_code || selItem.ref_code || option.pos_code || option.ref_code || variant.pos_code || variant.ref_code || '',
                        ref_code: selItem.ref_code || option.ref_code || variant.ref_code || ''
                    });
                    return;
                } else if (isTopping) {
                    if (itemQty <= 0) {
                        return;
                    }
                    customizationsSelections.push({
                        variant_id: variant.id,
                        variant_name: variant.name,
                        option_id: option.id,
                        option_name: option.name,
                        item_id: selItem.id,
                        item_name: selItem.name || selItem.title || selItem.product_name,
                        price: itemPrice * itemQty,
                        quantity: itemQty,
                        pos_code: selItem.pos_code || selItem.ref_code || option.pos_code || option.ref_code || variant.pos_code || variant.ref_code || '',
                        ref_code: selItem.ref_code || option.ref_code || variant.ref_code || ''
                    });
                    return;
                } else {
                    const cleanItem = {
                        variant_id: variant.id,
                        variant_name: variant.name,
                        option_id: option.id,
                        option_name: option.name,
                        item_id: selItem.id,
                        item_name: selItem.name || selItem.title || selItem.product_name,
                        price: isSize ? itemPrice : (itemPrice * itemQty),
                        quantity: itemQty,
                        pos_code: selItem.pos_code || selItem.ref_code || option.pos_code || option.ref_code || variant.pos_code || variant.ref_code || '',
                        ref_code: selItem.ref_code || option.ref_code || variant.ref_code || ''
                    };

                    if (isSize) {
                        sizeSelection = cleanItem;
                    } else {
                        customizationsSelections.push(cleanItem);
                    }
                }
            }
        });

        const details = {
            basePrice: price,
            size: sizeSelection,
            customizations: customizationsSelections
        };
        const cartKey = `${id}-${JSON.stringify(details)}`;
        const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;
        addToCart(cartKey, unitPrice, name, image, product.pos_code || ref_code, details, quantity);
        navigation.goBack();
    };

    const isItemSelected = (variantId, optionId, itemId, isMultiSelect, isNested = false, heading = '', crustItemId = '', toppingObj = null) => {
        if (isNested) {
            const baseKey = `nested_${variantId}_${optionId}_${crustItemId}_${heading}`;
            const key = isMultiSelect ? `${baseKey}_${itemId}` : baseKey;
            const selection = selectedSelections[key];
            if (selection) {
                return selection.quantity > 0;
            }
            if (isMultiSelect && toppingObj && isDefaultNestedTopping(heading, toppingObj)) {
                return true;
            }
            return false;
        }

        const key = isMultiSelect ? `${variantId}_${optionId}_${itemId}` : `${variantId}_${optionId}`;
        if (isMultiSelect) {
            const selection = selectedSelections[key];
            if (selection) {
                return selection.quantity > 0;
            }
            // If not found in state, check if its price is 0 (it is selected by default)
            const variant = variants.find(v => v.id === variantId);
            const option = variant?.options?.find(o => o.id === optionId);
            const optName = (option?.name || '').toLowerCase();
            const itemObj = option?.items?.find(i => i.id === itemId);
            const priceVal = parseFloat(itemObj?.price || 0);
            if (priceVal === 0 && optName.includes('topping')) return true;
            return false;
        }
        return selectedSelections[key]?.id === itemId;
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}>
                <View style={styles.headerPanel}>
                    {image && (
                        <Image
                            source={{ uri: image }}
                            style={styles.heroImage}
                            defaultSource={require('../../assets/Kruncheese.png')}
                        />
                    )}
                    <View style={styles.infoBox}>
                        <Text style={styles.title}>{name}</Text>
                        {description && <Text style={styles.description}>{description}</Text>}
                        <Text style={styles.priceDisplay}>Rs {totalPrice.toFixed(0)}</Text>
                    </View>
                </View>

                <View style={styles.qtyPanel}>
                    <Text style={styles.sectionLabel}>Quantity</Text>
                    <View style={styles.qtyControl}>
                        <TouchableOpacity
                            onPress={() => setQuantity(q => Math.max(1, q - 1))}
                            style={styles.qtyBtn}
                        >
                            <Minus size={20} color={theme.colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{quantity}</Text>
                        <TouchableOpacity
                            onPress={() => setQuantity(q => q + 1)}
                            style={styles.qtyBtn}
                        >
                            <Plus size={20} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Half & Half Render */}
                {isHalfAndHalf && (
                    <View style={styles.variantContainer}>
                        {/* 1st Half Selection */}
                        <TouchableOpacity
                            style={styles.variantHeader}
                            onPress={() => toggleSection('half_1_pizza')}
                        >
                            <Text style={styles.variantTitle}>
                                1st Half Pizza {selectedFirstHalf ? `(${selectedFirstHalf.name})` : ''}
                            </Text>
                            {expandedSections['half_1_pizza'] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                        </TouchableOpacity>

                        {expandedSections['half_1_pizza'] && (
                            <View style={{ marginBottom: 24 }}>
                                <View style={styles.optionsWrapper}>
                                    {product.halves_options?.map(cat => (
                                        <View key={cat.id} style={{ marginBottom: 16 }}>
                                            <Text style={styles.optionSubTitle}>{cat.name}</Text>
                                            <View style={styles.itemGrid}>
                                                {cat.products?.map(p => {
                                                    const isSelected = selectedFirstHalf?.id === p.id;
                                                    return (
                                                        <TouchableOpacity
                                                            key={p.id}
                                                            style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                                            onPress={() => {
                                                                setSelectedFirstHalf(p);
                                                                setFirstHalfSelections({});

                                                                setExpandedSections(prev => ({
                                                                    ...prev,
                                                                    half_1_pizza: false,
                                                                    half_2_pizza: !selectedSecondHalf ? true : false,
                                                                    half_shared_crust: selectedSecondHalf ? true : false
                                                                }));
                                                            }}
                                                        >
                                                            <View style={styles.itemCardContent}>
                                                                <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{p.name}</Text>
                                                            </View>
                                                            {isSelected && <View style={styles.checkCircle}><Check size={12} color="#fff" /></View>}
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* 2nd Half Selection */}
                        <TouchableOpacity
                            style={styles.variantHeader}
                            onPress={() => toggleSection('half_2_pizza')}
                        >
                            <Text style={styles.variantTitle}>
                                2nd Half Pizza {selectedSecondHalf ? `(${selectedSecondHalf.name})` : ''}
                            </Text>
                            {expandedSections['half_2_pizza'] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                        </TouchableOpacity>

                        {expandedSections['half_2_pizza'] && (
                            <View style={{ marginBottom: 24 }}>
                                <View style={styles.optionsWrapper}>
                                    {product.halves_options?.map(cat => (
                                        <View key={cat.id} style={{ marginBottom: 16 }}>
                                            <Text style={styles.optionSubTitle}>{cat.name}</Text>
                                            <View style={styles.itemGrid}>
                                                {cat.products?.map(p => {
                                                    const isSelected = selectedSecondHalf?.id === p.id;
                                                    return (
                                                        <TouchableOpacity
                                                            key={p.id}
                                                            style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                                            onPress={() => {
                                                                setSelectedSecondHalf(p);
                                                                setSecondHalfSelections({});

                                                                setExpandedSections(prev => ({
                                                                    ...prev,
                                                                    half_2_pizza: false,
                                                                    half_shared_crust: true
                                                                }));
                                                            }}
                                                        >
                                                            <View style={styles.itemCardContent}>
                                                                <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{p.name}</Text>
                                                            </View>
                                                            {isSelected && <View style={styles.checkCircle}><Check size={12} color="#fff" /></View>}
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Shared Crust Selection */}
                        {selectedFirstHalf && (() => {
                            const firstPrice = selectedFirstHalf ? parseFloat(selectedFirstHalf.price || 0) : 0;
                            const secondPrice = selectedSecondHalf ? parseFloat(selectedSecondHalf.price || 0) : 0;
                            const higherHalf = (secondPrice > firstPrice) ? selectedSecondHalf : selectedFirstHalf;

                            const sizeVar = higherHalf?.variants?.find(v => v.name.toLowerCase().includes('size'));
                            const sizeOpt = sizeVar?.options?.find(o => product.halves_variant_option_ids?.includes(o.id.toString())) || sizeVar?.options?.[0];
                            const crustNameToShow = sharedCrustName || (secondPrice > firstPrice ? selectedSecondHalfCrust?.name : selectedFirstHalfCrust?.name);

                            return sizeOpt?.items && sizeOpt.items.length > 0 && (
                                <View style={{ marginBottom: 24, marginTop: -10 }}>
                                    <TouchableOpacity
                                        style={[styles.variantHeader, { marginTop: 0 }]}
                                        onPress={() => toggleSection('half_shared_crust')}
                                    >
                                        <Text style={styles.variantTitle}>
                                            Pizza Crust {crustNameToShow ? `(${crustNameToShow})` : ''}
                                        </Text>
                                        {expandedSections['half_shared_crust'] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                                    </TouchableOpacity>

                                    {expandedSections['half_shared_crust'] && (
                                        <View style={styles.optionGroup}>
                                            <View style={styles.itemGrid}>
                                                {sizeOpt.items.map(crust => {
                                                    const isSelected = crustNameToShow === crust.name;
                                                    return (
                                                        <TouchableOpacity
                                                            key={crust.id}
                                                            style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                                            onPress={() => {
                                                                setSharedCrustName(crust.name);
                                                                // reset selections if crust changes since toppings options might be different
                                                                setFirstHalfSelections({});
                                                                setSecondHalfSelections({});

                                                                setExpandedSections(prev => ({
                                                                    ...prev,
                                                                    half_shared_crust: false,
                                                                    half_1_toppings: true
                                                                }));
                                                            }}
                                                        >
                                                            <View style={styles.itemCardContent}>
                                                                <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{crust.name}</Text>
                                                                {getEffectiveCrustPrice(crust.name) > 0 && <Text style={[styles.itemPrice, isSelected && styles.itemLabelSelected]}>+Rs {getEffectiveCrustPrice(crust.name).toFixed(0)}</Text>}
                                                            </View>
                                                            {isSelected && <View style={styles.checkCircle}><Check size={12} color="#fff" /></View>}
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })()}

                        {/* 1st Half Toppings */}
                        {selectedFirstHalfCrust?.options && (() => {
                            const grouped = {};
                            selectedFirstHalfCrust.options.forEach(opt => {
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
                                        onPress={() => toggleSection('half_1_toppings')}
                                    >
                                        <Text style={styles.variantTitle}>1st Half Toppings</Text>
                                        {expandedSections['half_1_toppings'] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                                    </TouchableOpacity>

                                    {expandedSections['half_1_toppings'] && toppingHeadings.map(heading => {
                                        const isMulti = isHeadingMultiSelect(heading);
                                        return (
                                            <View key={heading} style={styles.optionGroup}>
                                                <Text style={styles.optionSubTitle}>{heading}</Text>
                                                <View style={styles.itemGrid}>
                                                    {grouped[heading].map(item => {
                                                        const key = `nested_${item.id}`;
                                                        const isTopping = true;
                                                        const isDefault = isTopping && parseFloat(item.price || 0) === 0;
                                                        const isSelected = firstHalfSelections[key]?.quantity > 0 || (!firstHalfSelections[key] && isDefault);

                                                        return (
                                                            <TouchableOpacity
                                                                key={item.id}
                                                                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                                                onPress={() => {
                                                                    setFirstHalfSelections(prev => {
                                                                        const next = { ...prev };
                                                                        if (isMulti) {
                                                                            if (isSelected) {
                                                                                const currentQty = firstHalfSelections[key]?.quantity || (isDefault ? 1 : 0);
                                                                                if (isDefault) next[key] = { ...item, heading, quantity: Math.max(-1, currentQty - 1) };
                                                                                else if (currentQty <= 1) delete next[key];
                                                                                else next[key] = { ...item, heading, quantity: currentQty - 1 };
                                                                            } else {
                                                                                next[key] = { ...item, heading, quantity: 1 };
                                                                            }
                                                                        } else {
                                                                            if (!isSelected) {
                                                                                Object.keys(next).forEach(k => {
                                                                                    if (grouped[heading].some(gItem => `nested_${gItem.id}` === k)) {
                                                                                        delete next[k];
                                                                                    }
                                                                                });
                                                                                next[key] = { ...item, heading, quantity: 1 };
                                                                            }
                                                                        }
                                                                        return next;
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
                                                                        const qty = firstHalfSelections[key]?.quantity || 1;
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
                                                                                            setFirstHalfSelections(prev => {
                                                                                                const next = { ...prev };
                                                                                                const currentQty = next[key]?.quantity || 1;
                                                                                                if (currentQty <= 1) delete next[key];
                                                                                                else next[key] = { ...item, heading, quantity: currentQty - 1 };
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
                                                                                            setFirstHalfSelections(prev => {
                                                                                                const next = { ...prev };
                                                                                                const currentQty = next[key]?.quantity || 1;
                                                                                                next[key] = { ...item, heading, quantity: currentQty + 1 };
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
                        {selectedSecondHalfCrust?.options && (() => {
                            const grouped = {};
                            selectedSecondHalfCrust.options.forEach(opt => {
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
                                        onPress={() => toggleSection('half_2_toppings')}
                                    >
                                        <Text style={styles.variantTitle}>2nd Half Toppings</Text>
                                        {expandedSections['half_2_toppings'] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                                    </TouchableOpacity>

                                    {expandedSections['half_2_toppings'] && toppingHeadings.map(heading => {
                                        const isMulti = isHeadingMultiSelect(heading);
                                        return (
                                            <View key={heading} style={styles.optionGroup}>
                                                <Text style={styles.optionSubTitle}>{heading}</Text>
                                                <View style={styles.itemGrid}>
                                                    {grouped[heading].map(item => {
                                                        const key = `nested_${item.id}`;
                                                        const isTopping = true;
                                                        const isDefault = isTopping && parseFloat(item.price || 0) === 0;
                                                        const isSelected = secondHalfSelections[key]?.quantity > 0 || (!secondHalfSelections[key] && isDefault);

                                                        return (
                                                            <TouchableOpacity
                                                                key={item.id}
                                                                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                                                onPress={() => {
                                                                    setSecondHalfSelections(prev => {
                                                                        const next = { ...prev };
                                                                        if (isMulti) {
                                                                            if (isSelected) {
                                                                                const currentQty = secondHalfSelections[key]?.quantity || (isDefault ? 1 : 0);
                                                                                if (isDefault) next[key] = { ...item, heading, quantity: Math.max(-1, currentQty - 1) };
                                                                                else if (currentQty <= 1) delete next[key];
                                                                                else next[key] = { ...item, heading, quantity: currentQty - 1 };
                                                                            } else {
                                                                                next[key] = { ...item, heading, quantity: 1 };
                                                                            }
                                                                        } else {
                                                                            if (!isSelected) {
                                                                                Object.keys(next).forEach(k => {
                                                                                    if (grouped[heading].some(gItem => `nested_${gItem.id}` === k)) {
                                                                                        delete next[k];
                                                                                    }
                                                                                });
                                                                                next[key] = { ...item, heading, quantity: 1 };
                                                                            }
                                                                        }
                                                                        return next;
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
                                                                        const qty = secondHalfSelections[key]?.quantity || 1;
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
                                                                                            setSecondHalfSelections(prev => {
                                                                                                const next = { ...prev };
                                                                                                const currentQty = next[key]?.quantity || 1;
                                                                                                if (currentQty <= 1) delete next[key];
                                                                                                else next[key] = { ...item, heading, quantity: currentQty - 1 };
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
                                                                                            setSecondHalfSelections(prev => {
                                                                                                const next = { ...prev };
                                                                                                const currentQty = next[key]?.quantity || 1;
                                                                                                next[key] = { ...item, heading, quantity: currentQty + 1 };
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
                )}

                {/* Variants -> Options -> Items */}
                {!isHalfAndHalf && displayVariants.map((variant) => {
                    const vName = variant.name.toLowerCase();

                    // Pizza: hide customization if no size picked
                    if (isPizza && vName.includes('customization') && !anySizePicked) return null;

                    // Requirement indicators
                    let isRequired = false;
                    if (vName.includes('size')) isRequired = true;
                    if (isBurger && vName.includes('meal') && (hasDrink || hasFry)) isRequired = true;

                    return (
                        <View key={variant.id} style={styles.variantContainer}>
                            <TouchableOpacity
                                style={styles.variantHeader}
                                onPress={() => toggleSection(variant.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.headerTitleRow}>
                                    <Text style={styles.variantTitle}>{variant.name}</Text>
                                    {isRequired && (
                                        <View style={[
                                            styles.requirementBadge,
                                            isBurger && !variant.options?.some(o => selectedSelections[`${variant.id}_${o.id}`])
                                                ? styles.requirementBadgeAlert : styles.requirementBadgeInfo
                                        ]}>
                                            <Text style={styles.requirementText}>
                                                {isBurger ? 'Meal Option' : 'Required'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {expandedSections[variant.id] ? (
                                    <ChevronUp size={20} color={theme.colors.text} />
                                ) : (
                                    <ChevronDown size={20} color={theme.colors.text} />
                                )}
                            </TouchableOpacity>

                            {(expandedSections[variant.id]) && (
                                <View style={styles.optionsWrapper}>
                                    {(variant.options || variant.variant_options || variant.variantoption || []).map((option) => {
                                        const oName = (option.name || '').toLowerCase();
                                        const isMultiSelect = vName.includes('customization') || vName.includes('add on') || vName.includes('addon');
                                        const isRadio = vName.includes('size');

                                        // Burger meal requirements on option level
                                        const isDrinkOption = oName.includes('drink');
                                        const isFryOption = oName.includes('frie');
                                        const isOptionMissing = isBurger && vName.includes('meal') && (
                                            (isDrinkOption && !hasDrink && hasFry) ||
                                            (isFryOption && !hasFry && hasDrink)
                                        );

                                        return (
                                            <View key={option.id} style={styles.optionGroup}>
                                                <View style={styles.optionHeader}>
                                                    <Text style={styles.optionSubTitle}>{option.name}</Text>
                                                    {isOptionMissing && (
                                                        <Text style={styles.missingHint}>Please select</Text>
                                                    )}
                                                </View>
                                                <View style={styles.itemGrid}>
                                                    {(option.items || option.option_items || option.optionitems || []).map((item) => {
                                                        const selected = isItemSelected(variant.id, option.id, item.id, isMultiSelect);
                                                        return (
                                                            <TouchableOpacity
                                                                key={item.id}
                                                                style={[
                                                                    styles.itemCard,
                                                                    selected && styles.itemCardSelected
                                                                ]}
                                                                onPress={() => {
                                                                    if (isMultiSelect && vName.includes('topping')) {
                                                                        // For toppings, tapping the card toggles it (or removes default)
                                                                        if (selected) {
                                                                            handleToppingQuantityChange(variant.id, option.id, item, -1, isMultiSelect);
                                                                        } else {
                                                                            handleToppingQuantityChange(variant.id, option.id, item, 1, isMultiSelect);
                                                                        }
                                                                    } else {
                                                                        handleSelectOptionItem(variant.id, option.id, item, isRadio, isMultiSelect);
                                                                    }
                                                                }}
                                                            >
                                                                <View style={styles.itemCardContent}>
                                                                    <Text style={[
                                                                        styles.itemLabel,
                                                                        selected && styles.itemLabelSelected
                                                                    ]}>
                                                                        {item.name || item.product_name || item.title || 'Option'}
                                                                    </Text>

                                                                    {/* Base Price display if not selected or if not a topping */}
                                                                    {(!selected || !isMultiSelect || !vName.includes('topping')) && Number(item.price) > 0 && (
                                                                        <Text style={[
                                                                            styles.itemPrice,
                                                                            selected && styles.itemLabelSelected
                                                                        ]}>
                                                                            +Rs {Number(item.price).toFixed(0)}
                                                                        </Text>
                                                                    )}

                                                                    {/* Quantity & Dynamic Price for selected Toppings */}
                                                                    {selected && isMultiSelect && vName.includes('topping') && (() => {
                                                                        const optName = (option.name || '').toLowerCase();
                                                                        const priceVal = parseFloat(item.price || 0);
                                                                        const isDefault = priceVal === 0 && optName.includes('topping');
                                                                        const key = `${variant.id}_${option.id}_${item.id}`;
                                                                        const selectedItemData = selectedSelections[key];
                                                                        const qty = selectedItemData ? selectedItemData.quantity : (isDefault ? 1 : 1);

                                                                        let extraCharge = 0;
                                                                        if (isDefault && qty > 1) {
                                                                            extraCharge = 170 * (qty - 1);
                                                                        } else if (!isDefault && qty > 0) {
                                                                            extraCharge = priceVal * qty;
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
                                                                                        onPress={() => handleToppingQuantityChange(variant.id, option.id, item, -1, isMultiSelect)}
                                                                                    >
                                                                                        <Minus size={14} color={theme.colors.primary} />
                                                                                    </TouchableOpacity>
                                                                                    <Text style={styles.toppingQtyText}>{qty}</Text>
                                                                                    <TouchableOpacity
                                                                                        style={styles.toppingQtyBtn}
                                                                                        onPress={() => handleToppingQuantityChange(variant.id, option.id, item, 1, isMultiSelect)}
                                                                                    >
                                                                                        <Plus size={14} color={theme.colors.primary} />
                                                                                    </TouchableOpacity>
                                                                                </View>
                                                                            </View>
                                                                        );
                                                                    })()}
                                                                </View>
                                                                {selected && (!isMultiSelect || !vName.includes('topping')) && (
                                                                    <View style={styles.checkCircle}>
                                                                        <Check size={12} color="#fff" />
                                                                    </View>
                                                                )}
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* Pizza Nested Customizations (Toppings, Portions, etc.) */}
                {!isHalfAndHalf && isPizza && selectedCrustItem && Object.keys(nestedGroupedOptions).map((heading) => {
                    const headingToppings = nestedGroupedOptions[heading];
                    const isMultiSelect = isHeadingMultiSelect(heading);

                    return (
                        <View key={heading} style={styles.variantContainer}>
                            <TouchableOpacity
                                style={styles.variantHeader}
                                onPress={() => toggleSection(heading)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.variantTitle}>{heading}</Text>
                                {expandedSections[heading] ? (
                                    <ChevronUp size={20} color={theme.colors.text} />
                                ) : (
                                    <ChevronDown size={20} color={theme.colors.text} />
                                )}
                            </TouchableOpacity>

                            {expandedSections[heading] && (
                                <View style={styles.optionsWrapper}>
                                    <View style={styles.itemGrid}>
                                        {headingToppings.map((topping) => {
                                            const selected = isItemSelected(
                                                sizeVariant.id,
                                                selectedSizeOption.id,
                                                topping.id,
                                                isMultiSelect,
                                                true,
                                                heading,
                                                selectedCrustItem.id,
                                                topping
                                            );
                                            return (
                                                <TouchableOpacity
                                                    key={topping.id}
                                                    style={[
                                                        styles.itemCard,
                                                        selected && styles.itemCardSelected
                                                    ]}
                                                    onPress={() => {
                                                        if (isMultiSelect) {
                                                            if (selected) {
                                                                handleNestedToppingQuantityChange(heading, topping, -1);
                                                            } else {
                                                                handleNestedToppingQuantityChange(heading, topping, 1);
                                                            }
                                                        } else {
                                                            handleSelectNestedTopping(heading, topping);
                                                        }
                                                    }}
                                                >
                                                    <View style={styles.itemCardContent}>
                                                        <Text style={[
                                                            styles.itemLabel,
                                                            selected && styles.itemLabelSelected
                                                        ]}>
                                                            {topping.name}
                                                        </Text>

                                                        {(!selected || !isMultiSelect) && Number(topping.price) > 0 && (
                                                            <Text style={[
                                                                styles.itemPrice,
                                                                selected && styles.itemLabelSelected
                                                            ]}>
                                                                +Rs {Number(topping.price).toFixed(0)}
                                                            </Text>
                                                        )}

                                                        {selected && isMultiSelect && (() => {
                                                            const isDefault = isDefaultNestedTopping(heading, topping);
                                                            const baseKey = `nested_${sizeVariant.id}_${selectedSizeOption.id}_${selectedCrustItem.id}_${heading}`;
                                                            const key = `${baseKey}_${topping.id}`;
                                                            const selectedItemData = selectedSelections[key];
                                                            const qty = selectedItemData ? selectedItemData.quantity : (isDefault ? 1 : 1);

                                                            let extraCharge = 0;
                                                            if (isDefault && qty > 1) {
                                                                extraCharge = 170 * (qty - 1);
                                                            } else if (!isDefault && qty > 0) {
                                                                extraCharge = parseFloat(topping.price || 0) * qty;
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
                                                                            onPress={() => handleNestedToppingQuantityChange(heading, topping, -1)}
                                                                        >
                                                                            <Minus size={14} color={theme.colors.primary} />
                                                                        </TouchableOpacity>
                                                                        <Text style={styles.toppingQtyText}>{qty}</Text>
                                                                        <TouchableOpacity
                                                                            style={styles.toppingQtyBtn}
                                                                            onPress={() => handleNestedToppingQuantityChange(heading, topping, 1)}
                                                                        >
                                                                            <Plus size={14} color={theme.colors.primary} />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            );
                                                        })()}
                                                    </View>
                                                    {selected && !isMultiSelect && (
                                                        <View style={styles.checkCircle}>
                                                            <Check size={12} color="#fff" />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.colors.card, paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity
                    style={[styles.confirmBtn, isProductIncomplete() && styles.confirmBtnIncomplete]}
                    onPress={handleAddToCart}
                    disabled={isProductIncomplete()}
                >
                    <Text style={styles.confirmBtnText}>
                        {isProductIncomplete() ? 'Complete selection' : `Add to Order • Rs ${totalPrice.toFixed(0)}`}
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
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    heroImage: {
        width: '100%',
        height: 250,
        backgroundColor: '#f0f0f0',
    },
    infoBox: {
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 8,
        fontFamily: theme.fonts?.bold,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 15,
        color: theme.colors.text,
        opacity: 0.7,
        lineHeight: 22,
        marginBottom: 16,
        fontFamily: theme.fonts?.regular,
    },
    priceDisplay: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.primary,
        fontFamily: theme.fonts?.bold,
    },
    qtyPanel: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        marginTop: 8,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text,
        fontFamily: theme.fonts?.bold,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    qtyBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    qtyText: {
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        fontFamily: theme.fonts?.bold,
    },
    variantContainer: {
        marginTop: 8,
        paddingHorizontal: 20,
    },
    variantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    variantTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    optionsWrapper: {
        paddingVertical: 12,
    },
    optionGroup: {
        marginBottom: 20,
    },
    optionSubTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
        opacity: 0.5,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    itemGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    itemCard: {
        width: '30%',
        margin: 4,
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        position: 'relative',
    },
    itemCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10', // Light primary tint
    },
    itemCardContent: {
        justifyContent: 'center',
    },
    itemLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
        fontFamily: theme.fonts?.medium,
    },
    itemLabelSelected: {
        color: theme.colors.primary,
        fontFamily: theme.fonts?.bold,
    },
    itemPrice: {
        fontSize: 13,
        color: theme.colors.text,
        opacity: 0.5,
        marginTop: 2,
    },
    checkCircle: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border || (theme.dark ? '#333' : '#EEE'),
    },
    confirmBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        fontFamily: theme.fonts?.bold,
        letterSpacing: 0.5,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    requirementBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    requirementBadgeInfo: {
        backgroundColor: '#E3F2FD',
    },
    requirementBadgeAlert: {
        backgroundColor: '#FFEBEE',
    },
    requirementText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.primary,
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    optionSubTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    missingHint: {
        fontSize: 10,
        color: '#FF5252',
        fontWeight: '600',
        fontStyle: 'italic',
    },
    confirmBtnIncomplete: {
        backgroundColor: theme.colors.border,
        opacity: 0.7,
    },
    toppingQtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        padding: 2,
        alignSelf: 'flex-start',
    },
    toppingQtyBtn: {
        padding: 6,
        backgroundColor: theme.colors.card,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    toppingQtyText: {
        marginHorizontal: 12,
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    }
});

export default ItemOptions;
