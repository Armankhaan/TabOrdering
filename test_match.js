const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dealhalf&halfexample.json', 'utf8'));

const slotProds = data.deal.lines[0].items; // Cheese Medium Original, Smokey Tikka, etc.

const getMatchedHalfProduct = (baseHalf, crustName) => {
    const flavourName = baseHalf.product?.name || baseHalf.display_name.split(' ')[0] || 'Unknown';
    console.log('Searching for flavor:', flavourName, 'with crust:', crustName);
    
    const match = slotProds.find(p => {
        const pFlavour = p.product?.name || p.display_name.split(' ')[0] || 'Unknown';
        if (pFlavour !== flavourName) return false;
        const pCrust = p.variant_items?.[0]?.name || p.display_name.replace(pFlavour, '').trim();
        return pCrust.toLowerCase().includes((crustName||'').toLowerCase());
    });
    return match || baseHalf;
};

// Find Smokey Tikka Medium Original
const base = slotProds.find(p => p.display_name === 'Smokey Tikka Medium Original');
console.log('Base:', base.display_name, base.extra_price);

const match = getMatchedHalfProduct(base, 'Kabab Crust');
console.log('Match:', match.display_name, match.extra_price);

const match2 = getMatchedHalfProduct(base, 'Authentic Thin');
console.log('Match2:', match2.display_name, match2.extra_price);
