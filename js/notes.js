    // Configuration
    const config = {
      postsApiUrl: "https://script.google.com/macros/s/AKfycbyl_tLV9i5K6cngdpXd9OfvVtNj53hP2FiOoXp1UZn1G8luBhMJZVN6JRhR2amLomyjMw/exec?sheet=Post",
      postsPerPage: 9,
      searchDebounce: 300,
      appVersion: '1.0.0',
      cacheTime: 30 * 60 * 1000 // 30 minutes in milliseconds
    };

    // State management
    const state = {
      posts: [],
      filteredPosts: [],
      currentPage: 1,
      likedPosts: JSON.parse(localStorage.getItem('likedPosts')) || {},
      darkMode: localStorage.getItem("darkMode") === "true",
      currentPost: null,
      isOnline: navigator.onLine,
      lastFetched: null
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
      postModal: null, // Will be initialized after DOM content loaded
      modalTitle: document.getElementById('modalTitle'),
      modalContent: document.getElementById('modalContent'),
      modalImage: document.getElementById('modalImage'),
      modalTags: document.getElementById('modalTags'),
      likeButton: document.getElementById('likeButton'),
      likeCount: document.getElementById('likeCount'),
      likeButtonText: document.getElementById('likeButtonText'),
      viewCount: document.getElementById('viewCount'),
      modalDateText: document.getElementById('modalDateText'),
      backToTop: document.getElementById('backToTop'),
      offlineNotification: document.getElementById('offlineNotification'),
      contactLink: document.getElementById('contactLink'),
      footerContactLink: document.getElementById('footerContactLink'),
      contactForm: document.getElementById('contactForm'),
      shareButton: document.getElementById('shareButton'),
      shareModal: null, // Will be initialized after DOM content loaded
      shareFacebook: document.getElementById('shareFacebook'),
      shareTwitter: document.getElementById('shareTwitter'),
      shareWhatsapp: document.getElementById('shareWhatsapp'),
      shareEmail: document.getElementById('shareEmail'),
      shareLink: document.getElementById('shareLink'),
      copyLink: document.getElementById('copyLink'),
      copyMessage: document.getElementById('copyMessage')
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
        
        // Basic HTML sanitization
        let sanitized = content
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
          
        // Convert URLs to clickable links
        sanitized = sanitized.replace(
          /(https?:\/\/[^\s]+)/g, 
          '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // Convert markdown-like syntax
        // Bold
        sanitized = sanitized.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        sanitized = sanitized.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return sanitized;
      },
      
      saveToCache: (key, data) => {
        const cacheItem = {
          data: data,
          timestamp: new Date().getTime()
        };
        localStorage.setItem(key, JSON.stringify(cacheItem));
      },
      
      getFromCache: (key) => {
        const cachedItem = localStorage.getItem(key);
        if (!cachedItem) return null;
        
        const { data, timestamp } = JSON.parse(cachedItem);
        const now = new Date().getTime();
        
        // Check if cache is still valid
        if (now - timestamp < config.cacheTime) {
          return data;
        }
        
        return null;
      },
      
      showToast: (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
          <div class="d-flex">
            <div class="toast-body">
              ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        `;
        
        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();
        
        // Remove from DOM after hiding
        toast.addEventListener('hidden.bs.toast', () => {
          document.body.removeChild(toast);
        });
      },
      
      generateShareLinks: (title, url) => {
        return {
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`,
          email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Saya menemukan artikel menarik: ' + url)}`
        };
      }
    };

    // Core functions
    const core = {
      fetchPosts: async () => {
        try {
          // Show loader
          dom.loader.style.display = "block";
          
          // Check if we have cached data
          const cachedPosts = utils.getFromCache('blogPosts');
          if (cachedPosts && state.isOnline === false) {
            state.posts = cachedPosts;
            state.filteredPosts = [...state.posts];
            state.lastFetched = utils.getFromCache('lastFetched') || new Date().getTime();
            core.renderPosts();
            dom.loader.style.display = "none";
            return;
          }
          
          const res = await fetch(config.postsApiUrl);
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          
          const data = await res.json();
          state.posts = data.filter(p => p.Status && p.Status.toLowerCase() === "publish");
          state.filteredPosts = [...state.posts];
          state.currentPage = 1;
          state.lastFetched = new Date().getTime();
          
          // Cache the posts
          utils.saveToCache('blogPosts', state.posts);
          utils.saveToCache('lastFetched', state.lastFetched);
          
          core.renderPosts();
          core.checkNewPost();
          dom.loader.style.display = "none";
        } catch (error) {
          console.error("Error fetching posts:", error);
          
          // Try to load from cache if fetch fails
          const cachedPosts = utils.getFromCache('blogPosts');
          if (cachedPosts) {
            state.posts = cachedPosts;
            state.filteredPosts = [...state.posts];
            state.lastFetched = utils.getFromCache('lastFetched') || new Date().getTime();
            core.renderPosts();
            utils.showToast('Menampilkan konten dari cache. Beberapa konten mungkin tidak terbaru.', 'warning');
          } else {
            core.showError();
          }
          
          dom.loader.style.display = "none";
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
                <button class="btn btn-primary mt-2" onclick="core.resetSearch()">
                  <i class="fas fa-sync-alt me-1"></i> Reset Pencarian
                </button>
              </div>
            </div>`;
          return;
        }

        dom.postsContainer.innerHTML = paginatedPosts.map((post, index) => `
          <div class="col-md-6 col-lg-4">
            <article class="card h-100 animate-card" style="animation-delay: ${index * 0.1}s">
              ${post.Gambar ? `
                <img src="${post.Gambar}" class="card-img-top" alt="${post.Judul}" loading="lazy" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 300 200\'%3E%3Crect width=\'300\' height=\'200\' fill=\'%23f5f5f5\'/%3E%3Ctext x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'16\' fill=\'%23666\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E'">
              ` : ''}
              <div class="card-body d-flex flex-column">
                <h3 class="h5 card-title" onclick="core.openModal('${post.Judul.replace(/'/g, "\\'")}')" style="cursor: pointer;">${post.Judul}</h3>
                <div class="mb-2">
                  ${post.Kategori ? `<span class="card-category">${post.Kategori}</span>` : ''}
                  ${post.Tag ? post.Tag.split(',').map(tag => `
                    <span class="card-tag">${tag.trim()}</span>
                  `).join('') : ''}
                </div>
                <p class="card-text text-muted flex-grow-1">${post.Isi ? post.Isi.substring(0, 100) + '..' : 'Tidak ada konten'}</p>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                  <small class="text-muted"><i class="far fa-calendar-alt me-1"></i> ${utils.formatDate(post.Tanggal)}</small>
                  <button class="btn btn-sm btn-primary" onclick="core.openModal('${post.Judul.replace(/'/g, "\\'")}')">
                    Baca <i class="fas fa-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            </article>
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
        let startPage = Math.max(1, state.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
          startPage = Math.max(1, endPage - 4);
        }
        
        if (startPage > 1) {
          const firstPage = document.createElement('button');
          firstPage.className = 'page-item';
          firstPage.textContent = '1';
          firstPage.setAttribute('aria-label', 'Page 1');
          firstPage.addEventListener('click', () => {
            state.currentPage = 1;
            core.renderPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          paginationContainer.appendChild(firstPage);
          
          if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-item disabled';
            ellipsis.textContent = '...';
            ellipsis.setAttribute('aria-hidden', 'true');
            paginationContainer.appendChild(ellipsis);
          }
        }
        
        for (let i = startPage; i <= endPage; i++) {
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
        
        if (endPage < totalPages) {
          if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-item disabled';
            ellipsis.textContent = '...';
            ellipsis.setAttribute('aria-hidden', 'true');
            paginationContainer.appendChild(ellipsis);
          }
          
          const lastPage = document.createElement('button');
          lastPage.className = 'page-item';
          lastPage.textContent = totalPages;
          lastPage.setAttribute('aria-label', `Page ${totalPages}`);
          lastPage.addEventListener('click', () => {
            state.currentPage = totalPages;
            core.renderPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          paginationContainer.appendChild(lastPage);
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
          utils.showToast("Postingan tidak ditemukan!", "danger");
          return;
        }
        
        // Save current post to state
        state.currentPost = post;
        
        // Show loading state
        dom.modalContent.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>';
        dom.modalTitle.textContent = post.Judul;
        document.getElementById('modalCategory').textContent = post.Kategori || 'Umum';
        
        // Handle tags
        if (post.Tag) {
          const tags = post.Tag.split(',');
          dom.modalTags.innerHTML = tags.map(tag => 
            `<span class="card-tag">${tag.trim()}</span>`
          ).join('');
        } else {
          dom.modalTags.innerHTML = '<span class="card-tag">Tanpa tag</span>';
        }
        
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
        
        // Update share link
        const shareUrl = `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(post.Judul)}`;
        dom.shareLink.value = shareUrl;
        
        // Update share buttons
        const shareLinks = utils.generateShareLinks(post.Judul, shareUrl);
        dom.shareFacebook.href = shareLinks.facebook;
        dom.shareTwitter.href = shareLinks.twitter;
        dom.shareWhatsapp.href = shareLinks.whatsapp;
        dom.shareEmail.href = shareLinks.email;
        
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
          utils.showToast('Artikel ditambahkan ke favorit!');
        } else {
          likeCount = Math.max(0, likeCount - 1);
          delete state.likedPosts[title];
          dom.likeButton.classList.remove('btn-danger');
          dom.likeButton.classList.add('btn-outline-danger');
          dom.likeButtonText.textContent = 'Suka';
          utils.showToast('Artikel dihapus dari favorit');
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
      
      resetSearch: () => {
        dom.searchInput.value = '';
        state.filteredPosts = [...state.posts];
        state.currentPage = 1;
        core.renderPosts();
      },
      
      checkNewPost: () => {
        const lastSeen = localStorage.getItem("lastCheck") || new Date(0);
        const newCount = state.posts.filter(p => new Date(p.Tanggal) > new Date(lastSeen)).length;
        
        if (newCount > 0) {
          utils.showToast(`${newCount} postingan baru tersedia!`, 'info');
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
        if (state.darkMode) {
          dom.darkModeToggle.innerHTML = '<i class="fas fa-sun me-1"></i> <span class="d-none d-md-inline">Mode Terang</span>';
        } else {
          dom.darkModeToggle.innerHTML = '<i class="fas fa-moon me-1"></i> <span class="d-none d-md-inline">Mode Gelap</span>';
        }
      },
      
      initDarkMode: () => {
        if (state.darkMode) {
          document.body.classList.add('dark-mode');
          dom.darkModeToggle.innerHTML = '<i class="fas fa-sun me-1"></i> <span class="d-none d-md-inline">Mode Terang</span>';
        }
      },
      
      initCurrentYear: () => {
        dom.currentYear.textContent = new Date().getFullYear();
      },
      
      handleBackToTop: () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 200) {
          dom.backToTop.classList.add('visible');
        } else {
          dom.backToTop.classList.remove('visible');
        }
      },
      
      scrollToTop: () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      },
      
      handleNetworkChange: () => {
        state.isOnline = navigator.onLine;
        
        if (state.isOnline) {
          dom.offlineNotification.style.display = 'none';
          // Refresh data if we were offline
          core.fetchPosts();
        } else {
          dom.offlineNotification.style.display = 'block';
        }
      },
      
      validateContactForm: (form) => {
        let isValid = true;
        
        // Reset previous validation
        form.classList.remove('was-validated');
        
        // Check each required field
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
          } else {
            field.classList.remove('is-invalid');
            
            // Additional validation for email
            if (field.type === 'email') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(field.value)) {
                field.classList.add('is-invalid');
                isValid = false;
              }
            }
          }
        });
        
        // Add validation class to show feedback
        if (!isValid) {
          form.classList.add('was-validated');
        }
        
        return isValid;
      },
      
      handleContactSubmit: (e) => {
        e.preventDefault();
        
        const form = e.target;
        
        if (core.validateContactForm(form)) {
          // In a real application, you would send the form data to a server
          // For this demo, we'll just show a success message
          
          // Get form data
          const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value
          };
          
          console.log('Form data:', formData);
          
          // Show success message
          utils.showToast('Pesan Anda telah dikirim! Kami akan menghubungi Anda segera.', 'success');
          
          // Reset form
          form.reset();
          
          // Close modal
          bootstrap.Modal.getInstance(document.getElementById('contactModal')).hide();
        }
      },
      
      copyShareLink: () => {
        dom.shareLink.select();
        document.execCommand('copy');
        
        dom.copyMessage.classList.remove('d-none');
        setTimeout(() => {
          dom.copyMessage.classList.add('d-none');
        }, 2000);
      },
      
      checkUrlParams: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const postTitle = urlParams.get('post');
        
        if (postTitle) {
          // Wait for posts to load before opening modal
          const checkPostsLoaded = setInterval(() => {
            if (state.posts.length > 0) {
              clearInterval(checkPostsLoaded);
              
              const post = state.posts.find(p => p.Judul === decodeURIComponent(postTitle));
              if (post) {
                core.openModal(post.Judul);
              }
            }
          }, 100);
        }
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
        
        // Back to top button
        window.addEventListener('scroll', core.handleBackToTop);
        dom.backToTop.addEventListener('click', core.scrollToTop);
        
        // Network status
        window.addEventListener('online', core.handleNetworkChange);
        window.addEventListener('offline', core.handleNetworkChange);
        
        // Contact form
        dom.contactLink.addEventListener('click', (e) => {
          e.preventDefault();
          const contactModal = new bootstrap.Modal(document.getElementById('contactModal'));
          contactModal.show();
        });
        
        dom.footerContactLink.addEventListener('click', (e) => {
          e.preventDefault();
          const contactModal = new bootstrap.Modal(document.getElementById('contactModal'));
          contactModal.show();
        });
        
        dom.contactForm.addEventListener('submit', core.handleContactSubmit);
        
        // Share button
        dom.shareButton.addEventListener('click', () => {
          dom.shareModal.show();
        });
        
        // Copy link button
        dom.copyLink.addEventListener('click', core.copyShareLink);
        
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl);
        });
      },
      
      init: () => {
        // Initialize Bootstrap components
        dom.postModal = new bootstrap.Modal(document.getElementById('postModal'));
        dom.shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
        
        core.initDarkMode();
        core.initCurrentYear();
        core.setupEventListeners();
        core.fetchPosts();
        core.handleNetworkChange(); // Check initial network status
        core.checkUrlParams(); // Check for post in URL
      }
    };

    // Initialize the app when DOM is loaded
    document.addEventListener('DOMContentLoaded', core.init);

    // Expose core functions to global scope for HTML event handlers
    window.core = core;
