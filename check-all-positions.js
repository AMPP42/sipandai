// Script to check all positions and employees data
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllPositions() {
  try {
    console.log('🔍 Checking all positions and employees data...\n');
    
    // Check all employees
    const { data: allEmployees, error: empError } = await supabase
      .from('employees')
      .select('id, nama, nip, unit, jabatan, pangkat');
    
    if (empError) {
      console.log('❌ Error loading employees:', empError.message);
      return;
    }
    
    console.log(`📊 Total employees in database: ${allEmployees?.length || 0}`);
    
    if (allEmployees && allEmployees.length > 0) {
      console.log('\n📋 All employees:');
      allEmployees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.nama} - ${emp.unit} - ${emp.jabatan}`);
      });
      
      // Check for employees with "Sekretariat" in unit name
      const sekretariatEmployees = allEmployees.filter(emp => 
        emp.unit.toLowerCase().includes('sekretariat')
      );
      
      console.log(`\n🎯 Employees with "Sekretariat" in unit name: ${sekretariatEmployees.length}`);
      if (sekretariatEmployees.length > 0) {
        sekretariatEmployees.forEach((emp, index) => {
          console.log(`${index + 1}. ${emp.nama} - ${emp.unit} - ${emp.jabatan}`);
        });
      }
      
      // Check for specific positions
      const analisPositions = allEmployees.filter(emp => 
        emp.jabatan.toLowerCase().includes('analis')
      );
      
      const konselorPositions = allEmployees.filter(emp => 
        emp.jabatan.toLowerCase().includes('konselor')
      );
      
      console.log(`\n🎯 Employees with "Analis" in jabatan: ${analisPositions.length}`);
      if (analisPositions.length > 0) {
        analisPositions.forEach((emp, index) => {
          console.log(`${index + 1}. ${emp.nama} - ${emp.unit} - ${emp.jabatan}`);
        });
      }
      
      console.log(`\n🎯 Employees with "Konselor" in jabatan: ${konselorPositions.length}`);
      if (konselorPositions.length > 0) {
        konselorPositions.forEach((emp, index) => {
          console.log(`${index + 1}. ${emp.nama} - ${emp.unit} - ${emp.jabatan}`);
        });
      }
    }
    
    // Check all positions in positions table
    console.log('\n🔍 Checking positions table...');
    const { data: allPositions, error: posError } = await supabase
      .from('positions')
      .select('*');
    
    if (posError) {
      console.log('❌ Error loading positions:', posError.message);
    } else {
      console.log(`📊 Total positions in database: ${allPositions?.length || 0}`);
      
      if (allPositions && allPositions.length > 0) {
        console.log('\n📋 All positions:');
        allPositions.forEach((pos, index) => {
          console.log(`${index + 1}. ${pos.unit} - ${pos.jabatan} (Gap: ${pos.gap || 'N/A'})`);
        });
      }
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkAllPositions();
