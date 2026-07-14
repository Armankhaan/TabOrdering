const fs = require('fs');
const content = fs.readFileSync('/Users/papajohns/untitled folder/TabOrdering/src/navigation/screens/DealOptions.jsx', 'utf8');
let depth = 0;
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let changes = 0;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') { depth++; changes++; }
    if (line[j] === '}') { depth--; changes--; }
  }
  if (depth === 0 && i > 30 && i < 1000) {
    console.log('Depth 0 at line', i + 1, ':', line);
  }
}
