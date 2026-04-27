// =====================================================
// APP.JS — Inisialisasi & Auth State Observer
// =====================================================

const app = {
  init() {
    // Tampilkan loading screen dulu
    document.getElementById('app').innerHTML = `
      <div class="splash-screen">
        <div class="splash-logo">📚</div>
        <h1>ThesisTrack</h1>
        <p>Sistem Manajemen Skripsi</p>
        <div class="spinner-lg"></div>
      </div>
    `;

    // Listen auth state
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userSnap = await db.collection('users').doc(user.uid).get();
          if (userSnap.exists) {
            const userData = userSnap.data();
            dashboard.init(user, userData);
          } else {
            // User ada di Auth tapi belum ada di Firestore
            // Buat record default sebagai client
            const newUser = {
              uid: user.uid,
              name: user.displayName || user.email.split('@')[0],
              email: user.email,
              role: 'client',
              nim: '-',
              jurusan: '-',
              created_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('users').doc(user.uid).set(newUser);
            dashboard.init(user, newUser);
          }
        } catch (err) {
          console.error('Error loading user data:', err);
          document.getElementById('app').innerHTML = `
            <div class="splash-screen">
              <p class="error-text">❌ Gagal memuat data. <button onclick="app.logout()">Coba Lagi</button></p>
            </div>
          `;
        }
      } else {
        // Tidak login → tampilkan halaman auth
        authPage.init();
      }
    });
  },

  async logout() {
    try {
      // Bersihkan listeners
      dashboard.unsubscribers?.forEach(fn => fn());
      projectDetail.unsubscribers?.forEach(fn => fn());
      await auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
};

// Mulai app saat DOM siap
document.addEventListener('DOMContentLoaded', () => app.init());
