const fs = require('fs');
const file = "/home/danieler/Documentos/Proyecto Tanques/tanques-game/src/App.css";
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\.hero-tank-banner[\s\S]*?border-radius: 4px;\n\}/m, `.hero-banner {
  width: 100%;
  background-color: #0f172a;
  border: 4px solid #10b981;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}

.ascii-tank {
  font-family: monospace;
  color: #10b981;
  font-size: 1.5rem;
  line-height: 1.2;
  margin: 0;
  text-shadow: 2px 2px 0px rgba(0,255,0,0.3);
  font-weight: bold;
}`);

fs.writeFileSync(file, content);
