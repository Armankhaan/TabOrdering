const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dealhalf&halfexample.json', 'utf8'));

const slot = data.deal.lines[0]; 
const slotProds = slot.items;

const kabab = slotProds.find(p => p.display_name === 'Creamy Mughlai Medium Kabab Crust');
console.log('Found kabab in slotProds:', !!kabab);
