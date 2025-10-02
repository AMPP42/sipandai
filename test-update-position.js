import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://puiisklsrqzhigmnxeey.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdatePosition() {
  console.log('🧪 Testing UPDATE operation on positions table...\n');

  try {
    // First, get the position with typo
    const { data: positions, error: fetchError } = await supabase
      .from('positions')
      .select('*')
      .eq('unit', 'Sekretriat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas');

    if (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
      return;
    }

    if (!positions || positions.length === 0) {
      console.log('⚠️  Position with typo not found. It may have been fixed already.');
      
      // Check all positions
      const { data: allPositions } = await supabase
        .from('positions')
        .select('*');
      
      console.log('\n📊 Current positions in database:');
      allPositions?.forEach((pos, i) => {
        console.log(`${i + 1}. ${pos.unit} - ${pos.jabatan}`);
      });
      return;
    }

    const positionToUpdate = positions[0];
    console.log('✅ Found position with typo:');
    console.log(`   ID: ${positionToUpdate.id}`);
    console.log(`   Current unit: "${positionToUpdate.unit}"`);
    console.log(`   Jabatan: ${positionToUpdate.jabatan}`);

    // Try to update it
    console.log('\n🔄 Attempting to fix typo...');
    const { data: updatedData, error: updateError } = await supabase
      .from('positions')
      .update({
        unit: 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas'
      })
      .eq('id', positionToUpdate.id)
      .select();

    if (updateError) {
      console.log('❌ Update error:', updateError.message);
      console.log('📋 Error details:', updateError);
      console.log('\n💡 This means RLS policies are blocking UPDATE operations.');
      console.log('   Please run: fix-positions-update-rls.sql');
      return;
    }

    console.log('✅ Update successful!');
    console.log(`   New unit: "${updatedData[0].unit}"`);

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const { data: verifyData } = await supabase
      .from('positions')
      .select('*')
      .eq('unit', 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas');

    console.log(`✅ Total positions with correct unit name: ${verifyData?.length || 0}`);
    if (verifyData && verifyData.length > 0) {
      verifyData.forEach((pos, i) => {
        console.log(`   ${i + 1}. ${pos.jabatan} (Gap: ${pos.gap})`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testUpdatePosition();
