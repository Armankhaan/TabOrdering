const fs = require('fs');
const content = fs.readFileSync('/Users/papajohns/untitled folder/TabOrdering/src/navigation/screens/DealOptions.jsx', 'utf8');
let depth = 0;
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') depth++;
    if (line[j] === '}') depth--;
  }
  if (depth < 0) {
    console.log('Negative depth at line', i + 1, ':', line);
    depth = 0;
  }
}
console.log('Final depth:', depth);
