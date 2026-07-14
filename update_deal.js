const fs = require('fs');
const path = require('path');

const filePath = '/Users/papajohns/untitled folder/TabOrdering/src/navigation/screens/DealOptions.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add State
content = content.replace(
  /const \[expandedSections, setExpandedSections\] = useState\(\{\}\);/,
  `const [expandedSections, setExpandedSections] = useState({});\n\n  const [selectedFirstHalfInSlot, setSelectedFirstHalfInSlot] = useState({});\n  const [selectedSecondHalfInSlot, setSelectedSecondHalfInSlot] = useState({});\n  const [sharedCrustNameInSlot, setSharedCrustNameInSlot] = useState({});\n  const [firstHalfSelectionsInSlot, setFirstHalfSelectionsInSlot] = useState({});\n  const [secondHalfSelectionsInSlot, setSecondHalfSelectionsInSlot] = useState({});`
);

// 2. Add Helpers
content = content.replace(
  /const isProdPizza = \(prod\) => \{/,
  `const getEffectiveCrustPriceForSlot = (slotId, crustName) => {
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

  const getHalfProductsForSlot = (slot) => {
     if (!slot) return [];
     const allProducts = (slot.categories && slot.categories.length > 0)
        ? slot.categories.flatMap(cat => cat.products || cat.items || [])
        : (slot.products || slot.items || slot.deal_products || []);
     return allProducts;
  };

  const isProdPizza = (prod) => {`
);

// 3. Price Calculation
content = content.replace(
  /\/\/ Price Calculation[\s\S]*?setTotalPrice\(calc \* quantity\);\n  \}, \[basePrice, selectedInSlots, selectedToppings, quantity\]\);/,
  `// Price Calculation
  useEffect(() => {
    let calc = parseFloat(basePrice);

    Object.keys(selectedInSlots).forEach(slotId => {
      const item = selectedInSlots[slotId];
      if (!item) return;

      if (item.product?.product_type === 'half_and_half') {
         const firstHalf = selectedFirstHalfInSlot[slotId];
         const secondHalf = selectedSecondHalfInSlot[slotId];
         
         const firstPrice = firstHalf ? parseFloat(firstHalf.price || firstHalf.extra_price || 0) : 0;
         const secondPrice = secondHalf ? parseFloat(secondHalf.price || secondHalf.extra_price || 0) : 0;
         calc += Math.max(firstPrice, secondPrice);
         
         const sCrust = sharedCrustNameInSlot[slotId];
         if (sCrust) {
            calc += getEffectiveCrustPriceForSlot(slotId, sCrust);
         }

         const fToppings = firstHalfSelectionsInSlot[slotId] || {};
         Object.values(fToppings).forEach(t => {
            if (t.quantity > 0) {
              const rawPrice = t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price;
              calc += parseFloat(rawPrice || 0) * 0.5;
            }
         });

         const sToppings = secondHalfSelectionsInSlot[slotId] || {};
         Object.values(sToppings).forEach(t => {
            if (t.quantity > 0) {
              const rawPrice = t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price;
              calc += parseFloat(rawPrice || 0) * 0.5;
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
              calc += parseFloat(rawPrice !== undefined && rawPrice !== null ? rawPrice : 0);
            }
          });
        }
      }
    });

    setTotalPrice(calc * quantity);
  }, [basePrice, selectedInSlots, selectedToppings, quantity, selectedFirstHalfInSlot, selectedSecondHalfInSlot, sharedCrustNameInSlot, firstHalfSelectionsInSlot, secondHalfSelectionsInSlot]);`
);

// 4. isAllSlotsFilled
content = content.replace(
  /const isAllSlotsFilled = dealSlots\.every\(\(slot, index\) => \{\n    const sId = slot\.id \|\| \`slot-\$\{index\}\`;\n    return !!selectedInSlots\[sId\];\n  \}\);/,
  `const isAllSlotsFilled = dealSlots.every((slot, index) => {
    const sId = slot.id || \`slot-\${index}\`;
    const prod = selectedInSlots[sId];
    if (!prod) return false;
    
    if (prod.product?.product_type === 'half_and_half') {
      return !!selectedFirstHalfInSlot[sId] && !!selectedSecondHalfInSlot[sId] && !!sharedCrustNameInSlot[sId];
    }
    return true;
  });`
);

// 5. handleProductSelect
content = content.replace(
  /if \(\!hasToppings\) \{\n      const currentIdx = dealSlots\.findIndex\(s => \(s\.id \|\| \`slot-\$\{dealSlots\.indexOf\(s\)\}\`\) === slotId\);\n      if \(currentIdx !== -1\) \{[\s\S]*?\}\n    \}\n  \};/,
  `if (!hasToppings && product?.product?.product_type !== 'half_and_half') {
      const currentIdx = dealSlots.findIndex(s => (s.id || \`slot-\${dealSlots.indexOf(s)}\`) === slotId);
      if (currentIdx !== -1) {
        if (currentIdx < dealSlots.length - 1) {
          const nextSlot = dealSlots[currentIdx + 1];
          const nextSlotId = nextSlot.id || \`slot-\${currentIdx + 1}\`;
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
         [\`\${slotId}_half_1_pizza\`]: true
       }));
    }
  };`
);

fs.writeFileSync(filePath, content, 'utf8');
