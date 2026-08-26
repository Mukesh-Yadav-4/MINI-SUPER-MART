const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\YASH\\.gemini\\antigravity\\brain\\a5af5244-8c6a-4c5e-b4ee-05a489041f6a\\.system_generated\\logs\\transcript_full.jsonl'),
  crlfDelay: Infinity
});

let lines = [];
rl.on('line', (line) => {
  lines.push(line);
});

rl.on('close', () => {
  console.log(`Total lines: ${lines.length}`);
  let targetIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('why is this green and yellow worker')) {
      targetIdx = i;
      break;
    }
  }
  console.log(`Target prompt at line index: ${targetIdx}`);

  // Let's find all file writes between targetIdx and targetIdx + 20
  for (let i = targetIdx; i < lines.length && i < targetIdx + 25; i++) {
    try {
      const obj = JSON.parse(lines[i]);
      if (obj.tool_calls) {
        for (let tc of obj.tool_calls) {
          console.log(`Step ${i}: ${tc.name}`);
          if (tc.name === 'replace_file_content' || tc.name === 'write_to_file') {
            console.log(`  File: ${tc.args.TargetFile || tc.args.targetFile}`);
          }
          if (tc.name === 'run_command' && tc.args.CommandLine.includes('WriteAllText')) {
            console.log(`  Command: ${tc.args.CommandLine.substring(0, 120)}...`);
          }
        }
      }
      if (obj.type === 'USER_INPUT' && obj.content.includes('this yellow worker is still getting stuck')) {
        console.log(`PROMPT 10 OCCURS AT STEP ${i}`);
      }
    } catch (e) {}
  }
});