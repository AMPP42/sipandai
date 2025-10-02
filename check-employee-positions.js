// Script to check positions data from employees table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkEmployeePositions() {
  try {
    console.log('🔍 Checking positions data from employees table...\n');
    
    const targetUnit = 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas';
    
    // Check all employees for the target unit
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, nama, nip, unit, jabatan, pangkat')
      .eq('unit', targetUnit);
    
    if (empError) {
      console.log('❌ Error loading employees:', empError.message);
      return;
    }
    
    console.log(`📊 Found ${employees?.length || 0} employees in target unit`);
    
    if (employees && employees.length > 0) {
      console.log('\n📋 Employees in target unit:');
      employees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.nama} - ${emp.jabatan} (${emp.pangkat})`);
      });
      
      // Check for specific positions mentioned
      const analisSDM = employees.filter(emp => 
        emp.jabatan.toLowerCase().includes('analis') && 
        emp.jabatan.toLowerCase().includes('sdm')
      );
      
      const konselorSDM = employees.filter(emp => 
        emp.jabatan.toLowerCase().includes('konselor') && 
        emp.jabatan.toLowerCase().includes('sdm')
      );
      
      console.log(`\n🎯 Analis SDM positions: ${analisSDM.length}`);
      if (analisSDM.length > 0) {
        analisSDM.forEach(emp => {
          console.log(`   - ${emp.jabatan}`);
        });
      }
      
      console.log(`\n🎯 Konselor SDM positions: ${konselorSDM.length}`);
      if (konselorSDM.length > 0) {
        konselorSDM.forEach(emp => {
          console.log(`   - ${emp.jabatan}`);
        });
      }
      
      // Check all unique positions in this unit
      const uniquePositions = [...new Set(employees.map(emp => emp.jabatan))];
      console.log(`\n📋 All unique positions in this unit (${uniquePositions.length}):`);
      uniquePositions.forEach((pos, index) => {
        console.log(`${index + 1}. ${pos}`);
      });
    }
    
    // Check if there are any positions in the positions table that match
    console.log('\n🔍 Checking positions table for matching data...');
    const { data: positions, error: posError } = await supabase
      .from('positions')
      .select('*')
      .ilike('unit', `%${targetUnit.split(' ')[0]}%`); // Check for partial matches
    
    if (posError) {
      console.log('❌ Error loading positions:', posError.message);
    } else {
      console.log(`📊 Found ${positions?.length || 0} positions with similar unit name`);
      if (positions && positions.length > 0) {
        positions.forEach((pos, index) => {
          console.log(`${index + 1}. ${pos.unit} - ${pos.jabatan} (Gap: ${pos.gap || 'N/A'})`);
        });
      }
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkEmployeePositions();
