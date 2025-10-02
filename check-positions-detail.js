import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://puiisklsrqzhigmnxeey.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPositionsDetail() {
  console.log('🔍 Checking positions detail...\n');

  try {
    // Fetch all positions
    const { data: positions, error } = await supabase
      .from('positions')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log(`📊 Total positions: ${positions?.length || 0}\n`);

    if (positions && positions.length > 0) {
      positions.forEach((pos, index) => {
        console.log(`\n${index + 1}. Position Details:`);
        console.log('='.repeat(100));
        console.log(`   ID: ${pos.id}`);
        console.log(`   Unit: "${pos.unit}"`);
        console.log(`   Unit Length: ${pos.unit.length} characters`);
        console.log(`   Jabatan: "${pos.jabatan}"`);
        console.log(`   Existing: ${pos.existing}`);
        console.log(`   Kebutuhan: ${pos.kebutuhan}`);
        console.log(`   Gap: ${pos.gap}`);
        console.log(`   Status: ${pos.status || 'N/A'}`);
        
        // Show unit name in hex to detect hidden characters
        const unitHex = Buffer.from(pos.unit).toString('hex');
        console.log(`   Unit (hex): ${unitHex}`);
      });

      // Check for duplicate or similar unit names
      console.log('\n\n🔍 Checking for unit name variations:');
      console.log('='.repeat(100));
      const units = positions.map(p => p.unit);
      const uniqueUnits = [...new Set(units)];
      
      console.log(`\nTotal units: ${units.length}`);
      console.log(`Unique units: ${uniqueUnits.length}`);
      
      if (units.length !== uniqueUnits.length) {
        console.log('\n⚠️  WARNING: There are duplicate unit names!');
      }

      console.log('\nUnit names comparison:');
      positions.forEach((pos, i) => {
        console.log(`${i + 1}. "${pos.unit}"`);
      });

      // Check work_units table
      console.log('\n\n🏢 Checking work_units table for matching names:');
      console.log('='.repeat(100));
      
      const { data: workUnits, error: unitsError } = await supabase
        .from('work_units')
        .select('name')
        .eq('is_active', true)
        .order('name');

      if (unitsError) {
        console.log('❌ Error loading work_units:', unitsError.message);
      } else {
        const unitNames = workUnits?.map(u => u.name) || [];
        console.log(`\nTotal active work units: ${unitNames.length}`);
        
        // Check if position units match work_units
        positions.forEach(pos => {
          const exactMatch = unitNames.includes(pos.unit);
          const similarMatch = unitNames.find(u => 
            u.toLowerCase().includes(pos.unit.toLowerCase()) || 
            pos.unit.toLowerCase().includes(u.toLowerCase())
          );
          
          console.log(`\n"${pos.unit}"`);
          console.log(`  - Exact match in work_units: ${exactMatch ? '✅ YES' : '❌ NO'}`);
          if (!exactMatch && similarMatch) {
            console.log(`  - Similar match found: "${similarMatch}"`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPositionsDetail();
