const path = require('path');

async function run() {
  console.log('Running basic tests...');

  const { extractFirstJson } = require(path.join(__dirname, '..', 'src', 'lib', 'aiResponseParser.js'));
  const { deriveTargets } = require(path.join(__dirname, '..', 'src', 'lib', 'targets.js'));

  // Test 1: extractFirstJson happy path
  const sample = 'Here is the analysis:\n```json\n{ "activity": "running", "duration_minutes": 30, "metValue": 9 }\n```';
  try {
    const parsed = extractFirstJson(sample);
    if (parsed.activity !== 'running' || parsed.duration_minutes !== 30) throw new Error('parse mismatch');
    console.log('PASS: extractFirstJson happy path');
  } catch (e) {
    console.error('FAIL: extractFirstJson happy path', e.message);
  }

  // Test 2: deriveTargets basic
  try {
    const out = deriveTargets({ age: 30, height_cm: 175, weight_kg: 75, gender: 'male', activity_level: 'moderately_active' });
    if (!out.derived_daily_calorie_target) throw new Error('missing tdee');
    console.log('PASS: deriveTargets basic');
  } catch (e) {
    console.error('FAIL: deriveTargets basic', e.message);
  }

  // Test 3: extractFirstJson failure
  try {
    extractFirstJson('no json here');
    console.error('FAIL: extractFirstJson should have thrown');
  } catch (e) {
    console.log('PASS: extractFirstJson failure case');
  }

  console.log('Basic tests completed');
}

run();
