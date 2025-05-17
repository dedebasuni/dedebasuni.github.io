        // API Configuration
        const API_BASE_URL = 'https://equran.id/api/v2';

        // Function to convert number to Arabic numerals
        function toArabicNumerals(number) {
            const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            return String(number).split('').map(digit => arabicDigits[digit]).join('');
        }

        // DOM Elements
        const loadingIndicator = document.getElementById('loadingIndicator');
        const surahListSection = document.getElementById('surahListSection');
        const surahGrid = document.getElementById('surahGrid');
        const bookmarkSection = document.getElementById('bookmarkSection');
        const bookmarkGrid = document.getElementById('bookmarkGrid');
        const surahDetailSection = document.getElementById('surahDetailSection');
        const surahDetailTitle = document.getElementById('surahDetailTitle');
        const surahDetailContent = document.getElementById('surahDetailContent');
        const closeSurahDetail = document.getElementById('closeSurahDetail');
        const noResults = document.getElementById('noResults');
        const notificationContainer = document.getElementById('notificationContainer');
        const toggleThemeButton = document.getElementById('toggleTheme');
        const homeButton = document.getElementById('home');
        const showBookmarksButton = document.getElementById('showBookmarks');
        const searchInput = document.getElementById('searchInput');
        const voiceSearchButton = document.getElementById('voiceSearch');
        const sortSurahButton = document.getElementById('sortSurah');
        const tafsirModal = document.getElementById('tafsirModal');
        const closeTafsirModal = document.getElementById('closeTafsirModal');
        const scrollToTopButton = document.getElementById('scrollToTop');

        // Theme Toggle
        let darkMode = localStorage.getItem('darkMode') !== null ? localStorage.getItem('darkMode') === 'true' : false;
        updateTheme();

        toggleThemeButton.addEventListener('click', () => {
            darkMode = !darkMode;
            localStorage.setItem('darkMode', darkMode);
            updateTheme();
        });

        function updateTheme() {
            document.body.classList.toggle('dark', darkMode);
            document.body.classList.toggle('bg-gray-50', !darkMode);
            document.body.classList.toggle('bg-gray-900', darkMode);
            document.body.classList.toggle('text-gray-800', !darkMode);
            document.body.classList.toggle('text-gray-100', darkMode);
            toggleThemeButton.innerHTML = darkMode ? '<i class="fas fa-sun text-lg"></i>' : '<i class="fas fa-moon text-lg"></i>';
            document.querySelector('header').classList.toggle('bg-blue-900', darkMode);
            document.querySelector('footer').classList.toggle('bg-blue-900', darkMode);
        }

        // Home Button
        homeButton.addEventListener('click', () => {
            hideAllSections();
            surahListSection.classList.remove('hidden');
            searchInput.value = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Bookmark Management
        function getBookmarks() {
            return JSON.parse(localStorage.getItem('bookmarks') || '[]');
        }

        function saveBookmark(surahNumber, surahName) {
            surahNumber = parseInt(surahNumber);
            const bookmarks = getBookmarks();
            if (!bookmarks.some(b => b.number === surahNumber)) {
                bookmarks.push({ number: surahNumber, name: surahName });
                localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
                showNotification(`Surah ${surahName} ditambahkan ke bookmark`);
                if (!bookmarkSection.classList.contains('hidden')) {
                    displayBookmarks();
                }
            }
        }

        function removeBookmark(surahNumber) {
            surahNumber = parseInt(surahNumber);
            const bookmarks = getBookmarks();
            const surah = bookmarks.find(b => b.number === surahNumber);
            const updatedBookmarks = bookmarks.filter(b => b.number !== surahNumber);
            localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
            showNotification(`Surah ${surah ? surah.name : ''} dihapus dari bookmark`);
            if (!bookmarkSection.classList.contains('hidden')) {
                displayBookmarks();
            }
        }

        // Show Bookmarks
        showBookmarksButton.addEventListener('click', () => {
            hideAllSections();
            bookmarkSection.classList.remove('hidden');
            displayBookmarks();
            bookmarkSection.scrollIntoView({ behavior: 'smooth' });
        });

        // Voice Search
        voiceSearchButton.addEventListener('click', () => {
            if ('webkitSpeechRecognition' in window) {
                const recognition = new webkitSpeechRecognition();
                recognition.lang = 'id-ID';
                recognition.onresult = (event) => {
                    searchInput.value = event.results[0][0].transcript;
                    searchInput.dispatchEvent(new Event('input'));
                };
                recognition.onerror = () => {
                    showNotification('Gagal menggunakan pencarian suara');
                };
                recognition.start();
            } else {
                showNotification('Pencarian suara tidak didukung oleh browser ini');
            }
        });

        // Sort Surah
        let sortAscending = true;
        sortSurahButton.addEventListener('click', () => {
            sortAscending = !sortAscending;
            fetchSurahList().then((response) => {
                const sortedSurahs = response.data.sort((a, b) => {
                    return sortAscending ? a.nomor - b.nomor : b.nomor - a.nomor;
                });
                displaySurahList(sortedSurahs);
                sortSurahButton.innerHTML = `<i class="fas fa-sort mr-1"></i> ${sortAscending ? 'Urutkan Z-A' : 'Urutkan A-Z'}`;
            });
        });

        // Scroll to Top
        window.addEventListener('scroll', () => {
            scrollToTopButton.classList.toggle('hidden', window.scrollY < 300);
        });

        scrollToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Load Surah List on page load
        document.addEventListener('DOMContentLoaded', () => {
            fetchSurahList();
        });

        // Fetch Surah List from API
        async function fetchSurahList(retryCount = 0) {
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/surat`);
                if (!response.ok) throw new Error('Gagal memuat daftar surah');
                const data = await response.json();
                if (data.code === 200 && data.data) {
                    displaySurahList(data.data);
                    return data;
                } else {
                    throw new Error('Format data tidak valid');
                }
            } catch (error) {
                console.error('Error:', error);
                if (retryCount < 2) {
                    showNotification('Gagal memuat daftar surah, mencoba lagi...');
                    setTimeout(() => fetchSurahList(retryCount + 1), 2000);
                } else {
                    showNotification('Gagal memuat daftar surah');
                    showErrorWithRetry(() => fetchSurahList());
                }
            } finally {
                hideLoading();
            }
        }

        // Display Surah List
        function displaySurahList(surahList) {
            const fragment = document.createDocumentFragment();
            surahList.forEach((surah, index) => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl p-6 shadow-lg card card-enter';
                card.style.animationDelay = `${index * 0.1}s`;
                const bookmarks = getBookmarks();
                const isBookmarked = bookmarks.some(b => b.number === surah.nomor);
                card.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <span class="bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm arabic-numeric">${toArabicNumerals(surah.nomor)}</span>
                        <div class="flex items-center space-x-3">
                            <span class="text-sm text-gray-600">${surah.jumlahAyat} ayat</span>
                            <button class="bookmark-btn" data-surah="${surah.nomor}" data-name="${surah.namaLatin}" aria-label="${isBookmarked ? 'Hapus' : 'Tambah'} bookmark Surah ${surah.namaLatin}">
                                <i class="fas fa-bookmark ${isBookmarked ? 'text-yellow-500' : 'text-gray-400'} text-lg"></i>
                            </button>
                        </div>
                    </div>
                    <h4 class="font-semibold text-blue-700 text-lg">${surah.namaLatin}</h4>
                    <p class="text-sm text-gray-600">${surah.arti}</p>
                    <p class="arabic text-base mt-3">${surah.nama}</p>
                    <div class="flex justify-between items-center mt-4">
                        <button class="flex items-center text-sm text-blue-700 hover:text-blue-800 view-surah" data-surah="${surah.nomor}" aria-label="Baca Surah ${surah.namaLatin}">
                            <i class="fas fa-book-open mr-2"></i> Baca Surah
                        </button>
                        <button class="flex items-center text-sm text-blue-700 hover:text-blue-800 share-surah" data-surah="${surah.nomor}" data-name="${surah.namaLatin}" aria-label="Bagikan Surah ${surah.namaLatin}">
                            <i class="fas fa-share-alt mr-2"></i> Bagikan
                        </button>
                    </div>
                `;
                card.querySelector('.view-surah').addEventListener('click', (e) => {
                    const surahNumber = e.target.dataset.surah || e.target.parentElement.dataset.surah;
                    fetchSurahDetail(surahNumber);
                });
                card.querySelector('.bookmark-btn').addEventListener('click', (e) => {
                    const bookmarkBtn = e.target.closest('.bookmark-btn');
                    const surahNumber = parseInt(bookmarkBtn.dataset.surah);
                    const surahName = bookmarkBtn.dataset.name;
                    const isBookmarked = bookmarks.some(b => b.number === surahNumber);
                    if (isBookmarked) {
                        removeBookmark(surahNumber);
                        bookmarkBtn.querySelector('i').classList.remove('text-yellow-500');
                        bookmarkBtn.querySelector('i').classList.add('text-gray-400');
                    } else {
                        saveBookmark(surahNumber, surahName);
                        bookmarkBtn.querySelector('i').classList.remove('text-gray-400');
                        bookmarkBtn.querySelector('i').classList.add('text-yellow-500');
                    }
                });
                card.querySelector('.share-surah').addEventListener('click', (e) => {
                    const surahNumber = e.target.dataset.surah || e.target.parentElement.dataset.surah;
                    const surahName = e.target.dataset.name || e.target.parentElement.dataset.name;
                    shareSurah(surahNumber, surahName);
                });
                fragment.appendChild(card);
            });
            surahGrid.innerHTML = '';
            surahGrid.appendChild(fragment);
        }

        // Display Bookmarks
        function displayBookmarks() {
            const bookmarks = getBookmarks();
            if (bookmarks.length === 0) {
                bookmarkGrid.innerHTML = '<p class="text-gray-600">Belum ada bookmark.</p>';
                return;
            }
            bookmarkGrid.innerHTML = '';
            fetchSurahList().then((response) => {
                const bookmarkedSurahs = response.data.filter(surah =>
                    bookmarks.some(b => parseInt(b.number) === surah.nomor)
                );
                if (bookmarkedSurahs.length === 0) {
                    bookmarkGrid.innerHTML = '<p class="text-gray-600">Tidak ada surah yang dibookmark.</p>';
                } else {
                    const fragment = document.createDocumentFragment();
                    bookmarkedSurahs.forEach((surah, index) => {
                        const card = document.createElement('div');
                        card.className = 'bg-white rounded-xl p-6 shadow-lg card card-enter';
                        card.style.animationDelay = `${index * 0.1}s`;
                        card.innerHTML = `
                            <div class="flex justify-between items-center mb-4">
                                <span class="bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm arabic-numeric">${toArabicNumerals(surah.nomor)}</span>
                                <div class="flex items-center space-x-3">
                                    <span class="text-sm text-gray-600">${surah.jumlahAyat} ayat</span>
                                    <button class="bookmark-btn" data-surah="${surah.nomor}" data-name="${surah.namaLatin}" aria-label="Hapus bookmark Surah ${surah.namaLatin}">
                                        <i class="fas fa-bookmark text-yellow-500 text-lg"></i>
                                    </button>
                                </div>
                            </div>
                            <h4 class="font-semibold text-blue-700 text-lg">${surah.namaLatin}</h4>
                            <p class="text-sm text-gray-600">${surah.arti}</p>
                            <p class="arabic text-base mt-3">${surah.nama}</p>
                            <div class="flex justify-between items-center mt-4">
                                <button class="flex items-center text-sm text-blue-700 hover:text-blue-800 view-surah" data-surah="${surah.nomor}" aria-label="Baca Surah ${surah.namaLatin}">
                                    <i class="fas fa-book-open mr-2"></i> Baca Surah
                                </button>
                                <button class="flex items-center text-sm text-blue-700 hover:text-blue-800 share-surah" data-surah="${surah.nomor}" data-name="${surah.namaLatin}" aria-label="Bagikan Surah ${surah.namaLatin}">
                                    <i class="fas fa-share-alt mr-2"></i> Bagikan
                                </button>
                            </div>
                        `;
                        card.querySelector('.view-surah').addEventListener('click', (e) => {
                            const surahNumber = e.target.dataset.surah || e.target.parentElement.dataset.surah;
                            fetchSurahDetail(surahNumber);
                        });
                        card.querySelector('.bookmark-btn').addEventListener('click', (e) => {
                            const bookmarkBtn = e.target.closest('.bookmark-btn');
                            const surahNumber = parseInt(bookmarkBtn.dataset.surah);
                            removeBookmark(surahNumber);
                            displayBookmarks();
                        });
                        card.querySelector('.share-surah').addEventListener('click', (e) => {
                            const surahNumber = e.target.dataset.surah || e.target.parentElement.dataset.surah;
                            const surahName = e.target.dataset.name || e.target.parentElement.dataset.name;
                            shareSurah(surahNumber, surahName);
                        });
                        fragment.appendChild(card);
                    });
                    bookmarkGrid.appendChild(fragment);
                }
            });
        }

        // Share Surah
        function shareSurah(surahNumber, surahName) {
            if (navigator.share) {
                navigator.share({
                    title: `Surah ${surahName}`,
                    text: `Baca Surah ${surahName} di Al-Quran Digital`,
                    url: `${window.location.origin}/#surah-${surahNumber}`,
                }).catch(() => {
                    showNotification('Gagal membagikan surah');
                });
            } else {
                navigator.clipboard.writeText(`${window.location.origin}/#surah-${surahNumber}`)
                    .then(() => showNotification('Link surah disalin ke clipboard'))
                    .catch(() => showNotification('Gagal menyalin link surah'));
            }
        }

        // Fetch Surah Detail from API
        async function fetchSurahDetail(surahNumber, retryCount = 0) {
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/surat/${surahNumber}`);
                if (!response.ok) throw new Error('Gagal memuat detail surah');
                const data = await response.json();
                if (data.code === 200 && data.data) {
                    displaySurahDetail(data.data);
                } else {
                    throw new Error('Format data tidak valid');
                }
            } catch (error) {
                console.error('Error:', error);
                if (retryCount < 2) {
                    showNotification('Gagal memuat detail surah, mencoba lagi...');
                    setTimeout(() => fetchSurahDetail(surahNumber, retryCount + 1), 2000);
                } else {
                    showNotification('Gagal memuat detail surah');
                    showErrorWithRetry(() => fetchSurahDetail(surahNumber));
                }
            } finally {
                hideLoading();
            }
        }

        // Singleton Audio Player
        let currentAudio = null;

        // Display Surah Detail
        function displaySurahDetail(surah) {
            hideAllSections();
            surahDetailSection.classList.remove('hidden');
            surahDetailTitle.textContent = `${toArabicNumerals(surah.nomor)}. ${surah.namaLatin} (${surah.nama}) - ${surah.arti}`;
            
            const fragment = document.createDocumentFragment();
            
            const infoCard = document.createElement('div');
            infoCard.className = 'bg-white rounded-xl p-6 shadow-lg card';
            infoCard.innerHTML = `
                <p class="text-sm text-gray-600 mb-3">${surah.tempatTurun} • ${surah.jumlahAyat} ayat</p>
                <div class="text-gray-800 prose">${surah.deskripsi}</div>
                <div class="mt-4">
                    <button class="play-all bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors" data-surah="${surah.nomor}" aria-label="Putar semua ayat">
                        <i class="fas fa-play mr-2"></i> Putar Semua Ayat
                    </button>
                </div>
            `;
            infoCard.querySelector('.play-all').addEventListener('click', () => {
                playAllAyahs(surah);
            });
            fragment.appendChild(infoCard);
            
            surah.ayat.forEach((ayah, index) => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl p-6 shadow-lg card card-enter';
                card.style.animationDelay = `${index * 0.1}s`;
                card.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center space-x-3">
                            <span class="bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm arabic-numeric">${toArabicNumerals(ayah.nomorAyat)}</span>
                            <span class="text-sm text-gray-600">${surah.namaLatin}</span>
                        </div>
                        <div class="flex space-x-2">
                            <button class="text-blue-700 p-2 rounded-full play-ayah" data-audio="${ayah.audio['01']}" aria-label="Putar audio ayat ${ayah.nomorAyat}">
                                <i class="fas fa-play text-base"></i>
                            </button>
                            <button class="text-blue-700 p-2 rounded-full view-ayah-tafsir" data-surah="${surah.nomor}" data-ayat="${ayah.nomorAyat}" data-surah-name="${surah.namaLatin}" aria-label="Lihat tafsir ayat ${ayah.nomorAyat}">
                                <i class="fas fa-comment-alt text-base"></i>
                            </button>
                            <button class="text-blue-700 p-2 rounded-full share-ayah" data-surah="${surah.nomor}" data-ayat="${ayah.nomorAyat}" data-surah-name="${surah.namaLatin}" aria-label="Bagikan ayat ${ayah.nomorAyat}">
                                <i class="fas fa-share-alt text-base"></i>
                            </button>
                        </div>
                    </div>
                    <p class="arabic mb-3">${ayah.teksArab}</p>
                    <p class="text-gray-800 text-sm mb-2">${ayah.teksLatin}</p>
                    <p class="text-gray-800">${ayah.teksIndonesia}</p>
                    <div class="audio-controls hidden mt-6" id="audio-controls-${surah.nomor}-${ayah.nomorAyat}">
                        <audio id="audio-player-${surah.nomor}-${ayah.nomorAyat}" src="${ayah.audio['01']}"></audio>
                        <div class="flex items-center space-x-4">
                            <button class="play-pause bg-blue-700 text-white p-3 rounded-full hover:bg-blue-800">
                                <i class="fas fa-play"></i>
                            </button>
                            <input type="range" class="seek-bar w-full h-1 bg-blue-200 rounded-lg" value="0" min="0" max="100">
                            <span class="time text-sm text-gray-600">0:00 / 0:00</span>
                        </div>
                    </div>
                `;
                
                const playButton = card.querySelector('.play-ayah');
                playButton.addEventListener('click', (e) => {
                    const audioUrl = e.target.closest('.play-ayah').dataset.audio;
                    const audioControls = card.querySelector('.audio-controls');
                    toggleAudioPlayer(audioControls, audioUrl, surah.nomor, ayah.nomorAyat);
                });
                
                card.querySelector('.view-ayah-tafsir').addEventListener('click', (e) => {
                    const surahNumber = e.target.dataset.surah || e.target.parentElement.dataset.surah;
                    const ayahNumber = e.target.dataset.ayat || e.target.parentElement.dataset.ayat;
                    const surahName = e.target.dataset.surahName || e.target.parentElement.dataset.surahName;
                    fetchAyahTafsir(surahNumber, ayahNumber, surahName);
                });
                
                card.querySelector('.share-ayah').addEventListener('click', (e) => {
                    const surahNumber = e.target.dataset.surah || e.target.parentElement.dataset.surah;
                    const ayahNumber = e.target.dataset.ayat || e.target.parentElement.dataset.ayat;
                    const surahName = e.target.dataset.surahName || e.target.parentElement.dataset.surahName;
                    shareAyah(surahNumber, ayahNumber, surahName);
                });
                
                fragment.appendChild(card);
            });
            
            if (surah.surat_sebelumnya || surah.surat_selanjutnya) {
                const navDiv = document.createElement('div');
                navDiv.className = 'flex justify-between mt-8';
                
                if (surah.surat_sebelumnya) {
                    const prevButton = document.createElement('button');
                    prevButton.className = 'bg-blue-700 hover:bg-blue-800 text-white font-medium py-3 px-6 rounded-xl transition-colors';
                    prevButton.innerHTML = `<i class="fas fa-arrow-left mr-2"></i> ${surah.surat_sebelumnya.namaLatin}`;
                    prevButton.setAttribute('aria-label', `Baca Surah Sebelumnya: ${surah.surat_sebelumnya.namaLatin}`);
                    prevButton.addEventListener('click', () => {
                        fetchSurahDetail(surah.surat_sebelumnya.nomor);
                    });
                    navDiv.appendChild(prevButton);
                }
                
                if (surah.surat_selanjutnya) {
                    const nextButton = document.createElement('button');
                    nextButton.className = 'bg-blue-700 hover:bg-blue-800 text-white font-medium py-3 px-6 rounded-xl transition-colors';
                    nextButton.innerHTML = `${surah.surat_selanjutnya.namaLatin} <i class="fas fa-arrow-right ml-2"></i>`;
                    nextButton.setAttribute('aria-label', `Baca Surah Berikutnya: ${surah.surat_selanjutnya.namaLatin}`);
                    nextButton.addEventListener('click', () => {
                        fetchSurahDetail(surah.surat_selanjutnya.nomor);
                    });
                    navDiv.appendChild(nextButton);
                }
                
                fragment.appendChild(navDiv);
            }
            
            surahDetailContent.innerHTML = '';
            surahDetailContent.appendChild(fragment);
            surahDetailSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Play All Ayahs
        async function playAllAyahs(surah) {
            if (currentAudio) {
                currentAudio.pause();
                const prevControls = currentAudio.closest('.audio-controls');
                if (prevControls) {
                    prevControls.classList.add('hidden');
                    const prevButton = prevControls.querySelector('.play-pause');
                    if (prevButton) prevButton.innerHTML = '<i class="fas fa-play"></i>';
                }
            }
            
            for (let ayah of surah.ayat) {
                const audioControls = document.getElementById(`audio-controls-${surah.nomor}-${ayah.nomorAyat}`);
                const audioPlayer = audioControls.querySelector('audio');
                audioControls.classList.remove('hidden');
                await new Promise((resolve) => {
                    audioPlayer.src = ayah.audio['01'];
                    audioPlayer.play().catch(() => {
                        showNotification('Gagal memutar audio');
                        resolve();
                    });
                    audioPlayer.onended = resolve;
                });
                audioControls.classList.add('hidden');
            }
        }

        // Share Ayah
        function shareAyah(surahNumber, ayahNumber, surahName) {
            if (navigator.share) {
                navigator.share({
                    title: `Surah ${surahName} Ayat ${ayahNumber}`,
                    text: `Baca Surah ${surahName} Ayat ${ayahNumber} di Al-Quran Digital`,
                    url: `${window.location.origin}/#surah-${surahNumber}-ayah-${ayahNumber}`,
                }).catch(() => {
                    showNotification('Gagal membagikan ayat');
                });
            } else {
                navigator.clipboard.writeText(`${window.location.origin}/#surah-${surahNumber}-ayah-${ayahNumber}`)
                    .then(() => showNotification('Link ayat disalin ke clipboard'))
                    .catch(() => showNotification('Gagal menyalin link ayat'));
            }
        }

        // Fetch Tafsir for Specific Ayah
        async function fetchAyahTafsir(surahNumber, ayahNumber, surahName, retryCount = 0) {
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/tafsir/${surahNumber}`);
                if (!response.ok) throw new Error('Gagal memuat tafsir');
                const data = await response.json();
                if (data.code === 200 && data.data) {
                    const tafsir = data.data.tafsir.find(t => t.ayat == ayahNumber);
                    if (tafsir) {
                        displayAyahTafsir(tafsir, surahName, ayahNumber);
                    } else {
                        throw new Error('Tafsir untuk ayat ini tidak ditemukan');
                    }
                } else {
                    throw new Error('Format data tidak valid');
                }
            } catch (error) {
                console.error('Error:', error);
                if (retryCount < 2) {
                    showNotification('Gagal memuat tafsir, mencoba lagi...');
                    setTimeout(() => fetchAyahTafsir(surahNumber, ayahNumber, surahName, retryCount + 1), 2000);
                } else {
                    showNotification('Gagal memuat tafsir');
                    showErrorWithRetry(() => fetchAyahTafsir(surahNumber, ayahNumber, surahName));
                }
            } finally {
                hideLoading();
            }
        }

        // Display Tafsir in Modal
        function displayAyahTafsir(tafsir, surahName, ayahNumber) {
            const tafsirModalTitle = document.getElementById('tafsirModalTitle');
            const tafsirModalContent = document.getElementById('tafsirModalContent');

            tafsirModalTitle.textContent = `Tafsir Surah ${surahName} Ayat ${toArabicNumerals(ayahNumber)}`;
            tafsirModalContent.innerHTML = `
                <p class="text-gray-800 dark:text-gray-200 prose">${tafsir.teks}</p>
            `;
            
            tafsirModal.classList.remove('hidden');
            tafsirModal.scrollIntoView({ behavior: 'smooth' });
        }

        // Audio Player Functionality
        function toggleAudioPlayer(audioControls, audioUrl, surahNumber, ayahNumber) {
            if (currentAudio && currentAudio !== audioControls.querySelector('audio')) {
                currentAudio.pause();
                const prevControls = currentAudio.closest('.audio-controls');
                if (prevControls) {
                    prevControls.classList.add('hidden');
                    const prevButton = prevControls.querySelector('.play-pause');
                    if (prevButton) prevButton.innerHTML = '<i class="fas fa-play"></i>';
                }
            }
            
            audioControls.classList.toggle('hidden');
            
            if (!audioControls.classList.contains('hidden')) {
                const audioPlayer = audioControls.querySelector('audio');
                const playPauseBtn = audioControls.querySelector('.play-pause');
                const seekBar = audioControls.querySelector('.seek-bar');
                const timeDisplay = audioControls.querySelector('.time');
                
                audioPlayer.src = audioUrl;
                currentAudio = audioPlayer;
                
                playPauseBtn.removeEventListener('click', handlePlayPause);
                audioPlayer.removeEventListener('timeupdate', updateTime);
                audioPlayer.removeEventListener('ended', resetAudio);
                seekBar.removeEventListener('input', handleSeek);
                
                function handlePlayPause() {
                    if (audioPlayer.paused) {
                        audioPlayer.play();
                        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    } else {
                        audioPlayer.pause();
                        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    }
                }
                
                function updateTime() {
                    const currentTime = formatTime(audioPlayer.currentTime);
                    const duration = formatTime(audioPlayer.duration || 0);
                    timeDisplay.textContent = `${currentTime} / ${duration}`;
                    if (audioPlayer.duration) {
                        seekBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                    }
                }
                
                function handleSeek() {
                    const seekTime = (seekBar.value / 100) * audioPlayer.duration;
                    audioPlayer.currentTime = seekTime;
                }
                
                function resetAudio() {
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    audioPlayer.currentTime = 0;
                    seekBar.value = 0;
                    currentAudio = null;
                }
                
                playPauseBtn.addEventListener('click', handlePlayPause);
                audioPlayer.addEventListener('timeupdate', updateTime);
                audioPlayer.addEventListener('ended', resetAudio);
                seekBar.addEventListener('input', handleSeek);
                
                audioPlayer.play().catch(() => {
                    showNotification('Gagal memutar audio');
                });
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                currentAudio = null;
            }
        }

        // Format time (seconds to mm:ss)
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        // Search Functionality
        searchInput.addEventListener('input', async () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query === '') {
                fetchSurahList();
                return;
            }
            
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/surat`);
                if (!response.ok) throw new Error('Gagal memuat daftar surah');
                const data = await response.json();
                if (data.code === 200 && data.data) {
                    const filteredSurahs = data.data.filter(surah =>
                        surah.namaLatin.toLowerCase().includes(query) ||
                        surah.nomor.toString() === query ||
                        surah.nama.toLowerCase().includes(query)
                    );
                    if (filteredSurahs.length > 0) {
                        hideAllSections();
                        surahListSection.classList.remove('hidden');
                        displaySurahList(filteredSurahs);
                    } else {
                        showError();
                    }
                } else {
                    throw new Error('Format data tidak valid');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Gagal mencari surah');
                showError();
            } finally {
                hideLoading();
            }
        });

        // Notification
        function showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'notification px-6 py-3 shadow-lg';
            notification.textContent = message;
            notificationContainer.appendChild(notification);
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // Utility Functions
        function showLoading() {
            loadingIndicator.classList.remove('hidden');
        }

        function hideLoading() {
            loadingIndicator.classList.add('hidden');
        }

        function showError() {
            hideAllSections();
            noResults.classList.remove('hidden');
            noResults.innerHTML = `
                <i class="far fa-frown text-4xl text-blue-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-blue-700 mb-2">Tidak Ada Hasil</h3>
                <p class="text-gray-600">Coba kata kunci lain atau periksa kembali ejaan.</p>
            `;
            noResults.scrollIntoView({ behavior: 'smooth' });
        }

        function showErrorWithRetry(retryCallback) {
            hideAllSections();
            noResults.classList.remove('hidden');
            noResults.innerHTML = `
                <i class="far fa-frown text-4xl text-blue-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-blue-700 mb-2">Gagal Memuat</h3>
                <p class="text-gray-600 mb-4">Terjadi kesalahan saat memuat data.</p>
                <button id="retryButton" class="bg-blue-700 text-white py-2 px-6 rounded-lg hover:bg-blue-800" aria-label="Coba lagi memuat data">
                    Coba Lagi
                </button>
            `;
            document.getElementById('retryButton').addEventListener('click', retryCallback);
            noResults.scrollIntoView({ behavior: 'smooth' });
        }

        function hideAllSections() {
            surahListSection.classList.add('hidden');
            bookmarkSection.classList.add('hidden');
            surahDetailSection.classList.add('hidden');
            noResults.classList.add('hidden');
            tafsirModal.classList.add('hidden');
        }

        // Close Buttons
        closeSurahDetail.addEventListener('click', () => {
            surahDetailSection.classList.add('hidden');
            surahListSection.classList.remove('hidden');
        });

        closeTafsirModal.addEventListener('click', () => {
            tafsirModal.classList.add('hidden');
        });

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!tafsirModal.classList.contains('hidden')) {
                    closeTafsirModal.click();
                } else if (!surahDetailSection.classList.contains('hidden')) {
                    closeSurahDetail.click();
                }
            }
        });