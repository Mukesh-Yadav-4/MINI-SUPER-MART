const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\YASH\\.gemini\\antigravity\\brain\\a5af5244-8c6a-4c5e-b4ee-05a489041f6a\\.system_generated\\logs\\transcript_full.jsonl'),
  crlfDelay: Infinity
});

let lineNum = 0;
let filesWritten = {};

rl.on('line', (line) => {
  lineNum++;
  if (lineNum <= 953) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (let tc of obj.tool_calls) {
          if (tc.name === 'run_command' && tc.args.CommandLine) {
            const cmd = tc.args.CommandLine;
            if (cmd.includes('WriteAllText') || cmd.includes('write_to_file')) {
              console.log(`Line ${lineNum}: File written in run_command: ${cmd.substring(0, 80)}...`);
            }
          }
          if (tc.name === 'write_to_file') {
            console.log(`Line ${lineNum}: write_to_file: ${tc.args.TargetFile}`);
          }
          if (tc.name === 'replace_file_content') {
            console.log(`Line ${lineNum}: replace_file_content: ${tc.args.TargetFile}`);
          }
        }
      }
    } catch (e) {}
  }
});