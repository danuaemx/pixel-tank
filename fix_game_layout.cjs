const fs = require('fs');
const file = "/home/danieler/Documentos/Proyecto Tanques/tanques-game/src/App.css";
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\.game-layout {\n  display: grid;\n  grid-template-columns: auto 340px;\n  gap: 20px;\n  align-items: start;\n}/, `.game-layout {
  display: flex;
  flex: 1;
  min-height: 0; /* needed for flex children to scroll */
  gap: 16px;
  align-items: stretch;
}`);

content = content.replace(/\.board \{\n  display: grid;\n  gap: 0;\n  padding: 8px;\n  border: 6px solid #000;\n  background: #111827;\n  box-shadow: \n    inset -4px -4px 0 0 rgba\(255,255,255,0\.1\),\n    inset 4px 4px 0 0 rgba\(0,0,0,0\.6\);\n  justify-content: center;\n\}/m, `.board {
  display: grid;
  gap: 0;
  padding: 4px;
  border: 4px solid #000;
  background: #111827;
  box-shadow: inset -4px -4px 0 0 rgba(255,255,255,0.1), inset 4px 4px 0 0 rgba(0,0,0,0.6);
  /* Make it scale to height and keep square */
  aspect-ratio: 1;
  height: 100%;
  max-width: 100%;
  margin: 0 auto;
}`);

content = content.replace(/\.board-cell \{\n  position: relative;\n  width: clamp\(24px, 5vw, 42px\);\n  height: clamp\(24px, 5vw, 42px\);\n/m, `.board-cell {
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
`);

content = content.replace(/\.right-panel {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n}/, `.right-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 340px;
  min-width: 300px;
  overflow-y: auto;
  padding-right: 8px;
}`);

fs.writeFileSync(file, content);
