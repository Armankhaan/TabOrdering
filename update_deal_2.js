const fs = require('fs');
const path = require('path');

const filePath = '/Users/papajohns/untitled folder/TabOrdering/src/navigation/screens/DealOptions.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 6. handleAddToCart
content = content.replace(
  /Object\.keys\(selectedInSlots\)\.forEach\(slotId => \{\n      const prod = selectedInSlots\[slotId\];\n\n      const slotToppingsMap = \{ \.\.\.\(selectedToppings\[slotId\] \|\| \{\}\) \};/,
  `Object.keys(selectedInSlots).forEach(slotId => {
      const prod = selectedInSlots[slotId];

      if (prod.product?.product_type === 'half_and_half') {
         const firstHalf = selectedFirstHalfInSlot[slotId];
         const secondHalf = selectedSecondHalfInSlot[slotId];
         const sCrust = sharedCrustNameInSlot[slotId];
         
         const mapTopping = t => {
            let toppingPrice = parseFloat(t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price || 0);
            if (toppingPrice === 0) {
              const originalPrice = getToppingOriginalPrice(t);
              if (originalPrice > 0) toppingPrice = originalPrice;
            }
            return {
               id: t.id,
               name: t.name,
               price: toppingPrice,
               quantity: t.quantity !== undefined ? t.quantity : 1,
               pos_code: t.pos_code || t.ref_code || '',
               ref_code: t.ref_code || ''
            };
         };

         const fToppings = Object.values(firstHalfSelectionsInSlot[slotId] || {}).map(mapTopping);
         const sToppings = Object.values(secondHalfSelectionsInSlot[slotId] || {}).map(mapTopping);

         const firstPrice = parseFloat(firstHalf.price || firstHalf.extra_price || 0);
         const secondPrice = parseFloat(secondHalf.price || secondHalf.extra_price || 0);
         const higherPrice = Math.max(firstPrice, secondPrice);
         
         const higherHalf = secondPrice > firstPrice ? secondHalf : firstHalf;
         let crustPos = '';
         let crustRef = '';
         if (higherHalf?.product?.variants) {
             const sizeVar = higherHalf.product.variants.find(v => v.name.toLowerCase().includes('size'));
             const halfVariantOptIds = prod.product.halves_variant_option_ids || [];
             let sizeOpt = sizeVar?.options?.find(o => halfVariantOptIds.includes(o.id.toString()));
             if (!sizeOpt) sizeOpt = sizeVar?.options?.[0];
             const cItem = sizeOpt?.items?.find(i => i.name === sCrust);
             if (cItem) {
                 crustPos = cItem.pos_code || '';
                 crustRef = cItem.ref_code || '';
             }
         }

         slotsWithToppings[slotId] = {
            id: prod.id,
            name: prod.product?.name || prod.display_name,
            price: higherPrice + getEffectiveCrustPriceForSlot(slotId, sCrust),
            ref_code: prod.ref_code || prod.product?.ref_code || '',
            pos_code: prod.pos_code || prod.product?.pos_code || '',
            isHalfAndHalf: true,
            firstHalf: {
               id: firstHalf.id,
               name: firstHalf.name || firstHalf.display_name || firstHalf.product?.name,
               ref_code: firstHalf.ref_code || firstHalf.product?.ref_code || '',
               pos_code: firstHalf.pos_code || firstHalf.product?.pos_code || '',
               toppings: fToppings,
               crust: sCrust,
               crust_pos: crustPos,
               crust_ref: crustRef,
            },
            secondHalf: {
               id: secondHalf.id,
               name: secondHalf.name || secondHalf.display_name || secondHalf.product?.name,
               ref_code: secondHalf.ref_code || secondHalf.product?.ref_code || '',
               pos_code: secondHalf.pos_code || secondHalf.product?.pos_code || '',
               toppings: sToppings,
               crust: sCrust,
               crust_pos: crustPos,
               crust_ref: crustRef,
            }
         };
         return;
      }

      const slotToppingsMap = { ...(selectedToppings[slotId] || {}) };`
);

// 7. Change Choice button
content = content.replace(
  /setActiveFlavourInSlot\(prev => \(\{ \.\.\.prev, \[sId\]: null \}\)\);\n                                \}\}/,
  `setActiveFlavourInSlot(prev => ({ ...prev, [sId]: null }));
                                setSelectedFirstHalfInSlot(prev => ({ ...prev, [sId]: null }));
                                setSelectedSecondHalfInSlot(prev => ({ ...prev, [sId]: null }));
                                setSharedCrustNameInSlot(prev => ({ ...prev, [sId]: null }));
                                setFirstHalfSelectionsInSlot(prev => ({ ...prev, [sId]: null }));
                                setSecondHalfSelectionsInSlot(prev => ({ ...prev, [sId]: null }));
                              }}`
);

fs.writeFileSync(filePath, content, 'utf8');
