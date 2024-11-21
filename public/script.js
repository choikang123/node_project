// 검색 폼 제출 이벤트
document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('query').value;

  // API 요청
  const response = await fetch(`/api/search?query=${query}`);
  const data = await response.json();

  // 결과 표시
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = ''; // 기존 결과 초기화

  data.documents.forEach((book) => {
    // 카드 컨테이너 생성
    const card = document.createElement('div');
    card.className = 'book-card';

    // 책 이미지
    const img = document.createElement('img');
    img.src = book.thumbnail || 'https://via.placeholder.com/150';
    img.alt = book.title;

    // 책 제목
    const title = document.createElement('h3');
    title.textContent = book.title;

    // 책 저자
    const authors = document.createElement('p');
    authors.textContent = `By: ${book.authors.join(', ')}`;

    // 카드에 추가
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(authors);
    resultsDiv.appendChild(card);
  });
});
