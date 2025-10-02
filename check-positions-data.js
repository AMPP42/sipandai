// Script to check positions data in database
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkPositionsData() {
  try {
    console.log('🔍 Checking positions data in database...\n');
    
    // Check all positions data
    const { data: allPositions, error: allError } = await supabase
      .from('positions')
      .select('*')
      .order('unit', { ascending: true });
    
    if (allError) {
      console.log('❌ Error loading all positions:', allError.message);
      return;
    }
    
    console.log(`📊 Total positions in database: ${allPositions?.length || 0}`);
    
    if (allPositions && allPositions.length > 0) {
      console.log('\n📋 All positions:');
      allPositions.forEach((pos, index) => {
        console.log(`${index + 1}. ${pos.unit} - ${pos.jabatan} (Existing: ${pos.existing}, Kebutuhan: ${pos.kebutuhan}, Gap: ${pos.gap || 'N/A'})`);
      });
    }
    
    // Check positions for specific unit
    const targetUnit = 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas';
    console.log(`\n🎯 Checking positions for unit: "${targetUnit}"`);
    
    const { data: unitPositions, error: unitError } = await supabase
      .from('positions')
      .select('*')
      .eq('unit', targetUnit);
    
    if (unitError) {
      console.log('❌ Error loading unit positions:', unitError.message);
    } else {
      console.log(`📊 Found ${unitPositions?.length || 0} positions for this unit`);
      
      if (unitPositions && unitPositions.length > 0) {
        console.log('\n📋 Positions for this unit:');
        unitPositions.forEach((pos, index) => {
          console.log(`${index + 1}. ${pos.jabatan} (Existing: ${pos.existing}, Kebutuhan: ${pos.kebutuhan}, Gap: ${pos.gap || 'N/A'})`);
        });
        
        // Check which positions have gap > 0 (available for selection)
        const availablePositions = unitPositions.filter(pos => (pos.gap || 0) > 0);
        console.log(`\n✅ Available positions (gap > 0): ${availablePositions.length}`);
        
        if (availablePositions.length > 0) {
          console.log('📋 Available positions:');
          availablePositions.forEach((pos, index) => {
            console.log(`${index + 1}. ${pos.jabatan} (Gap: ${pos.gap})`);
          });
        } else {
          console.log('⚠️  No available positions found (all have gap <= 0)');
        }
      }
    }
    
    // Check if there are any positions with gap <= 0 that should be available
    console.log('\n🔍 Checking positions with gap <= 0:');
    const unavailablePositions = allPositions?.filter(pos => (pos.gap || 0) <= 0) || [];
    console.log(`📊 Positions with gap <= 0: ${unavailablePositions.length}`);
    
    if (unavailablePositions.length > 0) {
      console.log('📋 These positions are not available for selection:');
      unavailablePositions.forEach((pos, index) => {
        console.log(`${index + 1}. ${pos.unit} - ${pos.jabatan} (Gap: ${pos.gap || 'N/A'})`);
      });
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkPositionsData();
