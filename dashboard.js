// =============================================
// StudyNest — dashboard.js
// Handles all 6 dashboard features
// =============================================

// ===== STATE (saved to localStorage) =====
let state = JSON.parse(localStorage.getItem('studynest_state') || 'null') || {
  tasks: [],
  notes: [],
  flashcards: [],
  pomodoroSessions: 0,
  cardsCorrect: 0,
  cardsReviewed: 0,
  streak: 0,
  lastStudied: null,
  tasksDone: 0,
  theme: 'dark',
};

function saveState() {
  localStorage.setItem('studynest_state', JSON.stringify(state));
}

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('theme-toggle');
document.documentElement.setAttribute('data-theme', state.theme);
themeToggle.textContent = state.theme === 'dark' ? '🌙' : '☀️';

themeToggle.addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  themeToggle.textContent = state.theme === 'dark' ? '🌙' : '☀️';
  saveState();
});

// ===== PANEL NAVIGATION =====
function switchPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  document.querySelector(`[data-panel="${name}"]`).classList.add('active');
  if (name === 'progress') updateProgress();
  if (name === 'overview') updateOverviewStats();
}

document.querySelectorAll('.dash-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});

// =============================================
// POMODORO TIMER
// =============================================
let pomoInterval = null;
let pomoRunning = false;
let pomoSecondsLeft = 25 * 60;
let pomoTotalSeconds = 25 * 60;

const pomoDisplay = document.getElementById('pomo-display');
const pomoRing = document.getElementById('pomo-ring');
const pomoStart = document.getElementById('pomo-start');
const pomoReset = document.getElementById('pomo-reset');
const pomoCount = document.getElementById('pomo-count');
const circumference = 2 * Math.PI * 90; // r=90

function updatePomoDisplay() {
  const mins = Math.floor(pomoSecondsLeft / 60).toString().padStart(2, '0');
  const secs = (pomoSecondsLeft % 60).toString().padStart(2, '0');
  pomoDisplay.textContent = `${mins}:${secs}`;

  const progress = pomoSecondsLeft / pomoTotalSeconds;
  pomoRing.style.strokeDashoffset = circumference * (1 - progress);
  pomoRing.style.strokeDasharray = circumference;
}

document.querySelectorAll('.pomo-mode').forEach(btn => {
  btn.addEventListener('click', () => {
    if (pomoRunning) return;
    document.querySelectorAll('.pomo-mode').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pomoSecondsLeft = parseInt(btn.dataset.mins) * 60;
    pomoTotalSeconds = pomoSecondsLeft;
    updatePomoDisplay();
  });
});

pomoStart.addEventListener('click', () => {
  if (!pomoRunning) {
    pomoRunning = true;
    pomoStart.textContent = '⏸ Pause';
    pomoInterval = setInterval(() => {
      pomoSecondsLeft--;
      updatePomoDisplay();
      if (pomoSecondsLeft <= 0) {
        clearInterval(pomoInterval);
        pomoRunning = false;
        pomoStart.textContent = '▶ Start';
        state.pomodoroSessions++;
        state.tasksDone = state.tasks.filter(t => t.done).length;
        saveState();
        pomoCount.textContent = state.pomodoroSessions;
        alert('🍅 Pomodoro complete! Time for a break.');
      }
    }, 1000);
  } else {
    clearInterval(pomoInterval);
    pomoRunning = false;
    pomoStart.textContent = '▶ Start';
  }
});

pomoReset.addEventListener('click', () => {
  clearInterval(pomoInterval);
  pomoRunning = false;
  pomoStart.textContent = '▶ Start';
  const activeMins = parseInt(document.querySelector('.pomo-mode.active').dataset.mins);
  pomoSecondsLeft = activeMins * 60;
  pomoTotalSeconds = pomoSecondsLeft;
  updatePomoDisplay();
});

pomoCount.textContent = state.pomodoroSessions;
updatePomoDisplay();

// =============================================
// TO-DO LIST
// =============================================
let todoFilter = 'all';

function renderTasks() {
  const list = document.getElementById('todo-list');
  const empty = document.getElementById('todo-empty');
  list.innerHTML = '';

  const filtered = state.tasks.filter(t => {
    if (todoFilter === 'active') return !t.done;
    if (todoFilter === 'done') return t.done;
    return true;
  });

  empty.style.display = filtered.length === 0 ? 'block' : 'none';

  filtered.forEach((task, i) => {
    const realIndex = state.tasks.indexOf(task);
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' done' : '');
    li.innerHTML = `
      <button class="todo-check ${task.done ? 'checked' : ''}" data-i="${realIndex}">${task.done ? '✓' : ''}</button>
      <span class="todo-text">${task.text}</span>
      <span class="todo-priority priority-${task.priority}">${task.priority}</span>
      <button class="todo-delete" data-i="${realIndex}">✕</button>`;
    list.appendChild(li);
  });

  list.querySelectorAll('.todo-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i);
      state.tasks[i].done = !state.tasks[i].done;
      state.tasksDone = state.tasks.filter(t => t.done).length;
      saveState(); renderTasks(); updateOverviewStats(); checkAchievements();
    });
  });

  list.querySelectorAll('.todo-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tasks.splice(parseInt(btn.dataset.i), 1);
      saveState(); renderTasks(); updateOverviewStats();
    });
  });
}

