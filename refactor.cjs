const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages');

const replaceRules = [
  { search: /surface-/g, replace: 'slate-' },
  { search: /risk-emergency/g, replace: 'red-600' },
  { search: /risk-urgent/g, replace: 'amber-500' },
  { search: /risk-routine/g, replace: 'emerald-500' },
  { search: /shadow-card-xl/g, replace: 'shadow-xl' },
  { search: /shadow-card-lg/g, replace: 'shadow-lg' },
  { search: /shadow-card/g, replace: 'shadow-md' },
  { search: /shadow-elevated/g, replace: 'shadow-2xl' },
  { search: /shadow-glow/g, replace: 'shadow-teal-500\/50' },
  { search: /bg-white\/80 backdrop-blur-xl/g, replace: 'bg-white' },
  { search: /bg-white\/90 backdrop-blur-md/g, replace: 'bg-white' },
  { search: /backdrop-blur/g, replace: '' },
  
  // Pastel Hero section fixes
  { search: /bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900/g, replace: 'bg-teal-50 border border-teal-100' },
  { search: /text-teal-50/g, replace: 'text-teal-700' },
  { search: /text-teal-100/g, replace: 'text-teal-600' },
  { search: /text-white/g, replace: 'text-slate-900' },
  { search: /bg-gradient-to-br from-emerald-600 via-teal-700 to-teal-900/g, replace: 'bg-emerald-50 border border-emerald-100' },
  { search: /bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-900/g, replace: 'bg-purple-50 border border-purple-100' },
  { search: /bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950/g, replace: 'bg-slate-50 border border-slate-200' },
  { search: /bg-gradient-to-r from-blue-600 to-indigo-700/g, replace: 'bg-blue-50 border border-blue-100' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const rule of replaceRules) {
        content = content.replace(rule.search, rule.replace);
      }
      
      // Additional fixes for the chat page text colors if they got changed incorrectly
      // Just applying general rules should make it render nicely
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated: ${file}`);
      }
    }
  }
}

processDirectory(dir);
console.log('Refactor complete.');
