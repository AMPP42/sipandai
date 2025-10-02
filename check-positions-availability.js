import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://puiisklsrqzhigmnxeey.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPositions() {
  console.log('🔍 Checking positions data...\n');

  try {
    // Check positions table
    const { data: positions, error } = await supabase
      .from('positions')
      .select('*')
      .order('unit', { ascending: true });

    if (error) {
      console.error('❌ Error loading positions:', error.message);
      return;
    }

    console.log(`📊 Total positions found: ${positions?.length || 0}\n`);

    if (positions && positions.length > 0) {
      console.log('✅ Positions data:');
      console.log('='.repeat(100));
      
      // Group by unit
      const byUnit = {};
      positions.forEach(pos => {
        if (!byUnit[pos.unit]) {
          byUnit[pos.unit] = [];
        }
        byUnit[pos.unit].push(pos);
      });

      Object.keys(byUnit).sort().forEach(unit => {
        console.log(`\n📍 Unit: ${unit}`);
        console.log('-'.repeat(100));
        byUnit[unit].forEach(pos => {
          console.log(`   • ${pos.jabatan}`);
          console.log(`     - Existing: ${pos.existing}, Kebutuhan: ${pos.kebutuhan}, Gap: ${pos.gap}`);
          console.log(`     - ID: ${pos.id}`);
        });
      });
    } else {
      console.log('⚠️  No positions data found in database!');
      console.log('\n💡 Suggestion: You need to populate the positions table first.');
      console.log('   Run one of these scripts:');
      console.log('   - node admin-seed-positions.js');
      console.log('   - node create-positions-from-employees.js');
    }

    // Check work_units table
    console.log('\n\n🏢 Checking work_units data...\n');
    const { data: units, error: unitsError } = await supabase
      .from('work_units')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (unitsError) {
      console.error('❌ Error loading work_units:', unitsError.message);
      return;
    }

    console.log(`📊 Total active work units: ${units?.length || 0}\n`);
    if (units && units.length > 0) {
      console.log('✅ Active work units:');
      units.forEach((unit, index) => {
        console.log(`   ${index + 1}. ${unit.name}`);
      });
    } else {
      console.log('⚠️  No active work units found!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPositions();
