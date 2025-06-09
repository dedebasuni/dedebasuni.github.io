// Declare showCustomModal and hideCustomModal in the global scope
// so they can be called from inline onclick attributes.
let appState = {}; // Global state to be initialized by init()

function showCustomModal(title, content, isError, isHtmlContent = false) {
    let modalOverlay = document.getElementById('custom-modal-overlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'custom-modal-overlay';
        modalOverlay.className = 'custom-modal-overlay';
        document.body.appendChild(modalOverlay);

        const modalContentDiv = document.createElement('div');
        modalContentDiv.className = 'custom-modal-content';
        modalOverlay.appendChild(modalContentDiv);

        const modalTitle = document.createElement('h3');
        modalTitle.id = 'custom-modal-title';
        modalTitle.className = 'custom-modal-title';
        modalContentDiv.appendChild(modalTitle);

        const modalMessage = document.createElement('div');
        modalMessage.id = 'custom-modal-message';
        modalMessage.className = 'custom-modal-message';
        modalContentDiv.appendChild(modalMessage);

        const modalButton = document.createElement('button');
        modalButton.textContent = 'OK';
        modalButton.className = 'custom-modal-button';
        // Note: The onclick attribute in HTML directly calls this global function
        modalButton.onclick = () => hideCustomModal(); 
        modalContentDiv.appendChild(modalButton);
    }

    const modalTitleEl = document.getElementById('custom-modal-title');
    const modalMessageEl = document.getElementById('custom-modal-message');
    const modalContentDiv = modalOverlay.querySelector('.custom-modal-content');

    modalTitleEl.textContent = title;
    
    // Apply error color based on isError, and default based on darkMode
    if (isError) {
        modalTitleEl.style.color = 'var(--incorrect)';
        modalContentDiv.style.animation = 'shake 0.5s'; // Add shake animation for errors
        modalContentDiv.addEventListener('animationend', () => {
            modalContentDiv.style.animation = ''; // Remove animation after it finishes
        });
    } else {
        // Use appState.darkMode after it's initialized
        modalTitleEl.style.color = appState.darkMode ? 'var(--whatsapp-green)' : 'var(--whatsapp-dark-green)';
    }

    if (isHtmlContent && typeof content === 'object') {
        modalMessageEl.innerHTML = '';
        modalMessageEl.appendChild(content);
    } else {
        modalMessageEl.textContent = content;
    }

    // Apply background and text colors based on current dark mode state
    if (appState.darkMode) { // Use appState.darkMode
        modalContentDiv.style.backgroundColor = 'var(--header-dark)';
        modalContentDiv.style.color = '#E9EDEF';
        const detailAnsContent = document.getElementById('detail-answers-content');
        if (detailAnsContent) {
            detailAnsContent.style.backgroundColor = '#111B21';
            detailAnsContent.style.borderColor = '#2A3942';
            detailAnsContent.style.color = '#E9EDEF';
        }
    } else {
        modalContentDiv.style.backgroundColor = 'var(--white)';
        modalContentDiv.style.color = 'var(--text-dark)';
        const detailAnsContent = document.getElementById('detail-answers-content');
        if (detailAnsContent) {
            detailAnsContent.style.backgroundColor = '#fcfcfc';
            detailAnsContent.style.borderColor = '#eee';
            detailAnsContent.style.color = 'var(--text-dark)';
        }
    }

    modalOverlay.style.display = 'flex';
  }

  function hideCustomModal() {
      const modalOverlay = document.getElementById('custom-modal-overlay');
      if (modalOverlay) {
          modalOverlay.style.display = 'none';
          // After hiding the modal, re-validate login inputs to update button state.
          // This is crucial for scenarios where the modal was shown due to time constraints
          // or completion status, and the button needs to reflect that.
          if (typeof validateLoginInputs === 'function') { // Ensure function exists before calling
              validateLoginInputs();
          }
      }
  }


  document.addEventListener('DOMContentLoaded', function () {

  const API_URL = 'https://script.google.com/macros/s/AKfycbwCn0QD_1GFvTJwsV3ZiHjQp-7EZzHLvKbiO6bBbjeJGnSId_ntpUFa0aP2EO_mi_hyzg/exec';
  const AU_DIPOYOK = 'mulai';
  const AU_DILEBOK = 'jenuh';

  // Sound effects WhatsApp-style
  const soundCorrect = new Audio('https://cdn.pixabay.com/download/audio/2025/06/06/audio_033375aac8.mp3');
  const soundWrong = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_8b0fae46ef.mp3');

  // State object, now inside DOMContentLoaded but referenced by global functions
  const state = {
    noPeserta: '',
    nama: '',
    kelas: '',
    questions: [],
    participants: [],
    settings: {},
    allResults: [],
    currentQuestionIndex: 0,
    answers: [],
    score: 0,
    timer: null,
    timeLeft: 0,
    typingTimeout: null,
    darkMode: false, // Default to false, will be overridden by localStorage or init
    practiceMode: false,
    examStarted: false, // Flag to track if exam has officially started
  };

  // Assign the state to the global appState for access by global modal functions
  appState = state;


  // DOM Elements
  const body = document.body;
  const header = document.getElementById('header');
  const avatar = document.getElementById('avatar');
  const headerName = document.getElementById('header-name');
  const headerStatus = document.getElementById('header-status');
  const timerEl = document.getElementById('timer');
  const darkToggle = document.getElementById('dark-toggle');

  const loginScreen = document.getElementById('login-screen');
  const examScreen = document.getElementById('exam-screen');
  const resultScreen = document.getElementById('result-screen');
  const adminScreen = document.getElementById('admin-screen');
  const resultsTableBody = document.querySelector('#results-table tbody');

  const chatMessages = document.getElementById('chat-messages');
  const questionCounter = document.getElementById('question-counter');
  const nextBtn = document.getElementById('next-btn');
  const startBtn = document.getElementById('start-btn');
  const adminLoginBtn = document.getElementById('admin-login-btn');
  const adminBackBtn = document.getElementById('admin-back-btn');

  const statsContainer = document.getElementById('stats-container');
  const statsList = document.getElementById('stats-list');

  const resultTitle = document.getElementById('result-title');
  const resultDetails = document.getElementById('result-details');
  const restartBtn = document.getElementById('restart-btn');

  const inputNoPeserta = document.getElementById('noPeserta');
  const inputNama = document.getElementById('nama');
  const inputKelas = document.getElementById('kelas');

  // Admin login modal elements
  const adminLoginModal = document.getElementById('admin-login-modal');
  const adminUsernameInput = document.getElementById('admin-username');
  const adminPasswordInput = document.getElementById('admin-password');
  const adminLoginSubmit = document.getElementById('admin-login-submit');
  const adminLoginCancel = document.getElementById('admin-login-cancel');

  // --- Utility Functions ---

  function isImageUrl(str) {
    return (typeof str === 'string') && (str.startsWith('http://') || str.startsWith('https://')) &&
           (/\.(jpg|jpeg|png|gif|webp)$/i).test(str);
  }

  function createImageElement(src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Gambar soal';
    img.loading = 'lazy';
    img.onerror = () => {
      console.warn('Failed to load image:', src);
      img.src = `https://placehold.co/150x100/A0A0A0/FFFFFF?text=Gambar+Rusak`;
    };
    return img;
  }

  function getInitials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  /**
   * Parses a date string in DD/MM/YYYY HH:mm:ss format into a Date object.
   * This helps to avoid browser-specific parsing ambiguities (MM/DD/YYYY vs DD/MM/YYYY).
   * @param {string} dateString - The date string to parse.
   * @returns {Date|null} A Date object or null if parsing fails.
   */
  function parseDDMMYYYY_HHMMSS(dateString) {
      if (!dateString || typeof dateString !== 'string') return null;
      const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})/);
      if (parts) {
          // Construct ISO 8601 compatible string: YYYY-MM-DDTHH:mm:ss
          // Note: Month in Date constructor is 0-indexed, but here we use it as MM in YYYY-MM-DD
          return new Date(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4].padStart(2, '0')}:${parts[5]}:${parts[6]}`);
      }
      return null; // Return null if format doesn't match
  }

  // --- Initialization ---

  async function init() {
    // Set default theme to dark if not set in localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === null) {
      state.darkMode = true; // Default to dark mode
      localStorage.setItem('darkMode', 'true');
    } else {
      state.darkMode = savedDarkMode === 'true';
    }

    if (state.darkMode) {
      body.classList.add('dark');
      body.classList.remove('light');
      darkToggle.textContent = '☀️';
    } else {
      body.classList.remove('dark');
      body.classList.add('light');
      darkToggle.textContent = '🌙';
    }

    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.status !== 'success' || !data.data) {
        throw new Error('Failed to load initial data from Google Sheet.');
      }
      state.settings = data.data.settings || {};
      state.participants = data.data.participants || [];
      state.questions = data.data.questions || [];
      state.allResults = data.data.results || [];

      // Parse start and end times once during initialization
      if (state.settings['Waktu Mulai']) {
          state.settings.parsedStartTime = parseDDMMYYYY_HHMMSS(state.settings['Waktu Mulai']);
      }
      if (state.settings['Waktu Selesai']) {
          state.settings.parsedEndTime = parseDDMMYYYY_HHMMSS(state.settings['Waktu Selesai']);
      }

      if (state.settings['Mata Pelajaran'] && state.settings['Guru Mapel']) {
        headerName.textContent = `${state.settings['Mata Pelajaran']} - ${state.settings['Guru Mapel']}`;
      } else {
        headerName.textContent = 'Ujian Online';
      }
      headerStatus.textContent = state.settings['Kelas'] ? `Kelas: ${state.settings['Kelas']}` : 'Sedang mengerjakan ujian';

    } catch (e) {
      showCustomModal('Error', `Failed to load initial data: ${e.message}. Pastikan URL API benar dan Google Sheet siap.`, true);
      console.error('Error fetching initial data:', e);
      startBtn.disabled = true;
    }

    inputNoPeserta.addEventListener('input', validateLoginInputs);
    inputNama.addEventListener('input', validateLoginInputs);
    inputKelas.addEventListener('input', validateLoginInputs);

    darkToggle.addEventListener('click', toggleDarkMode);
    startBtn.addEventListener('click', startExam);
    adminLoginBtn.addEventListener('click', showAdminLoginModal);
    nextBtn.addEventListener('click', handleNextQuestion);
    restartBtn.addEventListener('click', restartExam);
    adminBackBtn.addEventListener('click', showLoginScreen);

    // Admin login modal events
    adminLoginSubmit.addEventListener('click', handleAdminLogin);
    adminLoginCancel.addEventListener('click', hideAdminLoginModal);

    // Call validateLoginInputs after initial load to set correct button state
    validateLoginInputs();

    loadFromStorage() ? continueExam() : showLoginScreen();

    // Notifikasi keluar layar
    window.addEventListener('beforeunload', function(event) {
        if (state.examStarted && state.currentQuestionIndex < state.questions.length && state.questions.length > 0) {
            // Cancel the event
            event.preventDefault();
            // Chrome requires returnValue to be set
            event.returnValue = '';
            // Show a custom modal instead of alert
            showCustomModal('Peringatan', 'Anda tidak diperkenankan keluar dari layar ujian sebelum semua soal terjawab!', true);
            return 'Anda tidak diperkenankan keluar dari layar ujian sebelum semua soal terjawab!';
        }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && state.examStarted && state.currentQuestionIndex < state.questions.length && state.questions.length > 0) {
            showCustomModal('Peringatan', 'Anda tidak diperkenankan keluar dari layar ujian sebelum semua soal terjawab!', true);
        }
    });

    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
      // Small delay to allow viewport to adjust
      setTimeout(function() {
        scrollToBottom();
      }, 300);
    });

    // Handle window resize
    window.addEventListener('resize', function() {
      scrollToBottom();
    });
  }

  function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    if (state.darkMode) {
      body.classList.add('dark');
      body.classList.remove('light');
      darkToggle.textContent = '☀️';
      localStorage.setItem('darkMode', 'true');
    } else {
      body.classList.remove('dark');
      body.classList.add('light');
      darkToggle.textContent = '�';
      localStorage.setItem('darkMode', 'false');
    }
    // Re-apply modal theme if modal is open
    const modalOverlay = document.getElementById('custom-modal-overlay');
    if (modalOverlay && modalOverlay.style.display === 'flex') {
        const modalTitleEl = document.getElementById('custom-modal-title');
        const modalMessageEl = document.getElementById('custom-modal-message');
        const modalContentDiv = modalOverlay.querySelector('.custom-modal-content');
        const isError = modalTitleEl.style.color === 'var(--incorrect)'; // Check if current title color indicates error

        if (state.darkMode) {
            modalContentDiv.style.backgroundColor = 'var(--header-dark)';
            modalContentDiv.style.color = '#E9EDEF';
            modalTitleEl.style.color = isError ? 'var(--incorrect)' : 'var(--whatsapp-green)';
            const detailAnsContent = document.getElementById('detail-answers-content');
            if (detailAnsContent) {
                detailAnsContent.style.backgroundColor = '#111B21';
                detailAnsContent.style.borderColor = '#2A3942';
                detailAnsContent.style.color = '#E9EDEF';
            }
        } else {
            modalContentDiv.style.backgroundColor = 'var(--white)';
            modalContentDiv.style.color = 'var(--text-dark)';
            modalTitleEl.style.color = isError ? 'var(--incorrect)' : 'var(--whatsapp-dark-green)';
            const detailAnsContent = document.getElementById('detail-answers-content');
            if (detailAnsContent) {
                detailAnsContent.style.backgroundColor = '#fcfcfc';
                detailAnsContent.style.borderColor = '#eee';
                detailAnsContent.style.color = 'var(--text-dark)';
            }
        }
    }
  }

  function validateLoginInputs() {
    // Selalu nonaktifkan tombol terlebih dahulu, lalu aktifkan jika semua kondisi terpenuhi
    startBtn.disabled = true; 

    const noPesertaVal = inputNoPeserta.value.trim();
    const namaVal = inputNama.value.trim();
    const kelasVal = inputKelas.value.trim();

    const participant = state.participants.find(p => p.noPeserta === noPesertaVal);

    // Dapatkan waktu saat ini
    const currentTime = new Date();

    // Pastikan parsedStartTime dan parsedEndTime tersedia
    const startTime = state.settings.parsedStartTime;
    const endTime = state.settings.parsedEndTime;

    // Jika waktu mulai/selesai tidak valid atau tidak diatur, tampilkan modal error
    if (!startTime || isNaN(startTime.getTime()) || !endTime || isNaN(endTime.getTime())) {
        showCustomModal('Error Pengaturan Ujian', 'Waktu mulai atau waktu selesai ujian tidak valid. Hubungi administrator.', true);
        return; // Tombol tetap dinonaktifkan
    }

    // Periksa kondisi waktu ujian
    if (currentTime < startTime) {
        showCustomModal('Ujian Belum Dimulai', `Ujian akan dimulai pada ${startTime.toLocaleString('id-ID', {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'})}.`, false);
        return; // Tombol tetap dinonaktifkan
    }
    if (currentTime > endTime) {
        showCustomModal('Ujian Sudah Selesai', `Ujian telah berakhir pada ${endTime.toLocaleString('id-ID', {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'})}.`, false);
        return; // Tombol tetap dinonaktifkan
    }

    // Jika waktu ujian valid, lanjutkan dengan validasi peserta
    if (participant) {
      inputNama.value = participant.nama;
      inputKelas.value = participant.kelas;
      inputNama.disabled = true;
      inputKelas.disabled = true;

      // Check for completion using local storage
      const completedExams = JSON.parse(localStorage.getItem('completedExams') || '{}');
      if (completedExams[noPesertaVal]) {
          showCustomModal('Ujian Selesai', `Maaf, ${participant.nama}, Anda sudah menyelesaikan ujian ini.`, false);
          return; // Tombol tetap dinonaktifkan
      }

      // Jika semua kondisi valid, aktifkan tombol
      startBtn.disabled = false;
    } else { // New participant (not found in sheet)
      inputNama.value = ''; // Clear fields for new participant
      inputKelas.value = '';
      inputNama.disabled = false; // Enable input fields for new participant
      inputKelas.disabled = false;
      
      // For new participants, all fields must be filled and exam time must be valid
      if (noPesertaVal && namaVal && kelasVal) {
          startBtn.disabled = false; // Aktifkan tombol jika semua input terisi dan waktu valid
      }
    }
  }

  // --- Admin Login ---

  function showAdminLoginModal() {
    adminUsernameInput.value = '';
    adminPasswordInput.value = '';
    adminLoginModal.style.display = 'flex';
    adminUsernameInput.focus();
  }

  function hideAdminLoginModal() {
    adminLoginModal.style.display = 'none';
  }

  function handleAdminLogin() {
    const username = adminUsernameInput.value.trim();
    const password = adminPasswordInput.value.trim();

    if (username === AU_DIPOYOK && password === AU_DILEBOK) {
      hideAdminLoginModal();
      showAdminScreen();
    } else {
      showCustomModal('Login Gagal', 'Username atau password salah.', true);
    }
  }

  // --- Exam Flow ---

  async function startExam() {
    const noPesertaVal = inputNoPeserta.value.trim();
    const namaVal = inputNama.value.trim();
    const kelasVal = inputKelas.value.trim();

    // Re-check conditions right before starting the exam to prevent bypass
    const currentTime = new Date();
    const startTime = state.settings.parsedStartTime;
    const endTime = state.settings.parsedEndTime;

    if (!startTime || isNaN(startTime.getTime()) || !endTime || isNaN(endTime.getTime())) {
        showCustomModal('Error Pengaturan Ujian', 'Waktu mulai atau waktu selesai ujian tidak valid. Hubungi administrator.', true);
        return;
    }
    if (currentTime < startTime) {
        showCustomModal('Ujian Belum Dimulai', `Ujian akan dimulai pada ${startTime.toLocaleString('id-ID', {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'})}.`, false);
        return;
    }
    if (currentTime > endTime) {
        showCustomModal('Ujian Sudah Selesai', `Ujian telah berakhir pada ${endTime.toLocaleString('id-ID', {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'})}.`, true);
        return;
    }

    // Check if participant already completed, using local storage
    const completedExams = JSON.parse(localStorage.getItem('completedExams') || '{}');
    if (completedExams[noPesertaVal]) {
        showCustomModal('Ujian Selesai', `Maaf, ${namaVal || 'Anda'}, Anda sudah menyelesaikan ujian ini.`, false);
        return;
    }

    // If all checks pass, proceed to start the exam
    state.noPeserta = noPesertaVal;
    state.nama = namaVal;
    state.kelas = kelasVal;
    state.practiceMode = false;
    state.examStarted = true; // Set exam started flag

    avatar.style.backgroundImage = `url('https://placehold.co/48x48/00a884/ffffff?text=${getInitials(state.nama)}')`;

    loginScreen.classList.add('hidden');
    header.classList.remove('hidden');
    examScreen.classList.remove('hidden');
    statsContainer.classList.remove('hidden');

    chatMessages.innerHTML = '';
    statsList.innerHTML = '';
    questionCounter.textContent = `Soal 1/${state.questions.length}`;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Lanjut';

    state.currentQuestionIndex = 0;
    state.answers = [];
    state.score = 0;
    const waktuSetting = parseInt(state.settings['Waktu'] || '60', 10);
    state.timeLeft = waktuSetting * 60;
    clearInterval(state.timer);
    startTimer();

    appendBotMessage(`Halo ${state.nama}! Selamat datang di ujian online.`);
    appendBotMessage('Silakan jawab semua soal dengan memilih salah satu opsi yang tersedia.');

    setTimeout(() => {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        if (state.questions.length > 0) {
            showQuestion(0);
        } else {
            appendBotMessage('Tidak ada soal yang tersedia. Harap hubungi administrator.');
            nextBtn.disabled = true;
        }
        updateStats();
      }, 1200);
    }, 1000);
  }

  function startTimer() {
    updateTimerDisplay();
    state.timer = setInterval(() => {
      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        finishExam();
      } else {
        state.timeLeft--;
        updateTimerDisplay();
        saveToStorage();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const m = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
    const s = (state.timeLeft % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }

  // --- Chat & Message Display ---

  function showTypingIndicator() {
    if (document.querySelector('.typing-indicator')) return;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.setAttribute('aria-live', 'polite');
    typingDiv.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const typingDiv = document.querySelector('.typing-indicator');
    if (typingDiv) typingDiv.remove();
  }

  function appendBotMessage(content) {
    hideTypingIndicator();
    const div = document.createElement('div');
    div.className = 'message bot-message';
    if (isImageUrl(content)) {
        div.appendChild(createImageElement(content));
    } else {
        div.textContent = content;
    }
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = getCurrentTime();
    div.appendChild(timeSpan);
    chatMessages.appendChild(div);
    animateAndScroll(div);
  }

  function appendUserMessage(content) {
    const div = document.createElement('div');
    div.className = 'message user-message';
    if (isImageUrl(content)) {
        div.appendChild(createImageElement(content));
    } else {
        div.textContent = content;
    }
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = getCurrentTime();
    div.appendChild(timeSpan);
    chatMessages.appendChild(div);
    animateAndScroll(div);
  }

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function animateAndScroll(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      scrollToBottom();
    });
  }

  function scrollToBottom() {
    // Small delay to ensure DOM updates are complete
    setTimeout(function() {
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);
  }

  // --- Question and Answer Logic ---

  function showQuestion(index) {
    state.currentQuestionIndex = index;
    nextBtn.disabled = true;

    chatMessages.querySelectorAll('.option-message').forEach(opt => opt.remove());
    hideTypingIndicator();

    const q = state.questions[index];
    appendBotMessage(q.question);

    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      q.options.forEach((opt, i) => {
        const div = document.createElement('div');
        div.className = 'option-message';
        div.tabIndex = 0;
        div.setAttribute('role', 'button');
        div.setAttribute('aria-pressed', 'false');

        const optionLabel = `${String.fromCharCode(65 + i)}. `;
        if (isImageUrl(opt)) {
            div.innerHTML = optionLabel;
            div.appendChild(createImageElement(opt));
        } else {
            div.textContent = optionLabel + opt;
        }

        div.addEventListener('click', () => selectAnswer(div, opt, q.correctAnswer));
        div.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectAnswer(div, opt, q.correctAnswer);
          }
        });
        chatMessages.appendChild(div);
        animateAndScroll(div);
      });
      questionCounter.textContent = `Soal ${index + 1} / ${state.questions.length}`;

      const firstOpt = chatMessages.querySelector('.option-message');
      if (firstOpt) firstOpt.focus();
    }, 1200);
  }

  function selectAnswer(selectedDiv, selectedAnswer, correctAnswer) {
    if (!nextBtn.disabled) return;

    appendUserMessage(selectedAnswer);

    document.querySelectorAll('.option-message').forEach(opt => {
      opt.style.pointerEvents = 'none';
      opt.classList.add('selected');
    });

    const isCorrect = selectedAnswer === correctAnswer;
    state.answers.push({
      question: state.questions[state.currentQuestionIndex].question,
      selectedAnswer,
      correctAnswer,
      isCorrect
    });

    try {
      if (isCorrect) {
        soundCorrect.currentTime = 0;
        soundCorrect.play();
        state.score++;
      } else {
        soundWrong.currentTime = 0;
        soundWrong.play();
      }
    } catch (e) {
      console.warn("Sound playback failed:", e);
    }

    document.querySelectorAll('.option-message').forEach(opt => {
      const optContentElement = opt.querySelector('img');
      const optContent = optContentElement ? optContentElement.src : opt.textContent.replace(/^[A-Z]\.\s*/, '');

      const correctContent = isImageUrl(correctAnswer) ? correctAnswer : correctAnswer;

      if (optContent === correctContent || opt.textContent.includes(correctAnswer)) {
        opt.classList.add('correct-answer');
        addStatusIcon(opt, '✓', 'correct-indicator');
      }
      if (opt === selectedDiv && !isCorrect) {
        opt.classList.add('wrong-answer');
        addStatusIcon(opt, '✗', 'incorrect-indicator');
      }
    });

    nextBtn.disabled = false;

    if (state.currentQuestionIndex === state.questions.length - 1) {
      nextBtn.textContent = 'Selesai';
    } else {
      nextBtn.textContent = 'Lanjut';
    }

    updateStats();
    saveToStorage();
  }

  function addStatusIcon(element, icon, className) {
    const span = document.createElement('span');
    span.className = `status-indicator ${className}`;
    span.textContent = icon;
    element.appendChild(span);
  }

  function updateStats() {
    statsList.innerHTML = '';
    state.answers.forEach((ans, i) => {
      const li = document.createElement('li');
      li.textContent = `Soal ${i + 1}: ${ans.isCorrect ? 'Benar' : 'Salah'}`;
      li.className = ans.isCorrect ? 'correct' : 'incorrect';
      statsList.appendChild(li);
    });
  }

  function handleNextQuestion() {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      state.currentQuestionIndex++;
      showQuestion(state.currentQuestionIndex);
    } else {
      finishExam();
    }
  }

  // --- Exam Completion ---

  function finishExam() {
    clearInterval(state.timer);
    state.examStarted = false; // Reset exam started flag

    header.classList.add('hidden');
    examScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    // Normalize score to 100
    const totalQuestions = state.questions.length;
    let normalizedScore = 0;
    if (totalQuestions > 0) {
      normalizedScore = Math.round((state.score / totalQuestions) * 100);
    }

    const percentage = normalizedScore; // Use normalized score as percentage
    const emoji = percentage >= 85 ? '🎉' : percentage >= 60 ? '👍' : '💪';
    const feedback = percentage >= 85 ? 'Sempurna!' : percentage >= 60 ? 'Bagus!' : 'Perlu belajar lagi';

    resultTitle.textContent = `Ujian Selesai!`;
    resultDetails.innerHTML = `
      <p>No. Peserta: ${state.noPeserta}</p>
      <p>Nama: ${state.nama}</p>
      <p>Kelas: ${state.kelas}</p>
      <p>Skor: ${state.score} dari ${totalQuestions} soal</p>
      <p>Nilai Akhir (Skala 100): <strong>${normalizedScore}</strong></p>
      <p><strong>${feedback} ${emoji}</strong></p>
    `;

    sendResults(normalizedScore); // Send normalized score
    clearStorage();
  }

  async function sendResults(finalScore) { // Accept finalScore as parameter
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noPeserta: state.noPeserta,
          nama: state.nama,
          kelas: state.kelas,
          score: finalScore, // Send the normalized score
          answers: state.answers,
        }),
        mode: 'no-cors',
      });
      console.log('Hasil ujian dikirim:', response);
      const participantIndex = state.participants.findIndex(p => p.noPeserta === state.noPeserta);
      if (participantIndex !== -1) {
        state.participants[participantIndex].isCompleted = true;
      }
      // Mark as completed in local storage for persistence across sessions/reloads
      const completedExams = JSON.parse(localStorage.getItem('completedExams') || '{}');
      completedExams[state.noPeserta] = true;
      localStorage.setItem('completedExams', JSON.stringify(completedExams));

      await fetchAllInitialData(); // Re-fetch all data, though localStorage is now primary for completion status
    } catch (e) {
      console.warn('Gagal kirim hasil ujian:', e);
    }
  }

  // --- Restart & Continue Exam ---

  function restartExam() {
    resultScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    statsContainer.classList.add('hidden');
    nextBtn.disabled = true;
    nextBtn.textContent = 'Lanjut';
    chatMessages.innerHTML = '';
    inputNoPeserta.value = '';
    inputNama.value = '';
    inputKelas.value = '';
    inputNama.disabled = false;
    inputKelas.disabled = false;
    startBtn.disabled = true;
    state.answers = [];
    state.score = 0;
    state.currentQuestionIndex = 0;
    state.examStarted = false; // Reset exam started flag
    clearStorage();
    clearInterval(state.timer);
    updateTimerDisplay();
    validateLoginInputs(); // Re-validate after restart for exam time check
  }

  function continueExam() {
    avatar.style.backgroundImage = `url('https://placehold.co/48x48/00a884/ffffff?text=${getInitials(state.nama)}')`;

    loginScreen.classList.add('hidden');
    header.classList.remove('hidden');
    examScreen.classList.remove('hidden');
    statsContainer.classList.remove('hidden');

    chatMessages.innerHTML = '';
    statsList.innerHTML = '';

    questionCounter.textContent = `Soal ${state.currentQuestionIndex + 1} / ${state.questions.length}`;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Lanjut';

    state.examStarted = true; // Set exam started flag for continuation

    startTimer();

    appendBotMessage(`Selamat datang kembali, ${state.nama}!`);
    appendBotMessage('Anda dapat melanjutkan ujian dari sebelumnya.');

    setTimeout(() => {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        if (state.questions.length > 0) {
            showQuestion(state.currentQuestionIndex);
        } else {
            appendBotMessage('Tidak ada soal yang tersedia. Harap hubungi administrator.');
            nextBtn.disabled = true;
        }
        updateStats();
      }, 1200);
    }, 1000);
  }

  function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    header.classList.add('hidden');
    examScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    adminScreen.classList.add('hidden');
    statsContainer.classList.add('hidden');
    validateLoginInputs(); // Re-validate when returning to login screen
  }

  // --- Admin Functions ---

  async function showAdminScreen() {
    loginScreen.classList.add('hidden');
    examScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    header.classList.add('hidden');
    adminScreen.classList.remove('hidden');

    showCustomModal('Memuat Data', 'Sedang memuat data hasil ujian...', false);
    await fetchAllInitialData();
    populateAdminResultsTable();
    hideCustomModal();
  }

  async function fetchAllInitialData() {
      try {
          const response = await fetch(API_URL);
          const data = await response.json();
          if (data.status !== 'success' || !data.data) {
              throw new Error('Failed to load initial data from Google Sheet.');
          }
          state.settings = data.data.settings || {};
          state.participants = data.data.participants || [];
          state.questions = data.data.questions || [];
          state.allResults = data.data.results || [];

          // Re-parse start and end times after re-fetching settings
          if (state.settings['Waktu Mulai']) {
              state.settings.parsedStartTime = parseDDMMYYYY_HHMMSS(state.settings['Waktu Mulai']);
          }
          if (state.settings['Waktu Selesai']) {
              state.settings.parsedEndTime = parseDDMMYYYY_HHMMSS(state.settings['Waktu Selesai']);
          }

      } catch (e) {
          showCustomModal('Error', `Failed to reload data: ${e.message}.`, true);
          console.error('Error fetching initial data for admin:', e);
      }
  }

  function populateAdminResultsTable() {
    resultsTableBody.innerHTML = '';

    if (state.allResults.length === 0) {
      const row = resultsTableBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 6;
      cell.textContent = 'Belum ada hasil ujian.';
      cell.style.textAlign = 'center';
      return;
    }

    state.allResults.forEach(result => {
      const row = resultsTableBody.insertRow();
      row.insertCell().textContent = result.noPeserta;
      row.insertCell().textContent = result.nama;
      row.insertCell().textContent = result.kelas;
      // Display score as normalized score, if question length is available
      const displayScore = state.questions.length > 0 ?
          `${result.score} (Nilai: ${Math.round((result.score / state.questions.length) * 100)})` :
          result.score; // If no questions, just show raw score
      row.insertCell().textContent = displayScore;

      const timestamp = new Date(result.timestamp);
      row.insertCell().textContent = timestamp.toLocaleString('id-ID', {
          year: 'numeric', month: 'numeric', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
      });

      const detailCell = row.insertCell();
      const detailButton = document.createElement('button');
      detailButton.textContent = 'Lihat Detail';
      detailButton.className = 'btn view-detail-btn';
      detailButton.onclick = () => showAnswerDetailsModal(result.answers);
      detailCell.appendChild(detailButton);
    });
  }

  function showAnswerDetailsModal(answersJson) {
    let answers;
    try {
      answers = JSON.parse(answersJson);
    } catch (e) {
      showCustomModal('Error', 'Gagal memparsing detail jawaban.', true);
      console.error('Error parsing answers JSON:', e);
      return;
    }

    const modalContent = document.createElement('div');
    modalContent.id = 'detail-answers-content';

    answers.forEach((ans, index) => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>Soal ${index + 1}:</strong> ${ans.question}`;
      if (isImageUrl(ans.question)) {
          p.innerHTML = `<strong>Soal ${index + 1}:</strong> `;
          p.appendChild(createImageElement(ans.question));
      }

      const selectedAnswerText = isImageUrl(ans.selectedAnswer) ?
          `Jawaban Anda: <img src="${ans.selectedAnswer}" alt="Jawaban Anda" style="max-width: 80px; height: auto;">` :
          `Jawaban Anda: ${ans.selectedAnswer}`;
      const correctAnswerText = isImageUrl(ans.correctAnswer) ?
          `Jawaban Benar: <img src="${ans.correctAnswer}" alt="Jawaban Benar" style="max-width: 80px; height: auto;">` :
          `Jawaban Benar: ${ans.correctAnswer}`;

      p.innerHTML += `<br>${selectedAnswerText}`;
      p.innerHTML += `<br>${correctAnswerText}`;

      if (ans.isCorrect) {
        p.className = 'correct';
        p.innerHTML += ' (Benar)';
      } else {
        p.className = 'incorrect';
        p.innerHTML += ' (Salah)';
      }
      modalContent.appendChild(p);
    });

    showCustomModal('Detail Jawaban', modalContent, false, true);
  }

  // --- Local Storage Functions ---

  function saveToStorage() {
    localStorage.setItem('ujian-online-data', JSON.stringify({
      noPeserta: state.noPeserta,
      nama: state.nama,
      kelas: state.kelas,
      questions: state.questions,
      answers: state.answers,
      score: state.score,
      currentQuestionIndex: state.currentQuestionIndex,
      timeLeft: state.timeLeft,
      practiceMode: state.practiceMode,
      settings: state.settings
    }));
  }

  function loadFromStorage() {
    const data = localStorage.getItem('ujian-online-data');
    if (!data) return false;
    try {
      const obj = JSON.parse(data);
      if (obj && obj.nama && obj.kelas && obj.questions && obj.answers && obj.settings) {
        // Only load essential state to avoid overwriting current logic for examStarted
        state.noPeserta = obj.noPeserta;
        state.nama = obj.nama;
        state.kelas = obj.kelas;
        state.questions = obj.questions;
        state.answers = obj.answers;
        state.score = obj.score;
        state.currentQuestionIndex = obj.currentQuestionIndex;
        state.timeLeft = obj.timeLeft;
        state.practiceMode = obj.practiceMode;
        state.settings = obj.settings;

        // Re-parse start and end times after loading settings from storage
        if (state.settings['Waktu Mulai']) {
            state.settings.parsedStartTime = parseDDMMYYYY_HHMMSS(state.settings['Waktu Mulai']);
        }
        if (state.settings['Waktu Selesai']) {
            state.settings.parsedEndTime = parseDDMMYYYY_HHMMSS(state.settings['Waktu Selesai']);
        }

        // Do not load examStarted from storage, it's determined by current session
        state.examStarted = false; // Ensure it's false when loaded from storage, then set by continueExam if needed.


        if (state.settings['Mata Pelajaran'] && state.settings['Guru Mapel']) {
          headerName.textContent = `${state.settings['Mata Pelajaran']} - ${state.settings['Guru Mapel']}`;
        } else {
          headerName.textContent = 'Ujian Online';
        }
        headerStatus.textContent = state.settings['Kelas'] ? `Kelas: ${state.settings['Kelas']}` : 'Sedang mengerjakan ujian';
        // Removed validateLoginInputs() here, it's called explicitly at the end of init
        return true;
      }
    } catch (e) {
      console.error("Failed to load from storage:", e);
      return false;
    }
    return false;
  }

  function clearStorage() {
    localStorage.removeItem('ujian-online-data');
  }

  // Initialize the app
  init();
});