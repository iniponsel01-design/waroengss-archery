import { google } from 'googleapis';
import { readFileSync } from 'fs';

const FOLDER_ID = '1-fsyQKxeXwUGU8b616sq60Jx5etkgfhV';
const KEY_FILE = './service-account.json';

const credentials = JSON.parse(readFileSync(KEY_FILE, 'utf8'));
console.log('Service Account:', credentials.client_email);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

try {
  // Test 1: koneksi dasar
  const about = await drive.about.get({ fields: 'user' });
  console.log('✅ Koneksi OK:', about.data.user?.emailAddress);

  // Test 2: akses folder
  const folder = await drive.files.get({
    fileId: FOLDER_ID,
    fields: 'id,name,mimeType',
  });
  console.log('✅ Folder OK:', folder.data.name, '|', folder.data.id);

  // Test 3: list isi folder
  const list = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType)',
    pageSize: 20,
  });
  const files = list.data.files || [];
  console.log(`✅ Isi folder: ${files.length} item`);
  files.forEach(f => console.log('  -', f.name, '|', f.mimeType));

  if (files.length === 0) {
    console.log('  (folder kosong — belum ada file)');
  }

} catch (e) {
  console.error('❌ Error:', e.message);
  if (e.code === 404) {
    console.error('   → Folder tidak ditemukan atau belum di-share');
    console.error('   → Pastikan folder di-share ke:', credentials.client_email);
  } else if (e.code === 403) {
    console.error('   → Akses ditolak. Kemungkinan:');
    console.error('     1. Google Drive API belum diaktifkan');
    console.error('     2. Folder belum di-share ke service account');
  } else if (e.code === 400) {
    console.error('   → Google Drive API belum diaktifkan di Google Cloud Console');
    console.error('   → Buka: https://console.cloud.google.com/apis/library/drive.googleapis.com');
  }
}
