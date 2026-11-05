const STORAGE_KEY = 'username-finder-settings-v1';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const CHARS = `${ALPHABET}0123456789_`;

const lengthRange = document.getElementById('length-range');
const lengthValue = document.getElementById('length-value');
const maskInput = document.getElementById('mask-input');
const resultsList = document.getElementById('results-list');
const emptyState = document.getElementById('empty-state');
const toast = document.getElementById('toast');
let toastTimer;
let state = { length: 8, count: 5, mask: '', results: [], filter: 'all', generation: 0 };

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (Number.isInteger(saved.length) && saved.length >= 5 && saved.length <= 15) state.length = saved.length;
    if ([1, 3, 5, 7, 10].includes(saved.count)) state.count = saved.count;
    if (typeof saved.mask === 'string') state.mask = saved.mask.slice(0, 15);
    if (Array.isArray(saved.results)) state.results = saved.results.filter((item) => item && typeof item.username === 'string' && typeof item.status === 'string').slice(0, 100);
    if (Number.isInteger(saved.generation)) state.generation = saved.generation;
  } catch { /* Ignore damaged local settings and use defaults. */ }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ length: state.length, count: state.count, mask: state.mask, results: state.results, generation: state.generation }));
  } catch { showToast('Не удалось сохранить настройки в браузере'); }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2300);
}

