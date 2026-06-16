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
        variants.forEach(v => {
            const vName = v.name.toLowerCase();
            if (vName.includes('size') || vName.includes('meal')) {
                initialExpanded[v.id] = true;
            }
        });
        setExpandedSections(initialExpanded);
    }, [variants]);

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
        if (isPizza && aName.includes('size')) return -1;
        if (isPizza && bName.includes('size')) return 1;
        return 0;
    });

    // Validation
    const isProductIncomplete = () => {
        let incomplete = false;
        variants.forEach(v => {
            const vName = v.name.toLowerCase();
            if (isPizza && vName.includes('size')) {
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
                    if (existing.quantity === 1) {
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
                    if (existing.quantity === 1) {
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

    // Calculate total price accurately
    useEffect(() => {
        let calc = parseFloat(price);
        Object.values(selectedSelections).forEach(item => {
            if (item.quantity === undefined || item.quantity > 0) {
                calc += parseFloat(item.price || 0);
            }
        });
        setTotalPrice(calc * quantity);
    }, [price, selectedSelections, quantity]);

    const handleAddToCart = () => {
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
                // If it was deselected by user (quantity === -1), ignore it
                if (selItem.quantity === -1) return;

                const cleanItem = {
                    variant_id: selItem.variantId,
                    variant_name: "Customization",
                    option_id: selItem.id,
                    option_name: selItem.heading,
                    item_id: selItem.id,
                    item_name: selItem.name,
                    price: parseFloat(selItem.price || 0),
                    quantity: 1,
                    pos_code: selItem.pos_code || selItem.ref_code || '',
                    ref_code: selItem.ref_code || ''
                };
                customizationsSelections.push(cleanItem);
                return;
            }

            const variant = variants.find(v => v.id === selItem.variantId);
            const option = variant?.options?.find(o => o.id === selItem.optionId);
            
            if (variant && option) {
                const isSize = variant.name.toLowerCase().includes('size');
                const cleanItem = {
                    variant_id: variant.id,
                    variant_name: variant.name,
                    option_id: option.id,
                    option_name: option.name,
                    item_id: selItem.id,
                    item_name: selItem.name || selItem.title || selItem.product_name,
                    price: parseFloat(selItem.price || 0),
                    quantity: selItem.quantity !== undefined ? selItem.quantity : 1,
                    pos_code: selItem.pos_code || selItem.ref_code || option.pos_code || option.ref_code || variant.pos_code || variant.ref_code || '',
                    ref_code: selItem.ref_code || option.ref_code || variant.ref_code || ''
                };

                if (isSize) {
                    sizeSelection = cleanItem;
                } else {
                    customizationsSelections.push(cleanItem);
                }
            }
        });

        const details = {
            basePrice: price,
            size: sizeSelection,
            customizations: customizationsSelections
        };
        const cartKey = `${id}-${JSON.stringify(details)}`;
        addToCart(cartKey, totalPrice, name, image, product.pos_code || ref_code, details, quantity);
        navigation.goBack();
    };

    const isItemSelected = (variantId, optionId, itemId, isMultiSelect, isNested = false, heading = '', crustItemId = '', toppingObj = null) => {
        if (isNested) {
            const baseKey = `nested_${variantId}_${optionId}_${crustItemId}_${heading}`;
            const key = isMultiSelect ? `${baseKey}_${itemId}` : baseKey;
            const selection = selectedSelections[key];
            if (selection) {
                return selection.quantity === 1;
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
                return selection.quantity === 1;
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

                {/* Variants -> Options -> Items */}
                {displayVariants.map((variant) => {
                    const vName = variant.name.toLowerCase();
                    
                    // Pizza: hide customization if no size picked
                    if (isPizza && vName.includes('customization') && !anySizePicked) return null;

                    // Requirement indicators
                    let isRequired = false;
                    if (isPizza && vName.includes('size')) isRequired = true;
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
                                        const isRadio = isPizza && vName.includes('size');
                                        
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
                                                                onPress={() => handleSelectOptionItem(variant.id, option.id, item, isRadio, isMultiSelect)}
                                                            >
                                                                <View style={styles.itemCardContent}>
                                                                    <Text style={[
                                                                        styles.itemLabel,
                                                                        selected && styles.itemLabelSelected
                                                                    ]}>
                                                                        {item.name || item.product_name || item.title || 'Option'}
                                                                    </Text>
                                                                    {Number(item.price) > 0 && (
                                                                        <Text style={[
                                                                            styles.itemPrice,
                                                                            selected && styles.itemLabelSelected
                                                                        ]}>
                                                                            +Rs {Number(item.price).toFixed(0)}
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                                {selected && (
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
                {isPizza && selectedCrustItem && Object.keys(nestedGroupedOptions).map((heading) => {
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
                                                    onPress={() => handleSelectNestedTopping(heading, topping)}
                                                >
                                                    <View style={styles.itemCardContent}>
                                                        <Text style={[
                                                            styles.itemLabel,
                                                            selected && styles.itemLabelSelected
                                                        ]}>
                                                            {topping.name}
                                                        </Text>
                                                        {Number(topping.price) > 0 && (
                                                            <Text style={[
                                                                styles.itemPrice,
                                                                selected && styles.itemLabelSelected
                                                            ]}>
                                                                +Rs {Number(topping.price).toFixed(0)}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    {selected && (
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
        flex: 1,
        minWidth: '45%',
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
    }
});

export default ItemOptions;
