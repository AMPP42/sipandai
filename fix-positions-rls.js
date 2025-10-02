// Script to fix RLS policy for positions table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixPositionsRLS() {
  try {
    console.log('🔧 Fixing RLS policy for positions table...\n');
    
    // First, let's check current positions data
    console.log('1️⃣ Checking current positions data...');
    const { data: positions, error: posError } = await supabase
      .from('positions')
      .select('*');
    
    if (posError) {
      console.log('❌ Error accessing positions:', posError.message);
      console.log('📋 This confirms RLS is blocking access');
    } else {
      console.log('✅ Positions accessible');
      console.log('📊 Found positions:', positions?.length || 0);
    }
    
    // Try to create a simple RPC function to bypass RLS
    console.log('\n2️⃣ Creating RPC function to bypass RLS...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_positions_public()
      RETURNS TABLE (
        id uuid,
        unit text,
        jabatan text,
        existing integer,
        kebutuhan integer,
        gap integer,
        status text,
        created_at timestamptz,
        updated_at timestamptz
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          p.id,
          p.unit,
          p.jabatan,
          p.existing,
          p.kebutuhan,
          p.gap,
          p.status,
          p.created_at,
          p.updated_at
        FROM public.positions p
        ORDER BY p.unit, p.jabatan;
      END;
      $$;
    `;
    
    const { data: createData, error: createError } = await supabase
      .rpc('exec_sql', { sql: createFunctionSQL });
    
    if (createError) {
      console.log('❌ Error creating function:', createError.message);
    } else {
      console.log('✅ Function created successfully');
    }
    
    // Try to grant permissions
    console.log('\n3️⃣ Granting permissions...');
    const grantSQL = `
      GRANT EXECUTE ON FUNCTION get_positions_public() TO authenticated;
      GRANT EXECUTE ON FUNCTION get_positions_public() TO anon;
    `;
    
    const { data: grantData, error: grantError } = await supabase
      .rpc('exec_sql', { sql: grantSQL });
    
    if (grantError) {
      console.log('❌ Error granting permissions:', grantError.message);
    } else {
      console.log('✅ Permissions granted');
    }
    
    // Test the function
    console.log('\n4️⃣ Testing the function...');
    const { data: testData, error: testError } = await supabase
      .rpc('get_positions_public');
    
    if (testError) {
      console.log('❌ Error testing function:', testError.message);
    } else {
      console.log('✅ Function works!');
      console.log('📊 Found positions:', testData?.length || 0);
      
      if (testData && testData.length > 0) {
        console.log('\n📋 Sample positions:');
        testData.slice(0, 5).forEach((pos, index) => {
          console.log(`${index + 1}. ${pos.unit} - ${pos.jabatan} (Gap: ${pos.gap})`);
        });
        
        // Check for target unit
        const targetUnit = 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas';
        const targetPositions = testData.filter(pos => 
          pos.unit.toLowerCase().includes('sekretariat') && 
          pos.unit.toLowerCase().includes('direktorat jenderal')
        );
        
        console.log(`\n🎯 Positions for target unit: ${targetPositions.length}`);
        targetPositions.forEach((pos, index) => {
          console.log(`${index + 1}. ${pos.jabatan} (Gap: ${pos.gap})`);
        });
      }
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

fixPositionsRLS();
