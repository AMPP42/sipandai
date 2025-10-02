// Script to debug positions data issue
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugPositions() {
  try {
    console.log('🔍 Debugging positions data...\n');
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current user:', user ? 'Authenticated' : 'Not authenticated');
    if (userError) console.log('❌ User error:', userError.message);
    
    // Try different table names
    const tableNames = ['positions', 'formasi_jabatan', 'position', 'formasi'];
    
    for (const tableName of tableNames) {
      console.log(`\n🔍 Checking table: ${tableName}`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
        
        if (error) {
          console.log(`❌ Error with ${tableName}:`, error.message);
        } else {
          console.log(`✅ ${tableName} accessible, found ${data?.length || 0} records`);
          if (data && data.length > 0) {
            console.log('📋 Sample data:', data[0]);
          }
        }
      } catch (err) {
        console.log(`❌ Exception with ${tableName}:`, err.message);
      }
    }
    
    // Check if there are any tables with 'position' in the name
    console.log('\n🔍 Checking for tables with position-related names...');
    
    // Try to query information_schema to see available tables
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .ilike('table_name', '%position%');
      
      if (tablesError) {
        console.log('❌ Error querying information_schema:', tablesError.message);
      } else {
        console.log('📋 Tables with "position" in name:', tables?.map(t => t.table_name) || []);
      }
    } catch (err) {
      console.log('❌ Exception querying information_schema:', err.message);
    }
    
    // Check if there's a different table structure
    console.log('\n🔍 Checking for alternative table structures...');
    
    // Try to find tables that might contain position data
    const alternativeQueries = [
      { table: 'employees', description: 'Check if positions are stored in employees table' },
      { table: 'work_units', description: 'Check work units structure' },
      { table: 'applications', description: 'Check applications table for position data' }
    ];
    
    for (const query of alternativeQueries) {
      try {
        const { data, error } = await supabase
          .from(query.table)
          .select('*')
          .limit(3);
        
        if (error) {
          console.log(`❌ Error with ${query.table}:`, error.message);
        } else {
          console.log(`✅ ${query.table} accessible`);
          console.log(`📋 ${query.description}`);
          if (data && data.length > 0) {
            console.log('📊 Sample columns:', Object.keys(data[0]));
            // Check if this table contains position-related data
            const sampleData = data[0];
            if (sampleData.jabatan || sampleData.position || sampleData.unit) {
              console.log('🎯 This table might contain position data!');
              console.log('📋 Sample record:', sampleData);
            }
          }
        }
      } catch (err) {
        console.log(`❌ Exception with ${query.table}:`, err.message);
      }
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

debugPositions();
