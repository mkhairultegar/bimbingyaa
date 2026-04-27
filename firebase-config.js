// =====================================================
// FIREBASE CONFIGURATION
// Ganti nilai di bawah ini dengan konfigurasi Firebase proyekmu
// Buat project di: https://console.firebase.google.com
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyBDDyaDm-kCMwwv-71fPa4z3sVP8tHydbo",
  authDomain: "bimbingyaa.firebaseapp.com",
  projectId: "bimbingyaa",
  storageBucket: "bimbingyaa.firebasestorage.app",
  messagingSenderId: "809754227939",
  appId: "1:809754227939:web:d6d9fd7e884965810541d6",
  measurementId: "G-EKYM4E6ZQ3"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// =====================================================
// SAMPLE DATA - Jalankan sekali untuk mengisi Firestore
// Buka console browser dan panggil: seedSampleData()
// =====================================================
async function seedSampleData() {
  console.log("Memulai pengisian sample data...");

  // Sample users (password: demo1234)
  const usersData = [
    { email: "admin@thesis.id",    role: "admin",     name: "Admin Sistem",       nim: "-",          jurusan: "-" },
    { email: "writer@thesis.id",   role: "writer",    name: "Sari Penulis",       nim: "W001",       jurusan: "Teknik Informatika" },
    { email: "developer@thesis.id",role: "developer", name: "Budi Developer",     nim: "D001",       jurusan: "Sistem Informasi" },
    { email: "client@thesis.id",   role: "client",    name: "Andi Mahasiswa",     nim: "C2021001",   jurusan: "Manajemen Bisnis" },
  ];

  console.log("Sample credentials:");
  usersData.forEach(u => console.log(`  ${u.role}: ${u.email} / demo1234`));
  console.log("Buat akun-akun ini manual di Firebase Auth Console, lalu jalankan seedProjectData()");
}

async function seedProjectData(writerId, developerId, clientId) {
  // Panggil setelah mendapat UID dari Firebase Auth
  // contoh: seedProjectData("uid_writer", "uid_developer", "uid_client")
  
  const projectRef = await db.collection("projects").add({
    name: "Sistem Informasi Manajemen Skripsi Berbasis Web",
    nim: "C2021001",
    jurusan: "Manajemen Bisnis",
    pembimbing: "Dr. Hendra Wijaya, M.Kom",
    client_id: clientId,
    writer_id: writerId,
    developer_id: developerId,
    status: "progress",
    created_at: firebase.firestore.FieldValue.serverTimestamp(),
    updated_at: firebase.firestore.FieldValue.serverTimestamp()
  });

  const updates = [
    { sender_role: "client",    message: "Selamat datang! Saya butuh bantuan skripsi tentang sistem informasi.", file_link: "" },
    { sender_role: "writer",    message: "Baik, kami siap membantu. Berikut draft outline BAB 1.", file_link: "https://drive.google.com/file/d/sample1" },
    { sender_role: "developer", message: "Desain ERD sudah saya buat. Silakan dicek.", file_link: "https://drive.google.com/file/d/sample2" },
    { sender_role: "client",    message: "Sudah saya cek, ada beberapa revisi di bagian metodologi.", file_link: "" },
  ];

  for (const upd of updates) {
    await db.collection("updates").add({
      project_id: projectRef.id,
      ...upd,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  console.log("Sample data berhasil dibuat! Project ID:", projectRef.id);
}
