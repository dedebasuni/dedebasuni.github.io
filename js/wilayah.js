        // State management
        const state = {
            currentView: 'provinsi',
            currentData: null,
            navigationStack: [],
            breadcrumbs: [{ text: 'Provinsi', level: 'provinsi' }],
            params: {
                kode_provinsi: null,
                kode_kabupaten_kota: null,
                kode_kecamatan: null,
                nama_provinsi: null,
                nama_kabupaten: null,
                nama_kecamatan: null
            },
            pagination: {
                currentPage: 1,
                itemsPerPage: 10,
                totalItems: 0
            },
            searchQuery: ''
        };

        // DOM elements
        const contentEl = document.getElementById('content');
        const breadcrumbEl = document.getElementById('breadcrumb');
        const searchInput = document.getElementById('searchInput');

        // API base URL
        const API_BASE_URL = 'https://api.datawilayah.com/api';

        // Initialize app
        document.addEventListener('DOMContentLoaded', () => {
            fetchProvinsi();
            setupEventListeners();
        });

        // Event listeners
        function setupEventListeners() {
            // Search functionality
            searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value.toLowerCase();
                renderContent();
            });
        }

        // Navigation functions
        function navigateBack() {
            if (state.navigationStack.length > 0) {
                const prevState = state.navigationStack.pop();
                state.currentView = prevState.currentView;
                state.currentData = prevState.currentData;
                state.breadcrumbs = prevState.breadcrumbs;
                state.params = prevState.params;
                renderContent();
                updateBreadcrumb();
            }
        }

        function pushToNavigationStack() {
            state.navigationStack.push({
                currentView: state.currentView,
                currentData: Array.isArray(state.currentData) ? [...state.currentData] : state.currentData,
                breadcrumbs: [...state.breadcrumbs],
                params: { ...state.params }
            });
        }

        // API fetch functions
        async function fetchProvinsi() {
            try {
                showLoading();
                const response = await fetch(`${API_BASE_URL}/provinsi.json`);
                if (!response.ok) throw new Error('Gagal memuat data provinsi');
                const data = await response.json();

                // Normalize data
                let provinsiData = [];
                if (Array.isArray(data)) {
                    provinsiData = data;
                } else if (data && data.data && Array.isArray(data.data)) {
                    provinsiData = data.data;
                } else if (data && typeof data === 'object') {
                    provinsiData = [data];
                }

                // Validate province count
                if (provinsiData.length < 38) {
                    showWarning(`Peringatan: Hanya ${provinsiData.length} provinsi ditemukan, seharusnya 38. Data API mungkin tidak lengkap.`);
                }

                state.currentView = 'provinsi';
                state.currentData = provinsiData;
                state.breadcrumbs = [{ text: 'Provinsi', level: 'provinsi' }];
                state.params = {
                    kode_provinsi: null,
                    kode_kabupaten_kota: null,
                    kode_kecamatan: null,
                    nama_provinsi: null,
                    nama_kabupaten: null,
                    nama_kecamatan: null
                };
                state.pagination.currentPage = 1;
                state.pagination.totalItems = provinsiData.length;

                renderContent();
                updateBreadcrumb();
            } catch (error) {
                showError('Gagal memuat data provinsi: ' + error.message);
            }
        }

        async function fetchKabupatenKota(kodeProvinsi) {
            try {
                showLoading();
                const response = await fetch(`${API_BASE_URL}/kabupaten_kota/${kodeProvinsi}.json`);
                if (!response.ok) throw new Error('Gagal memuat data kabupaten/kota');
                const data = await response.json();

                const kabupatenData = Array.isArray(data) ? data : (data.data ? data.data : [data]);
                pushToNavigationStack();
                state.currentView = 'kabupaten_kota';
                state.currentData = kabupatenData;
                state.params = {
                    kode_provinsi: kodeProvinsi,
                    kode_kabupaten_kota: null,
                    kode_kecamatan: null,
                    nama_provinsi: state.params.nama_provinsi || 'Kabupaten/Kota',
                    nama_kabupaten: null,
                    nama_kecamatan: null
                };
                state.pagination.currentPage = 1;
                state.pagination.totalItems = kabupatenData.length;

                const provinsiName = state.navigationStack.length > 0 && Array.isArray(state.navigationStack[state.navigationStack.length - 1].currentData)
                    ? state.navigationStack[state.navigationStack.length - 1].currentData.find(p => p.kode_wilayah === kodeProvinsi)?.nama_wilayah
                    : state.params.nama_provinsi || 'Kabupaten/Kota';

                state.params.nama_provinsi = provinsiName;
                state.breadcrumbs = [
                    { text: 'Provinsi', level: 'provinsi' },
                    { text: provinsiName, level: 'kabupaten_kota', kode: kodeProvinsi }
                ];

                renderContent();
                updateBreadcrumb();
            } catch (error) {
                showError('Gagal memuat data kabupaten/kota: ' + error.message);
            }
        }

        async function fetchKecamatan(kodeKabupatenKota, kodeProvinsi) {
            try {
                showLoading();
                const response = await fetch(`${API_BASE_URL}/kecamatan/${kodeKabupatenKota}.json`);
                if (!response.ok) throw new Error('Gagal memuat data kecamatan');
                const data = await response.json();

                let kecamatanData = [];
                if (Array.isArray(data)) {
                    kecamatanData = data;
                } else if (data && data.data && Array.isArray(data.data)) {
                    kecamatanData = data.data;
                } else if (data && typeof data === 'object') {
                    kecamatanData = [data];
                }

                if (kecamatanData.length === 0) {
                    throw new Error('Data kecamatan kosong');
                }

                pushToNavigationStack();
                state.currentView = 'kecamatan';
                state.currentData = kecamatanData;
                state.params = {
                    kode_provinsi: kodeProvinsi,
                    kode_kabupaten_kota: kodeKabupatenKota,
                    kode_kecamatan: null,
                    nama_provinsi: state.params.nama_provinsi,
                    nama_kabupaten: state.params.nama_kabupaten || 'Kecamatan',
                    nama_kecamatan: null
                };
                state.pagination.currentPage = 1;
                state.pagination.totalItems = kecamatanData.length;

                const prevState = state.navigationStack[state.navigationStack.length - 1];
                const parentKabupaten = prevState.currentData && Array.isArray(prevState.currentData)
                    ? prevState.currentData.find(item => item.kode_wilayah === kodeKabupatenKota)
                    : { nama_wilayah: state.params.nama_kabupaten || 'Kecamatan', nama_provinsi: state.params.nama_provinsi || 'N/A' };

                state.params.nama_kabupaten = parentKabupaten.nama_wilayah;
                state.breadcrumbs = [
                    { text: 'Provinsi', level: 'provinsi' },
                    { text: parentKabupaten.nama_provinsi, level: 'kabupaten_kota', kode: kodeProvinsi },
                    { text: parentKabupaten.nama_wilayah, level: 'kecamatan', kode: kodeKabupatenKota }
                ];

                renderContent();
                updateBreadcrumb();
            } catch (error) {
                showError('Gagal memuat data kecamatan: ' + error.message);
            }
        }

        async function fetchDesaKelurahan(kodeKecamatan, kodeKabupatenKota) {
            try {
                showLoading();
                const response = await fetch(`${API_BASE_URL}/desa_kelurahan/${kodeKecamatan}.json`);
                if (!response.ok) throw new Error('Gagal memuat data desa/kelurahan');
                const data = await response.json();

                let desaData = [];
                if (Array.isArray(data)) {
                    desaData = data;
                } else if (data && data.data && Array.isArray(data.data)) {
                    desaData = data.data;
                } else if (data && typeof data === 'object') {
                    desaData = [data];
                }

                if (desaData.length === 0) {
                    throw new Error('Data desa/kelurahan kosong');
                }

                pushToNavigationStack();
                state.currentView = 'desa_kelurahan';
                state.currentData = desaData;
                state.params = {
                    kode_provinsi: kodeKabupatenKota.split('.')[0],
                    kode_kabupaten_kota: kodeKabupatenKota,
                    kode_kecamatan: kodeKecamatan,
                    nama_provinsi: state.params.nama_provinsi,
                    nama_kabupaten: state.params.nama_kabupaten,
                    nama_kecamatan: state.params.nama_kecamatan || 'Desa/Kelurahan'
                };
                state.pagination.currentPage = 1;
                state.pagination.totalItems = desaData.length;

                const prevState = state.navigationStack[state.navigationStack.length - 1];
                const parentKecamatan = prevState.currentData && Array.isArray(prevState.currentData)
                    ? prevState.currentData.find(item => item.kode_wilayah === kodeKecamatan)
                    : { nama_wilayah: state.params.nama_kecamatan || 'Desa/Kelurahan' };

                state.params.nama_kecamatan = parentKecamatan.nama_wilayah;
                state.breadcrumbs = [
                    { text: 'Provinsi', level: 'provinsi' },
                    { text: state.params.nama_provinsi || 'Kabupaten/Kota', level: 'kabupaten_kota', kode: kodeKabupatenKota.split('.')[0] },
                    { text: state.params.nama_kabupaten || 'Kecamatan', level: 'kecamatan', kode: kodeKabupatenKota },
                    { text: parentKecamatan.nama_wilayah, level: 'desa_kelurahan', kode: kodeKecamatan }
                ];

                renderContent();
                updateBreadcrumb();
            } catch (error) {
                showError('Gagal memuat data desa/kelurahan: ' + error.message);
            }
        }

        // Render functions
        function renderContent() {
            contentEl.innerHTML = '';
            
            // Apply search filter if query exists
            let filteredData = state.currentData;
            if (state.searchQuery && Array.isArray(state.currentData)) {
                filteredData = state.currentData.filter(item => 
                    item.nama_wilayah.toLowerCase().includes(state.searchQuery)
                );
                state.pagination.totalItems = filteredData.length;
            }

            switch (state.currentView) {
                case 'provinsi':
                    renderProvinsi(filteredData);
                    break;
                case 'provinsi_detail':
                    renderProvinsiDetail();
                    break;
                case 'kabupaten_kota':
                    renderKabupatenKota(filteredData);
                    break;
                case 'kabupaten_detail':
                    renderKabupatenDetail();
                    break;
                case 'kecamatan':
                    renderKecamatan(filteredData);
                    break;
                case 'desa_kelurahan':
                    renderDesaKelurahan(filteredData);
                    break;
                default:
                    renderProvinsi(filteredData);
            }

            // Render pagination if needed
            if (Array.isArray(filteredData) && filteredData.length > state.pagination.itemsPerPage) {
                renderPagination();
            }
        }

        function renderProvinsi(provinsiData) {
            if (!provinsiData || !Array.isArray(provinsiData)) {
                showError('Data provinsi tidak tersedia');
                return;
            }

            // Calculate pagination
            const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
            const endIndex = Math.min(startIndex + state.pagination.itemsPerPage, provinsiData.length);
            const paginatedData = provinsiData.slice(startIndex, endIndex);

            const table = document.createElement('div');
            table.className = 'table-responsive';
            table.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Provinsi</th>
                            <th>Kode Wilayah</th>
                            <th>Jumlah Penduduk</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
            const tbody = table.querySelector('tbody');

            paginatedData.forEach(provinsi => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center;">
                            <i class="fas fa-map-marker-alt" style="margin-right: 10px; color: ${getRandomColor()}"></i>
                            <span class="wilayah-name" data-kode="${provinsi.kode_wilayah || ''}" style="cursor: pointer; font-weight: 500;">
                                ${provinsi.nama_wilayah || 'N/A'}
                            </span>
                        </div>
                    </td>
                    <td><span class="badge badge-primary">${provinsi.kode_wilayah || 'N/A'}</span></td>
                    <td>${provinsi.populasi?.penduduk?.jumlah_penduduk ? formatNumber(provinsi.populasi.penduduk.jumlah_penduduk) : '-'}</td>
                    <td><span class="badge badge-success">Aktif</span></td>
                `;
                const wilayahName = row.querySelector('.wilayah-name');
                if (provinsi.kode_wilayah) {
                    wilayahName.addEventListener('click', () => {
                        showProvinsiDetail(provinsi);
                    });
                }
                tbody.appendChild(row);
            });

            contentEl.appendChild(table);
        }

        function showProvinsiDetail(provinsi) {
            pushToNavigationStack();
            state.currentView = 'provinsi_detail';
            state.currentData = provinsi;
            state.params.nama_provinsi = provinsi.nama_wilayah;
            state.breadcrumbs = [
                { text: 'Provinsi', level: 'provinsi' },
                { text: provinsi.nama_wilayah, level: 'provinsi_detail' }
            ];

            renderProvinsiDetail();
            updateBreadcrumb();
        }

        function renderProvinsiDetail() {
            const provinsi = state.currentData;
            const detailView = document.createElement('div');
            detailView.className = 'detail-view';

            // Stats grid
            const statsGrid = document.createElement('div');
            statsGrid.className = 'stats-grid';
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-card-title">Total Penduduk</div>
                    <div class="stat-card-value">${formatNumber(provinsi.populasi?.penduduk?.jumlah_penduduk || 0)}</div>
                    <div class="stat-card-change">+2.5% dari tahun lalu</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Luas Wilayah</div>
                    <div class="stat-card-value">${formatNumber(provinsi.luas_wilayah || 0)} km²</div>
                    <div class="stat-card-change">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Kepadatan</div>
                    <div class="stat-card-value">${formatNumber(provinsi.populasi?.penduduk?.jumlah_penduduk_km2 || 0)}</div>
                    <div class="stat-card-change">per km²</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Kabupaten/Kota</div>
                    <div class="stat-card-value">${provinsi.jumlah_kabupaten || 'N/A'}</div>
                    <div class="stat-card-change">-</div>
                </div>
            `;

            // Map placeholder
            const mapContainer = document.createElement('div');
            mapContainer.className = 'map-container';
            mapContainer.innerHTML = `
                <div class="map-placeholder">
                    <i class="fas fa-map" style="font-size: 3rem; margin-right: 15px;"></i>
                    <span>Peta Wilayah ${provinsi.nama_wilayah}</span>
                </div>
            `;

            // Detail sections
            const detailSections = document.createElement('div');
            detailSections.innerHTML = `
                <div class="detail-section">
                    <div class="detail-header">
                        <h3><i class="fas fa-info-circle" style="margin-right: 10px;"></i>Informasi Dasar</h3>
                    </div>
                    <div class="detail-content">
                        <div class="detail-row">
                            <div class="detail-label">Kode Wilayah</div>
                            <div class="detail-value">${provinsi.kode_wilayah || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Level Wilayah</div>
                            <div class="detail-value">${provinsi.level_wilayah || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Ibu Kota</div>
                            <div class="detail-value">${provinsi.ibu_kota || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                ${renderPopulasiSection(provinsi.populasi)}
            `;

            // Action buttons
            const actionButtons = document.createElement('div');
            actionButtons.className = 'btn-group';
            actionButtons.innerHTML = `
                <button class="btn btn-outline" onclick="navigateBack()">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <button class="btn btn-primary" onclick="fetchKabupatenKota('${provinsi.kode_wilayah}')">
                    <i class="fas fa-city"></i> Lihat Kabupaten/Kota
                </button>
            `;

            // Assemble the view
            detailView.appendChild(statsGrid);
            detailView.appendChild(mapContainer);
            detailView.appendChild(detailSections);
            detailView.appendChild(actionButtons);

            contentEl.appendChild(detailView);
        }

        function renderKabupatenKota(kabupatenData) {
            if (!kabupatenData || !Array.isArray(kabupatenData)) {
                showError('Data kabupaten/kota tidak tersedia');
                return;
            }

            // Calculate pagination
            const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
            const endIndex = Math.min(startIndex + state.pagination.itemsPerPage, kabupatenData.length);
            const paginatedData = kabupatenData.slice(startIndex, endIndex);

            const table = document.createElement('div');
            table.className = 'table-responsive';
            table.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Kabupaten/Kota</th>
                            <th>Kode Wilayah</th>
                            <th>Provinsi</th>
                            <th>Penduduk</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
            const tbody = table.querySelector('tbody');

            paginatedData.forEach(kabupaten => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center;">
                            <i class="fas fa-${kabupaten.tipe === 'Kota' ? 'building' : 'tree'}" style="margin-right: 10px; color: ${getRandomColor()}"></i>
                            <span class="wilayah-name" data-kode="${kabupaten.kode_wilayah || ''}" style="cursor: pointer; font-weight: 500;">
                                ${kabupaten.nama_wilayah || 'N/A'}
                            </span>
                        </div>
                    </td>
                    <td><span class="badge badge-primary">${kabupaten.kode_wilayah || 'N/A'}</span></td>
                    <td>${kabupaten.nama_provinsi || state.params.nama_provinsi || 'N/A'}</td>
                    <td>${kabupaten.populasi?.penduduk?.jumlah_penduduk ? formatNumber(kabupaten.populasi.penduduk.jumlah_penduduk) : '-'}</td>
                `;
                const wilayahName = row.querySelector('.wilayah-name');
                if (kabupaten.kode_wilayah && kabupaten.kode_provinsi) {
                    wilayahName.addEventListener('click', () => {
                        showKabupatenDetail(kabupaten);
                    });
                }
                tbody.appendChild(row);
            });

            contentEl.appendChild(table);
        }

        function showKabupatenDetail(kabupaten) {
            pushToNavigationStack();
            state.currentView = 'kabupaten_detail';
            state.currentData = kabupaten;
            state.params.kode_kabupaten_kota = kabupaten.kode_wilayah;
            state.params.nama_kabupaten = kabupaten.nama_wilayah;

            state.breadcrumbs = [
                { text: 'Provinsi', level: 'provinsi' },
                { text: state.params.nama_provinsi || 'Kabupaten/Kota', level: 'kabupaten_kota', kode: state.params.kode_provinsi },
                { text: kabupaten.nama_wilayah, level: 'kabupaten_detail' }
            ];

            renderKabupatenDetail();
            updateBreadcrumb();
        }

        function renderKabupatenDetail() {
            const kabupaten = state.currentData;
            const detailView = document.createElement('div');
            detailView.className = 'detail-view';

            // Stats grid
            const statsGrid = document.createElement('div');
            statsGrid.className = 'stats-grid';
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-card-title">Total Penduduk</div>
                    <div class="stat-card-value">${formatNumber(kabupaten.populasi?.penduduk?.jumlah_penduduk || 0)}</div>
                    <div class="stat-card-change">+1.8% dari tahun lalu</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Luas Wilayah</div>
                    <div class="stat-card-value">${formatNumber(kabupaten.luas_wilayah || 0)} km²</div>
                    <div class="stat-card-change">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Kecamatan</div>
                    <div class="stat-card-value">${kabupaten.jumlah_kecamatan || 'N/A'}</div>
                    <div class="stat-card-change">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Tipe</div>
                    <div class="stat-card-value">${kabupaten.tipe || 'N/A'}</div>
                    <div class="stat-card-change">-</div>
                </div>
            `;

            // Detail sections
            const detailSections = document.createElement('div');
            detailSections.innerHTML = `
                <div class="detail-section">
                    <div class="detail-header">
                        <h3><i class="fas fa-info-circle" style="margin-right: 10px;"></i>Informasi Dasar</h3>
                    </div>
                    <div class="detail-content">
                        <div class="detail-row">
                            <div class="detail-label">Kode Wilayah</div>
                            <div class="detail-value">${kabupaten.kode_wilayah || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Provinsi</div>
                            <div class="detail-value">${kabupaten.nama_provinsi || state.params.nama_provinsi || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Ibu Kota</div>
                            <div class="detail-value">${kabupaten.ibu_kota || 'N/A'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Tipe</div>
                            <div class="detail-value">${kabupaten.tipe || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                ${renderPopulasiSection(kabupaten.populasi)}
            `;

            // Action buttons
            const actionButtons = document.createElement('div');
            actionButtons.className = 'btn-group';
            actionButtons.innerHTML = `
                <button class="btn btn-outline" onclick="navigateBack()">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <button class="btn btn-primary" onclick="fetchKecamatan('${kabupaten.kode_wilayah}', '${kabupaten.kode_provinsi}')">
                    <i class="fas fa-map-marked-alt"></i> Lihat Kecamatan
                </button>
            `;

            // Assemble the view
            detailView.appendChild(statsGrid);
            detailView.appendChild(detailSections);
            detailView.appendChild(actionButtons);

            contentEl.appendChild(detailView);
        }

        function renderKecamatan(kecamatanData) {
            if (!kecamatanData || !Array.isArray(kecamatanData) || kecamatanData.length === 0) {
                showError('Data kecamatan tidak tersedia atau kosong');
                return;
            }

            // Calculate pagination
            const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
            const endIndex = Math.min(startIndex + state.pagination.itemsPerPage, kecamatanData.length);
            const paginatedData = kecamatanData.slice(startIndex, endIndex);

            const table = document.createElement('div');
            table.className = 'table-responsive';
            table.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Kecamatan</th>
                            <th>Kode Wilayah</th>
                            <th>Kabupaten/Kota</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
            const tbody = table.querySelector('tbody');

            paginatedData.forEach(kecamatan => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center;">
                            <i class="fas fa-map-pin" style="margin-right: 10px; color: ${getRandomColor()}"></i>
                            <span class="wilayah-name" data-kode="${kecamatan.kode_wilayah || ''}" style="cursor: pointer; font-weight: 500;">
                                ${kecamatan.nama_wilayah || 'N/A'}
                            </span>
                        </div>
                    </td>
                    <td><span class="badge badge-primary">${kecamatan.kode_wilayah || 'N/A'}</span></td>
                    <td>${state.params.nama_kabupaten || 'N/A'}</td>
                `;
                const wilayahName = row.querySelector('.wilayah-name');
                if (kecamatan.kode_wilayah && kecamatan.kode_kabupaten_kota) {
                    wilayahName.addEventListener('click', () => {
                        state.params.nama_kecamatan = kecamatan.nama_wilayah;
                        fetchDesaKelurahan(kecamatan.kode_wilayah, kecamatan.kode_kabupaten_kota);
                    });
                }
                tbody.appendChild(row);
            });

            contentEl.appendChild(table);
        }

        function renderDesaKelurahan(desaData) {
            if (!desaData || !Array.isArray(desaData) || desaData.length === 0) {
                showError('Data desa/kelurahan tidak tersedia atau kosong');
                return;
            }

            // Calculate pagination
            const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
            const endIndex = Math.min(startIndex + state.pagination.itemsPerPage, desaData.length);
            const paginatedData = desaData.slice(startIndex, endIndex);

            const table = document.createElement('div');
            table.className = 'table-responsive';
            table.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Desa/Kelurahan</th>
                            <th>Kode Wilayah</th>
                            <th>Kecamatan</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
            const tbody = table.querySelector('tbody');

            paginatedData.forEach(desa => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center;">
                            <i class="fas fa-home" style="margin-right: 10px; color: ${getRandomColor()}"></i>
                            ${desa.nama_wilayah || 'N/A'}
                        </div>
                    </td>
                    <td><span class="badge badge-primary">${desa.kode_wilayah || 'N/A'}</span></td>
                    <td>${state.params.nama_kecamatan || 'N/A'}</td>
                `;
                tbody.appendChild(row);
            });

            contentEl.appendChild(table);
        }

        function renderPopulasiSection(populasi) {
            if (!populasi || !populasi.penduduk) return '';

            const sexRatio = calculateSexRatio(populasi.jenis_kelamin?.laki_laki || 0, populasi.jenis_kelamin?.perempuan || 0);
            const sexRatioClass = sexRatio !== 'N/A' && (parseFloat(sexRatio) > 110 || parseFloat(sexRatio) < 90) ? 'highlight' : '';

            return `
                <div class="detail-section">
                    <div class="detail-header">
                        <h3><i class="fas fa-users" style="margin-right: 10px;"></i>Data Penduduk</h3>
                    </div>
                    <div class="detail-content">
                        <div class="detail-row">
                            <div class="detail-label">Jumlah Penduduk</div>
                            <div class="detail-value">${formatNumber(populasi.penduduk.jumlah_penduduk)}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Kepadatan</div>
                            <div class="detail-value">${formatNumber(populasi.penduduk.jumlah_penduduk_km2 || 0)} per km²</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Tahun Data</div>
                            <div class="detail-value">${populasi.penduduk.tahun} (Semester ${populasi.penduduk.semester})</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-header">
                        <h3><i class="fas fa-venus-mars" style="margin-right: 10px;"></i>Jenis Kelamin</h3>
                    </div>
                    <div class="detail-content">
                        <div class="detail-row">
                            <div class="detail-label">Laki-laki</div>
                            <div class="detail-value">${formatNumber(populasi.jenis_kelamin?.laki_laki || 0)}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Perempuan</div>
                            <div class="detail-value">${formatNumber(populasi.jenis_kelamin?.perempuan || 0)}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Rasio Jenis Kelamin</div>
                            <div class="detail-value ${sexRatioClass}">${sexRatio}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-header">
                        <h3><i class="fas fa-chart-pie" style="margin-right: 10px;"></i>Usia Produktif</h3>
                    </div>
                    <div class="detail-content">
                        <div class="detail-row">
                            <div class="detail-label">15-64 tahun</div>
                            <div class="detail-value">${formatNumber(populasi.usia_produktif?.usia_15_64_thn || 0)} (${calculatePercentage(populasi.usia_produktif?.usia_15_64_thn || 0, populasi.penduduk.jumlah_penduduk)}%)</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">< 14 tahun</div>
                            <div class="detail-value">${formatNumber(populasi.usia_produktif?.usia_kurang_14_thn || 0)} (${calculatePercentage(populasi.usia_produktif?.usia_kurang_14_thn || 0, populasi.penduduk.jumlah_penduduk)}%)</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">> 65 tahun</div>
                            <div class="detail-value">${formatNumber(populasi.usia_produktif?.usia_diatas_65 || 0)} (${calculatePercentage(populasi.usia_produktif?.usia_diatas_65 || 0, populasi.penduduk.jumlah_penduduk)}%)</div>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderPagination() {
            const totalPages = Math.ceil(state.pagination.totalItems / state.pagination.itemsPerPage);
            if (totalPages <= 1) return;

            const pagination = document.createElement('div');
            pagination.className = 'pagination';

            // Previous button
            const prevBtn = document.createElement('div');
            prevBtn.className = 'pagination-btn' + (state.pagination.currentPage === 1 ? ' disabled' : '');
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.addEventListener('click', () => {
                if (state.pagination.currentPage > 1) {
                    state.pagination.currentPage--;
                    renderContent();
                }
            });
            pagination.appendChild(prevBtn);

            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('div');
                pageBtn.className = 'pagination-btn' + (i === state.pagination.currentPage ? ' active' : '');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    state.pagination.currentPage = i;
                    renderContent();
                });
                pagination.appendChild(pageBtn);
            }

            // Next button
            const nextBtn = document.createElement('div');
            nextBtn.className = 'pagination-btn' + (state.pagination.currentPage === totalPages ? ' disabled' : '');
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.addEventListener('click', () => {
                if (state.pagination.currentPage < totalPages) {
                    state.pagination.currentPage++;
                    renderContent();
                }
            });
            pagination.appendChild(nextBtn);

            contentEl.appendChild(pagination);
        }

        // Helper functions
        function updateBreadcrumb() {
            breadcrumbEl.innerHTML = '';

            state.breadcrumbs.forEach((crumb, index) => {
                if (index > 0) {
                    const separator = document.createElement('div');
                    separator.className = 'breadcrumb-separator';
                    separator.innerHTML = '<i class="fas fa-chevron-right"></i>';
                    breadcrumbEl.appendChild(separator);
                }

                const item = document.createElement('div');
                item.className = 'breadcrumb-item';

                if (index === state.breadcrumbs.length - 1) {
                    item.innerHTML = `<span>${crumb.text}</span>`;
                } else {
                    item.innerHTML = `
                        <a href="#" data-level="${crumb.level}" ${crumb.kode ? `data-kode="${crumb.kode}"` : ''}>
                            ${crumb.text}
                        </a>
                    `;
                }

                breadcrumbEl.appendChild(item);
            });

            // Add click event to breadcrumb links
            const links = breadcrumbEl.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const level = e.target.getAttribute('data-level');
                    const kode = e.target.getAttribute('data-kode');
                    navigateToBreadcrumb(level, kode);
                });
            });
        }

        function navigateToBreadcrumb(level, kode) {
            const index = state.breadcrumbs.findIndex(b => b.level === level);
            if (index >= 0) {
                state.breadcrumbs = state.breadcrumbs.slice(0, index + 1);
                state.navigationStack = state.navigationStack.slice(0, index);
                state.searchQuery = '';
                searchInput.value = '';
                
                switch (level) {
                    case 'provinsi':
                        fetchProvinsi();
                        break;
                    case 'kabupaten_kota':
                        fetchKabupatenKota(kode);
                        break;
                    case 'kecamatan':
                        fetchKecamatan(kode, state.params.kode_provinsi);
                        break;
                    case 'desa_kelurahan':
                        fetchDesaKelurahan(kode, state.params.kode_kabupaten_kota);
                        break;
                }
            }
        }

        function showLoading() {
            contentEl.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div>Memuat data wilayah...</div>
                </div>
            `;
        }

        function showError(message) {
            contentEl.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${message}</span>
                </div>
                <button class="btn btn-outline" onclick="fetchProvinsi()">
                    <i class="fas fa-sync-alt"></i> Muat Ulang
                </button>
            `;
        }

        function showWarning(message) {
            const warningEl = document.createElement('div');
            warningEl.className = 'warning-message';
            warningEl.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            `;
            contentEl.insertBefore(warningEl, contentEl.firstChild);
        }

        function formatNumber(num) {
            if (!num || isNaN(num)) return '0';
            return parseInt(num).toLocaleString('id-ID');
        }

        function calculatePercentage(partial, total) {
            if (!partial || !total || isNaN(partial) || isNaN(total)) return '0';
            return ((parseInt(partial) / parseInt(total)) * 100).toFixed(2);
        }

        function calculateSexRatio(male, female) {
            if (!male || !female || isNaN(male) || isNaN(female) || female === '0') return 'N/A';
            return ((parseInt(male) / parseInt(female)) * 100).toFixed(2);
        }

        function getRandomColor() {
            const colors = ['#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', '#3a0ca3'];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        // Make functions available globally for button clicks
        window.navigateBack = navigateBack;
        window.fetchKabupatenKota = fetchKabupatenKota;
        window.fetchKecamatan = fetchKecamatan;