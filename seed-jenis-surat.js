#!/usr/bin/env node

/**
 * Script untuk testing fitur Jenis Surat
 * Menambahkan beberapa jenis surat contoh ke database
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Login sebagai super admin
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@desa.com',
      password: 'admin123'
    });
    return response.data.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Jenis surat contoh
const jenisSuratData = [
  {
    nama_surat: 'Surat Keterangan Domisili',
    kode_surat: 'SKD',
    deskripsi: 'Surat keterangan tempat tinggal warga',
    template_konten: `Yang bertanda tangan di bawah ini, Kepala Desa Cibadak Kecamatan Ciampea Kabupaten Bogor, dengan ini menerangkan bahwa:

Nama             : {{nama}}
NIK              : {{nik}}
Tempat/Tgl Lahir : {{tempat_lahir}}, {{tanggal_lahir}}
Jenis Kelamin    : {{jenis_kelamin}}
Alamat           : {{alamat}}
RT/RW            : {{rt}}/{{rw}}

Adalah benar warga kami yang berdomisili di wilayah kami sejak tahun {{tahun_tinggal}}.

Demikian surat keterangan domisili ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,
    fields: [
      { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
      { name: 'nik', label: 'NIK', type: 'text', required: true },
      { name: 'tempat_lahir', label: 'Tempat Lahir', type: 'text', required: true },
      { name: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date', required: true },
      { name: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', required: true, options: ['Laki-laki', 'Perempuan'] },
      { name: 'alamat', label: 'Alamat', type: 'textarea', required: true },
      { name: 'rt', label: 'RT', type: 'text', required: true },
      { name: 'rw', label: 'RW', type: 'text', required: true },
      { name: 'tahun_tinggal', label: 'Tahun Mulai Tinggal', type: 'number', required: true }
    ],
    require_verification: true,
    status: 'aktif'
  },
  {
    nama_surat: 'Surat Keterangan Usaha',
    kode_surat: 'SKU',
    deskripsi: 'Surat keterangan memiliki usaha',
    template_konten: `Yang bertanda tangan di bawah ini, Kepala Desa Cibadak Kecamatan Ciampea Kabupaten Bogor, dengan ini menerangkan bahwa:

Nama             : {{nama}}
NIK              : {{nik}}
Alamat           : {{alamat}}
RT/RW            : {{rt}}/{{rw}}

Adalah benar memiliki usaha dengan data sebagai berikut:

Nama Usaha       : {{nama_usaha}}
Jenis Usaha      : {{jenis_usaha}}
Alamat Usaha     : {{alamat_usaha}}
Berdiri Sejak    : {{tahun_berdiri}}

Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,
    fields: [
      { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
      { name: 'nik', label: 'NIK', type: 'text', required: true },
      { name: 'alamat', label: 'Alamat', type: 'textarea', required: true },
      { name: 'rt', label: 'RT', type: 'text', required: true },
      { name: 'rw', label: 'RW', type: 'text', required: true },
      { name: 'nama_usaha', label: 'Nama Usaha', type: 'text', required: true },
      { name: 'jenis_usaha', label: 'Jenis Usaha', type: 'text', required: true },
      { name: 'alamat_usaha', label: 'Alamat Usaha', type: 'textarea', required: true },
      { name: 'tahun_berdiri', label: 'Tahun Berdiri', type: 'number', required: true }
    ],
    require_verification: true,
    status: 'aktif'
  },
  {
    nama_surat: 'Surat Keterangan Tidak Mampu',
    kode_surat: 'SKTM',
    deskripsi: 'Surat keterangan tidak mampu',
    template_konten: `Yang bertanda tangan di bawah ini, Kepala Desa Cibadak Kecamatan Ciampea Kabupaten Bogor, dengan ini menerangkan bahwa:

Nama             : {{nama}}
NIK              : {{nik}}
Tempat/Tgl Lahir : {{tempat_lahir}}, {{tanggal_lahir}}
Jenis Kelamin    : {{jenis_kelamin}}
Pekerjaan        : {{pekerjaan}}
Penghasilan      : {{penghasilan}}
Alamat           : {{alamat}}
RT/RW            : {{rt}}/{{rw}}

Adalah benar warga kami yang tergolong keluarga kurang mampu/tidak mampu.

Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,
    fields: [
      { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
      { name: 'nik', label: 'NIK', type: 'text', required: true },
      { name: 'tempat_lahir', label: 'Tempat Lahir', type: 'text', required: true },
      { name: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date', required: true },
      { name: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', required: true, options: ['Laki-laki', 'Perempuan'] },
      { name: 'pekerjaan', label: 'Pekerjaan', type: 'text', required: true },
      { name: 'penghasilan', label: 'Penghasilan per Bulan', type: 'text', required: true },
      { name: 'alamat', label: 'Alamat', type: 'textarea', required: true },
      { name: 'rt', label: 'RT', type: 'text', required: true },
      { name: 'rw', label: 'RW', type: 'text', required: true }
    ],
    require_verification: true,
    status: 'aktif'
  },
  {
    nama_surat: 'Surat Pengantar Nikah',
    kode_surat: 'SPN',
    deskripsi: 'Surat pengantar untuk menikah',
    template_konten: `Yang bertanda tangan di bawah ini, Kepala Desa Cibadak Kecamatan Ciampea Kabupaten Bogor, dengan ini menerangkan bahwa:

CALON SUAMI:
Nama             : {{nama_pria}}
NIK              : {{nik_pria}}
Tempat/Tgl Lahir : {{tempat_lahir_pria}}, {{tanggal_lahir_pria}}
Pekerjaan        : {{pekerjaan_pria}}
Alamat           : {{alamat_pria}}

CALON ISTRI:
Nama             : {{nama_wanita}}
NIK              : {{nik_wanita}}
Tempat/Tgl Lahir : {{tempat_lahir_wanita}}, {{tanggal_lahir_wanita}}
Pekerjaan        : {{pekerjaan_wanita}}
Alamat           : {{alamat_wanita}}

Adalah benar keduanya akan melangsungkan pernikahan pada:
Tempat           : {{tempat_nikah}}
Tanggal          : {{tanggal_nikah}}

Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,
    fields: [
      { name: 'nama_pria', label: 'Nama Calon Suami', type: 'text', required: true },
      { name: 'nik_pria', label: 'NIK Calon Suami', type: 'text', required: true },
      { name: 'tempat_lahir_pria', label: 'Tempat Lahir Calon Suami', type: 'text', required: true },
      { name: 'tanggal_lahir_pria', label: 'Tanggal Lahir Calon Suami', type: 'date', required: true },
      { name: 'pekerjaan_pria', label: 'Pekerjaan Calon Suami', type: 'text', required: true },
      { name: 'alamat_pria', label: 'Alamat Calon Suami', type: 'textarea', required: true },
      { name: 'nama_wanita', label: 'Nama Calon Istri', type: 'text', required: true },
      { name: 'nik_wanita', label: 'NIK Calon Istri', type: 'text', required: true },
      { name: 'tempat_lahir_wanita', label: 'Tempat Lahir Calon Istri', type: 'text', required: true },
      { name: 'tanggal_lahir_wanita', label: 'Tanggal Lahir Calon Istri', type: 'date', required: true },
      { name: 'pekerjaan_wanita', label: 'Pekerjaan Calon Istri', type: 'text', required: true },
      { name: 'alamat_wanita', label: 'Alamat Calon Istri', type: 'textarea', required: true },
      { name: 'tempat_nikah', label: 'Tempat Pernikahan', type: 'text', required: true },
      { name: 'tanggal_nikah', label: 'Tanggal Pernikahan', type: 'date', required: true }
    ],
    require_verification: true,
    status: 'aktif'
  }
];

async function createJenisSurat(token) {
  console.log('\nMenambahkan jenis surat contoh...\n');
  
  for (const data of jenisSuratData) {
    try {
      await axios.post(`${BASE_URL}/admin/jenis-surat`, data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`${data.nama_surat} (${data.kode_surat}) berhasil ditambahkan`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`${data.nama_surat} sudah ada, dilewati`);
      } else {
        console.error(`${data.nama_surat} gagal:`, error.response?.data?.message || error.message);
      }
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   Test Fitur Jenis Surat');
  console.log('═══════════════════════════════════════');
  
  console.log('\n🔐 Login sebagai Super Admin...');
  const token = await login();
  console.log('Login berhasil!\n');
  
  await createJenisSurat(token);
  
  console.log('\n═══════════════════════════════════════');
  console.log('Selesai!');
  console.log('═══════════════════════════════════════');
  console.log('\nSilakan buka aplikasi dan cek:');
  console.log('   1. Super Admin → Jenis Surat');
  console.log('   2. Warga → Ajukan Surat');
  console.log('\n');
}

main().catch(error => {
  console.error('\nError:', error.message);
  process.exit(1);
});
