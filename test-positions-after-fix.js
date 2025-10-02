import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://puiisklsrqzhigmnxeey.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPositions() {
  console.log('🧪 Testing positions access after RLS fix...\n');

  try {
    // Test 1: Count total positions
    const { count, error: countError } = await supabase
      .from('positions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Count error:', countError.message);
    } else {
      console.log('✅ Total positions in database:', count);
    }

    // Test 2: Fetch all positions
    const { data: positions, error } = await supabase
      .from('positions')
      .select('*')
      .order('unit', { ascending: true });

    if (error) {
      console.log('❌ Fetch error:', error.message);
      console.log('📋 Error details:', error);
      return;
    }

    console.log('✅ Successfully fetched positions:', positions?.length || 0);

    if (positions && positions.length > 0) {
      console.log('\n📊 Sample positions data:');
      console.log('='.repeat(100));
      
      // Group by unit and show first 3 units
      const byUnit = {};
      positions.forEach(pos => {
        if (!byUnit[pos.unit]) {
          byUnit[pos.unit] = [];
        }
        byUnit[pos.unit].push(pos);
      });

      const units = Object.keys(byUnit).sort().slice(0, 3);
      units.forEach(unit => {
        console.log(`\n📍 Unit: ${unit}`);
        console.log('-'.repeat(100));
        byUnit[unit].slice(0, 3).forEach(pos => {
          console.log(`   • ${pos.jabatan}`);
          console.log(`     - Existing: ${pos.existing}, Kebutuhan: ${pos.kebutuhan}, Gap: ${pos.gap}`);
        });
        if (byUnit[unit].length > 3) {
          console.log(`   ... and ${byUnit[unit].length - 3} more positions`);
        }
      });

      console.log(`\n📊 Total units with positions: ${Object.keys(byUnit).length}`);
      console.log(`📊 Total positions: ${positions.length}`);
    } else {
      console.log('\n⚠️  No positions found!');
      console.log('💡 This means either:');
      console.log('   1. The table is empty (run: node admin-seed-positions.js)');
      console.log('   2. RLS policies are still blocking access');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPositions();
