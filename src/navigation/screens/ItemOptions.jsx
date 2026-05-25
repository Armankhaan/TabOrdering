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
    const categoryName = (product.categoryName || '').toLowerCase();
    const isPizza = categoryName.includes('pizza');
    const isBurger = categoryName.includes('burger');

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

    // Auto-selection for mandatory items with only 1 choice
    useEffect(() => {
        if (variants.length > 0) {
            const autoPick = {};
            variants.forEach(v => {
                const vn = v.name.toLowerCase();
                if (vn.includes('customization') || vn.includes('add on') || vn.includes('addon')) return;
                if (v.options?.length === 1 && v.options[0].items?.length === 1) {
                    const opt = v.options[0];
                    const item = opt.items[0];
                    autoPick[`${v.id}_${opt.id}`] = { ...item, variantId: v.id, optionId: opt.id };
                }
            });
            if (Object.keys(autoPick).length > 0) {
                setSelectedSelections(autoPick);
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

    // Pizza size status
    const anySizePicked = isPizza && Object.values(selectedSelections).some(s => {
        const sv = variants.find(vr => vr.id === s.variantId);
        return sv?.name.toLowerCase().includes('size');
    });

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
            if (isMultiSelect ? next[key] : next[key]?.id === item.id) {
                delete next[key];
            } else {
                if (isRadio) {
                    Object.keys(next).forEach(k => {
                        if (k.startsWith(`${variantId}_`)) delete next[k];
                    });
                }
                next[key] = { ...item, variantId, optionId };
                isNewSelection = true;
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

    // Calculate total price accurately
    useEffect(() => {
        let calc = parseFloat(price);
        Object.values(selectedSelections).forEach(item => {
            calc += parseFloat(item.price || 0);
        });
        setTotalPrice(calc * quantity);
    }, [price, selectedSelections, quantity]);

    const handleAddToCart = () => {
        const details = {
            selections: selectedSelections,
            basePrice: price,
        };
        const cartKey = `${id}-${JSON.stringify(selectedSelections)}`;
        addToCart(cartKey, totalPrice, name, image, ref_code, details, quantity);
        navigation.goBack();
    };

    const isItemSelected = (variantId, optionId, itemId, isMultiSelect) => {
        const key = isMultiSelect ? `${variantId}_${optionId}_${itemId}` : `${variantId}_${optionId}`;
        return isMultiSelect ? !!selectedSelections[key] : selectedSelections[key]?.id === itemId;
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
