const fs = require('fs');
const file = "/home/danieler/Documentos/Proyecto Tanques/tanques-game/src/App.css";
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\/\* MENU BANNER styles \*\/[\s\S]*?font-weight: bold;\n\}/m, `/* MENU BANNER styles */
.hero-banner {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  margin-bottom: 20px;
  background: repeating-linear-gradient(45deg, #111827, #111827 10px, #1f2937 10px, #1f2937 20px);
  border: 4px solid #000;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
}

.retro-title {
  font-size: 3rem;
  color: #fcd34d;
  text-shadow: 4px 4px 0 #b45309, 8px 8px 0 #000;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}`);

fs.writeFileSync(file, content);
