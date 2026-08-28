import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bppwrpxmlglfkhcjzicn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GgKxsbGu_N9_wJ7umrgq8Q_ZQiww7tD';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('1. Testing SELECT...');
  const { data: selectData, error: selectError } = await supabase
    .from('Viwers')
    .select('*')
    .limit(1);
  console.log('Select error:', selectError?.message);
  console.log('Select data:', selectData);

  console.log('\n2. Testing INSERT...');
  const { data: insertData, error: insertError } = await supabase
    .from('Viwers')
    .insert([{
      id: 'test-' + Date.now(),
      date: new Date().toLocaleDateString(),
      category: 'Test Category',
      name: 'Test Centre',
      location: 'Test Location',
      total: 10,
      contact: '+263770000000',
      breakdown: '5M, 5F',
      prayer_expectations: 'Test prayer'
    }]);
  console.log('Insert error:', insertError?.message, insertError?.details, insertError?.hint);
  console.log('Insert data:', insertData);
}

test().catch(console.error);
