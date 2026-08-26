const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\YASH\\.gemini\\antigravity\\brain\\a5af5244-8c6a-4c5e-b4ee-05a489041f6a\\.system_generated\\logs\\transcript_full.jsonl'),
  crlfDelay: Infinity
});

let lineNum = 0;
rl.on('line', (line) => {
  lineNum++;
  if (line.includes('this yellow worker is still getting stuck')) {
    console.log(`Matched on line: ${lineNum}`);
  }
});