const fs = require('fs');
let text = fs.readFileSync('figma_node.json', 'utf16le');
if (text.charCodeAt(0) === 0xFEFF) {
  text = text.slice(1);
}
const data = JSON.parse(text);
fs.writeFileSync('figma_node_clean.json', JSON.stringify(data, null, 2), 'utf8');
