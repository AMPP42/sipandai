// Script to check profiles and authentication
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkProfilesAndAuth() {
  try {
    console.log('🔍 Checking profiles and authentication...\n');
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current user:', user ? `Authenticated (${user.id})` : 'Not authenticated');
    if (userError) console.log('❌ User error:', userError.message);
    
    // Check profiles table
    console.log('\n🔍 Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
    } else {
      console.log('✅ Profiles accessible');
      console.log('📊 Found profiles:', profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        console.log('📋 Sample profile:', profiles[0]);
      }
    }
    
    // Check if we can access positions with different approaches
    console.log('\n🔍 Testing positions access with different approaches...');
    
    // 1. Try to bypass RLS by using a different query approach
    console.log('1️⃣ Try RPC function approach:');
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_positions');
      
      if (rpcError) {
        console.log('❌ RPC error:', rpcError.message);
      } else {
        console.log('✅ RPC successful');
        console.log('📊 Found positions:', rpcData?.length || 0);
      }
    } catch (err) {
      console.log('❌ RPC exception:', err.message);
    }
    
    // 2. Try to create a simple RPC function to get positions
    console.log('\n2️⃣ Try to create RPC function for positions:');
    try {
      const { data: createRpcData, error: createRpcError } = await supabase
        .rpc('create_get_positions_function');
      
      if (createRpcError) {
        console.log('❌ Create RPC error:', createRpcError.message);
      } else {
        console.log('✅ Create RPC successful');
      }
    } catch (err) {
      console.log('❌ Create RPC exception:', err.message);
    }
    
    // 3. Check if there's a way to temporarily disable RLS
    console.log('\n3️⃣ Check RLS status:');
    try {
      const { data: rlsData, error: rlsError } = await supabase
        .from('pg_class')
        .select('relname, relrowsecurity')
        .eq('relname', 'positions');
      
      if (rlsError) {
        console.log('❌ RLS check error:', rlsError.message);
      } else {
        console.log('✅ RLS check successful');
        console.log('📋 RLS status:', rlsData);
      }
    } catch (err) {
      console.log('❌ RLS check exception:', err.message);
    }
    
    // 4. Try to check if there are any public policies
    console.log('\n4️⃣ Check for public access policies:');
    try {
      const { data: publicPolicies, error: publicError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'positions')
        .eq('roles', 'public');
      
      if (publicError) {
        console.log('❌ Public policies error:', publicError.message);
      } else {
        console.log('✅ Public policies check successful');
        console.log('📋 Public policies:', publicPolicies);
      }
    } catch (err) {
      console.log('❌ Public policies exception:', err.message);
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkProfilesAndAuth();
