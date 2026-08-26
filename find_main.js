const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\YASH\\.gemini\\antigravity\\brain\\a5af5244-8c6a-4c5e-b4ee-05a489041f6a\\.system_generated\\logs\\transcript_full.jsonl'),
  crlfDelay: Infinity
});

let lineNum = 0;
let mainEdits = [];

rl.on('line', (line) => {
  lineNum++;
  if (lineNum <= 953) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (let tc of obj.tool_calls) {
          if (tc.name === 'run_command' && tc.args.CommandLine && tc.args.CommandLine.includes('main.js')) {
            mainEdits.push({ lineNum, type: 'cmd', content: tc.args.CommandLine.substring(0, 100) });
          }
          if (tc.name === 'replace_file_content' && tc.args.TargetFile && tc.args.TargetFile.includes('main.js')) {
            mainEdits.push({ lineNum, type: 'replace', instruction: tc.args.Instruction });
          }
        }
      }
    } catch (e) {}
  }
});

rl.on('close', () => {
  console.log('main edits count:', mainEdits.length);
  console.log(mainEdits);
});