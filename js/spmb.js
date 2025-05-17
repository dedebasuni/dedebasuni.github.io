        // Data dummy untuk simulasi
        const dummyData = {
            admin: {
                username: "admin",
                password: "admin",
                token: "dummy_admin_token_123"
            },
            academicYear: "2023/2024",
            registrations: [
                {
                    nomor: "REG20230001",
                    jenis_pendaftaran: "Siswa Baru",
                    tahun_ajaran: "2023/2024",
                    nisn: "1234567890",
                    nik: "3212345678901234",
                    nama: "Andi Wijaya",
                    jenis_kelamin: "Laki-laki",
                    tempat_lahir: "Jakarta",
                    tanggal_lahir: "2008-05-15",
                    agama: "Islam",
                    whatsapp: "081234567890",
                    alamat: "Jl. Merdeka No. 123, Jakarta Pusat",
                    nama_ayah: "Budi Wijaya",
                    pekerjaan_ayah: "PNS",
                    nama_ibu: "Siti Aminah",
                    pekerjaan_ibu: "Ibu Rumah Tangga",
                    whatsapp_ortu: "081298765432",
                    asal_sekolah: "SMP Negeri 1 Jakarta",
                    tahun_lulus: "2023",
                    timestamp: "2023-06-10 14:30:22",
                    status_verifikasi: "Diverifikasi"
                },
                {
                    nomor: "REG20230002",
                    jenis_pendaftaran: "Siswa Baru",
                    tahun_ajaran: "2023/2024",
                    nisn: "2345678901",
                    nik: "3212345678901235",
                    nama: "Budi Santoso",
                    jenis_kelamin: "Laki-laki",
                    tempat_lahir: "Bandung",
                    tanggal_lahir: "2008-07-20",
                    agama: "Islam",
                    whatsapp: "081234567891",
                    alamat: "Jl. Asia Afrika No. 45, Bandung",
                    nama_ayah: "Joko Santoso",
                    pekerjaan_ayah: "Wiraswasta",
                    nama_ibu: "Dewi Santoso",
                    pekerjaan_ibu: "Guru",
                    whatsapp_ortu: "081298765433",
                    asal_sekolah: "SMP Negeri 5 Bandung",
                    tahun_lulus: "2023",
                    timestamp: "2023-06-11 09:15:10",
                    status_verifikasi: "Belum Diverifikasi"
                }
            ]
        };

        // Fungsi untuk simulasi response dari server
        async function simulateServerResponse(requestData) {
            // Simulasi delay jaringan
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (requestData.action === 'getCurrentAcademicYear') {
                return {
                    success: true,
                    data: { academicYear: dummyData.academicYear }
                };
            }
            
            if (requestData.action === 'submitForm') {
                const newNomor = `REG${20230000 + dummyData.registrations.length + 1}`;
                const newRegistration = {
                    ...requestData.formData,
                    nomor: newNomor,
                    timestamp: new Date().toLocaleString('id-ID', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }).replace(/\//g, '-').replace(',', ''),
                    status_verifikasi: "Belum Diverifikasi"
                };
                dummyData.registrations.push(newRegistration);
                
                return {
                    success: true,
                    data: {
                        nomorPendaftaran: newNomor,
                        tahun_ajaran: requestData.formData.tahun_ajaran
                    }
                };
            }
            
            if (requestData.action === 'checkStatus') {
                const { nomor, nisn } = requestData;
                const registration = dummyData.registrations.find(
                    reg => reg.nomor === nomor && reg.nisn === nisn
                );
                
                if (registration) {
                    return {
                        success: true,
                        data: {
                            found: true,
                            data: registration
                        }
                    };
                } else {
                    return {
                        success: false,
                        error: { message: "Data tidak ditemukan" }
                    };
                }
            }
            
            if (requestData.action === 'adminLogin') {
                if (requestData.username === dummyData.admin.username && 
                    requestData.password === dummyData.admin.password) {
                    return {
                        success: true,
                        data: { token: dummyData.admin.token }
                    };
                } else {
                    return {
                        success: false,
                        error: { message: "Username atau password salah" }
                    };
                }
            }
            
            if (requestData.action === 'getAllRegistrations') {
                if (requestData.token !== dummyData.admin.token) {
                    return {
                        success: false,
                        error: { message: "Token tidak valid" }
                    };
                }
                
                return {
                    success: true,
                    data: {
                        data: dummyData.registrations.map(reg => ({
                            nomor: reg.nomor,
                            nama: reg.nama,
                            asal_sekolah: reg.asal_sekolah,
                            timestamp: reg.timestamp,
                            status_verifikasi: reg.status_verifikasi
                        }))
                    }
                };
            }
            
            if (requestData.action === 'updateStatus') {
                if (requestData.token !== dummyData.admin.token) {
                    return {
                        success: false,
                        error: { message: "Token tidak valid" }
                    };
                }
                
                const registration = dummyData.registrations.find(
                    reg => reg.nomor === requestData.nomor
                );
                
                if (registration) {
                    registration.status_verifikasi = requestData.status;
                    return { success: true };
                } else {
                    return {
                        success: false,
                        error: { message: "Data pendaftaran tidak ditemukan" }
                    };
                }
            }
            
            if (requestData.action === 'exportData') {
                if (requestData.token !== dummyData.admin.token) {
                    return {
                        success: false,
                        error: { message: "Token tidak valid" }
                    };
                }
                
                // Simulasi URL download
                return {
                    success: true,
                    data: {
                        downloadUrl: "https://example.com/export/registrations.xlsx"
                    }
                };
            }
            
            return {
                success: false,
                error: { message: "Aksi tidak dikenali" }
            };
        }

        // Modifikasi fungsi fetch untuk menggunakan simulasi
        async function mockFetch(url, options) {
            try {
                const requestData = JSON.parse(options.body);
                const responseData = await simulateServerResponse(requestData);
                
                return {
                    ok: responseData.success,
                    json: () => Promise.resolve(responseData)
                };
            } catch (error) {
                return {
                    ok: false,
                    json: () => Promise.resolve({
                        success: false,
                        error: { message: "Terjadi kesalahan dalam simulasi" }
                    })
                };
            }
        }

        // Gunakan mockFetch untuk simulasi
        const apiCall = mockFetch;
        
        // Daftar section yang valid untuk navigasi
        const validSections = ['landing', 'info', 'form', 'check', 'dashboard'];
        
        // Load tahun ajaran saat halaman form dibuka
        function loadAcademicYear() {
            apiCall('dummy-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getCurrentAcademicYear' })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const input = document.getElementById('tahun_ajaran');
                    if (input) {
                        input.value = data.data.academicYear || '';
                    }
                } else {
                    showErrorAlert(data.error?.message || 'Gagal memuat tahun ajaran');
                }
            })
            .catch(() => {
                showErrorAlert('Gagal memuat tahun ajaran');
            });
        }
        
        // Fungsi navigasi section sesuai parameter URL atau default landing
        function showSection(section) {
            if (!validSections.includes(section)) {
                section = 'landing';
                const baseUrl = window.location.pathname;
                window.history.replaceState({}, '', `${baseUrl}?page=landing`);
            }
        
            // Sembunyikan semua section
            document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
            // Tampilkan section target
            const targetSection = document.getElementById(`${section}-section`);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                if (section === 'form') loadAcademicYear();
            } else {
                // fallback ke landing jika section tidak ditemukan
                document.getElementById('landing-section').classList.remove('hidden');
            }
        
            // Update URL tanpa reload
            const baseUrl = window.location.pathname;
            window.history.pushState({}, '', `${baseUrl}?page=${section}`);
        
            // Tutup menu mobile jika ada
            const nav = document.getElementById('main-nav');
            if (nav) nav.classList.add('hidden');
        
            window.scrollTo(0, 0);
        }
        
        // Saat halaman selesai dimuat
        window.onload = function() {
            const params = new URLSearchParams(window.location.search);
            let page = params.get('page') || 'landing';
        
            if (!validSections.includes(page)) {
                page = 'landing';
                const baseUrl = window.location.pathname;
                window.history.replaceState({}, '', `${baseUrl}?page=landing`);
            }
        
            showSection(page);
        
            const nomor = params.get('nomor');
            if (nomor && page === 'check') {
                const inputNomor = document.getElementById('check-nomor');
                if (inputNomor) {
                    inputNomor.value = nomor;
                    setTimeout(checkStatus, 500);
                }
            }
        
            if (page === 'form') {
                loadAcademicYear();
                
                // Tambahkan tombol isi otomatis
                const form = document.getElementById('registration-form');
                if (form) {
                    const autoFillBtn = document.createElement('button');
                    autoFillBtn.type = 'button';
                    autoFillBtn.className = 'btn btn-secondary';
                    autoFillBtn.innerHTML = '<i class="fas fa-magic"></i> Isi Demo';
                    autoFillBtn.style.marginLeft = '10px';
                    autoFillBtn.onclick = autoFillDemoData;
                    form.querySelector('.action-buttons').prepend(autoFillBtn);
                }
            }
        };
        
        // Toggle menu mobile (jika ada)
        function toggleMobileMenu() {
            const nav = document.getElementById('main-nav');
            if (nav) nav.classList.toggle('hidden');
        }
        
        // Fungsi untuk mengisi data demo otomatis
        function autoFillDemoData() {
            const demoData = {
                jenis_pendaftaran: "Siswa Baru",
                nisn: "1234567890",
                nik: "3212345678901234",
                nama: "Andi Wijaya",
                jenis_kelamin: "Laki-laki",
                tempat_lahir: "Jakarta",
                tanggal_lahir: "2008-05-15",
                agama: "Islam",
                whatsapp: "081234567890",
                alamat: "Jl. Merdeka No. 123, Jakarta Pusat",
                nama_ayah: "Budi Wijaya",
                pekerjaan_ayah: "PNS",
                nama_ibu: "Siti Aminah",
                pekerjaan_ibu: "Ibu Rumah Tangga",
                whatsapp_ortu: "081298765432",
                asal_sekolah: "SMP Negeri 1 Jakarta",
                tahun_lulus: "2023"
            };
            
            Object.keys(demoData).forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = demoData[id];
            });
            
            showSuccessAlert('Data demo telah diisi. Anda bisa mengeditnya sebelum submit.');
        }
        
        // Preview data form sebelum submit
        function previewForm() {
            const form = document.getElementById('registration-form');
            const formData = new FormData(form);
        
            // Validasi wajib isi
            let isValid = true;
            form.querySelectorAll('[required]').forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'var(--danger)';
                } else {
                    input.style.borderColor = '';
                }
            });
            if (!isValid) {
                showErrorAlert('Harap lengkapi semua field yang wajib diisi!');
                return;
            }
        
            // Urutkan fields untuk preview
            const fieldOrder = [
                'jenis_pendaftaran', 'tahun_ajaran', 'nisn', 'nik', 'nama', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
                'agama', 'whatsapp', 'alamat', 'nama_ayah', 'pekerjaan_ayah', 'nama_ibu', 'pekerjaan_ibu', 'whatsapp_ortu', 'asal_sekolah', 'tahun_lulus'
            ];
        
            const entries = Array.from(formData.entries());
            entries.sort((a, b) => fieldOrder.indexOf(a[0]) - fieldOrder.indexOf(b[0]));
        
            // Build HTML preview
            let previewHtml = `<h4 style="margin-bottom:1rem;font-weight:600;color:var(--primary-dark);"><i class="fas fa-user-check"></i> Data Pendaftaran</h4><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;">`;
        
            entries.forEach(([key, value]) => {
                const labelElem = document.querySelector(`label[for="${key}"]`);
                const label = labelElem ? labelElem.textContent.replace(' *','') : key;
                previewHtml += `
                    <div style="margin-bottom:0.5rem;">
                        <strong style="font-size:0.85rem;color:var(--gray);">${label}:</strong>
                        <p style="margin-top:0.25rem;">${escapeHtml(value) || '-'}</p>
                    </div>
                `;
            });
            previewHtml += '</div>';
        
            document.getElementById('preview-content').innerHTML = previewHtml;
            document.getElementById('preview-section').classList.remove('hidden');
            form.classList.add('hidden');
        }
        
        // Kembali ke form edit dari preview
        function editForm() {
            document.getElementById('preview-section').classList.add('hidden');
            document.getElementById('registration-form').classList.remove('hidden');
        }
        
        // Submit form pendaftaran
