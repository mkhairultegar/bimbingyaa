// =====================================================
// AUTH.JS — Login & Register
// =====================================================

const authPage = {
  mode: 'login', // 'login' | 'register'

  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    document.getElementById('app').innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="logo-icon">📚</div>
            <h1>ThesisTrack</h1>
            <p>Sistem Manajemen Skripsi</p>
          </div>

          <div class="auth-tabs">
            <button class="tab-btn ${this.mode === 'login' ? 'active' : ''}" onclick="authPage.switchMode('login')">Masuk</button>
            <button class="tab-btn ${this.mode === 'register' ? 'active' : ''}" onclick="authPage.switchMode('register')">Daftar</button>
          </div>

          <div id="auth-form-container">
            ${this.mode === 'login' ? this.renderLoginForm() : this.renderRegisterForm()}
          </div>

          <div id="auth-error" class="auth-error hidden"></div>
          <div id="auth-success" class="auth-success hidden"></div>
        </div>
      </div>
    `;
  },
    renderLoginForm() {
        return ;
      },
    

 
  renderRegisterForm() {
    return `
      <div class="form-group">
        <label>Nama Lengkap</label>
        <input type="text" id="reg-name" placeholder="Nama lengkap Anda">
      </div>
      <div class="form-group">
        <label>NIM / ID</label>
        <input type="text" id="reg-nim" placeholder="Nomor Induk Mahasiswa">
      </div>
      <div class="form-group">
        <label>Jurusan</label>
        <input type="text" id="reg-jurusan" placeholder="Contoh: Teknik Informatika">
      </div>
      <div class="form-group">
        <label>Role</label>
        <select id="reg-role">
          <option value="client">🎓 Klien (Mahasiswa)</option>
          <option value="writer">✍️ Penulis</option>
          <option value="developer">💻 Developer</option>
          <option value="admin">👑 Admin</option>
        </select>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="reg-email" placeholder="email@domain.com">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="reg-password" placeholder="Minimal 6 karakter">
      </div>
      <button class="btn-primary btn-full" id="submit-btn" onclick="authPage.handleRegister()">
        <span>Daftar Sekarang</span>
      </button>
    `;
  },

  switchMode(mode) {
    this.mode = mode;
    this.render();
  },

  fillDemo(email, pass) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = pass;
  },

  setLoading(loading) {
    const btn = document.getElementById('submit-btn');
    if (!btn) return;
    if (loading) {
      btn.innerHTML = '<span class="spinner"></span> Memproses...';
      btn.disabled = true;
    } else {
      btn.innerHTML = this.mode === 'login' ? '<span>Masuk</span>' : '<span>Daftar Sekarang</span>';
      btn.disabled = false;
    }
  },

  showError(msg) {
    const el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = '⚠️ ' + msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  },

  showSuccess(msg) {
    const el = document.getElementById('auth-success');
    if (!el) return;
    el.textContent = '✅ ' + msg;
    el.classList.remove('hidden');
  },

  async handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) return this.showError('Email dan password wajib diisi.');
    this.setLoading(true);

    try {
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged di app.js akan handle redirect
    } catch (err) {
      this.setLoading(false);
      const msgs = {
        'auth/user-not-found': 'Email tidak terdaftar.',
        'auth/wrong-password': 'Password salah.',
        'auth/invalid-email': 'Format email tidak valid.',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.'
      };
      this.showError(msgs[err.code] || err.message);
    }
  },

  async handleRegister() {
    const name     = document.getElementById('reg-name').value.trim();
    const nim      = document.getElementById('reg-nim').value.trim();
    const jurusan  = document.getElementById('reg-jurusan').value.trim();
    const role     = document.getElementById('reg-role').value;
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) return this.showError('Nama, email, dan password wajib diisi.');
    if (password.length < 6) return this.showError('Password minimal 6 karakter.');
    this.setLoading(true);

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection('users').doc(cred.user.uid).set({
        uid: cred.user.uid,
        name, nim, jurusan, role, email,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      this.showSuccess('Akun berhasil dibuat! Mengalihkan...');
    } catch (err) {
      this.setLoading(false);
      const msgs = {
        'auth/email-already-in-use': 'Email sudah digunakan.',
        'auth/invalid-email': 'Format email tidak valid.',
        'auth/weak-password': 'Password terlalu lemah.'
      };
      this.showError(msgs[err.code] || err.message);
    }
  }
};
