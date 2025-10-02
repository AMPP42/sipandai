// Script to test positions data access via RPC function
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPositionsRPC() {
  try {
    console.log('🔍 Testing positions data access via RPC function...\n');
    
    // Test RPC function
    console.log('1️⃣ Testing get_positions() RPC function:');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_positions');
    
    if (rpcError) {
      console.log('❌ RPC error:', rpcError.message);
      console.log('📋 Error details:', rpcError);
    } else {
      console.log('✅ RPC function successful');
      console.log('📊 Found positions:', rpcData?.length || 0);
      
      if (rpcData && rpcData.length > 0) {
        console.log('\n📋 Sample positions:');
        rpcData.slice(0, 5).forEach((pos, index) => {
          console.log(`${index + 1}. ${pos.unit} - ${pos.jabatan} (Gap: ${pos.gap})`);
        });
        
        // Check for target unit
        const targetUnit = 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas';
        const targetPositions = rpcData.filter(pos => 
          pos.unit.toLowerCase().includes('sekretariat') && 
          pos.unit.toLowerCase().includes('direktorat jenderal')
        );
        
        console.log(`\n🎯 Positions for target unit: ${targetPositions.length}`);
        targetPositions.forEach((pos, index) => {
          console.log(`${index + 1}. ${pos.jabatan} (Gap: ${pos.gap})`);
        });
      }
    }
    
    // Test direct table access (should still fail due to RLS)
    console.log('\n2️⃣ Testing direct table access (should fail due to RLS):');
    const { data: directData, error: directError } = await supabase
      .from('positions')
      .select('*')
      .limit(5);
    
    if (directError) {
      console.log('❌ Direct access error (expected):', directError.message);
    } else {
      console.log('✅ Direct access successful (unexpected)');
      console.log('📊 Found records:', directData?.length || 0);
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testPositionsRPC();
