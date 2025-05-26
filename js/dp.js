let currentUser = null;
let statusChart, genderChart;

function showLoading(show) {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    console.log('Show loading:', show);
    spinner.style.display = show ? 'flex' : 'none';
    if (show) {
      setTimeout(() => {
        if (spinner && spinner.style.display === 'flex') {
          console.warn('Loading timeout, forcing hide');
          spinner.style.display = 'none';
        }
      }, 5000); // 5 detik timeout
    }
  } else {
    console.error('Spinner element not found');
  }
}

function showMessage(elementId, message, type) {
  const container = document.getElementById(elementId);
  if (container) {
    console.log('showMessage:', elementId, message, type);
    container.innerHTML = `<div class="alert alert-${type === 'success' ? 'success' : 'danger'}" role="alert">${message}</div>`;
    setTimeout(() => container.innerHTML = '', 5000);
  } else {
    console.error('Message container not found:', elementId);
  }
}

function navigateTo(section) {
  console.log('navigateTo:', section);
  const sections = ['home', 'register', 'edit', 'check', 'upload', 'checklist', 'admin', 'login', 'contact'];
  sections.forEach(s => {
    const el = document.getElementById(`${s}-section`);
    if (el) {
      el.style.display = s === section ? 'block' : 'none';
      console.log(`Set ${s}-section display:`, el.style.display);
    } else {
      console.error(`Section not found: ${s}-section`);
    }
  });
  if (section === 'admin' && currentUser) {
    console.log('Loading admin dashboard');
    loadAdminDashboard();
  }
}

function showAdminSection(contentId) {
  console.log('showAdminSection:', contentId);
  const contents = ['dashboard', 'siswa', 'users', 'settings'];
  contents.forEach(id => {
    const el = document.getElementById(`${id}-content`);
    if (el) {
      el.style.display = id === contentId ? 'block' : 'none';
      console.log(`Set ${id}-content display:`, el.style.display);
    } else {
      console.error(`Content not found: ${id}-content`);
    }
    const navLink = document.querySelector(`.admin-sidebar .nav-link[onclick*="${id}"]`);
    if (navLink) {
      navLink.classList.toggle('active', id === contentId);
    }
  });
  if (contentId === 'siswa') loadAllSiswa();
  if (contentId === 'users') loadAllUsers();
  if (contentId === 'settings') loadSettings();
}

function loadRegistrationStats() {
  console.log('loadRegistrationStats called');
  showLoading(true);
  google.script.run
    .withSuccessHandler(function(stats) {
      showLoading(false);
      console.log('Registration stats:', stats);
      if (!stats) {
        showMessage('registration-stats', 'Data statistik kosong', 'error');
        return;
      }
      document.getElementById('stat-total').textContent = stats.total || 0;
      document.getElementById('stat-verified').textContent = stats.verified || 0;
      document.getElementById('stat-pending').textContent = stats.pending || 0;
      document.getElementById('stat-rejected').textContent = stats.rejected || 0;
      document.getElementById('stat-male').textContent = stats.byGender['Laki-laki'] || 0;
      document.getElementById('stat-female').textContent = stats.byGender['Perempuan'] || 0;

      const bySchoolList = document.getElementById('stat-by-school');
      if (bySchoolList) {
        bySchoolList.innerHTML = '';
        for (const school in stats.bySchool) {
          const li = document.createElement('li');
          li.textContent = `${school}: ${stats.bySchool[school]} pendaftar`;
          bySchoolList.appendChild(li);
        }
      }

      const recentActivityDiv = document.getElementById('recentActivity');
      if (recentActivityDiv) {
        recentActivityDiv.innerHTML = `
          <h4>Pendaftar Terbaru</h4>
          <ul class="list-group">
            ${stats.recentActivity.map(item => `
              <li class="list-group-item">
                <strong>${item['Nomor Pendaftaran']}</strong>: ${item['Nama Lengkap']} (${item['Jenis Kelamin']})
                dari ${item['Asal Sekolah']} - ${item['Status Verifikasi']}
              </li>
            `).join('')}
          </ul>
        `;
      }

      renderCharts(stats);
    })
    .withFailureHandler(function(error) {
      showLoading(false);
      console.error('Error loading stats:', error);
      showMessage('registration-stats', 'Gagal memuat statistik: ' + error.message, 'error');
    })
    .handleGetRegistrationStats();
}

