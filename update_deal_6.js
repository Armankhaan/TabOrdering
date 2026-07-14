const fs = require('fs');
const path = require('path');

const filePath = '/Users/papajohns/untitled folder/TabOrdering/src/navigation/screens/DealOptions.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add getMatchedHalfProduct helper
content = content.replace(
  /const getHalfProductsForSlot = \(slot\) => \{/,
  `const getMatchedHalfProduct = (slotId, baseHalf, crustName) => {
      if (!baseHalf) return null;
      const slotProd = selectedInSlots[slotId];
      if (!slotProd) return baseHalf;
      const slot = dealSlots.find(s => (s.id || \`slot-\${dealSlots.indexOf(s)}\`) === slotId);
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

  const getHalfProductsForSlot = (slot) => {`
);

// 2. Price Calculation: replace the half_and_half block
content = content.replace(
  /if \(item\.product\?\.product_type === 'half_and_half'\) \{[\s\S]*?\} else \{/,
  `if (item.product?.product_type === 'half_and_half') {
         const firstHalfBase = selectedFirstHalfInSlot[slotId];
         const secondHalfBase = selectedSecondHalfInSlot[slotId];
         const sCrust = sharedCrustNameInSlot[slotId];
         
         const firstHalf = getMatchedHalfProduct(slotId, firstHalfBase, sCrust) || firstHalfBase;
         const secondHalf = getMatchedHalfProduct(slotId, secondHalfBase, sCrust) || secondHalfBase;
         
         const firstPrice = firstHalf ? parseFloat(firstHalf.extra_price || 0) : 0;
         const secondPrice = secondHalf ? parseFloat(secondHalf.extra_price || 0) : 0;
         calc += Math.max(firstPrice, secondPrice);
         
         const fToppings = firstHalfSelectionsInSlot[slotId] || {};
         Object.values(fToppings).forEach(t => {
            if (t.quantity > 0) {
              const rawPrice = t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price;
              calc += parseFloat(rawPrice || 0);
            }
         });

         const sToppings = secondHalfSelectionsInSlot[slotId] || {};
         Object.values(sToppings).forEach(t => {
            if (t.quantity > 0) {
              const rawPrice = t.price !== undefined && t.price !== null && t.price !== '' ? t.price : t.base_price;
              calc += parseFloat(rawPrice || 0);
            }
         });
      } else {`
);

// 3. handleAddToCart: mapping for half_and_half
content = content.replace(
  /if \(prod\.product\?\.product_type === 'half_and_half'\) \{[\s\S]*?const slotToppingsMap = \{ \.\.\.\(selectedToppings\[slotId\] \|\| \{\}\) \};/,
  `if (prod.product?.product_type === 'half_and_half') {
         const firstHalfBase = selectedFirstHalfInSlot[slotId];
         const secondHalfBase = selectedSecondHalfInSlot[slotId];
         const sCrust = sharedCrustNameInSlot[slotId];
         
         const firstHalf = getMatchedHalfProduct(slotId, firstHalfBase, sCrust) || firstHalfBase;
         const secondHalf = getMatchedHalfProduct(slotId, secondHalfBase, sCrust) || secondHalfBase;
         
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

         const firstPrice = parseFloat(firstHalf.extra_price || 0);
         const secondPrice = parseFloat(secondHalf.extra_price || 0);
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
            price: higherPrice,
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

// 4. Update getCrustPrice inside renderHalfAndHalfUI
content = content.replace(
  /const getCrustPrice = \(crustName\) => \{[\s\S]*?return 0;\n     \};/,
  `const getCrustPrice = (crustName) => {
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
     };`
);

// 5. Remove * 0.5 from toppings rendering
content = content.replace(
  /\{\(Number\(item\.price\) \* 0\.5\)\.toFixed\(0\)\}/g,
  `{Number(item.price).toFixed(0)}`
);

fs.writeFileSync(filePath, content, 'utf8');
