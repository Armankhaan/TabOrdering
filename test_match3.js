const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dealhalf&halfexample.json', 'utf8'));

const slot = data.deal.lines[0]; // This is the slot

const getHalfProductsForSlot = (slot) => {
     if (!slot) return [];
     const allProducts = (slot.categories && slot.categories.length > 0)
        ? slot.categories.flatMap(cat => cat.products || cat.items || [])
        : (slot.products || slot.items || slot.deal_products || []);
     return allProducts;
};

const slotProds = getHalfProductsForSlot(slot);
console.log('Slot prods count:', slotProds.length);
console.log('First slot prod:', slotProds[0].display_name);
// Does it contain Smokey Tikka?
const tikka = slotProds.find(p => p.display_name === 'Smokey Tikka Medium Original');
console.log('Found tikka in slotProds:', !!tikka);

// BUT the halves are actually inside halves_category!
const halfAndHalfProduct = slotProds.find(p => p.product?.product_type === 'half_and_half');
console.log('Half & Half product halves count:', halfAndHalfProduct.product.halves_category.products.length);