function submitForm() {
  const submitBtn = document.getElementById('submit-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="spinner"></span> Memproses...';
  submitBtn.disabled = true;

  setTimeout(() => {
    const form = document.getElementById('registration-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Generate nomor pendaftaran
    const nomorBaru = `REG${dummyData.academicYear.replace('/', '')}${(dummyData.registrations.length + 1)
      .toString()
      .padStart(4, '0')}`;
    data.data.data.nomor = nomorBaru;

    // Tambahkan tahun ajaran dari dummyData
    data.data.data.tahun_ajaran = dummyData.academicYear;

    // Timestamp
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    data.data.data.timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Status awal
    data.data.data.status_verifikasi = 'Belum Diverifikasi';

    // Simpan ke data dummy
    dummyData.registrations.push(data);

    // Tampilkan SweetAlert sukses
    Swal.fire({
      title: 'Pendaftaran Berhasil!',
      html: `<div style="text-align:left;">
        <p><strong>Nomor Pendaftaran:</strong> ${escapeHtml(data.data.data.nomor)}</p>
        <p><strong>Tahun Ajaran:</strong> ${escapeHtml(data.data.data.tahun_ajaran)}</p>
        <p class="mt-3">Simpan nomor ini untuk cek status pendaftaran.</p>
      </div>`,
      icon: 'success',
      confirmButtonText: 'OK',
      customClass: { confirmButton: 'btn btn-success' },
      buttonsStyling: false
    }).then(() => {
      form.reset();
      showSection('landing');
    });

    // Simulasi pesan WhatsApp (log saja dulu)
    const whatsappMessage = `Hallo admin SMA Contoh Takokak, berikut data pendaftaran saya:

Nama: ${data.data.data.nama}
Nomor Pendaftaran: ${data.data.data.nomor}
Asal Sekolah: ${data.data.data.asal_sekolah}

Terima kasih.`;
    console.log('WhatsApp message:', whatsappMessage);
    // window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(whatsappMessage)}`, '_blank');

    // Reset tombol
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }, 2000);
}
        
        // Cek status pendaftaran berdasarkan nomor dan NISN
        function checkStatus() {
            const checkBtn = document.getElementById('check-btn');
            const originalText = checkBtn.innerHTML;
            checkBtn.innerHTML = '<span class="spinner"></span> Mencari...';
            checkBtn.disabled = true;

            const nomor = document.getElementById('check-nomor').value.trim();
            const nisn = document.getElementById('check-nisn').value.trim();

            if (!nomor || !nisn) {
                showErrorAlert('Harap isi nomor pendaftaran dan NISN!');
                checkBtn.innerHTML = originalText;
                checkBtn.disabled = false;
                return;
            }

            // Gunakan mockFetch untuk simulasi
            mockFetch('dummy-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'checkStatus', nomor, nisn })
            })
            .then(res => res.json())
            .then(data => {
                const resultDiv = document.getElementById('check-result');
                resultDiv.classList.remove('hidden'); // Pastikan elemen ditampilkan
        
                if (data.success && data.data.found) {
                    const status = data.data.data.status_verifikasi;
                    let statusClass = '';
                    switch (status) {
                        case 'Diverifikasi': statusClass = 'status-verified'; break;
                        case 'Ditolak': statusClass = 'status-rejected'; break;
                        default: statusClass = 'status-pending';
                    }

                    resultDiv.innerHTML = `
                      <div class="card">
                        <h4 style="margin-bottom: 1rem; color: var(--primary-dark);">
                          <i class="fas fa-user-graduate"></i> Status Pendaftaran
                        </h4>
              
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                          <div>
                            <strong style="font-size: 0.85rem; color: var(--gray);">Nomor Pendaftaran:</strong>
                            <p style="margin-top: 0.25rem;">${data.data.data.nomor}</p>
                          </div>
                          <div>
                            <strong style="font-size: 0.85rem; color: var(--gray);">Nama:</strong>
                            <p style="margin-top: 0.25rem;">${data.data.data.nama}</p>
                          </div>
                         <div>
                            <strong style="font-size: 0.85rem; color: var(--gray);">Asal Sekolah:</strong>
                            <p style="margin-top: 0.25rem;">${data.data.data.asal_sekolah}</p>
                          </div>
                          <div>
                            <strong style="font-size: 0.85rem; color: var(--gray);">Tanggal Daftar:</strong>
                            <p style="margin-top: 0.25rem;">${data.data.data.timestamp}</p>
                          </div>
                          <div>
                            <strong style="font-size: 0.85rem; color: var(--gray);">Status:</strong>
                            <p style="margin-top: 0.25rem;" class="${statusClass}">
                              <i class="fas fa-${status === 'Diverifikasi' ? 'check-circle' : 
                                status === 'Ditolak' ? 'times-circle' : 'clock'}"></i>
                              ${status}
                            </p>
                          </div>
                        </div>
              
                        ${status === 'Diverifikasi' ? `
                          <div class="alert alert-success mt-3">
                            <strong><i class="fas fa-check-circle"></i> Selamat!</strong> 
                            Anda diterima di SMAS PGRI Takokak. Silakan lakukan daftar ulang sesuai jadwal.
                          </div>
                        ` : status === 'Ditolak' ? `
                          <div class="alert alert-danger mt-3">
                            <strong><i class="fas fa-times-circle"></i> Maaf</strong>, 
                            Anda belum diterima di SMAS PGRI Takokak.
                          </div>
                        ` : `
                          <div class="alert alert-info mt-3">
                            <strong><i class="fas fa-info-circle"></i> Proses Verifikasi</strong> 
                            Pendaftaran Anda sedang dalam proses verifikasi. Silakan cek kembali beberapa hari lagi.
                          </div>
                        `}
              
                        <div class="action-buttons mt-3">
                          <button onclick="window.print()" class="btn btn-secondary">
                            <i class="fas fa-print"></i> Cetak
                          </button>
                          <button onclick="showSection('landing')" class="btn btn-primary">
                            <i class="fas fa-home"></i> Kembali
                          </button>
                        </div>
                      </div>
                    `;
                    
                } else {
                  resultDiv.innerHTML = `
                    <div class="alert alert-danger">
                      <strong><i class="fas fa-exclamation-triangle"></i> Data tidak ditemukan</strong>
                      <p class="mt-2">${data.error?.message || 'Nomor pendaftaran atau NISN yang Anda masukkan tidak valid. Silakan coba lagi.'}</p>
                    </div>
                  `;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showErrorAlert('Terjadi kesalahan saat memeriksa status');
            })
            .finally(() => {
                checkBtn.innerHTML = originalText;
                checkBtn.disabled = false;
            });
        }
        
        // Admin login
        function adminLogin() {
            const loginBtn = document.getElementById('admin-login-btn');
            const originalText = loginBtn ? loginBtn.innerHTML : '';
            if (loginBtn) {
                loginBtn.innerHTML = '<span class="spinner"></span> Memverifikasi...';
                loginBtn.disabled = true;
            }
        
            const username = document.getElementById('admin-username').value.trim();
            const password = document.getElementById('admin-password').value.trim();
        
            if (!username || !password) {
                showErrorAlert('Harap isi username dan password!');
                if (loginBtn) {
                    loginBtn.innerHTML = originalText;
                    loginBtn.disabled = false;
                }
                return;
            }
        
            apiCall('dummy-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'adminLogin', username, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('adminToken', data.data.token);
                    loadAdminDashboard(data.data.token);
                    const loginForm = document.getElementById('login-form');
                    const adminContent = document.getElementById('admin-content');
                    if (loginForm) loginForm.classList.add('hidden');
                    if (adminContent) adminContent.classList.remove('hidden');
                    showSuccessAlert('Login berhasil!');
                } else {
                    showErrorAlert(data.error?.message || 'Login gagal. Periksa username dan password.');
                }
            })
            .catch(() => showErrorAlert('Terjadi kesalahan saat login'))
            .finally(() => {
                if (loginBtn) {
                    loginBtn.innerHTML = originalText;
                    loginBtn.disabled = false;
                }
            });
        }
        
        // Load data dashboard admin
        function loadAdminDashboard(token) {
            if (!token) {
                token = localStorage.getItem('adminToken');
                if (!token) {
                    showErrorAlert('Sesi telah habis, silakan login kembali');
                    document.getElementById('login-form').classList.remove('hidden');
                    document.getElementById('admin-content').classList.add('hidden');
                    return;
                }
            }
        
            apiCall('dummy-url', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'getAllRegistrations', token })
            })
            .then(res => res.json())
            .then(data => {
                const adminContent = document.getElementById('admin-content');
                if (!adminContent) return;
        
                if (data.success) {
                    let html = `<div class="info-section">
                        <div class="table-responsive">
                            <table id="admin-registrations-tab" class="info-table">
                                <thead>
                                    <tr>
                                        <th>No. Pendaftaran</th><th>Nama</th><th>Asal Sekolah</th><th>Tanggal Daftar</th><th>Status</th><th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>`;
        
                    data.data.data.forEach(reg => {
                        let statusClass = reg.status_verifikasi === 'Diverifikasi' ? 'status-verified' :
                                          reg.status_verifikasi === 'Ditolak' ? 'status-rejected' : 'status-pending';
                        html += `
                            <tr>
                                <td>${escapeHtml(reg.nomor)}</td>
                                <td>${escapeHtml(reg.nama)}</td>
                                <td>${escapeHtml(reg.asal_sekolah)}</td>
                                <td>${escapeHtml(reg.timestamp)}</td>
                                <td class="${statusClass}">${escapeHtml(reg.status_verifikasi)}</td>
                                <td>
                                    <select data-nomor="${escapeHtml(reg.nomor)}" class="status-select" style="padding:0.25rem;border-radius:4px;border:1px solid var(--light-gray);">
                                        <option value="Belum Diverifikasi" ${reg.status_verifikasi === 'Belum Diverifikasi' ? 'selected' : ''}>Belum Diverifikasi</option>
                                        <option value="Diverifikasi" ${reg.status_verifikasi === 'Diverifikasi' ? 'selected' : ''}>Diverifikasi</option>
                                        <option value="Ditolak" ${reg.status_verifikasi === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
                                    </select>
                                </td>
                            </tr>`;
                    });
        
                    html += `</tbody></table></div>
                        <div class="action-buttons mt-3">
                            <button id="export-excel-btn" class="btn btn-outline"><i class="fas fa-file-excel"></i> Export ke Excel</button>
                            <button id="logout-btn" class="btn btn-danger"><i class="fas fa-sign-out-alt"></i> Logout</button>
                        </div></div>`;
        
                    adminContent.innerHTML = html;
        
                    // Pasang event listener untuk update status
                    adminContent.querySelectorAll('.status-select').forEach(sel => {
                        sel.addEventListener('change', e => {
                            const nomor = e.target.getAttribute('data-nomor');
                            updateStatus(nomor, e.target.value, token);
                        });
                    });
        
                    // Event export Excel
                    const exportBtn = document.getElementById('export-excel-btn');
                    if (exportBtn) exportBtn.addEventListener('click', () => exportToExcel(token));
        
                    // Event logout
                    const logoutBtn = document.getElementById('logout-btn');
                    if (logoutBtn) logoutBtn.addEventListener('click', () => {
                        localStorage.removeItem('adminToken');
                        showSection('landing');
                    });
        
                } else {
                    adminContent.innerHTML = `<div class="alert alert-danger"><strong>Gagal memuat data:</strong> ${data.error?.message || 'Tidak ada data'}</div>`;
                    document.getElementById('login-form').classList.remove('hidden');
                    document.getElementById('admin-content').classList.add('hidden');
                }
            })
            .catch(() => {
                const adminContent = document.getElementById('admin-content');
                if (adminContent) {
                    adminContent.innerHTML = `<div class="alert alert-danger"><strong>Terjadi kesalahan saat memuat data</strong></div>`;
                    document.getElementById('login-form').classList.remove('hidden');
                    document.getElementById('admin-content').classList.add('hidden');
                }
            });
        }
        
        // Update status pendaftaran dari dashboard admin
        function updateStatus(nomor, status, token) {
            if (!nomor || !status) {
                showErrorAlert('Nomor dan status harus diisi');
                return;
            }
        
            if (!token) {
                token = localStorage.getItem('adminToken');
                if (!token) {
                    showErrorAlert('Sesi telah habis, silakan login kembali');
                    document.getElementById('login-form').classList.remove('hidden');
                    document.getElementById('admin-content').classList.add('hidden');
                    return;
                }
            }
        
            apiCall('dummy-url', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'updateStatus', nomor, status, token })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: 'Berhasil!',
                        text: 'Status pendaftaran berhasil diperbarui',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        customClass: { confirmButton: 'btn btn-success' },
                        buttonsStyling: false,
                        timer: 2000,
                        timerProgressBar: true
                    });
                } else {
                    showErrorAlert('Gagal memperbarui status: ' + (data.error?.message || 'Unknown error'));
                }
            })
            .catch(() => showErrorAlert('Terjadi kesalahan saat memperbarui status'));
        }
        
        // Export data admin ke Excel
        function exportToExcel(token) {
            if (!token) {
                token = localStorage.getItem('adminToken');
                if (!token) {
                    showErrorAlert('Sesi telah habis, silakan login kembali');
                    document.getElementById('login-form').classList.remove('hidden');
                    document.getElementById('admin-content').classList.add('hidden');
                    return;
                }
            }
        
            Swal.fire({
                title: 'Sedang memproses...',
                html: 'Mempersiapkan file Excel untuk diunduh',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
        
            apiCall('dummy-url', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'exportData', token })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: 'Berhasil!',
                        html: 'File Excel siap diunduh',
                        icon: 'success',
                        confirmButtonText: 'Unduh Sekarang',
                        customClass: { confirmButton: 'btn btn-success' },
                        buttonsStyling: false
                    }).then(() => {
                        window.open(data.data.downloadUrl, '_blank');
                    });
                } else {
                    showErrorAlert('Gagal mengekspor data: ' + (data.error?.message || 'Unknown error'));
                }
            })
            .catch(() => showErrorAlert('Terjadi kesalahan saat mengekspor data'));
        }
        
        // Utility: escape HTML untuk keamanan output
        function escapeHtml(text) {
            if (!text) return '';
            return text.replace(/&/g, "&amp;")
                       .replace(/</g, "&lt;")
                       .replace(/>/g, "&gt;")
                       .replace(/"/g, "&quot;")
                       .replace(/'/g, "&#039;");
        }
        
        // Utility: tampilkan alert sukses
        function showSuccessAlert(message) {
            Swal.fire({
                title: 'Berhasil!',
                text: message,
                icon: 'success',
                confirmButtonText: 'OK',
                customClass: { confirmButton: 'btn btn-success' },
                buttonsStyling: false
            });
        }
        
        // Utility: tampilkan alert error
        function showErrorAlert(message) {
            Swal.fire({
                title: 'Error!',
                text: message,
                icon: 'error',
                confirmButtonText: 'OK',
                customClass: { confirmButton: 'btn btn-danger' },
                buttonsStyling: false
            });
        }