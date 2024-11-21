// JWT 토큰 관리
let token = localStorage.getItem('jwtToken');

// DOM 요소
const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const searchSection = document.getElementById('searchSection');

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const searchForm = document.getElementById('searchForm');
const logoutButton = document.getElementById('logoutButton');

// 페이지 전환 버튼
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');

// 초기 화면 로드
if (token) {
  showSearchPage();
} else {
  showLoginPage();
}

// 페이지 전환
showSignupLink.addEventListener('click', (e) => {
  e.preventDefault();
  showSignupPage();
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  showLoginPage();
});

// 회원가입 폼 이벤트
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('signupUsername').value;
  const password = document.getElementById('signupPassword').value;

  const response = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    alert('회원가입이 완료되었습니다. 로그인을 해주세요.');
    showLoginPage();
  } else {
    alert('회원가입 실패! 아이디가 이미 존재합니다.');
  }
});

// 로그인 폼 이벤트
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    const data = await response.json();
    token = data.token;
    localStorage.setItem('jwtToken', token);
    alert('로그인 성공!');
    showSearchPage();
  } else {
    alert('로그인 실패! 아이디와 비밀번호를 확인해주세요.');
  }
});

// 로그아웃 이벤트
logoutButton.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('jwtToken');
  alert('로그아웃 되었습니다.');
  showLoginPage();
});

// 검색 폼 이벤트
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const query = document.getElementById('query').value;

  const response = await fetch(`/api/search?query=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    const data = await response.json();
    displaySearchResults(data.books);
  } else {
    alert('검색에 실패했습니다. 다시 로그인해주세요.');
    showLoginPage();
  }
});

// 검색 결과 표시
function displaySearchResults(books) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  books.forEach((book) => {
    const card = document.createElement('div');
    card.className = 'book-card';

    const title = document.createElement('h3');
    title.textContent = book.title;

    const authors = document.createElement('p');
    authors.textContent = `저자: ${book.authors.join(', ')}`;

    card.appendChild(title);
    card.appendChild(authors);
    resultsDiv.appendChild(card);
  });
}

// 로그인 페이지 표시
function showLoginPage() {
  loginSection.style.display = 'block';
  signupSection.style.display = 'none';
  searchSection.style.display = 'none';
}

// 회원가입 페이지 표시
function showSignupPage() {
  loginSection.style.display = 'none';
  signupSection.style.display = 'block';
  searchSection.style.display = 'none';
}

// 검색 페이지 표시
function showSearchPage() {
  loginSection.style.display = 'none';
  signupSection.style.display = 'none';
  searchSection.style.display = 'block';
}
