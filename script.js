    // Configuration
    const config = {
      postsApiUrl: "https://script.google.com/macros/s/AKfycbyl_tLV9i5K6cngdpXd9OfvVtNj53hP2FiOoXp1UZn1G8luBhMJZVN6JRhR2amLomyjMw/exec?sheet=Post",
      postsPerPage: 9,
      searchDebounce: 300
    };

    // State management
    const state = {
      posts: [],
      filteredPosts: [],
      currentPage: 1,
      likedPosts: JSON.parse(localStorage.getItem('likedPosts')) || {},
      darkMode: localStorage.getItem("darkMode") === "true"
    };

    // DOM Elements
    const dom = {
      postsContainer: document.getElementById('postsContainer'),
      searchInput: document.getElementById('searchInput'),
      searchButton: document.getElementById('searchButton'),
      loader: document.getElementById('loader'),
      darkModeToggle: document.getElementById('darkModeToggle'),
      paginationContainer: document.getElementById('paginationContainer'),
      currentYear: document.getElementById('currentYear'),
      postModal: new bootstrap.Modal('#postModal'),
      modalTitle: document.getElementById('modalTitle'),
      modalContent: document.getElementById('modalContent'),
      modalImage: document.getElementById('modalImage'),
      likeButton: document.getElementById('likeButton'),
      likeCount: document.getElementById('likeCount'),
      likeButtonText: document.getElementById('likeButtonText'),
      viewCount: document.getElementById('viewCount'),
      modalDateText: document.getElementById('modalDateText')
    };

    // Utility functions
    const utils = {
      formatDate: (dateString) => {
        if (!dateString) return 'Tanpa tanggal';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
      },
      
      debounce: (func, delay) => {
        let timeoutId;
        return function(...args) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
      },
      
      sanitizeContent: (content) => {
        if (!content) return 'Tidak ada konten';
        return content
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }
    };

    // Core functions
    const core = {
      fetchPosts: async () => {
        try {
          const res = await fetch(config.postsApiUrl);
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          
          const data = await res.json();
          state.posts = data.filter(p => p.Status && p.Status.toLowerCase() === "publish");
          state.filteredPosts = [...state.posts];
          state.currentPage = 1;
          
          core.renderPosts();
          core.checkNewPost();
          dom.loader.style.display = "none";
        } catch (error) {
          console.error("Error fetching posts:", error);
          core.showError();
        }
      },
      
      getPaginatedPosts: () => {
        const startIndex = (state.currentPage - 1) * config.postsPerPage;
        const endIndex = startIndex + config.postsPerPage;
        return state.filteredPosts.slice(startIndex, endIndex);
      },
      
      renderPosts: () => {
        const paginatedPosts = core.getPaginatedPosts();
        
        if (paginatedPosts.length === 0) {
          dom.postsContainer.innerHTML = `
            <div class="col-12">
              <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h4>Tidak ada postingan ditemukan</h4>
                <p>Coba gunakan kata kunci yang berbeda</p>
              </div>
            </div>`;
          return;
        }

        dom.postsContainer.innerHTML = paginatedPosts.map((post, index) => `
          <div class="col-md-4">
            <div class="card h-100 animate-card" style="animation-delay: ${index * 0.1}s">
              ${post.Gambar ? `
                <img src="${post.Gambar}" class="card-img-top" alt="${post.Judul}" loading="lazy" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 300 200\'%3E%3Crect width=\'300\' height=\'200\' fill=\'%23f5f5f5\'/%3E%3Ctext x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'16\' fill=\'%23666\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E'">
              ` : ''}
              <div class="card-body d-flex flex-column">
                <h5 class="card-title" onclick="core.openModal('${post.Judul}')" style="cursor: pointer;">${post.Judul}</h5>
                <div class="mb-2">
                  ${post.Kategori ? `<span class="card-category">${post.Kategori}</span>` : ''}
                  ${post.Tag ? post.Tag.split(',').map(tag => `
                    <span class="card-tag">${tag.trim()}</span>
                  `).join('') : ''}
                </div>
                <p class="card-text text-muted flex-grow-1">${post.Isi ? post.Isi.substring(0, 100) + '...' : 'Tidak ada konten'}</p>
                <div class="card-date mt-auto">
                  <!--
                  <small><i class="far fa-calendar-alt me-1"></i> ${utils.formatDate(post.Tanggal)}</small>
                  -->
                </div>
              </div>
            </div>
          </div>`).join('');
        
        core.renderPagination();
      },
      
      renderPagination: () => {
        const existingPagination = document.querySelector('.pagination-custom');
        if (existingPagination) existingPagination.remove();
        
        const totalPages = Math.ceil(state.filteredPosts.length / config.postsPerPage);
        if (totalPages <= 1) return;
        
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-custom d-flex justify-content-center gap-2 mb-2 mt-3';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = `page-item ${state.currentPage === 1 ? 'disabled' : ''}`;
        prevButton.innerHTML = '<i class="fas fa-chevron-left" aria-hidden="true"></i>';
        prevButton.setAttribute('aria-label', 'Previous page');
        prevButton.addEventListener('click', () => {
          if (state.currentPage > 1) {
            state.currentPage--;
            core.renderPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
        paginationContainer.appendChild(prevButton);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
          const pageItem = document.createElement('button');
          pageItem.className = `page-item ${i === state.currentPage ? 'active' : ''}`;
          pageItem.textContent = i;
          pageItem.setAttribute('aria-label', `Page ${i}`);
          pageItem.addEventListener('click', () => {
            state.currentPage = i;
            core.renderPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          paginationContainer.appendChild(pageItem);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = `page-item ${state.currentPage === totalPages ? 'disabled' : ''}`;
        nextButton.innerHTML = '<i class="fas fa-chevron-right" aria-hidden="true"></i>';
        nextButton.setAttribute('aria-label', 'Next page');
        nextButton.addEventListener('click', () => {
          if (state.currentPage < totalPages) {
            state.currentPage++;
            core.renderPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
        paginationContainer.appendChild(nextButton);
        
        dom.paginationContainer.appendChild(paginationContainer);
      },
      
      openModal: (title) => {
        const post = state.posts.find(p => p.Judul === title);
        if (!post) {
          alert("Postingan tidak ditemukan!");
          return;
        }
        
        // Show loading state
        dom.modalContent.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>';
        dom.modalTitle.textContent = post.Judul;
        document.getElementById('modalCategory').textContent = post.Kategori || 'Umum';
        document.getElementById('modalTag').textContent = post.Tag || 'Tanpa tag';
        dom.modalDateText.textContent = utils.formatDate(post.Tanggal);
        
        // Handle image
        if (post.Gambar) {
          dom.modalImage.src = post.Gambar;
          dom.modalImage.classList.remove("d-none");
        } else {
          dom.modalImage.classList.add("d-none");
        }
        
        // Update content after a small delay to show loading state
        setTimeout(() => {
          dom.modalContent.innerHTML = utils.sanitizeContent(post.Isi);
        }, 300);
        
        // Update view count
        core.updateView(post.Judul);
        
        // Update like count and button state
        const likeKey = `likeCount_${post.Judul}`;
        const currentLikes = parseInt(localStorage.getItem(likeKey)) || 0;
        dom.likeCount.querySelector('span').textContent = currentLikes;
        
        if (state.likedPosts[post.Judul]) {
          dom.likeButton.classList.remove('btn-outline-danger');
          dom.likeButton.classList.add('btn-danger');
          dom.likeButtonText.textContent = 'Disukai';
        } else {
          dom.likeButton.classList.remove('btn-danger');
          dom.likeButton.classList.add('btn-outline-danger');
          dom.likeButtonText.textContent = 'Suka';
        }
        
        dom.postModal.show();
      },
      
      updateLike: (title) => {
        const likeKey = `likeCount_${title}`;
        let likeCount = parseInt(localStorage.getItem(likeKey)) || 0;
        
        if (!state.likedPosts[title]) {
          likeCount++;
          state.likedPosts[title] = true;
          dom.likeButton.classList.remove('btn-outline-danger');
          dom.likeButton.classList.add('btn-danger');
          dom.likeButtonText.textContent = 'Disukai';
        } else {
          likeCount = Math.max(0, likeCount - 1);
          delete state.likedPosts[title];
          dom.likeButton.classList.remove('btn-danger');
          dom.likeButton.classList.add('btn-outline-danger');
          dom.likeButtonText.textContent = 'Suka';
        }
        
        localStorage.setItem(likeKey, likeCount);
        localStorage.setItem('likedPosts', JSON.stringify(state.likedPosts));
        dom.likeCount.querySelector('span').textContent = likeCount;
      },
      
      updateView: (title) => {
        const viewKey = `viewCount_${title}`;
        let viewCount = parseInt(localStorage.getItem(viewKey)) || 0;
        viewCount++;
        localStorage.setItem(viewKey, viewCount);
        dom.viewCount.querySelector('span').textContent = viewCount;
      },
      
      randomPost: () => {
        if (state.filteredPosts.length === 0) return;
        const randomIndex = Math.floor(Math.random() * state.filteredPosts.length);
        core.openModal(state.filteredPosts[randomIndex].Judul);
      },
      
      searchPosts: () => {
        const searchTerm = dom.searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
          state.filteredPosts = [...state.posts];
        } else {
          state.filteredPosts = state.posts.filter(post => 
            (post.Judul && post.Judul.toLowerCase().includes(searchTerm)) ||
            (post.Isi && post.Isi.toLowerCase().includes(searchTerm)) ||
            (post.Kategori && post.Kategori.toLowerCase().includes(searchTerm)) ||
            (post.Tag && post.Tag.toLowerCase().includes(searchTerm))
          );
        }
        
        state.currentPage = 1;
        core.renderPosts();
      },
      
      checkNewPost: () => {
        const lastSeen = localStorage.getItem("lastCheck") || new Date(0);
        const newCount = state.posts.filter(p => new Date(p.Tanggal) > new Date(lastSeen)).length;
        
        if (newCount > 0) {
          const notification = document.createElement('div');
          notification.className = 'alert alert-info alert-dismissible fade show position-fixed bottom-0 end-0 m-2';
          notification.setAttribute('role', 'alert');
          notification.innerHTML = `
            <strong>${newCount} post baru!</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          `;
          document.body.appendChild(notification);
        }
        
        localStorage.setItem("lastCheck", new Date().toISOString());
      },
      
      showError: () => {
        dom.postsContainer.innerHTML = `
          <div class="col-12">
            <div class="error-state">
              <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
              <h4 class="text-danger">Gagal memuat data</h4>
              <p class="text-muted">Silakan coba lagi nanti</p>
              <button class="btn btn-primary mt-2" onclick="core.fetchPosts()">
                <i class="fas fa-sync-alt me-1"></i> Muat Ulang
              </button>
            </div>
          </div>`;
        dom.loader.style.display = "none";
      },
      
      toggleDarkMode: () => {
        state.darkMode = !state.darkMode;
        document.body.classList.toggle('dark-mode', state.darkMode);
        localStorage.setItem("darkMode", state.darkMode);
        
        // Update icon and text
        const icon = dom.darkModeToggle.querySelector('i');
        if (state.darkMode) {
          icon.classList.replace('fa-moon', 'fa-sun');
          dom.darkModeToggle.innerHTML = '<i class="fas fa-sun me-1"></i> Mode Terang';
        } else {
          icon.classList.replace('fa-sun', 'fa-moon');
          dom.darkModeToggle.innerHTML = '<i class="fas fa-moon me-1"></i> Mode Gelap';
        }
      },
      
      initDarkMode: () => {
        if (state.darkMode) {
          document.body.classList.add('dark-mode');
          dom.darkModeToggle.innerHTML = '<i class="fas fa-sun me-1"></i> Mode Terang';
        }
      },
      
      initCurrentYear: () => {
        dom.currentYear.textContent = new Date().getFullYear();
      },
      
      setupEventListeners: () => {
        // Search functionality with debounce
        const debouncedSearch = utils.debounce(core.searchPosts, config.searchDebounce);
        dom.searchInput.addEventListener('input', debouncedSearch);
        dom.searchButton.addEventListener('click', core.searchPosts);
        
        // Dark mode toggle
        dom.darkModeToggle.addEventListener('click', core.toggleDarkMode);
        
        // Like button in modal
        dom.likeButton.addEventListener('click', () => {
          const title = dom.modalTitle.textContent;
          core.updateLike(title);
        });
      },
      
      init: () => {
        core.initDarkMode();
        core.initCurrentYear();
        core.setupEventListeners();
        core.fetchPosts();
      }
    };

    // Initialize the app when DOM is loaded
    document.addEventListener('DOMContentLoaded', core.init);

    // Expose core functions to global scope for HTML event handlers
    window.core = core;
