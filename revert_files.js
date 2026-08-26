const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\YASH\\.gemini\\antigravity\\brain\\a5af5244-8c6a-4c5e-b4ee-05a489041f6a\\.system_generated\\logs\\transcript_full.jsonl'),
  crlfDelay: Infinity
});

let lineNum = 0;
let lastStaffJs = null;
let lastConfigJs = null;
let lastCustomersJs = null;
let lastMainJs = null;

rl.on('line', (line) => {
  lineNum++;
  if (lineNum <= 953) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (let tc of obj.tool_calls) {
          if (tc.name === 'run_command' && tc.args && tc.args.CommandLine) {
            const cmd = tc.args.CommandLine;
            if (cmd.includes('$staffJs = @\'')) {
              const match = cmd.match(/\$staffJs = @'([\s\S]*?)'@/);
              if (match) lastStaffJs = match[1].trim();
            }
            if (cmd.includes('$configJs = @\'')) {
              const match = cmd.match(/\$configJs = @'([\s\S]*?)'@/);
              if (match) lastConfigJs = match[1].trim();
            }
            if (cmd.includes('$customersJs = @\'')) {
              const match = cmd.match(/\$customersJs = @'([\s\S]*?)'@/);
              if (match) lastCustomersJs = match[1].trim();
            }
            if (cmd.includes('$mainJs = @\'')) {
              const match = cmd.match(/\$mainJs = @'([\s\S]*?)'@/);
              if (match) lastMainJs = match[1].trim();
            }
          }
        }
      }
    } catch (e) {}
  }
});

rl.on('close', () => {
  console.log('lastStaffJs found:', !!lastStaffJs);
  console.log('lastConfigJs found:', !!lastConfigJs);
  console.log('lastCustomersJs found:', !!lastCustomersJs);
  console.log('lastMainJs found:', !!lastMainJs);

  if (lastStaffJs) {
    fs.writeFileSync('C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\staff.js', lastStaffJs, 'utf8');
    console.log('Restored src/staff.js');
  }
  if (lastConfigJs) {
    fs.writeFileSync('C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\config.js', lastConfigJs, 'utf8');
    console.log('Restored src/config.js');
  }
  if (lastCustomersJs) {
    fs.writeFileSync('C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\customers.js', lastCustomersJs, 'utf8');
    console.log('Restored src/customers.js');
  }
});