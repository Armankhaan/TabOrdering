const fs = require('fs');
const path = require('path');

const filePath = '/Users/papajohns/untitled folder/TabOrdering/src/navigation/screens/DealOptions.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the two grids in renderHalfAndHalfUI with grouped items
const oldGrid1 = `{availableHalves.map(p => {
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
                                 })}`;

const newGrid1 = `{groupItemsByFlavour(availableHalves).map(group => {
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
                                                     [\`\${sId}_half_1_pizza\`]: false,
                                                     [\`\${sId}_half_2_pizza\`]: !selectedSecondHalf ? true : false,
                                                     [\`\${sId}_half_shared_crust\`]: selectedSecondHalf ? true : false
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
                                 })}`;


const oldGrid2 = `{availableHalves.map(p => {
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
                                 })}`;

const newGrid2 = `{groupItemsByFlavour(availableHalves).map(group => {
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
                                                     [\`\${sId}_half_2_pizza\`]: false,
                                                     [\`\${sId}_half_shared_crust\`]: true
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
                                 })}`;

content = content.replace(oldGrid1, newGrid1);
content = content.replace(oldGrid2, newGrid2);

fs.writeFileSync(filePath, content, 'utf8');
