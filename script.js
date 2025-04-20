const postsApiUrl = "https://script.google.com/macros/s/AKfycbyl_tLV9i5K6cngdpXd9OfvVtNj53hP2FiOoXp1UZn1G8luBhMJZVN6JRhR2amLomyjMw/exec?sheet=Post";
let posts = [];
let filteredPosts = [];
let currentPage = 1;
const postsPerPage = 9;

function paginatePosts(postList) {
  const totalPages = Math.ceil(postList.length / postsPerPage);
  const start = (currentPage - 1) * postsPerPage;
  const end = start + postsPerPage;
  renderPosts(postList.slice(start, end));
  renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
  const pagination = document.getElementById('paginationControls');
  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
const li = document.createElement('li');
li.className = `page-item ${i === currentPage ? 'active' : ''}`;
li.innerHTML = `<button class="page-link" onclick="goToPage(${i})">${i}</button>`;
pagination.appendChild(li);
  }
}

function goToPage(page) {
  currentPage = page;
  paginatePosts(filteredPosts);
}

async function fetchPosts() {
  try {
const res = await fetch(postsApiUrl);
if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
posts = await res.json().then(data => data.filter(p => p.Status.toLowerCase() === "publish"));
filteredPosts = posts;
currentPage = 1;
paginatePosts(filteredPosts);
populateCategoryFilter();
checkNewPost();
document.getElementById("loader").style.display = "none";
document.getElementById("categoryFilter").classList.remove("d-none");
  } catch (error) {
console.error("Error fetching posts:", error);
document.getElementById("posts").innerHTML = "<p class='text-danger'>Gagal memuat data.</p>";
document.getElementById("loader").style.display = "none";
  }
}

function populateCategoryFilter() {
  let categories = [...new Set(posts.map(post => post.Kategori))];
  const categorySelect = document.getElementById("categoryFilter");
  categorySelect.innerHTML = '<option value="">Semua Kategori</option>';
  categories.forEach(category => {
let option = document.createElement("option");
option.value = category;
option.textContent = category;
categorySelect.appendChild(option);
  });
  categorySelect.addEventListener("change", function () {
let selectedCategory = this.value;
filteredPosts = selectedCategory ? posts.filter(post => post.Kategori === selectedCategory) : posts;
currentPage = 1;
paginatePosts(filteredPosts);
  });
}

function renderPosts(postList) {
  const postsContainer = document.getElementById('posts');
  postsContainer.innerHTML = postList.map(post => `
<div class="col-md-4">
  <div class="card p-3 shadow-sm h-100 d-flex flex-column">
<h5 class="card-title cursor-pointer" onclick="openModal('${post.Judul}')">${post.Judul}</h5>
<p class="card-category">${post.Kategori} | ${post.Tag || 'Tanpa tag'}</p>
  </div>
</div>`).join('');
}

function updateLike(title) {
  const likeKey = `likeCount_${title}`;
  let likeCount = parseInt(localStorage.getItem(likeKey)) || 0;
  likeCount++;
  localStorage.setItem(likeKey, likeCount);
  document.getElementById('likeCount').innerText = `${likeCount} Likes`;
}

function updateView(title) {
  const viewKey = `viewCount_${title}`;
  let viewCount = parseInt(localStorage.getItem(viewKey)) || 0;
  viewCount++;
  localStorage.setItem(viewKey, viewCount);
  document.getElementById('viewCount').innerText = `👁️ ${viewCount} views`;
}

function openModal(title) {
  const post = posts.find(p => p.Judul === title);
  if (!post) return alert("Postingan tidak ditemukan!");
  document.getElementById('modalTitle').innerText = post.Judul;
  document.getElementById('modalContent').innerText = post.Isi;
  const modalImage = document.getElementById('modalImage');
  if (post.Gambar) {
modalImage.src = post.Gambar;
modalImage.classList.remove("d-none");
  } else {
modalImage.classList.add("d-none");
  }
  updateView(post.Judul);
  const likeKey = `likeCount_${post.Judul}`;
  let likeCount = parseInt(localStorage.getItem(likeKey)) || 0;
  document.getElementById('likeCount').innerText = `${likeCount} Likes`;
  const modalElement = new bootstrap.Modal(document.getElementById('postModal'));
  modalElement.show();
}

function randomPost() {
  if (filteredPosts.length === 0) return;
  const randomIndex = Math.floor(Math.random() * filteredPosts.length);
  openModal(filteredPosts[randomIndex].Judul);
}

function checkNewPost() {
  const lastSeen = localStorage.getItem("lastCheck") || new Date(0);
  const newCount = posts.filter(p => new Date(p.Tanggal) > new Date(lastSeen)).length;
  if (newCount > 0) {
document.getElementById("newPostAlert").innerText = `${newCount} post baru`;
  }
  localStorage.setItem("lastCheck", new Date().toISOString());
}

function applySavedDarkMode() {
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) {
document.body.classList.add('dark-mode');
document.querySelectorAll('.card, .modal-content').forEach(el => el.classList.add('dark-mode'));
document.querySelector('header').classList.add('dark-mode');
document.querySelector('footer').classList.add('dark-mode');
  }
}

window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  header.classList.toggle("sticky", window.scrollY > 50);
});

document.getElementById('likeButton').addEventListener('click', function () {
  const title = document.getElementById('modalTitle').innerText;
  updateLike(title);
});

document.getElementById('darkModeToggle').addEventListener('click', function () {
  const isDark = document.body.classList.toggle('dark-mode');
  document.querySelectorAll('.card, .modal-content').forEach(el => el.classList.toggle('dark-mode', isDark));
  document.querySelector('header').classList.toggle('dark-mode', isDark);
  document.querySelector('footer').classList.toggle('dark-mode', isDark);
  localStorage.setItem("darkMode", isDark);
});

document.addEventListener("DOMContentLoaded", () => {
  applySavedDarkMode();
  fetchPosts();
});
