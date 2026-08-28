const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://bppwrpxmlglfkhcjzicn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GgKxsbGu_N9_wJ7umrgq8Q_ZQiww7tD';

function supabaseRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function checkTable() {
  try {
    // Try to select from the table to see if it exists
    console.log('Checking if Viwers table exists...');
    const result = await supabaseRequest('/rest/v1/Viwers?select=*&limit=1');
    console.log('Status:', result.status);
    console.log('Response:', result.data);

    if (result.status === 200) {
      console.log('Table exists!');
    } else if (result.status === 404) {
      console.log('Table does not exist. Need to create it.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function insertTestRecord() {
  try {
    console.log('\nTrying to insert a test record...');
    const testRecord = {
      id: 'test-' + Date.now(),
      date: new Date().toLocaleDateString(),
      category: 'Test Category',
      name: 'Test Centre',
      location: 'Test Location',
      total: 10,
      contact: '+263770000000',
      breakdown: '5 Males, 5 Females',
      prayer_expectations: 'Test prayer expectations'
    };

    const result = await supabaseRequest('/rest/v1/Viwers', 'POST', testRecord);
    console.log('Insert Status:', result.status);
    console.log('Insert Response:', result.data);
  } catch (error) {
    console.error('Insert Error:', error.message);
  }
}

async function main() {
  await checkTable();
  await insertTestRecord();
}

main();
