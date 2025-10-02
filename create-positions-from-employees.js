// Script to create positions data based on existing employees
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createPositionsFromEmployees() {
  try {
    console.log('🔧 Creating positions data from existing employees...\n');
    
    // Get all employees grouped by unit and jabatan
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('unit, jabatan')
      .order('unit', { ascending: true });
    
    if (empError) {
      console.log('❌ Error loading employees:', empError.message);
      return;
    }
    
    console.log(`📊 Found ${employees?.length || 0} employees`);
    
    // Group employees by unit and jabatan
    const positionMap = new Map();
    
    employees?.forEach(emp => {
      const key = `${emp.unit}|${emp.jabatan}`;
      if (positionMap.has(key)) {
        positionMap.get(key).existing += 1;
      } else {
        positionMap.set(key, {
          unit: emp.unit,
          jabatan: emp.jabatan,
          existing: 1,
          kebutuhan: 1 // Default kebutuhan, bisa disesuaikan
        });
      }
    });
    
    console.log(`📊 Found ${positionMap.size} unique positions`);
    
    // Convert to array and adjust kebutuhan based on existing
    const positionsData = Array.from(positionMap.values()).map(pos => ({
      unit: pos.unit,
      jabatan: pos.jabatan,
      existing: pos.existing,
      kebutuhan: Math.max(pos.existing, 1) // Set kebutuhan minimal sama dengan existing
    }));
    
    // Show what we're about to insert
    console.log('\n📋 Positions to be created:');
    positionsData.forEach((pos, index) => {
      const gap = pos.kebutuhan - pos.existing;
      console.log(`${index + 1}. ${pos.unit} - ${pos.jabatan} (Existing: ${pos.existing}, Kebutuhan: ${pos.kebutuhan}, Gap: ${gap})`);
    });
    
    // Focus on the specific unit mentioned by user
    const targetUnit = 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas';
    const targetPositions = positionsData.filter(pos => 
      pos.unit.toLowerCase().includes('sekretariat') && 
      pos.unit.toLowerCase().includes('direktorat jenderal')
    );
    
    console.log(`\n🎯 Positions for target unit "${targetUnit}": ${targetPositions.length}`);
    targetPositions.forEach((pos, index) => {
      const gap = pos.kebutuhan - pos.existing;
      console.log(`${index + 1}. ${pos.jabatan} (Existing: ${pos.existing}, Kebutuhan: ${pos.kebutuhan}, Gap: ${gap})`);
    });
    
    // Insert positions data in batches
    console.log('\n📦 Inserting positions data...');
    const batchSize = 10;
    let successCount = 0;
    
    for (let i = 0; i < positionsData.length; i += batchSize) {
      const batch = positionsData.slice(i, i + batchSize);
      console.log(`📦 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(positionsData.length/batchSize)}...`);
      
      const { data, error } = await supabase
        .from('positions')
        .insert(batch)
        .select();
      
      if (error) {
        console.log(`❌ Error inserting batch:`, error.message);
        console.log('📋 Failed batch:', batch);
        continue;
      }
      
      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} inserted successfully`);
      successCount += batch.length;
    }
    
    console.log(`\n📊 Insertion complete: ${successCount}/${positionsData.length} successful`);
    
    // Verify the data
    console.log('\n🔍 Verifying inserted data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('positions')
      .select('*')
      .limit(10);
    
    if (verifyError) {
      console.log('❌ Error verifying data:', verifyError.message);
    } else {
      console.log('✅ Verification successful!');
      console.log(`📊 Total positions: ${verifyData?.length || 0}`);
      if (verifyData && verifyData.length > 0) {
        console.log('📋 Sample data:', verifyData[0]);
      }
    }
    
    // Check specifically for the target unit
    console.log('\n🎯 Checking target unit positions...');
    const { data: targetData, error: targetError } = await supabase
      .from('positions')
      .select('*')
      .ilike('unit', '%Sekretariat Direktorat Jenderal%');
    
    if (targetError) {
      console.log('❌ Error loading target unit positions:', targetError.message);
    } else {
      console.log(`📊 Found ${targetData?.length || 0} positions for target unit`);
      if (targetData && targetData.length > 0) {
        console.log('📋 Target unit positions:');
        targetData.forEach((pos, index) => {
          console.log(`${index + 1}. ${pos.jabatan} (Existing: ${pos.existing}, Kebutuhan: ${pos.kebutuhan}, Gap: ${pos.gap})`);
        });
      }
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

createPositionsFromEmployees();