function renderCharts(stats) {
  console.log('renderCharts called');
  if (statusChart) statusChart.destroy();
  if (genderChart) genderChart.destroy();

  const statusCtx = document.getElementById('statusChart')?.getContext('2d');
  if (statusCtx) {
    statusChart = new Chart(statusCtx, {
      type: 'pie',
      data: {
        labels: ['Diverifikasi', 'Belum Diverifikasi', 'Ditolak'],
        datasets: [{
          data: [stats.verified, stats.pending, stats.rejected],
          backgroundColor: ['var(--success)', 'var(--warning)', 'var(--danger)'],
          borderColor: 'var(--dark)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Status Verifikasi' } }
      }
    });
  } else {
    console.error('statusChart canvas not found');
  }

  const genderCtx = document.getElementById('genderChart')?.getContext('2d');
  if (genderCtx) {
    genderChart = new Chart(genderCtx, {
      type: 'bar',
      data: {
        labels: ['Laki-laki', 'Perempuan'],
        datasets: [{
          label: 'Jumlah Pendaftar',
          data: [stats.byGender['Laki-laki'] || 0, stats.byGender['Perempuan'] || 0],
          backgroundColor: ['var(--primary)', '#ff69b4'],
          borderColor: 'var(--dark)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { title: { display: true, text: 'Pendaftar Berdasarkan Jenis Kelamin' } }
      }
    });
  } else {
    console.error('genderChart canvas not found');
  }
}

function loadAdminDashboard() {
  console.log('loadAdminDashboard called');
  if (!currentUser) {
    console.log('No user, redirect to login');
    navigateTo('login');
    return;
  }
  showLoading(true);
  showAdminSection('dashboard');
  loadRegistrationStats();
  google.script.run
    .withSuccessHandler(function(info) {
      showLoading(false);
      console.log('Tahun ajaran:', info);
      document.getElementById('tahunAjaranDisplay').textContent = `Tahun Ajaran: ${info.tahunAjaran}`;
    })
    .withFailureHandler(function(error) {
      showLoading(false);
      console.error('Error loading tahun ajaran:', error);
      showMessage('dashboard-content', 'Gagal memuat data: ' + error.message, 'error');
    })
    .getTahunAjaran();
}

function loadAllSiswa() {
  console.log('loadAllSiswa called');
  showLoading(true);
  google.script.run
    .withSuccessHandler(function(siswaList) {
      showLoading(false);
      console.log('Siswa list:', siswaList);
      const tbody = document.getElementById('siswa-list');
      if (!tbody) {
        console.error('siswa-list tbody not found');
        return;
      }
      tbody.innerHTML = '';
      if (siswaList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Tidak ada data siswa.</td></tr>';
        return;
      }
      siswaList.forEach(siswa => {
        const row = tbody.insertRow();
        row.insertCell().textContent = siswa['Nomor Pendaftaran'] || '-';
        row.insertCell().textContent = siswa['Nama Lengkap'] || '-';
        row.insertCell().textContent = siswa.NISN || '-';
        row.insertCell().textContent = siswa['Asal Sekolah'] || '-';
        row.insertCell().textContent = siswa['Status Verifikasi'] || '-';

        const actionsCell = row.insertCell();
        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update';
        updateBtn.className = 'btn btn-sm btn-primary';
        updateBtn.onclick = () => {
          document.getElementById('update-nisn').value = siswa.NISN;
          document.getElementById('update-status').value = siswa['Status Verifikasi'];
          window.scrollTo(0, document.getElementById('update-siswa-status-form').offsetTop);
        };
        actionsCell.appendChild(updateBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Hapus';
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.onclick = () => {
          Swal.fire({
            title: 'Yakin ingin menghapus?',
            text: `Hapus siswa ${siswa['Nama Lengkap']}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal'
          }).then((result) => {
            if (result.isConfirmed) {
              showLoading(true);
              google.script.run
                .withSuccessHandler(function(res) {
                  showLoading(false);
                  showMessage('siswa-message', res.message, 'success');
                  loadAllSiswa();
                })
                .withFailureHandler(function(error) {
                  showLoading(false);
                  showMessage('siswa-message', 'Gagal menghapus siswa: ' + error.message, 'error');
                })
                .deleteSiswa(siswa.NISN);
            }
          });
        };
        actionsCell.appendChild(deleteBtn);
      });
    })
    .withFailureHandler(function(error) {
      showLoading(false);
      console.error('Error loading siswa:', error);
      document.getElementById('siswa-list').innerHTML = '<tr><td colspan="6">Gagal memuat data siswa.</td></tr>';
    })
    .getAllSiswa();
}

function loadAllUsers() {
  console.log('loadAllUsers called');
  showLoading(true);
  google.script.run
    .withSuccessHandler(function(userList) {
      showLoading(false);
      console.log('User list:', userList);
      const tbody = document.getElementById('users-list');
      if (!tbody) {
        console.error('users-list tbody not found');
        return;
      }
      tbody.innerHTML = '';
      if (userList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Tidak ada data pengguna.</td></tr>';
        return;
      }
      userList.forEach(user => {
        const row = tbody.insertRow();
        row.insertCell().textContent = user.Username || '-';
        row.insertCell().textContent = user.Nama || '-';
        row.insertCell().textContent = user.Peran || '-';

        const actionsCell = row.insertCell();
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Hapus';
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.onclick = () => {
          Swal.fire({
            title: 'Yakin hapus pengguna?',
            text: `Hapus user ${user.Username}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal'
          }).then((result) => {
            if (result.isConfirmed) {
              showLoading(true);
              google.script.run
                .withSuccessHandler(function(res) {
                  showLoading(false);
                  showMessage('user-message', res.message, 'success');
                  loadAllUsers();
                })
                .withFailureHandler(function(error) {
                  showLoading(false);
                  showMessage('user-message', 'Gagal menghapus user: ' + error.message, 'error');
                })
                .deleteUser(user.Username);
            }
          });
        };
        actionsCell.appendChild(deleteBtn);
      });
    })
    .withFailureHandler(function(error) {
      showLoading(false);
      console.error('Error loading users:', error);
      document.getElementById('users-list').innerHTML = '<tr><td colspan="4">Gagal memuat data pengguna.</td></tr>';
    })
    .getAllUsers();
}

function loadSettings() {
  console.log('loadSettings called');
  showLoading(true);
  google.script.run
    .withSuccessHandler(function(settingsList) {
      showLoading(false);
      console.log('Settings list:', settingsList);
      const settingsFieldsDiv = document.getElementById('settings-fields');
      if (!settingsFieldsDiv) {
        console.error('settings-fields div not found');
        return;
      }
      settingsFieldsDiv.innerHTML = '';
      settingsList.forEach(setting => {
        const div = document.createElement('div');
        div.className = 'mb-3';
        div.innerHTML = `
          <label for="setting-${setting.Key}" class="form-label">${setting.Key}</label>
          <input type="text" class="form-control" id="setting-${setting.Key}" name="${setting.Key}" value="${setting.Value}">
        `;
        settingsFieldsDiv.appendChild(div);
      });
    })
    .withFailureHandler(function(error) {
      showLoading(false);
      console.error('Error loading settings:', error);
      document.getElementById('settings-fields').innerHTML = '<p>Gagal memuat pengaturan.</p>';
    })
    .getAllSettings();
}

function loginUser() {
  console.log('loginUser called');
  const username = document.getElementById('login-username')?.value;
  const password = document.getElementById('login-password')?.value;
  const messageDiv = document.getElementById('login-message');
  if (!username || !password) {
    messageDiv.innerHTML = '<div class="alert alert-danger">Username dan password harus diisi.</div>';
    return;
  }
  showLoading(true);
  google.script.run
    .withSuccessHandler(function(user) {
      showLoading(false);
      if (user) {
        currentUser = user;
        messageDiv.innerHTML = '<div class="alert alert-success">Login berhasil!</div>';
        document.getElementById('adminNavItem').style.display = 'inline';
        document.getElementById('loginNavItem').style.display = 'none';
        navigateTo('admin');
      } else {
        messageDiv.innerHTML = '<div class="alert alert-danger">Username atau password salah.</div>';
      }
    })
    .withFailureHandler(function(error) {
      showLoading(false);
      console.error('Error login:', error);
      messageDiv.innerHTML = `<div class="alert alert-danger">Gagal login: ${error.message}</div>`;
    })
    .authenticateUser(username, password);
}

function logoutAdmin() {
  console.log('logoutAdmin called');
  currentUser = null;
  document.getElementById('adminNavItem').style.display = 'none';
  document.getElementById('loginNavItem').style.display = 'inline';
  PropertiesService.getUserProperties().deleteProperty('userData');
  navigateTo('home');
}

function initializeApp() {
  console.log('initializeApp called');
  const updateSiswaForm = document.getElementById('update-siswa-status-form');
  if (updateSiswaForm) {
    updateSiswaForm.addEventListener('submit', function(event) {
      event.preventDefault();
      console.log('update-siswa-status-form submitted');
      const nisn = document.getElementById('update-nisn').value;
      const status = document.getElementById('update-status').value;
      showLoading(true);
      google.script.run
        .withSuccessHandler(function(res) {
          showLoading(false);
          showMessage('siswa-message', res.message, 'success');
          loadAllSiswa();
        })
        .withFailureHandler(function(error) {
          showLoading(false);
          showMessage('siswa-message', 'Gagal update status: ' + error.message, 'error');
        })
        .updateSiswa({ NISN: nisn, 'Status Verifikasi': status });
    });
  }

  const addUserForm = document.getElementById('add-user-form');
  if (addUserForm) {
    addUserForm.addEventListener('submit', function(event) {
      event.preventDefault();
      console.log('add-user-form submitted');
      const formData = {
        Username: document.getElementById('add-username').value,
        Password: document.getElementById('add-password').value,
        Nama: document.getElementById('add-nama').value,
        Peran: document.getElementById('add-peran').value
      };
      showLoading(true);
      google.script.run
        .withSuccessHandler(function(res) {
          showLoading(false);
          showMessage('user-message', res.message, 'success');
          addUserForm.reset();
          document.getElementById('add-user-form-container').style.display = 'none';
          loadAllUsers();
        })
        .withFailureHandler(function(error) {
          showLoading(false);
          showMessage('user-message', 'Gagal menambah user: ' + error.message, 'error');
        })
        .addUser(formData);
    });
  }

  const showAddUserFormBtn = document.getElementById('show-add-user-form');
  if (showAddUserFormBtn) {
    showAddUserFormBtn.addEventListener('click', function() {
      console.log('show-add-user-form clicked');
      const container = document.getElementById('add-user-form-container');
      container.style.display = container.style.display === 'none' ? 'block' : 'none';
    });
  }

  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', function(event) {
      event.preventDefault();
      console.log('settings-form submitted');
      const settingsData = {};
      for (let element of settingsForm.elements) {
        if (element.name && element.tagName !== 'BUTTON') {
          settingsData[element.name] = element.value;
        }
      }
      showLoading(true);
      google.script.run
        .withSuccessHandler(function(res) {
          showLoading(false);
          showMessage('settings-message', res.message, 'success');
          loadSettings();
          google.script.run
            .withSuccessHandler(function(info) {
              showLoading(false);
              document.getElementById('tahunAjaranDisplay').textContent = `Tahun Ajaran: ${info.tahunAjaran}`;
            })
            .withFailureHandler(function(error) {
              showLoading(false);
              console.error('Error fetching tahun ajaran:', error);
            })
            .getTahunAjaran();
        })
        .withFailureHandler(function(error) {
          showLoading(false);
          showMessage('settings-message', 'Gagal menyimpan pengaturan: ' + error.message, 'error');
        })
        .updateSettings(settingsData);
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      console.log('login-form submitted');
      loginUser();
    });
  }

  const registrationForm = document.getElementById('registration-form');
  if (registrationForm) {
    registrationForm.addEventListener('submit', function(event) {
      event.preventDefault();
      console.log('registration-form submitted');
      const formData = {
        NISN: document.getElementById('nisn').value,
        NIK: document.getElementById('nik').value,
        'Nama Lengkap': document.getElementById('nama-lengkap').value,
        'Jenis Kelamin': document.getElementById('jenis-kelamin').value,
        'Tempat Lahir': document.getElementById('tempat-lahir').value,
        'Tanggal Lahir': document.getElementById('tanggal-lahir').value,
        Agama: document.getElementById('agama').value,
        'Alamat Lengkap': document.getElementById('alamat-lengkap').value,
        WhatsApp: document.getElementById('whatsapp').value,
        'Nama Ayah': document.getElementById('nama-ayah').value,
        'Pekerjaan Ayah': document.getElementById('pekerjaan-ayah').value,
        'Nama Ibu': document.getElementById('nama-ibu').value,
        'Pekerjaan Ibu': document.getElementById('pekerjaan-ibu').value,
        'WhatsApp Orang Tua': document.getElementById('whatsapp-ortu').value,
        'Asal Sekolah': document.getElementById('asal-sekolah').value,
        'Tahun Lulus': document.getElementById('tahun-lulus').value,
        'Jenis Pendaftaran': 'Siswa Baru'
      };
      showLoading(true);
      google.script.run
        .withSuccessHandler(function(res) {
          showLoading(false);
          showMessage('registration-message', `${res.message} Nomor: ${res.nomorPendaftaran}`, 'success');
          registrationForm.reset();
        })
        .withFailureHandler(function(error) {
          showLoading(false);
          showMessage('registration-message', 'Gagal mendaftar: ' + error.message, 'error');
        })
        .saveSiswaRegistration(formData);
    });
  }

  navigateTo('home');
}

if (document.readyState === 'complete') {
  initializeApp();
} else {
  document.addEventListener('DOMContentLoaded', initializeApp);
}