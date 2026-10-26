/* ===================================================================
   LOGIC BÀI THI TRẮC NGHIỆM GDQP & AN LỚP 11 (TRẮNG ĐEN - TỐI GIẢN MOBILE)
   - Bỏ Bài 6: Còn lại 59 câu hỏi chuẩn xác (Bài 1, Bài 2, Bài 7)
   - Giữ nguyên thứ tự câu hỏi như file PDF
   - Xáo trộn đáp án A, B, C, D ngẫu nhiên cho từng câu
   - Đếm ngược 45:00, chấm điểm chi tiết và lọc xem câu sai
   =================================================================== */

const TOTAL_TIME_SECONDS = 45 * 60; // 45 phút = 2700 giây
let remainingSeconds = TOTAL_TIME_SECONDS;
let timerInterval = null;
let isSubmitted = false;

let activeQuizQuestions = [];
let userAnswers = {}; // { [qId]: optionIndex }
let flaggedQuestions = new Set(); // Set of qIds

// Thuật toán xáo trộn ngẫu nhiên Fisher-Yates
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Khởi tạo phiên làm bài
function initQuizSession() {
  clearInterval(timerInterval);
  isSubmitted = false;
  remainingSeconds = TOTAL_TIME_SECONDS;
  userAnswers = {};
  flaggedQuestions.clear();

  // Tạo danh sách câu hỏi: Thứ tự 1..59 giữ nguyên, chỉ xáo trộn ABCD
  activeQuizQuestions = QUIZ_QUESTIONS.map((q, index) => {
    const shuffledOptions = shuffleArray(q.options).map((opt, optIdx) => ({
      ...opt,
      letter: ['A', 'B', 'C', 'D'][optIdx]
    }));

    return {
      ...q,
      displayNumber: index + 1,
      shuffledOptions
    };
  });

  const resultBox = document.getElementById('resultBox');
  if (resultBox) resultBox.classList.remove('active');

  renderQuestions();
  renderPaletteGrid();
  updateProgress();
  startTimer();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Bắt đầu đếm ngược
function startTimer() {
  updateTimerUI();
  const badge = document.getElementById('timerBadge');

  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerUI();

      if (remainingSeconds <= 3 * 60) {
        badge.className = 'timer-badge danger';
      } else {
        badge.className = 'timer-badge';
      }
    } else {
      clearInterval(timerInterval);
      alert('Đã hết 45 phút! Hệ thống đang tự động nộp bài của bạn.');
      submitQuiz();
    }
  }, 1000);
}

function updateTimerUI() {
  const display = document.getElementById('timerDisplay');
  if (!display) return;
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Render câu hỏi ra màn hình
function renderQuestions() {
  const container = document.getElementById('questionsFeed');
  if (!container) return;
  container.innerHTML = '';

  let currentLesson = '';

  activeQuizQuestions.forEach((q) => {
    if (q.lesson !== currentLesson) {
      currentLesson = q.lesson;
      const lessonDiv = document.createElement('div');
      lessonDiv.className = 'lesson-header';
      lessonDiv.textContent = currentLesson;
      container.appendChild(lessonDiv);
    }

    const card = document.createElement('div');
    card.className = `question-card ${userAnswers[q.id] !== undefined ? 'answered' : ''}`;
    card.id = `q-${q.id}`;
    card.setAttribute('data-qid', q.id);

    // Dòng thông tin trên cùng của câu hỏi
    const topRow = document.createElement('div');
    topRow.className = 'q-top-row';
    topRow.innerHTML = `
      <div class="q-badge">Câu ${q.displayNumber} / ${activeQuizQuestions.length}</div>
      <div style="display:flex; align-items:center; gap:0.4rem;">
        <span class="status-placeholder" id="badge-${q.id}"></span>
        <button type="button" class="q-flag-btn ${flaggedQuestions.has(q.id) ? 'active' : ''}" onclick="toggleFlag(${q.id})">
          ${flaggedQuestions.has(q.id) ? '🚩 Đã cắm cờ' : '🏳️ Cắm cờ'}
        </button>
      </div>
    `;
    card.appendChild(topRow);

    // Nội dung câu hỏi
    const qContent = document.createElement('div');
    qContent.className = 'q-content';
    qContent.textContent = q.question;
    card.appendChild(qContent);

    // 4 đáp án
    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'options-wrap';

    q.shuffledOptions.forEach((opt, optIdx) => {
      const isSelected = userAnswers[q.id] === optIdx;
      const box = document.createElement('div');
      box.className = `opt-box ${isSelected ? 'selected' : ''}`;
      box.onclick = () => selectOption(q.id, optIdx);

      box.innerHTML = `
        <div class="opt-letter">${opt.letter}</div>
        <div class="opt-text">${opt.text}</div>
      `;
      optionsWrap.appendChild(box);
    });

    card.appendChild(optionsWrap);
    container.appendChild(card);
  });
}

// Chọn đáp án
function selectOption(qId, optIdx) {
  if (isSubmitted) return;

  userAnswers[qId] = optIdx;

  const card = document.getElementById(`q-${qId}`);
  if (card) {
    card.classList.add('answered');
    const boxes = card.querySelectorAll('.opt-box');
    boxes.forEach((b, idx) => {
      b.classList.toggle('selected', idx === optIdx);
    });
  }

  updateGridButton(qId);
  updateProgress();
}

// Cắm cờ câu hỏi
function toggleFlag(qId) {
  if (flaggedQuestions.has(qId)) {
    flaggedQuestions.delete(qId);
  } else {
    flaggedQuestions.add(qId);
  }

  const card = document.getElementById(`q-${qId}`);
  if (card) {
    const btn = card.querySelector('.q-flag-btn');
    if (btn) {
      const isF = flaggedQuestions.has(qId);
      btn.classList.toggle('active', isF);
      btn.textContent = isF ? '🚩 Đã cắm cờ' : '🏳️ Cắm cờ';
    }
  }

  updateGridButton(qId);
}

// Render lưới câu hỏi trong drawer
function renderPaletteGrid() {
  const grid = document.getElementById('paletteGrid');
  if (!grid) return;
  grid.innerHTML = '';

  activeQuizQuestions.forEach((q) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grid-num-btn';
    btn.id = `grid-btn-${q.id}`;
    btn.textContent = q.displayNumber;
    btn.onclick = () => {
      scrollToQuestion(q.id);
      toggleDrawer(false);
    };
    grid.appendChild(btn);
  });
}

