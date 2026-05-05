// =====================================================
// PROJECT-DETAIL.JS — Halaman detail + chat proyek
// =====================================================

const projectDetail = {
  projectId: null,
  unsubscribers: [],

  async open(projectId) {
    this.projectId = projectId;
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];

    document.getElementById('page-title').textContent = 'Detail Proyek';
    document.getElementById('content-area').innerHTML = `
      <div class="loading-state"><div class="spinner-lg"></div><p>Memuat proyek...</p></div>
    `;

    // Load project data
    const projectSnap = await db.collection('projects').doc(projectId).get();
    if (!projectSnap.exists) {
      document.getElementById('content-area').innerHTML = '<p class="error-text">Proyek tidak ditemukan.</p>';
      return;
    }

    const project = { id: projectSnap.id, ...projectSnap.data() };

    // Ambil nama tim
    const [writerName, devName, clientName] = await Promise.all([
      this.getUserName(project.writer_id),
      this.getUserName(project.developer_id),
      this.getUserName(project.client_id)
    ]);

    this.renderDetail(project, writerName, devName, clientName);
    this.listenUpdates(projectId);
  },

  async getUserName(uid) {
    if (!uid) return '-';
    try {
      const snap = await db.collection('users').doc(uid).get();
      return snap.exists ? snap.data().name : '-';
    } catch { return '-'; }
  },

  renderDetail(project, writerName, devName, clientName) {
    const statusLabel = { pending: '⏳ Pending', progress: '🔄 Proses', revision: '✏️ Revisi', done: '✅ Selesai' };
    const statusClass = { pending: 'status-pending', progress: 'status-progress', revision: 'status-revision', done: 'status-done' };
    const userRole = dashboard.userRole;

    document.getElementById('content-area').innerHTML = `
      <div class="detail-layout">
        <!-- Info Proyek -->
        <div class="detail-sidebar">
          <div class="detail-info-card">
            <div class="detail-status">
              <span class="status-badge ${statusClass[project.status]}">${statusLabel[project.status]}</span>
            </div>
            <h3 class="detail-title">${project.name}</h3>
            <div class="info-list">
              <div class="info-item"><span class="info-label">NIM</span><span>${project.nim}</span></div>
              <div class="info-item"><span class="info-label">Jurusan</span><span>${project.jurusan}</span></div>
              <div class="info-item"><span class="info-label">Pembimbing</span><span>${project.pembimbing || '-'}</span></div>
              <div class="info-item"><span class="info-label">Klien</span><span>🎓 ${clientName}</span></div>
              <div class="info-item"><span class="info-label">Penulis</span><span>✍️ ${writerName}</span></div>
              <div class="info-item"><span class="info-label">Developer</span><span>💻 ${devName}</span></div>
              <div class="info-item" style="flex-direction: column; align-items: flex-start;">
                <span class="info-label">Deskripsi</span>
                <span style="margin-top:5px;">${project.desc || 'Tidak ada deskripsi'}</span>
              </div>
              <div class="info-item"><span class="info-label">Dibuat</span><span>${project.created_at?.toDate ? new Date(project.created_at.toDate()).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) : '-'}</span></div>
            </div>

            ${userRole === 'admin' ? `
            <div class="status-updater">
              <label>Ubah Status:</label>
              <select id="quick-status" onchange="projectDetail.updateStatus('${project.id}', this.value)">
                ${['pending','progress','revision','done'].map(s => `<option value="${s}" ${project.status===s?'selected':''}>${statusLabel[s]}</option>`).join('')}
              </select>
            </div>
            ` : ''}

            <button class="btn-secondary btn-full mt-2" onclick="dashboard.renderProjectList()">
              ← Kembali ke Daftar
            </button>
          </div>
        </div>

        <!-- Chat Area -->
        <div class="chat-container">
          <div class="chat-header">
            <h4>💬 Diskusi & Update Proyek</h4>
            <span class="realtime-badge">🟢 Live</span>
          </div>
          <div class="chat-messages" id="chat-messages">
            <div class="loading-state"><div class="spinner-lg"></div><p>Memuat pesan...</p></div>
          </div>

          <!-- Input Pesan -->
          <div class="chat-input-area">
            <div class="file-link-row">
              <input type="text" id="file-link-input" placeholder="🔗 Link Google Drive (opsional)">
            </div>
            <div class="message-row">
              <textarea id="message-input" placeholder="Tulis pesan atau update..." rows="2" onkeydown="projectDetail.handleEnter(event)"></textarea>
              <button class="btn-send" onclick="projectDetail.sendMessage('${project.id}')">
                <span>➤</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  listenUpdates(projectId) {
    const unsub = db.collection('updates')
      .where('project_id', '==', projectId)
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        const updates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.renderMessages(updates);
      });
    this.unsubscribers.push(unsub);
  },

  renderMessages(updates) {
    const chatEl = document.getElementById('chat-messages');
    if (!chatEl) return;

    const currentRole = dashboard.userRole;
    const roleLabel   = { client: '🎓 Klien', writer: '✍️ Penulis', developer: '💻 Developer', admin: '👑 Admin' };
    const roleColor   = { client: 'bubble-client', writer: 'bubble-writer', developer: 'bubble-dev', admin: 'bubble-admin' };

    if (updates.length === 0) {
      chatEl.innerHTML = `
        <div class="chat-empty">
          <div class="chat-empty-icon">💬</div>
          <p>Belum ada pesan. Mulai diskusi sekarang!</p>
        </div>
      `;
      return;
    }

    // Group by date
    let currentDate = '';
    let html = '';

    updates.forEach(upd => {
      const ts    = upd.timestamp?.toDate ? upd.timestamp.toDate() : new Date();
      const date  = ts.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
      const time  = ts.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
      const isMine = upd.sender_role === currentRole;

      if (date !== currentDate) {
        html += `<div class="date-divider"><span>${date}</span></div>`;
        currentDate = date;
      }

      html += `
        <div class="message-wrapper ${isMine ? 'mine' : 'theirs'}">
          ${!isMine ? `<div class="sender-label">${roleLabel[upd.sender_role] || upd.sender_role}</div>` : ''}
          <div class="bubble ${roleColor[upd.sender_role] || ''} ${isMine ? 'bubble-mine' : ''}">
            <div class="bubble-text">${this.escapeHtml(upd.message)}</div>
            ${upd.file_link ? `
              <a href="${upd.file_link}" target="_blank" class="file-attachment">
                📎 Lihat File Google Drive
              </a>` : ''}
            <div class="bubble-time">${time}</div>
          </div>
        </div>
      `;
    });

    chatEl.innerHTML = html;
    // Auto scroll ke bawah
    chatEl.scrollTop = chatEl.scrollHeight;
  },

  handleEnter(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      projectDetail.sendMessage(this.projectId);
    }
  },

  async sendMessage(projectId) {
    const msgInput  = document.getElementById('message-input');
    const fileInput = document.getElementById('file-link-input');
    const message   = msgInput?.value.trim();
    const file_link = fileInput?.value.trim();

    if (!message) return;

    const btn = document.querySelector('.btn-send');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳'; }

    try {
      await db.collection('updates').add({
        project_id:  projectId,
        sender_role: dashboard.userRole,
        sender_id:   dashboard.currentUser.uid,
        sender_name: dashboard.userData.name,
        message,
        file_link: file_link || '',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Kirim notif ke semua member proyek
      let project = dashboard.projects.find(p => p.id === projectId);
        
        if (!project) {
          const snap = await db.collection('projects').doc(projectId).get();
          if (snap.exists) {
            project = { id: snap.id, ...snap.data() };
          }
        }
      const targets = [project.writer_id, project.developer_id, project.client_id]
        .filter(uid => uid && uid !== dashboard.currentUser.uid);
      
      for (const uid of targets) {
        await db.collection('notifications').add({
          project_id: projectId,
          project_name: project.name,
          sender_role: dashboard.userRole,
          sender_name: dashboard.userData.name,
          message_preview: message.substring(0, 60),
          target_uid: uid,
          is_read: false,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      // Update updated_at di project
      await db.collection('projects').doc(projectId).update({
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (msgInput)  msgInput.value  = '';
      if (fileInput) fileInput.value = '';
    } catch (err) {
      alert('Gagal kirim pesan: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<span>➤</span>'; }
    }
  },

  async updateStatus(projectId, newStatus) {
    try {
      await db.collection('projects').doc(projectId).update({
        status: newStatus,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      alert('Gagal update status: ' + err.message);
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }
  // tandai notif project ini sebagai sudah dibaca
  const snap = await db.collection('notifications')
    .where('target_uid', '==', dashboard.currentUser.uid)
    .where('project_id', '==', projectId)
    .where('is_read', '==', false)
    .get();
  
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { is_read: true }));
  await batch.commit();
};
