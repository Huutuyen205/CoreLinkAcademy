const fs = require('fs');
const path = require('path');

const masterPath = path.join(__dirname, '..', 'docs', 'CORELINK_MASTER.md');
const content = fs.readFileSync(masterPath, 'utf8');

// 1. Extract 98 FRs from Section 5
const frRegex = /\| (FR-\d+) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|/g;
const frMap = new Map();
let m;
while ((m = frRegex.exec(content)) !== null) {
  const [_, code, desc, criteria, gd, priority] = m;
  if (!frMap.has(code)) {
    frMap.set(code, {
      code,
      desc: desc.trim(),
      criteria: criteria.trim(),
      gd: gd.trim(),
      priority: priority.trim()
    });
  }
}

// 2. Extract 14 AIs from Section 7
const aiRegex = /\| (AI-\d+) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|/g;
const aiMap = new Map();
while ((m = aiRegex.exec(content)) !== null) {
  const [_, code, title, input, output, modelType, approver, gd] = m;
  if (!aiMap.has(code)) {
    aiMap.set(code, {
      code,
      title: title.trim(),
      input: input.trim(),
      output: output.trim(),
      modelType: modelType.trim(),
      approver: approver.trim(),
      gd: gd.trim()
    });
  }
}

// 3. Extract 44 Screens from Section 11
const sRegex = /\| (S\d{2}) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|/g;
const sMap = new Map();
while ((m = sRegex.exec(content)) !== null) {
  const [_, code, role, name, summary, gd] = m;
  if (!sMap.has(code)) {
    sMap.set(code, {
      code,
      role: role.trim(),
      name: name.trim(),
      summary: summary.trim(),
      gd: gd.trim()
    });
  }
}

// 4. Extract 154 TCs from Section B5
const tcRegex = /\| (TC-\d{3}) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|/g;
const tcMap = new Map();
while ((m = tcRegex.exec(content)) !== null) {
  const [_, code, moduleName, frCode, title, role, precondition, steps, data, expected, type, priority, gd] = m;
  if (!tcMap.has(code)) {
    tcMap.set(code, {
      code,
      moduleName: moduleName.trim(),
      frCode: frCode.trim(),
      title: title.trim(),
      role: role.trim(),
      precondition: precondition.trim(),
      steps: steps.trim(),
      data: data.trim(),
      expected: expected.trim(),
      type: type.trim(),
      priority: priority.trim(),
      gd: gd.trim()
    });
  }
}

console.log(`Parsed: ${frMap.size} FRs, ${aiMap.size} AIs, ${sMap.size} Screens, ${tcMap.size} TCs.`);
