// Script to check RLS policies for positions table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkPositionsRLS() {
  try {
    console.log('🔍 Checking RLS policies for positions table...\n');
    
    // Check current user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current user:', user ? `Authenticated (${user.id})` : 'Not authenticated');
    if (userError) console.log('❌ User error:', userError.message);
    
    // Try to query positions with different approaches
    console.log('\n🔍 Testing positions table access...');
    
    // 1. Basic select
    console.log('1️⃣ Basic select from positions:');
    const { data: basicData, error: basicError } = await supabase
      .from('positions')
      .select('*')
      .limit(5);
    
    if (basicError) {
      console.log('❌ Basic select error:', basicError.message);
      console.log('📋 Error details:', basicError);
    } else {
      console.log('✅ Basic select successful');
      console.log('📊 Found records:', basicData?.length || 0);
    }
    
    // 2. Try with specific columns
    console.log('\n2️⃣ Select specific columns:');
    const { data: colData, error: colError } = await supabase
      .from('positions')
      .select('id, unit, jabatan, existing, kebutuhan, gap')
      .limit(5);
    
    if (colError) {
      console.log('❌ Column select error:', colError.message);
    } else {
      console.log('✅ Column select successful');
      console.log('📊 Found records:', colData?.length || 0);
    }
    
    // 3. Try with count
    console.log('\n3️⃣ Count records:');
    const { count, error: countError } = await supabase
      .from('positions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Count error:', countError.message);
    } else {
      console.log('✅ Count successful');
      console.log('📊 Total records:', count);
    }
    
    // 4. Check if we can see the table structure
    console.log('\n4️⃣ Check table structure:');
    try {
      const { data: structureData, error: structureError } = await supabase
        .rpc('get_table_structure', { table_name: 'positions' });
      
      if (structureError) {
        console.log('❌ Structure error:', structureError.message);
      } else {
        console.log('✅ Structure query successful');
        console.log('📋 Table structure:', structureData);
      }
    } catch (err) {
      console.log('❌ Structure query exception:', err.message);
    }
    
    // 5. Try to check RLS policies directly
    console.log('\n5️⃣ Check RLS policies:');
    try {
      const { data: policiesData, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'positions');
      
      if (policiesError) {
        console.log('❌ Policies query error:', policiesError.message);
      } else {
        console.log('✅ Policies query successful');
        console.log('📋 RLS policies:', policiesData);
      }
    } catch (err) {
      console.log('❌ Policies query exception:', err.message);
    }
    
    // 6. Try with different authentication approach
    console.log('\n6️⃣ Try with service role (if available):');
    // This will fail with anon key, but let's see the error
    try {
      const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      
      const { data: serviceData, error: serviceError } = await serviceSupabase
        .from('positions')
        .select('*')
        .limit(5);
      
      if (serviceError) {
        console.log('❌ Service role error:', serviceError.message);
      } else {
        console.log('✅ Service role successful');
        console.log('📊 Found records:', serviceData?.length || 0);
      }
    } catch (err) {
      console.log('❌ Service role exception:', err.message);
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkPositionsRLS();