function syncControls() {
  lengthRange.value = String(state.length);
  lengthValue.textContent = String(state.length);
  maskInput.value = state.mask;
  document.querySelectorAll('[data-count]').forEach((button) => {
    const selected = Number(button.dataset.count) === state.count;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.getElementById('continue-button').disabled = state.results.length === 0;
  document.getElementById('regenerate-button').disabled = state.results.length === 0;
}

function validateMask(mask, length) {
  if (mask.length > 15 || mask.length > length) return 'Маска не может быть длиннее выбранной длины username.';
  if (mask && !/^[a-z?]/i.test(mask)) return 'Первый символ маски должен быть буквой или знаком ?.';
  if (!/^[a-zA-Z0-9_?]*$/.test(mask)) return 'Используйте только a–z, 0–9, _, и ?.';
  return '';
}

function generateUsername(mask, length) {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    const token = mask[index] || '?';
    if (token !== '?') {
      value += token.toLowerCase();
      continue;
    }
    const alphabet = index === 0 ? ALPHABET : CHARS;
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

function createCandidates() {
  const error = validateMask(state.mask, state.length);
  if (error) { showToast(error); maskInput.focus(); return null; }
  const unique = new Set();
  const maxAttempts = state.count * 50;
  let attempts = 0;
  while (unique.size < state.count && attempts < maxAttempts) {
    unique.add(generateUsername(state.mask, state.length));
    attempts += 1;
  }
  return Array.from(unique, (username) => ({ username, status: 'unknown', generation: state.generation + 1 }));
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function renderResults() {
  const counts = { free: 0, taken: 0, unknown: 0 };
  state.results.forEach((result) => { if (counts[result.status] !== undefined) counts[result.status] += 1; });
  document.getElementById('all-count').textContent = String(state.results.length);
  document.getElementById('free-count').textContent = String(counts.free);
  document.getElementById('taken-count').textContent = String(counts.taken);
  document.getElementById('unknown-count').textContent = String(counts.unknown);
  const filtered = state.filter === 'all' ? state.results : state.results.filter((result) => result.status === state.filter);
  emptyState.hidden = state.results.length !== 0;
  resultsList.querySelectorAll('.result-card').forEach((card) => card.remove());
  if (state.results.length) {
    document.getElementById('results-title').textContent = `${state.results.length} ${state.results.length === 1 ? 'вариант' : state.results.length < 5 ? 'варианта' : 'вариантов'} готово`;
    filtered.forEach((result) => {
      const card = document.createElement('article');
      card.className = 'result-card';
      const statusText = result.status === 'free' ? 'Свободен' : result.status === 'taken' ? 'Занят' : 'Не удалось проверить';
      card.innerHTML = `<div class="result-identity"><span class="result-avatar">@</span><div class="username-wrap"><strong>@${escapeHTML(result.username)}</strong><span>Telegram username</span></div></div><span class="result-status ${result.status}"><i></i>${statusText}</span><div class="result-actions"><button class="copy-button" type="button" data-copy="${escapeHTML(result.username)}" aria-label="Скопировать username" title="Скопировать">▢</button><a class="open-button" href="https://t.me/${encodeURIComponent(result.username)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть профиль" title="Открыть профиль">↗</a></div>`;
      resultsList.appendChild(card);
    });
    if (!filtered.length) {
      const noMatches = document.createElement('div');
      noMatches.className = 'filter-empty';
      noMatches.textContent = 'Для этой категории пока нет вариантов.';
      resultsList.appendChild(noMatches);
    }
  } else {
    document.getElementById('results-title').textContent = 'Готовы к генерации';
  }
  document.getElementById('continue-button').disabled = state.results.length === 0;
  document.getElementById('regenerate-button').disabled = state.results.length === 0;
}

function generate({ append = false } = {}) {
  const candidates = createCandidates();
  if (!candidates) return;
  state.generation += 1;
  const previous = append ? new Set(state.results.map((item) => item.username)) : new Set();
  const fresh = candidates.filter((item) => !previous.has(item.username));
  if (!fresh.length) { showToast('Получились те же варианты. Попробуйте другую маску или длину.'); return; }
  state.results = append ? [...fresh, ...state.results].slice(0, 100) : fresh;
  state.filter = 'all';
  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.filter === 'all';
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  document.getElementById('generation-note').textContent = `Поколение #${state.generation} · ${state.length} символов`;
  saveSettings();
  renderResults();
  showToast(append ? 'Добавили новые варианты' : 'Варианты сгенерированы');
}

document.getElementById('generate-button').addEventListener('click', () => generate());
document.getElementById('regenerate-button').addEventListener('click', () => generate());
document.getElementById('continue-button').addEventListener('click', () => generate({ append: true }));
lengthRange.addEventListener('input', () => {
  state.length = Number(lengthRange.value);
  lengthValue.textContent = String(state.length);
  if (state.mask.length > state.length) {
    state.mask = state.mask.slice(0, state.length);
    maskInput.value = state.mask;
  }
  saveSettings();
});
document.getElementById('count-choices').addEventListener('click', (event) => {
  const button = event.target.closest('[data-count]');
  if (!button) return;
  state.count = Number(button.dataset.count);
  syncControls();
  saveSettings();
});
maskInput.addEventListener('input', () => {
  const cleaned = maskInput.value.replace(/[^a-zA-Z0-9_?]/g, '').slice(0, 15);
  maskInput.value = cleaned;
  state.mask = cleaned;
  if (cleaned.length > state.length) {
    state.length = Math.min(15, cleaned.length);
    lengthRange.value = String(state.length);
    lengthValue.textContent = String(state.length);
  }
  saveSettings();
});
document.getElementById('clear-mask').addEventListener('click', () => {
  state.mask = '';
  maskInput.value = '';
  saveSettings();
  maskInput.focus();
});
document.querySelector('.result-tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-filter]');
  if (!tab) return;
  state.filter = tab.dataset.filter;
  document.querySelectorAll('.tab').forEach((item) => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  renderResults();
});
resultsList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  try {
    await navigator.clipboard.writeText(`@${button.dataset.copy}`);
    showToast(`@${button.dataset.copy} скопирован`);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = `@${button.dataset.copy}`;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    textArea.remove();
    showToast(copied ? `@${button.dataset.copy} скопирован` : 'Не удалось скопировать username');
  }
});

const helpDialog = document.getElementById('help-dialog');
document.getElementById('help-button').addEventListener('click', () => helpDialog.showModal());
document.getElementById('close-help').addEventListener('click', () => helpDialog.close());
helpDialog.addEventListener('click', (event) => { if (event.target === helpDialog) helpDialog.close(); });

loadSettings();
syncControls();
renderResults();
