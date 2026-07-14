const fs = require('fs');
const path = require('path');

const filePath = '/Users/papajohns/untitled folder/TabOrdering/src/navigation/screens/DealOptions.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const helperCode = `
  const renderHalfAndHalfUI = (sId, product) => {
     const halfProds = getHalfProductsForSlot(dealSlots.find(s => (s.id || \`slot-\${dealSlots.indexOf(s)}\`) === sId));
     const targetCategoryIds = product.product?.halves_category_ids || [];
     const availableHalves = halfProds.filter(p => p.product?.category_id && targetCategoryIds.includes(p.product.category_id.toString()));
     
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
        const match = crustOptions.find(i => i.name === crustName);
        if (match) return parseFloat(match.price !== undefined && match.price !== null && match.price !== '' ? match.price : match.base_price || 0);
        return 0;
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
                 onPress={() => toggleSection(\`\${sId}_half_1_pizza\`)}
             >
                 <Text style={styles.variantTitle}>
                     1st Half Pizza {selectedFirstHalf ? \`(\${selectedFirstHalf.name || selectedFirstHalf.display_name})\` : ''}
                 </Text>
                 {expandedSections[\`\${sId}_half_1_pizza\`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
             </TouchableOpacity>
             
             {expandedSections[\`\${sId}_half_1_pizza\`] && (
                 <View style={{ marginBottom: 24 }}>
                     <View style={styles.optionsWrapper}>
                         <View style={{ marginBottom: 16 }}>
                             <View style={styles.itemGrid}>
                                 {availableHalves.map(p => {
                                     const isSelected = selectedFirstHalf?.id === p.id;
                                     return (
                                         <TouchableOpacity
                                             key={p.id}
                                             style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                             onPress={() => {
                                                 setSelectedFirstHalfInSlot(prev => ({...prev, [sId]: p}));
                                                 setFirstHalfSelectionsInSlot(prev => ({...prev, [sId]: {}}));
                                                 
                                                 setExpandedSections(prev => ({
                                                     ...prev,
                                                     [\`\${sId}_half_1_pizza\`]: false,
                                                     [\`\${sId}_half_2_pizza\`]: !selectedSecondHalf ? true : false,
                                                     [\`\${sId}_half_shared_crust\`]: selectedSecondHalf ? true : false
                                                 }));
                                             }}
                                         >
                                             <View style={styles.itemCardContent}>
                                                 <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{p.name || p.display_name}</Text>
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
                 onPress={() => toggleSection(\`\${sId}_half_2_pizza\`)}
             >
                 <Text style={styles.variantTitle}>
                     2nd Half Pizza {selectedSecondHalf ? \`(\${selectedSecondHalf.name || selectedSecondHalf.display_name})\` : ''}
                 </Text>
                 {expandedSections[\`\${sId}_half_2_pizza\`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
             </TouchableOpacity>
             
             {expandedSections[\`\${sId}_half_2_pizza\`] && (
                 <View style={{ marginBottom: 24 }}>
                     <View style={styles.optionsWrapper}>
                         <View style={{ marginBottom: 16 }}>
                             <View style={styles.itemGrid}>
                                 {availableHalves.map(p => {
                                     const isSelected = selectedSecondHalf?.id === p.id;
                                     return (
                                         <TouchableOpacity
                                             key={p.id}
                                             style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                             onPress={() => {
                                                 setSelectedSecondHalfInSlot(prev => ({...prev, [sId]: p}));
                                                 setSecondHalfSelectionsInSlot(prev => ({...prev, [sId]: {}}));

                                                 setExpandedSections(prev => ({
                                                     ...prev,
                                                     [\`\${sId}_half_2_pizza\`]: false,
                                                     [\`\${sId}_half_shared_crust\`]: true
                                                 }));
                                             }}
                                         >
                                             <View style={styles.itemCardContent}>
                                                 <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{p.name || p.display_name}</Text>
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
                         onPress={() => toggleSection(\`\${sId}_half_shared_crust\`)}
                     >
                         <Text style={styles.variantTitle}>
                             Pizza Crust {crustNameToShow ? \`(\${crustNameToShow})\` : ''}
                         </Text>
                         {expandedSections[\`\${sId}_half_shared_crust\`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                     </TouchableOpacity>
                     
                     {expandedSections[\`\${sId}_half_shared_crust\`] && (
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
                                                     [\`\${sId}_half_shared_crust\`]: false,
                                                     [\`\${sId}_half_1_toppings\`]: true
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
                             onPress={() => toggleSection(\`\${sId}_half_1_toppings\`)}
                         >
                             <Text style={styles.variantTitle}>1st Half Toppings</Text>
                             {expandedSections[\`\${sId}_half_1_toppings\`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                         </TouchableOpacity>

                         {expandedSections[\`\${sId}_half_1_toppings\`] && toppingHeadings.map(heading => {
                             const isMulti = isHeadingMultiSelect(heading);
                             return (
                                 <View key={heading} style={styles.optionGroup}>
                                     <Text style={styles.optionSubTitle}>{heading}</Text>
                                     <View style={styles.itemGrid}>
                                         {grouped[heading].map(item => {
                                             const key = \`nested_\${item.id}\`;
                                             const isTopping = true;
                                             const isDefault = isTopping && parseFloat(item.price||0) === 0;
                                             const isSelected = firstHalfSelections[key]?.quantity === 1 || (!firstHalfSelections[key] && isDefault);

                                             return (
                                                 <TouchableOpacity
                                                     key={item.id}
                                                     style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                                     onPress={() => {
                                                         setFirstHalfSelectionsInSlot(prev => {
                                                             const slotToppings = prev[sId] ? {...prev[sId]} : {};
                                                             if (isMulti) {
                                                                 if (isSelected) {
                                                                     if (isDefault) slotToppings[key] = { ...item, heading, quantity: -1 };
                                                                     else delete slotToppings[key];
                                                                 } else {
                                                                     slotToppings[key] = { ...item, heading, quantity: 1 };
                                                                 }
                                                             } else {
                                                                 Object.keys(slotToppings).forEach(k => {
                                                                     if (grouped[heading].some(gItem => \`nested_\${gItem.id}\` === k)) {
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
                                                         {Number(item.price) > 0 && <Text style={[styles.itemPrice, isSelected && styles.itemLabelSelected]}>+Rs {(Number(item.price) * 0.5).toFixed(0)}</Text>}
                                                     </View>
                                                     {isSelected && <View style={styles.checkCircle}><Check size={12} color="#fff" /></View>}
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
                             onPress={() => toggleSection(\`\${sId}_half_2_toppings\`)}
                         >
                             <Text style={styles.variantTitle}>2nd Half Toppings</Text>
                             {expandedSections[\`\${sId}_half_2_toppings\`] ? <ChevronUp color={theme.colors.text} size={20} /> : <ChevronDown color={theme.colors.text} size={20} />}
                         </TouchableOpacity>

                         {expandedSections[\`\${sId}_half_2_toppings\`] && toppingHeadings.map(heading => {
                             const isMulti = isHeadingMultiSelect(heading);
                             return (
                                 <View key={heading} style={styles.optionGroup}>
                                     <Text style={styles.optionSubTitle}>{heading}</Text>
                                     <View style={styles.itemGrid}>
                                         {grouped[heading].map(item => {
                                             const key = \`nested_\${item.id}\`;
                                             const isTopping = true;
                                             const isDefault = isTopping && parseFloat(item.price||0) === 0;
                                             const isSelected = secondHalfSelections[key]?.quantity === 1 || (!secondHalfSelections[key] && isDefault);

                                             return (
                                                 <TouchableOpacity
                                                     key={item.id}
                                                     style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                                                     onPress={() => {
                                                         setSecondHalfSelectionsInSlot(prev => {
                                                             const slotToppings = prev[sId] ? {...prev[sId]} : {};
                                                             if (isMulti) {
                                                                 if (isSelected) {
                                                                     if (isDefault) slotToppings[key] = { ...item, heading, quantity: -1 };
                                                                     else delete slotToppings[key];
                                                                 } else {
                                                                     slotToppings[key] = { ...item, heading, quantity: 1 };
                                                                 }
                                                             } else {
                                                                 Object.keys(slotToppings).forEach(k => {
                                                                     if (grouped[heading].some(gItem => \`nested_\${gItem.id}\` === k)) {
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
                                                         {Number(item.price) > 0 && <Text style={[styles.itemPrice, isSelected && styles.itemLabelSelected]}>+Rs {(Number(item.price) * 0.5).toFixed(0)}</Text>}
                                                     </View>
                                                     {isSelected && <View style={styles.checkCircle}><Check size={12} color="#fff" /></View>}
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
`;

content = content.replace(/return \(/, helperCode);

// Inject render call
content = content.replace(
  /\{isProdPizza\(selectedProduct\) \? \(/,
  `{selectedProduct.product?.product_type === 'half_and_half' ? (
                            renderHalfAndHalfUI(sId, selectedProduct)
                          ) : isProdPizza(selectedProduct) ? (`
);

fs.writeFileSync(filePath, content, 'utf8');
