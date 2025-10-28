const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'surat_desa'
};

async function syncWargaToUsers() {
  let connection;
  
  try {
    // Koneksi ke database
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Terhubung ke database');

    // Generate hash untuk password default
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    console.log('✓ Password hash dibuat:', hashedPassword);

    // Tambahkan kolom tambahan jika belum ada
    console.log('\nMenambahkan kolom tambahan ke tabel users...');
    const alterTableQueries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(50) AFTER alamat',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS tanggal_lahir DATE AFTER tempat_lahir',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS jenis_kelamin ENUM("Laki-laki","Perempuan") AFTER tanggal_lahir',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS pekerjaan VARCHAR(50) AFTER jenis_kelamin',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS agama VARCHAR(20) AFTER pekerjaan',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS status_perkawinan VARCHAR(50) AFTER agama',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS kewarganegaraan VARCHAR(50) AFTER status_perkawinan',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS pendidikan VARCHAR(50) AFTER kewarganegaraan',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS golongan_darah VARCHAR(5) AFTER pendidikan',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS dusun VARCHAR(50) AFTER golongan_darah',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS no_kk VARCHAR(20) AFTER dusun',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS nama_kepala_keluarga VARCHAR(100) AFTER no_kk',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS hubungan_keluarga VARCHAR(50) AFTER nama_kepala_keluarga'
    ];

    for (const query of alterTableQueries) {
      try {
        await connection.query(query);
      } catch (err) {
        // Abaikan error jika kolom sudah ada
        if (!err.message.includes('Duplicate column name')) {
          console.log('  ⚠ Warning:', err.message);
        }
      }
    }
    console.log('✓ Kolom tambahan berhasil ditambahkan');

    // Ambil data warga yang belum ada di users
    console.log('\nMengambil data warga...');
    const [wargaData] = await connection.query(`
      SELECT 
        w.nik,
        w.nama_anggota_keluarga,
        w.alamat,
        w.rt,
        w.rw,
        w.tempat_lahir,
        w.tanggal_lahir,
        w.jenis_kelamin,
        w.pekerjaan,
        w.agama,
        w.status_pernikahan,
        w.kewarganegaraan,
        w.pendidikan,
        w.golongan_darah,
        w.dusun,
        w.no_kk,
        w.nama_kepala_keluarga,
        w.hubungan_keluarga
      FROM warga w
      WHERE w.nik IS NOT NULL 
        AND w.nik != '' 
        AND LENGTH(w.nik) = 16
    `);

    console.log(`✓ Ditemukan ${wargaData.length} data warga`);

    // Sinkronisasi setiap warga ke tabel users
    console.log('\nMemulai sinkronisasi...');
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const warga of wargaData) {
      try {
        // Cek apakah NIK sudah ada di users
        const [existing] = await connection.query(
          'SELECT id FROM users WHERE nik = ?',
          [warga.nik]
        );

        if (existing.length > 0) {
          // Update data yang sudah ada
          await connection.query(`
            UPDATE users SET
              nama = ?,
              alamat = ?,
              rt = ?,
              rw = ?,
              tempat_lahir = ?,
              tanggal_lahir = ?,
              jenis_kelamin = ?,
              pekerjaan = ?,
              agama = ?,
              status_perkawinan = ?,
              kewarganegaraan = ?,
              pendidikan = ?,
              golongan_darah = ?,
              dusun = ?,
              no_kk = ?,
              nama_kepala_keluarga = ?,
              hubungan_keluarga = ?,
              updated_at = NOW()
            WHERE nik = ?
          `, [
            warga.nama_anggota_keluarga,
            warga.alamat,
            warga.rt,
            warga.rw,
            warga.tempat_lahir,
            warga.tanggal_lahir,
            warga.jenis_kelamin,
            warga.pekerjaan,
            warga.agama,
            warga.status_pernikahan,
            warga.kewarganegaraan,
            warga.pendidikan,
            warga.golongan_darah,
            warga.dusun,
            warga.no_kk,
            warga.nama_kepala_keluarga,
            warga.hubungan_keluarga,
            warga.nik
          ]);
          updated++;
        } else {
          // Insert data baru
          await connection.query(`
            INSERT INTO users (
              nik,
              nama,
              email,
              password,
              role,
              no_telepon,
              alamat,
              rt,
              rw,
              tempat_lahir,
              tanggal_lahir,
              jenis_kelamin,
              pekerjaan,
              agama,
              status_perkawinan,
              kewarganegaraan,
              pendidikan,
              golongan_darah,
              dusun,
              no_kk,
              nama_kepala_keluarga,
              hubungan_keluarga,
              status,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            warga.nik,
            warga.nama_anggota_keluarga,
            `${warga.nik}@warga.desa`,
            hashedPassword,
            'warga',
            '',
            warga.alamat,
            warga.rt,
            warga.rw,
            warga.tempat_lahir,
            warga.tanggal_lahir,
            warga.jenis_kelamin,
            warga.pekerjaan,
            warga.agama,
            warga.status_pernikahan,
            warga.kewarganegaraan,
            warga.pendidikan,
            warga.golongan_darah,
            warga.dusun,
            warga.no_kk,
            warga.nama_kepala_keluarga,
            warga.hubungan_keluarga,
            'aktif'
          ]);
          inserted++;
        }
      } catch (err) {
        console.error(`  ✗ Error untuk NIK ${warga.nik}:`, err.message);
        errors++;
      }
    }

    console.log('\nSINKRONISASI SELESAI');
    console.log('========================');
    console.log(`📥 Data baru ditambahkan: ${inserted}`);
    console.log(`Data diupdate: ${updated}`);
    console.log(`Error: ${errors}`);
    console.log(`Total data warga: ${wargaData.length}`);

    // Tampilkan statistik
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_user_warga,
        COUNT(DISTINCT rt) as total_rt,
        COUNT(DISTINCT rw) as total_rw
      FROM users 
      WHERE role = 'warga'
    `);

    console.log('\n📈 STATISTIK USER WARGA');
    console.log('========================');
    console.log(`Total user warga: ${stats[0].total_user_warga}`);
    console.log(`Total RT: ${stats[0].total_rt}`);
    console.log(`Total RW: ${stats[0].total_rw}`);
    console.log('\nINFORMASI LOGIN');
    console.log('========================');
    console.log('Username: NIK warga (16 digit)');
    console.log('Password: password123');
    console.log('Contoh: NIK 3201155206690002 / password123');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Koneksi database ditutup');
    }
  }
}

// Jalankan fungsi
console.log('SINKRONISASI DATA WARGA KE USERS');
console.log('====================================\n');
syncWargaToUsers();
