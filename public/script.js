let token = localStorage.getItem('jwtToken');

// Sections
const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const searchSection = document.getElementById('searchSection');
const detailsSection = document.getElementById('detailsSection');

// Forms and buttons
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const searchForm = document.getElementById('searchForm');
const logoutButton = document.getElementById('logoutButton');
const backToSearch = document.getElementById('backToSearch');

const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');

// Initialize page
if (token) {
  showSearchPage();
} else {
  showLoginPage();
}

// Show login page
function showLoginPage() {
  loginSection.style.display = 'block';
  signupSection.style.display = 'none';
  searchSection.style.display = 'none';
  detailsSection.style.display = 'none';
}

// Show signup page
function showSignupPage() {
  loginSection.style.display = 'none';
  signupSection.style.display = 'block';
  searchSection.style.display = 'none';
  detailsSection.style.display = 'none';
}

// Show search page
function showSearchPage() {
  loginSection.style.display = 'none';
  signupSection.style.display = 'none';
  searchSection.style.display = 'block';
  detailsSection.style.display = 'none';
}

// Show details page
function showDetailsPage(book) {
  searchSection.style.display = 'none';
  detailsSection.style.display = 'block';

  // Populate book details
  document.getElementById('bookTitle').textContent = book.title || '제목 없음';
  document.getElementById('bookAuthors').textContent = `저자: ${book.authors.join(', ') || '저자 정보 없음'}`;
  document.getElementById('bookPublisher').textContent = `출판사: ${book.publisher || '출판사 정보 없음'}`;
  document.getElementById('bookDate').textContent = `출판일: ${
    book.datetime ? new Date(book.datetime).toLocaleDateString() : '출판일 정보 없음'
  }`;
  document.getElementById('bookDescription').textContent = book.contents || '설명이 없습니다.';

  const thumbnail = document.getElementById('bookThumbnail');
  if (book.thumbnail) {
    thumbnail.src = book.thumbnail;
    thumbnail.style.display = 'block';
  } else {
    thumbnail.style.display = 'none';
  }

  // Load comments for the book
  loadComments(book.id);

  // Add event listener for comment submission
  const commentForm = document.getElementById('commentForm');
  commentForm.onsubmit = (e) => {
    e.preventDefault();
    saveComment(book.id);
  };
}

// Back to search page
backToSearch.addEventListener('click', () => {
  showSearchPage();
});

// Event listeners
showSignupLink.addEventListener('click', (e) => {
  e.preventDefault();
  showSignupPage();
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  showLoginPage();
});

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

logoutButton.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('jwtToken');
  alert('로그아웃 되었습니다.');
  showLoginPage();
});

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const query = document.getElementById('query').value;

  try {
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
  } catch (err) {
    console.error('검색 오류:', err);
    alert('검색 중 오류가 발생했습니다.');
  }
});

function displaySearchResults(books) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  books.forEach((book) => {
    const card = document.createElement('div');
    card.className = 'book-card';

    const img = document.createElement('img');
    img.src = book.thumbnail;
    img.alt = book.title;

    const title = document.createElement('h3');
    title.textContent = book.title;

    const authors = document.createElement('p');
    authors.textContent = `저자: ${book.authors.join(', ')}`;

    const button = document.createElement('button');
    button.textContent = '상세보기';
    button.addEventListener('click', () => {
      showDetailsPage(book);
    });

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(authors);
    card.appendChild(button);
    resultsDiv.appendChild(card);
  });
}

// Load comments for a book
async function loadComments(bookId) {
  try {
    const response = await fetch(`/api/comments/${bookId}`);
    if (response.ok) {
      const comments = await response.json();
      const commentsDiv = document.getElementById('comments');
      commentsDiv.innerHTML = '';

      comments.forEach((comment) => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';

        const user = document.createElement('p');
        user.className = 'username';
        user.textContent = `작성자: ${comment.username}`;

        const content = document.createElement('p');
        content.className = 'content';
        content.textContent = comment.comment;

        const date = document.createElement('p');
        date.className = 'date';
        date.textContent = `작성일: ${new Date(comment.createdAt).toLocaleString()}`;

        commentDiv.appendChild(user);
        commentDiv.appendChild(content);
        commentDiv.appendChild(date);
        commentsDiv.appendChild(commentDiv);
      });
    }
  } catch (err) {
    console.error('댓글 로드 실패:', err);
  }
}

// Handle comment submission
async function saveComment(bookId) {
  const commentInput = document.getElementById('newComment');
  const comment = commentInput.value;

  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId, comment }),
    });

    if (response.ok) {
      commentInput.value = '';
      alert('댓글이 저장되었습니다.');
      loadComments(bookId);
    } else {
      alert('댓글 저장에 실패했습니다.');
    }
  } catch (err) {
    console.error('댓글 저장 실패:', err);
  }
}
