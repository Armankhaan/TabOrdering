const fs = require('fs');
const path = require('path');

const filePath = '/Users/papajohns/untitled folder/TabOrdering/src/navigation/screens/DealOptions.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `const targetCategoryIds = product.product?.halves_category_ids || [];
     const availableHalves = halfProds.filter(p => p.product?.category_id && targetCategoryIds.includes(p.product.category_id.toString()));`;

const newCode = `let targetCategoryIds = [];
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
     });`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(filePath, content, 'utf8');
