// Script untuk admin mengisi data positions
// Jalankan script ini dengan service role key atau sebagai admin

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://puiisklsrqzhigmnxeey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aWlza2xzcnF6aGlnbW54ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDQxMzMsImV4cCI6MjA3MjI4MDEzM30._BFYvIz0Rf3WYtBzjexDIRyoo2RWiRkMSIBAxctNx9Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function adminSeedPositions() {
  try {
    console.log('🔧 Admin: Seeding positions data...\n');
    
    // Sample positions data
    const positionsData = [
      // Sekretariat Direktorat Jenderal
      {
        unit: 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas',
        jabatan: 'Direktur Jenderal',
        existing: 1,
        kebutuhan: 1
      },
      {
        unit: 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas',
        jabatan: 'Sekretaris Direktorat Jenderal',
        existing: 1,
        kebutuhan: 1
      },
      {
        unit: 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas',
        jabatan: 'Kepala Bagian Umum',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas',
        jabatan: 'Kepala Bagian Keuangan',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas',
        jabatan: 'Staff Administrasi',
        existing: 2,
        kebutuhan: 5
      },
      
      // Direktorat Pembinaan Standarisasi Kompetensi
      {
        unit: 'Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan',
        jabatan: 'Direktur',
        existing: 1,
        kebutuhan: 1
      },
      {
        unit: 'Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan',
        jabatan: 'Sekretaris Direktorat',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan',
        jabatan: 'Kepala Bidang Standarisasi',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan',
        jabatan: 'Kepala Bidang Program Pelatihan',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan',
        jabatan: 'Analis Kebijakan',
        existing: 1,
        kebutuhan: 3
      },
      
      // Direktorat Pembinaan Kelembagaan Pelatihan Vokasi
      {
        unit: 'Direktorat Pembinaan Kelembagaan Pelatihan Vokasi',
        jabatan: 'Direktur',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Direktorat Pembinaan Kelembagaan Pelatihan Vokasi',
        jabatan: 'Sekretaris Direktorat',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Direktorat Pembinaan Kelembagaan Pelatihan Vokasi',
        jabatan: 'Kepala Bidang Kelembagaan',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Direktorat Pembinaan Kelembagaan Pelatihan Vokasi',
        jabatan: 'Kepala Bidang Vokasi',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Direktorat Pembinaan Kelembagaan Pelatihan Vokasi',
        jabatan: 'Staff Kelembagaan',
        existing: 1,
        kebutuhan: 4
      },
      
      // Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi
      {
        unit: 'Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi',
        jabatan: 'Kepala Balai Besar',
        existing: 1,
        kebutuhan: 1
      },
      {
        unit: 'Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi',
        jabatan: 'Sekretaris Balai Besar',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi',
        jabatan: 'Kepala Bagian Administrasi',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi',
        jabatan: 'Kepala Bagian Teknis',
        existing: 0,
        kebutuhan: 1
      },
      {
        unit: 'Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi',
        jabatan: 'Instruktur Pelatihan',
        existing: 2,
        kebutuhan: 8
      },
      {
        unit: 'Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi',
        jabatan: 'Staff Administrasi',
        existing: 1,
        kebutuhan: 3
      }
    ];
    
    console.log(`📊 Inserting ${positionsData.length} positions...`);
    
    // Insert data in batches
    const batchSize = 5;
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
    
    console.log('\n🎉 Data seeding completed!');
    console.log('💡 You can now use the Pengajuan Mutasi Terpadu feature.');
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

// Instructions for admin
console.log('🔧 ADMIN INSTRUCTIONS:');
console.log('1. This script will seed the positions table with sample data');
console.log('2. Make sure you have admin privileges or service role key');
console.log('3. Run: node admin-seed-positions.js');
console.log('4. After running, the Pengajuan Mutasi Terpadu feature should work\n');

adminSeedPositions();
