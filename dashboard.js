// =====================================================
// DASHBOARD.JS — Panel utama semua role
// =====================================================

const dashboard = {
  currentUser: null,
  userRole: null,
  projects: [],
  unsubscribers: [],

  async init(user, userData) {
    this.currentUser = user;
    this.userRole = userData.role;
    this.userData = userData;
    this.render();
    this.loadProjects();
  },

  render() {
    const roleLabel = { admin: '👑 Admin', writer: '✍️ Penulis', developer: '💻 Developer', client: '🎓 Klien' };
    document.getElementById('app').innerHTML = `
      <div class="app-layout">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <div class="logo">📚 ThesisTrack</div>
            <button class="sidebar-close" onclick="dashboard.toggleSidebar()">✕</button>
          </div>
          <div class="user-info">
            <div class="avatar">${(this.userData.name || 'U')[0].toUpperCase()}</div>
            <div>
              <div class="user-name">${this.userData.name || 'Pengguna'}</div>
              <div class="user-role">${roleLabel[this.userRole] || this.userRole}</div>
            </div>
          </div>
          <nav class="sidebar-nav">
            <a href="#" class="nav-item active" onclick="dashboard.showView('projects')">
              <span>📋</span> Daftar Proyek
            </a>
            ${this.userRole === 'admin' ? `
            <a href="#" class="nav-item" onclick="dashboard.showView('users')">
              <span>👥</span> Manajemen User
            </a>` : ''}
            ${this.userRole === 'client' ? `
            <a href="#" class="nav-item" onclick="dashboard.showNewProject()">
              <span>➕</span> Buat Proyek Baru
            </a>` : ''}
          </nav>
          <button class="btn-logout" onclick="app.logout()">🚪 Keluar</button>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <header class="topbar">
            <button class="menu-btn" onclick="dashboard.toggleSidebar()">☰</button>
            <h2 id="page-title">Daftar Proyek</h2>
            <div class="topbar-right">
              ${this.userRole === 'client' ? `<button class="btn-primary btn-sm" onclick="dashboard.showNewProject()">+ Proyek Baru</button>` : ''}
            </div>
          </header>
          <div class="content-area" id="content-area">
            <div class="loading-state">
              <div class="spinner-lg"></div>
              <p>Memuat data...</p>
            </div>
          </div>
        </main>
      </div>
    `;
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
  },

  showView(view) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event?.target?.closest('.nav-item')?.classList.add('active');
    if (view === 'projects') this.renderProjectList();
    if (view === 'users') this.renderUserManagement();
  },

  // ─── LOAD PROJECTS ───────────────────────────────
  loadProjects() {
    // Unsubscribe listener sebelumnya
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];

    let query = db.collection('projects').orderBy('created_at', 'desc');

    if (this.userRole === 'writer') {
      query = query.where('writer_id', '==', this.currentUser.uid);
    } else if (this.userRole === 'developer') {
      query = query.where('developer_id', '==', this.currentUser.uid);
    } else if (this.userRole === 'client') {
      query = query.where('client_id', '==', this.currentUser.uid);
    }

    const unsub = query.onSnapshot(snapshot => {
      this.projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.renderProjectList();
    });

    this.unsubscribers.push(unsub);
  },

  // ─── RENDER DAFTAR PROYEK ────────────────────────
  renderProjectList() {
    document.getElementById('page-title').textContent = 'Daftar Proyek';
    const statusLabel = { pending: '⏳ Pending', progress: '🔄 Proses', revision: '✏️ Revisi', done: '✅ Selesai' };
    const statusClass = { pending: 'status-pending', progress: 'status-progress', revision: 'status-revision', done: 'status-done' };

    const html = `
      <div class="stats-row">
        ${this.renderStats()}
      </div>
      <div class="section-header">
        <h3>Proyek ${this.userRole === 'admin' ? 'Semua' : 'Kamu'}</h3>
        <div class="filter-tabs">
          <button class="filter-btn active" onclick="dashboard.filterProjects('all', this)">Semua</button>
          <button class="filter-btn" onclick="dashboard.filterProjects('pending', this)">Pending</button>
          <button class="filter-btn" onclick="dashboard.filterProjects('progress', this)">Proses</button>
          <button class="filter-btn" onclick="dashboard.filterProjects('revision', this)">Revisi</button>
          <button class="filter-btn" onclick="dashboard.filterProjects('done', this)">Selesai</button>
        </div>
      </div>
      <div class="project-grid" id="project-grid">
        ${this.projects.length === 0 
          ? '<div class="empty-state">📭 Belum ada proyek.</div>'
          : this.projects.map(p => `
            <div class="project-card" onclick="projectDetail.open('${p.id}')">
              <div class="project-card-header">
                <span class="status-badge ${statusClass[p.status] || ''}">${statusLabel[p.status] || p.status}</span>
                ${this.userRole === 'admin' ? `<button class="btn-icon" onclick="event.stopPropagation(); dashboard.showAssign('${p.id}')" title="Tugaskan Tim">⚙️</button>` : ''}
              </div>
              <h4 class="project-title">${p.name}</h4>
              <div class="project-meta">
                <span>🎓 ${p.nim}</span>
                <span>📚 ${p.jurusan}</span>
              </div>
              <div class="project-meta">
                <span>👨‍🏫 ${p.pembimbing || '-'}</span>
              </div>
              <div class="project-footer">
                <span class="project-date">${p.created_at?.toDate ? new Date(p.created_at.toDate()).toLocaleDateString('id-ID') : '-'}</span>
                <span class="btn-sm-link">Lihat Detail →</span>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;
    document.getElementById('content-area').innerHTML = html;
  },

  renderStats() {
    const total    = this.projects.length;
    const pending  = this.projects.filter(p => p.status === 'pending').length;
    const progress = this.projects.filter(p => p.status === 'progress').length;
    const done     = this.projects.filter(p => p.status === 'done').length;

    return `
      <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total Proyek</div></div>
      <div class="stat-card stat-yellow"><div class="stat-num">${pending}</div><div class="stat-label">Pending</div></div>
      <div class="stat-card stat-blue"><div class="stat-num">${progress}</div><div class="stat-label">Proses</div></div>
      <div class="stat-card stat-green"><div class="stat-num">${done}</div><div class="stat-label">Selesai</div></div>
    `;
  },

  filterProjects(status, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cards = document.querySelectorAll('.project-card');
    const statusClass = { pending: 'status-pending', progress: 'status-progress', revision: 'status-revision', done: 'status-done' };
    cards.forEach(card => {
      if (status === 'all') { card.style.display = ''; return; }
      const badge = card.querySelector('.status-badge');
      card.style.display = badge?.classList.contains(statusClass[status]) ? '' : 'none';
    });
  },

  // ─── FORM PROYEK BARU (client) ───────────────────
  showNewProject() {
    document.getElementById('page-title').textContent = 'Buat Proyek Baru';
    document.getElementById('content-area').innerHTML = `
      <div class="form-card">
        <h3>📝 Form Pengajuan Skripsi</h3>
        <div class="form-group">
          <label>Judul Skripsi</label>
          <input type="text" id="p-name" placeholder="Masukkan judul skripsi Anda">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>NIM</label>
            <input type="text" id="p-nim" value="${this.userData.nim || ''}" placeholder="Nomor Induk Mahasiswa">
          </div>
          <div class="form-group">
            <label>Jurusan</label>
            <input type="text" id="p-jurusan" value="${this.userData.jurusan || ''}" placeholder="Program Studi">
          </div>
        </div>
        <div class="form-group">
          <label>Nama Dosen Pembimbing</label>
          <input type="text" id="p-pembimbing" placeholder="Contoh: Dr. Budi Santoso, M.Kom">
        </div>
        <div class="form-group">
          <label>Deskripsi Singkat</label>
          <textarea id="p-desc" placeholder="Jelaskan topik skripsi Anda secara singkat..." rows="4"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn-secondary" onclick="dashboard.loadProjects(); dashboard.renderProjectList()">Batal</button>
          <button class="btn-primary" onclick="dashboard.submitProject()">🚀 Ajukan Proyek</button>
        </div>
        <div id="form-msg"></div>
      </div>
    `;
  },

  async submitProject() {
    const name      = document.getElementById('p-name').value.trim();
    const nim       = document.getElementById('p-nim').value.trim();
    const jurusan   = document.getElementById('p-jurusan').value.trim();
    const pembimbing = document.getElementById('p-pembimbing').value.trim();
    const desc      = document.getElementById('p-desc').value.trim();
    const msg       = document.getElementById('form-msg');

    if (!name || !nim || !jurusan) {
      msg.innerHTML = '<p class="error-text">⚠️ Judul, NIM, dan Jurusan wajib diisi.</p>';
      return;
    }

    try {
      msg.innerHTML = '<p class="info-text">⏳ Menyimpan...</p>';
      await db.collection('projects').add({
        name, nim, jurusan, pembimbing, desc,
        client_id: this.currentUser.uid,
        writer_id: null,
        developer_id: null,
        status: 'pending',
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      msg.innerHTML = '<p class="success-text">✅ Proyek berhasil diajukan!</p>';
      setTimeout(() => { this.loadProjects(); }, 1500);
    } catch (err) {
      msg.innerHTML = `<p class="error-text">❌ Gagal: ${err.message}</p>`;
    }
  },

  // ─── ASSIGN TIM (admin) ──────────────────────────
  async showAssign(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    // Ambil daftar writer dan developer
    const [writers, developers] = await Promise.all([
      db.collection('users').where('role', '==', 'writer').get(),
      db.collection('users').where('role', '==', 'developer').get()
    ]);

    const writerOpts   = writers.docs.map(d => `<option value="${d.id}" ${project.writer_id === d.id ? 'selected' : ''}>${d.data().name}</option>`).join('');
    const devOpts      = developers.docs.map(d => `<option value="${d.id}" ${project.developer_id === d.id ? 'selected' : ''}>${d.data().name}</option>`).join('');
    const statusOpts   = ['pending','progress','revision','done'].map(s => `<option value="${s}" ${project.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('');

    // Modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'assign-modal';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3>⚙️ Atur Proyek</h3>
          <button onclick="document.getElementById('assign-modal').remove()">✕</button>
        </div>
        <p class="modal-project-name">${project.name}</p>
        <div class="form-group">
          <label>Tugaskan Penulis</label>
          <select id="assign-writer">
            <option value="">— Pilih Penulis —</option>
            ${writerOpts}
          </select>
        </div>
        <div class="form-group">
          <label>Tugaskan Developer</label>
          <select id="assign-dev">
            <option value="">— Pilih Developer —</option>
            ${devOpts}
          </select>
        </div>
        <div class="form-group">
          <label>Status Proyek</label>
          <select id="assign-status">${statusOpts}</select>
        </div>
        <div id="assign-msg"></div>
        <div class="form-actions">
          <button class="btn-secondary" onclick="document.getElementById('assign-modal').remove()">Batal</button>
          <button class="btn-primary" onclick="dashboard.saveAssign('${projectId}')">💾 Simpan</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async saveAssign(projectId) {
    const writerId = document.getElementById('assign-writer').value;
    const devId    = document.getElementById('assign-dev').value;
    const status   = document.getElementById('assign-status').value;
    const msg      = document.getElementById('assign-msg');

    try {
      msg.innerHTML = '<p class="info-text">⏳ Menyimpan...</p>';
      await db.collection('projects').doc(projectId).update({
        writer_id: writerId || null,
        developer_id: devId || null,
        status,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      msg.innerHTML = '<p class="success-text">✅ Berhasil disimpan!</p>';
      setTimeout(() => document.getElementById('assign-modal')?.remove(), 1200);
    } catch (err) {
      msg.innerHTML = `<p class="error-text">❌ ${err.message}</p>`;
    }
  },

  // ─── USER MANAGEMENT (admin) ─────────────────────
  renderUserManagement() {
    document.getElementById('page-title').textContent = 'Manajemen User';
    document.getElementById('content-area').innerHTML = `
      <div class="loading-state"><div class="spinner-lg"></div><p>Memuat users...</p></div>
    `;

    db.collection('users').orderBy('created_at', 'desc').onSnapshot(snap => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const roleLabel = { admin: '👑 Admin', writer: '✍️ Penulis', developer: '💻 Developer', client: '🎓 Klien' };
      document.getElementById('content-area').innerHTML = `
        <div class="table-card">
          <h3>👥 Daftar Pengguna (${users.length})</h3>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr><th>Nama</th><th>Email</th><th>NIM</th><th>Jurusan</th><th>Role</th><th>Bergabung</th></tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td><strong>${u.name || '-'}</strong></td>
                    <td>${u.email || '-'}</td>
                    <td>${u.nim || '-'}</td>
                    <td>${u.jurusan || '-'}</td>
                    <td><span class="role-badge role-${u.role}">${roleLabel[u.role] || u.role}</span></td>
                    <td>${u.created_at?.toDate ? new Date(u.created_at.toDate()).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });
  }
};