function updateGridButton(qId) {
  const btn = document.getElementById(`grid-btn-${qId}`);
  if (!btn) return;
  btn.classList.toggle('done', userAnswers[qId] !== undefined);
  btn.classList.toggle('flagged', flaggedQuestions.has(qId));
}

function updateProgress() {
  const total = activeQuizQuestions.length;
  const done = Object.keys(userAnswers).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const text = document.getElementById('progressText');
  const fill = document.getElementById('progressFill');

  if (text) text.textContent = `${done}/${total} câu (${percent}%)`;
  if (fill) fill.style.width = `${percent}%`;

  const btnBottom = document.getElementById('btnBottomCounter');
  if (btnBottom) btnBottom.textContent = `📋 Câu hỏi (${done}/${total})`;
}

function scrollToQuestion(qId) {
  const card = document.getElementById(`q-${qId}`);
  if (card) {
    const headerHeight = 65;
    const y = card.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

// Mở / Đóng Drawer danh sách câu hỏi
function toggleDrawer(forceState) {
  const drawer = document.getElementById('paletteDrawer');
  const overlay = document.getElementById('drawerOverlay');

  const willOpen = forceState !== undefined ? forceState : !drawer.classList.contains('active');

  drawer.classList.toggle('active', willOpen);
  overlay.classList.toggle('active', willOpen);
}

// Modal nộp bài
function openSubmitModal() {
  if (isSubmitted) return;

  const total = activeQuizQuestions.length;
  const done = Object.keys(userAnswers).length;
  const left = total - done;

  const msg = document.getElementById('submitModalMsg');
  if (left > 0) {
    msg.innerHTML = `Bạn đã làm <strong>${done}/${total}</strong> câu. Còn <strong>${left}</strong> câu chưa chọn đáp án.<br>Bạn có chắc muốn nộp bài không?`;
  } else {
    msg.innerHTML = `Bạn đã làm xong toàn bộ <strong>${done}/${total}</strong> câu!<br>Xác nhận nộp bài để xem điểm và các câu sai?`;
  }

  document.getElementById('confirmModal').classList.add('active');
}

function closeSubmitModal() {
  document.getElementById('confirmModal').classList.remove('active');
}

// Chấm điểm và nộp bài
function submitQuiz() {
  closeSubmitModal();
  isSubmitted = true;
  clearInterval(timerInterval);

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const timeUsedSeconds = TOTAL_TIME_SECONDS - remainingSeconds;
  const m = Math.floor(timeUsedSeconds / 60);
  const s = timeUsedSeconds % 60;
  const timeFormatted = `${m}p ${s}s`;

  activeQuizQuestions.forEach((q) => {
    const userChoice = userAnswers[q.id];
    const card = document.getElementById(`q-${q.id}`);
    const badgePlaceholder = document.getElementById(`badge-${q.id}`);
    const gridBtn = document.getElementById(`grid-btn-${q.id}`);
    const optBoxes = card.querySelectorAll('.opt-box');

    if (userChoice === undefined) {
      unansweredCount++;
      card.className = 'question-card res-wrong';
      card.setAttribute('data-res', 'unanswered');
      if (badgePlaceholder) badgePlaceholder.innerHTML = '<span class="status-badge unanswered">Chưa làm</span>';
      if (gridBtn) gridBtn.className = 'grid-num-btn res-wrong';

      // Tô xanh đáp án đúng
      q.shuffledOptions.forEach((opt, idx) => {
        if (opt.isCorrect) optBoxes[idx].classList.add('is-correct');
      });
    } else {
      const isCorrect = q.shuffledOptions[userChoice].isCorrect;
      if (isCorrect) {
        correctCount++;
        card.className = 'question-card res-correct';
        card.setAttribute('data-res', 'correct');
        if (badgePlaceholder) badgePlaceholder.innerHTML = '<span class="status-badge correct">✓ Đúng</span>';
        if (gridBtn) gridBtn.className = 'grid-num-btn res-correct';
        optBoxes[userChoice].classList.add('is-correct');
      } else {
        wrongCount++;
        card.className = 'question-card res-wrong';
        card.setAttribute('data-res', 'wrong');
        if (badgePlaceholder) badgePlaceholder.innerHTML = '<span class="status-badge wrong">✗ Sai</span>';
        if (gridBtn) gridBtn.className = 'grid-num-btn res-wrong';

        optBoxes[userChoice].classList.add('is-wrong');
        // Tô xanh đáp án đúng để học sinh biết
        q.shuffledOptions.forEach((opt, idx) => {
          if (opt.isCorrect) optBoxes[idx].classList.add('is-correct');
        });
      }
    }
  });

  const total = activeQuizQuestions.length;
  const score10 = ((correctCount / total) * 10).toFixed(2);

  let remark = '';
  if (score10 >= 9.0) remark = 'Xuất sắc! Bạn nắm rất vững kiến thức.';
  else if (score10 >= 8.0) remark = 'Giỏi! Kết quả ôn tập rất tốt.';
  else if (score10 >= 6.5) remark = 'Khá! Hãy xem lại các câu bị sai.';
  else if (score10 >= 5.0) remark = 'Đạt! Cần ôn luyện kỹ hơn.';
  else remark = 'Cần cố gắng nhiều hơn! Hãy làm lại bài để cải thiện.';

  const resultBox = document.getElementById('resultBox');
  resultBox.innerHTML = `
    <div class="result-score">${score10} <span style="font-size:1.4rem; font-weight:700;">/ 10</span></div>
    <div class="result-remark">${remark}</div>

    <div class="result-stats-row">
      <div class="res-item correct">
        <div class="res-val">${correctCount}</div>
        <div class="res-lbl">Số câu đúng</div>
      </div>
      <div class="res-item wrong">
        <div class="res-val">${wrongCount}</div>
        <div class="res-lbl">Số câu sai</div>
      </div>
      <div class="res-item">
        <div class="res-val">${unansweredCount}</div>
        <div class="res-lbl">Chưa làm</div>
      </div>
      <div class="res-item">
        <div class="res-val" style="font-size:1rem; padding-top:4px;">${timeFormatted}</div>
        <div class="res-lbl">Thời gian</div>
      </div>
    </div>

    <div>
      <button type="button" class="btn btn-black" onclick="initQuizSession()" style="width:100%; padding:0.75rem; font-size:1rem;">
        🔄 Làm lại đề thi (Tráo mới đáp án)
      </button>
    </div>

    <div class="filter-tabs">
      <button type="button" class="filter-btn active" onclick="applyFilter('all', this)">
        Tất cả (${total})
      </button>
      <button type="button" class="filter-btn" onclick="applyFilter('wrong', this)">
        ✗ Chỉ xem câu sai (${wrongCount})
      </button>
      <button type="button" class="filter-btn" onclick="applyFilter('correct', this)">
        ✓ Xem câu đúng (${correctCount})
      </button>
      <button type="button" class="filter-btn" onclick="applyFilter('unanswered', this)">
        Chưa làm (${unansweredCount})
      </button>
    </div>
  `;

  resultBox.classList.add('active');

  // Đổi nút nộp bài thành nút làm lại
  const topSubmit = document.getElementById('topSubmitBtn');
  if (topSubmit) {
    topSubmit.textContent = '🔄 Làm lại';
    topSubmit.onclick = initQuizSession;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Lọc câu hỏi sau nộp
function applyFilter(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  activeQuizQuestions.forEach(q => {
    const card = document.getElementById(`q-${q.id}`);
    if (!card) return;
    const res = card.getAttribute('data-res');

    if (type === 'all') {
      card.style.display = 'block';
    } else if (type === 'wrong') {
      card.style.display = res === 'wrong' ? 'block' : 'none';
    } else if (type === 'correct') {
      card.style.display = res === 'correct' ? 'block' : 'none';
    } else if (type === 'unanswered') {
      card.style.display = res === 'unanswered' ? 'block' : 'none';
    }
  });
}

function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  document.getElementById('themeBtn').textContent = newTheme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('minimal-theme', newTheme);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('minimal-theme') || 'light';
  document.body.setAttribute('data-theme', saved);
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.textContent = saved === 'dark' ? '☀️' : '🌙';

  initQuizSession();
});
