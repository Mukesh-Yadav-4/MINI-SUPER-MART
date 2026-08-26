const fs = require('fs');
const readline = require('readline');

// Let's replay all file creations and edits from line 1 to line 953
const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\YASH\\.gemini\\antigravity\\brain\\a5af5244-8c6a-4c5e-b4ee-05a489041f6a\\.system_generated\\logs\\transcript_full.jsonl'),
  crlfDelay: Infinity
});

let lineNum = 0;
let fileContents = {};

rl.on('line', (line) => {
  lineNum++;
  if (lineNum <= 953) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (let tc of obj.tool_calls) {
          if (tc.name === 'write_to_file' && tc.args.TargetFile && tc.args.CodeContent) {
            fileContents[tc.args.TargetFile] = tc.args.CodeContent;
          }
          if (tc.name === 'run_command' && tc.args.CommandLine) {
            const cmd = tc.args.CommandLine;
            const match = cmd.match(/\$(\w+) = @'([\s\S]*?)'@/);
            if (match) {
              const varName = match[1];
              const text = match[2].trim();
              const map = {
                'indexHtml': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\index.html',
                'styleCss': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\style.css',
                'configJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\config.js',
                'audioJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\audio.js',
                'sdkJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\sdk.js',
                'playerJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\player.js',
                'farmJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\farm.js',
                'marketJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\market.js',
                'customersJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\customers.js',
                'staffJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\staff.js',
                'uiJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\ui.js',
                'mainJs': 'C:\\Users\\YASH\\.gemini\\antigravity\\scratch\\organic-farm-mart\\src\\main.js'
              };
              if (map[varName]) {
                fileContents[map[varName]] = text;
              }
            }
          }
          if (tc.name === 'replace_file_content') {
            const file = tc.args.TargetFile;
            if (fileContents[file]) {
              const target = tc.args.TargetContent;
              const rep = tc.args.ReplacementContent;
              if (fileContents[file].includes(target)) {
                fileContents[file] = fileContents[file].replace(target, rep);
              } else {
                console.warn(`Line ${lineNum}: TargetContent not found in ${file}`);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error on line ${lineNum}:`, e);
    }
  }
});

rl.on('close', () => {
  console.log('Replay completed! Files to write:', Object.keys(fileContents).length);
  for (let file in fileContents) {
    if (file.includes('organic-farm-mart')) {
      fs.writeFileSync(file, fileContents[file], 'utf8');
      console.log('Restored exact pre-prompt state of:', file);
    }
  }
});