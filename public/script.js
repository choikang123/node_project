document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const signupSection = document.getElementById('signupSection');
  const searchSection = document.getElementById('searchSection');
  const detailsSection = document.getElementById('detailsSection');
  const queryInput = document.getElementById('query');
  const resultsDiv = document.getElementById('results');
  const commentsDiv = document.getElementById('comments');
  const newCommentInput = document.getElementById('newComment');
  const bookTitle = document.getElementById('bookTitle');
  const bookAuthors = document.getElementById('bookAuthors');
  const bookPublisher = document.getElementById('bookPublisher');
  const bookDate = document.getElementById('bookDate');
  const bookDescription = document.getElementById('bookDescription');
  const bookThumbnail = document.getElementById('bookThumbnail');
  let authToken = null;
  let currentBookId = null;
  let booksCache = []; // 검색 결과 캐싱

  // Helper Functions
  function showSection(section) {
    [loginSection, signupSection, searchSection, detailsSection].forEach(s => s.style.display = 'none');
    section.style.display = 'block';
  }

  function clearForm(...inputs) {
    inputs.forEach(input => input.value = '');
  }

  // Event Listeners
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        authToken = data.token;
        clearForm(document.getElementById('loginUsername'), document.getElementById('loginPassword'));
        showSection(searchSection);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('로그인에 실패했습니다.');
    }
  });

  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        alert('회원가입 성공! 로그인해주세요.');
        clearForm(document.getElementById('signupUsername'), document.getElementById('signupPassword'));
        showSection(loginSection);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('회원가입에 실패했습니다.');
    }
  });

  document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = queryInput.value;

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        booksCache = data.books; // 검색 결과 캐싱
        resultsDiv.innerHTML = '';
        data.books.forEach(book => {
          const bookCard = document.createElement('div');
          bookCard.className = 'book-card';
          bookCard.innerHTML = `
            <h3>${book.title}</h3>
            <img src="${book.thumbnail}" alt="${book.title}">
            <p>${book.authors.join(', ')}</p>
            <button data-id="${book.id}" class="view-details">상세 보기</button>
          `;
          resultsDiv.appendChild(bookCard);
        });
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('검색에 실패했습니다.');
    }
  });

  document.getElementById('results').addEventListener('click', async (e) => {
    if (e.target.classList.contains('view-details')) {
      const bookId = e.target.dataset.id;
      currentBookId = bookId;

      // 도서 상세 정보 업데이트
      const bookData = booksCache.find(book => book.id === bookId);
      if (bookData) {
        bookTitle.textContent = bookData.title;
        bookAuthors.textContent = `저자: ${bookData.authors.join(', ')}`;
        bookPublisher.textContent = `출판사: ${bookData.publisher}`;
        bookDate.textContent = `출판일: ${new Date(bookData.datetime).toLocaleDateString()}`;
        bookDescription.textContent = bookData.contents;
        if (bookData.thumbnail) {
          bookThumbnail.src = bookData.thumbnail;
          bookThumbnail.style.display = 'block';
        } else {
          bookThumbnail.style.display = 'none';
        }
      }

      // 댓글 로드
      try {
        const response = await fetch(`/api/comments/${bookId}`);
        const comments = await response.json();
        if (response.ok) {
          commentsDiv.innerHTML = comments.map(comment => `
            <div class="comment">
              <p class="content">${comment.comment}</p>
              <p class="date">${new Date(comment.createdAt).toLocaleString()}</p>
            </div>
          `).join('');
          showSection(detailsSection);
        } else {
          alert('댓글을 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  });

  document.getElementById('commentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const comment = newCommentInput.value;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ bookId: currentBookId, comment })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        newCommentInput.value = '';
        document.querySelector(`button[data-id="${currentBookId}"]`).click(); // Reload comments
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  });

  document.getElementById('logoutButton').addEventListener('click', () => {
    authToken = null;
    showSection(loginSection);
  });

  document.getElementById('showSignup').addEventListener('click', () => showSection(signupSection));
  document.getElementById('showLogin').addEventListener('click', () => showSection(loginSection));
  document.getElementById('backToSearch').addEventListener('click', () => showSection(searchSection));
});