document.getElementById('add-task-btn').addEventListener('click', () => {
  const input = document.getElementById('task-input');
  const priority = document.getElementById('task-priority').value;
  const text = input.value.trim();
  if (!text) return;
  state.tasks.unshift({ text, priority, done: false, id: Date.now() });
  input.value = '';
  saveState(); renderTasks(); updateOverviewStats();
});

document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('add-task-btn').click();
});

document.querySelectorAll('.filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    todoFilter = btn.dataset.filter;
    renderTasks();
  });
});

renderTasks();

// =============================================
// NOTES
// =============================================
function renderNotes(query = '') {
  const grid = document.getElementById('notes-grid');
  const empty = document.getElementById('notes-empty');
  grid.innerHTML = '';

  const filtered = query
    ? state.notes.filter(n => n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query))
    : state.notes;

  empty.style.display = filtered.length === 0 ? 'block' : 'none';

  filtered.forEach((note, i) => {
    const realIndex = state.notes.indexOf(note);
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <button class="note-delete" data-i="${realIndex}">✕</button>
      <div class="note-card-title">${note.title || 'Untitled'}</div>
      <div class="note-card-body">${note.body}</div>
      <div class="note-card-date">${note.date}</div>`;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.note-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      state.notes.splice(parseInt(btn.dataset.i), 1);
      saveState(); renderNotes(); updateOverviewStats();
    });
  });
}

document.getElementById('save-note-btn').addEventListener('click', () => {
  const title = document.getElementById('note-title').value.trim();
  const body = document.getElementById('note-body').value.trim();
  if (!body) return;
  const now = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  state.notes.unshift({ title, body, date: now });
  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value = '';
  saveState(); renderNotes(); updateOverviewStats(); checkAchievements();
});

document.getElementById('notes-search').addEventListener('input', function () {
  renderNotes(this.value.toLowerCase().trim());
});

renderNotes();

// =============================================
// FLASHCARDS
// =============================================
let flashIndex = 0;
let flashScore = { right: 0, total: 0 };

function renderFlashCard() {
  const cards = state.flashcards;
  const front = document.getElementById('flash-front-display');
  const back = document.getElementById('flash-back-display');
  const counter = document.getElementById('flash-counter');
  const card = document.getElementById('flash-card');

  card.classList.remove('flipped');

  if (cards.length === 0) {
    front.textContent = 'Add cards to start!';
    back.textContent = '';
    counter.textContent = '0 / 0';
    return;
  }

  front.textContent = cards[flashIndex].front;
  back.textContent = cards[flashIndex].back;
  counter.textContent = `${flashIndex + 1} / ${cards.length}`;
}

document.getElementById('flash-card-wrap').addEventListener('click', () => {
  document.getElementById('flash-card').classList.toggle('flipped');
});

document.getElementById('add-card-btn').addEventListener('click', () => {
  const front = document.getElementById('flash-front').value.trim();
  const back = document.getElementById('flash-back').value.trim();
  if (!front || !back) return;
  state.flashcards.push({ front, back });
  document.getElementById('flash-front').value = '';
  document.getElementById('flash-back').value = '';
  saveState();
  flashIndex = state.flashcards.length - 1;
  renderFlashCard();
});

document.getElementById('flash-next').addEventListener('click', () => {
  if (state.flashcards.length === 0) return;
  flashIndex = (flashIndex + 1) % state.flashcards.length;
  renderFlashCard();
});

document.getElementById('flash-prev').addEventListener('click', () => {
  if (state.flashcards.length === 0) return;
  flashIndex = (flashIndex - 1 + state.flashcards.length) % state.flashcards.length;
  renderFlashCard();
});

document.getElementById('flash-right').addEventListener('click', () => {
  if (state.flashcards.length === 0) return;
  flashScore.right++;
  flashScore.total++;
  state.cardsCorrect++;
  state.cardsReviewed++;
  saveState();
  updateFlashScore();
  checkAchievements();
  document.getElementById('flash-next').click();
});

document.getElementById('flash-wrong').addEventListener('click', () => {
  if (state.flashcards.length === 0) return;
  flashScore.total++;
  state.cardsReviewed++;
  saveState();
  updateFlashScore();
  document.getElementById('flash-next').click();
});

function updateFlashScore() {
  document.getElementById('flash-score-display').textContent = `${flashScore.right} / ${flashScore.total}`;
  updateOverviewStats();
}

renderFlashCard();

// =============================================
// PROGRESS TRACKER
// =============================================
function updateProgress() {
  const done = state.tasks.filter(t => t.done).length;
  document.getElementById('prog-tasks').textContent = done;
  document.getElementById('prog-sessions').textContent = state.pomodoroSessions;
  document.getElementById('prog-cards-right').textContent = state.cardsCorrect;
  document.getElementById('prog-notes-count').textContent = state.notes.length;

  // Progress bars (max values for visual scale)
  setBar('prog-bar-tasks', done, 20);
  setBar('prog-bar-sessions', state.pomodoroSessions, 10);
  setBar('prog-bar-cards', state.cardsCorrect, 20);
  setBar('prog-bar-notes', state.notes.length, 10);

  document.getElementById('streak-display').textContent = `${state.streak} day${state.streak !== 1 ? 's' : ''}`;
  checkAchievements();
}

function setBar(id, val, max) {
  const pct = Math.min((val / max) * 100, 100);
  document.getElementById(id).style.width = pct + '%';
}

// Streak
document.getElementById('log-today-btn').addEventListener('click', () => {
  const today = new Date().toDateString();
  if (state.lastStudied === today) {
    alert('✅ Already marked today as studied!');
    return;
  }
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  state.streak = state.lastStudied === yesterday ? state.streak + 1 : 1;
  state.lastStudied = today;
  saveState();
  updateProgress();
  checkAchievements();
  alert(`🔥 Streak updated! ${state.streak} day${state.streak !== 1 ? 's' : ''} and counting!`);
});

// Achievements
function checkAchievements() {
  const done = state.tasks.filter(t => t.done).length;

  const rules = [
    { id: 'ach-1', check: state.pomodoroSessions >= 1 },
    { id: 'ach-2', check: done >= 5 },
    { id: 'ach-3', check: state.cardsCorrect >= 10 },
    { id: 'ach-4', check: state.notes.length >= 3 },
    { id: 'ach-5', check: state.streak >= 3 },
  ];

  rules.forEach(r => {
    const el = document.getElementById(r.id);
    if (r.check) {
      el.classList.remove('locked');
      el.classList.add('unlocked');
    }
  });
}

// =============================================
// OVERVIEW STATS
// =============================================
function updateOverviewStats() {
  const done = state.tasks.filter(t => t.done).length;
  document.getElementById('qs-tasks').textContent = done;
  document.getElementById('qs-sessions').textContent = state.pomodoroSessions;
  document.getElementById('qs-cards').textContent = state.cardsReviewed;
  document.getElementById('qs-notes').textContent = state.notes.length;
}

// ===== INIT =====
updateOverviewStats();
checkAchievements();