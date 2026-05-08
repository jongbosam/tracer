const COLS = 10;
const ROWS = 5;
const CHARS_PER_PAGE = COLS * ROWS;

function processTextIntoPages(text) {
  const pages = [];
  let currentPageHolder = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '\n') {
      const currentLength = currentPageHolder.length;
      const remainder = currentLength % COLS;
      if (remainder !== 0 || currentLength === 0) {
        const padding = COLS - remainder;
        for (let p = 0; p < padding; p++) {
          currentPageHolder.push('');
        }
      }
    } else {
      currentPageHolder.push(char);
    }

    if (currentPageHolder.length >= CHARS_PER_PAGE) {
      pages.push([...currentPageHolder].slice(0, CHARS_PER_PAGE));
      currentPageHolder = [];
    }
  }

  if (currentPageHolder.length > 0) {
    while (currentPageHolder.length < CHARS_PER_PAGE) {
      currentPageHolder.push('');
    }
    pages.push([...currentPageHolder]);
  }

  return pages;
}

const text = "구름 한 조각\n하늘에 떠서\n조금씩만\n천천히 흘러요.\n\n구름이 가는 곳에\n아이들의 꿈이\n하나, 둘, 세 개\n닿아요.";
const pages = processTextIntoPages(text);
pages.forEach((p, i) => {
  console.log(`Page ${i + 1}:`);
  p.forEach((c, j) => {
    if (j % 10 === 0 && j > 0) process.stdout.write('\n');
    process.stdout.write(c === '' ? '_' : c);
  });
  console.log('\n');
});
