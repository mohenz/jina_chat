/**
 * jian_chat Microsoft Teams Client Application
 * Features: Teams UI, Splash/PIN lock, Persona Profile, Settings, Stickers, Reactions, TTS Voice, Daily Photo
 */

const AVATAR_URL = 'assets/img/jian_avatar.jpg?v=7';
const GALLERY_PHOTOS = [
  'assets/img/gallery/body_1.png?v=3',
  'assets/img/gallery/body_2.png?v=3',
  'assets/img/gallery/body_3.png?v=3',
  'assets/img/gallery/jian_daily_01.png',
  'assets/img/gallery/jian_daily_02.png',
  'assets/img/gallery/jian_daily_03.png',
  'assets/img/gallery/jian_daily_04.png',
  'assets/img/gallery/jian_daily_05.png',
  'assets/img/gallery/jian_daily_06.png',
  'assets/img/gallery/jian_daily_07.png',
  'assets/img/gallery/jian_daily_08.png',
  'assets/img/gallery/jian_daily_09.png'
];
const GALLERY_STORAGE_KEY = 'jian_gallery_deleted';
const GALLERY_DB_NAME = 'jian-chat-gallery';
const GALLERY_DB_STORE = 'photos';
const galleryObjectUrls = new Map();
let galleryPhotoSources = [...GALLERY_PHOTOS];
const TURNAROUND_VIEWS = [
  { src: 'assets/img/turnaround/jian_turn_01.png', label: '정면', alt: '지안 정면 전신' },
  { src: 'assets/img/turnaround/jian_turn_02.png', label: '왼쪽 옆면', alt: '지안 왼쪽 옆면 전신' },
  { src: 'assets/img/turnaround/jian_turn_03.png', label: '뒷면', alt: '지안 뒷면 전신' },
  { src: 'assets/img/turnaround/jian_turn_04.png', label: '오른쪽 옆면', alt: '지안 오른쪽 옆면 전신' }
];
const WEATHER_CITIES = {
  seoul: { name: '서울', latitude: 37.5665, longitude: 126.9780 },
  busan: { name: '부산', latitude: 35.1796, longitude: 129.0756 },
  incheon: { name: '인천', latitude: 37.4563, longitude: 126.7052 },
  daegu: { name: '대구', latitude: 35.8714, longitude: 128.6014 },
  daejeon: { name: '대전', latitude: 36.3504, longitude: 127.3845 },
  gwangju: { name: '광주', latitude: 35.1595, longitude: 126.8526 },
  ulsan: { name: '울산', latitude: 35.5384, longitude: 129.3114 },
  sejong: { name: '세종', latitude: 36.4800, longitude: 127.2890 },
  jeju: { name: '제주', latitude: 33.4996, longitude: 126.5312 },
  gangneung: { name: '강릉', latitude: 37.7519, longitude: 128.8761 }
};
let turnaroundIndex = 0;

// App State
let isSending = false;
let currentMessages = [];
let userTone = localStorage.getItem('jian_tone') || 'daily';
let userTheme = localStorage.getItem('jian_theme') || 'system';
let userFontSize = localStorage.getItem('jian_font_size') || 'normal';
let pinEnabled = localStorage.getItem('jian_pin_enabled') === 'true';
let autoVoice = localStorage.getItem('jian_auto_voice') === 'true';
let userVoice = localStorage.getItem('jian_voice') || 'sunhi-natural';
let currentAudio = null;
let enteredPin = '';
const DEFAULT_PIN = '1234';

// DOM Elements
const dom = {
  chatStream: document.getElementById('chat-stream'),
  messageInput: document.getElementById('message-input'),
  sendBtn: document.getElementById('send-btn'),
  typingIndicator: document.getElementById('typing-indicator'),
  
  // Splash & PIN
  splashScreen: document.getElementById('splash-screen'),
  splashGreeting: document.getElementById('splash-greeting'),
  splashPinContainer: document.getElementById('splash-pin-container'),
  splashEnterBtn: document.getElementById('splash-enter-btn'),
  pinDots: document.querySelectorAll('.pin-dot'),
  pinBtns: document.querySelectorAll('.pin-btn'),

  // Header & Modals
  headerAvatarTrigger: document.getElementById('header-avatar-trigger'),
  headerNameTrigger: document.getElementById('header-name-trigger'),
  btnVideoCall: document.getElementById('btn-video-call'),
  btnHeaderBack: document.getElementById('btn-header-back'),
  btnVoiceCall: document.getElementById('btn-voice-call'),
  btnSettings: document.getElementById('btn-settings'),

  // Profile Modal
  profileModal: document.getElementById('profile-modal'),
  profileBackdrop: document.getElementById('profile-backdrop'),
  profileCloseBtn: document.getElementById('profile-close-btn'),
  profileAvatarZoomTrigger: document.getElementById('profile-avatar-zoom-trigger'),
  btnVoiceIntro: document.getElementById('btn-voice-intro'),
  profileDdayCount: document.getElementById('profile-dday-count'),
  galleryGrid: document.getElementById('gallery-grid'),
  galleryAddBtn: document.getElementById('gallery-add-btn'),
  galleryFileInput: document.getElementById('gallery-file-input'),

  // Settings Modal
  settingsModal: document.getElementById('settings-modal'),
  settingsBackdrop: document.getElementById('settings-backdrop'),
  settingsCloseBtn: document.getElementById('settings-close-btn'),
  themeBtns: document.querySelectorAll('.theme-btn'),
  fontBtns: document.querySelectorAll('.font-btn'),
  toneCards: document.querySelectorAll('.tone-card'),
  voiceCards: document.querySelectorAll('.voice-card'),
  btnPreviewVoice: document.getElementById('btn-preview-voice'),
  togglePinLock: document.getElementById('toggle-pin-lock'),
  btnExportChat: document.getElementById('btn-export-chat'),
  btnRefreshChat: document.getElementById('btn-refresh-chat'),

  // Emoji Picker & Attach
  btnOpenEmoji: document.getElementById('btn-open-emoji'),
  emojiTray: document.getElementById('emoji-tray'),
  emojiTrayClose: document.getElementById('emoji-tray-close'),
  emojiTabs: document.querySelectorAll('.emoji-tab'),
  emojiPanels: document.querySelectorAll('.emoji-category-panel'),
  emojiItems: document.querySelectorAll('.emoji-item'),
  btnOpenAttach: document.getElementById('btn-open-attach'),
  attachSheet: document.getElementById('attach-sheet'),
  attachBackdrop: document.getElementById('attach-backdrop'),
  btnRequestPhoto: document.getElementById('btn-request-photo'),
  btnSheetExport: document.getElementById('btn-sheet-export'),
  btnSheetCancel: document.getElementById('btn-sheet-cancel'),
  btnVoiceToggle: document.getElementById('btn-voice-toggle'),

  // Lightbox
  imageLightbox: document.getElementById('image-lightbox'),
  lightboxImg: document.getElementById('lightbox-img'),
  lightboxClose: document.getElementById('lightbox-close'),
  weatherScreen: document.getElementById('weather-screen'),
  weatherBackBtn: document.getElementById('weather-back-btn'),
  weatherRefreshBtn: document.getElementById('weather-refresh-btn'),
  weatherCitySelect: document.getElementById('weather-city-select'),
  weatherLocationBtn: document.getElementById('weather-location-btn'),
  weatherDate: document.getElementById('weather-date'),
  weatherPlace: document.getElementById('weather-place'),
  weatherGreeting: document.getElementById('weather-greeting'),
  weatherDescription: document.getElementById('weather-description'),
  weatherTemperature: document.getElementById('weather-temperature'),
  weatherCondition: document.getElementById('weather-condition'),
  weatherLow: document.getElementById('weather-low'),
  weatherHigh: document.getElementById('weather-high'),
  weatherRain: document.getElementById('weather-rain'),
  weatherOutfitNote: document.getElementById('weather-outfit-note'),
  weatherImage: document.getElementById('weather-image'),
  weatherImageCaption: document.getElementById('weather-image-caption'),
  weatherUpdatedAt: document.getElementById('weather-updated-at'),
  weatherChatReturn: document.getElementById('weather-chat-return'),
};

/* ========================================================
   Helpers
   ======================================================== */

function formatDatePill(isoString) {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(d);
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(d);
}

function scrollToBottom(smooth = true) {
  dom.chatStream.scrollTo({
    top: dom.chatStream.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ========================================================
   Voice / TTS Synthesis
   ======================================================== */

async function speakText(text, btnElement = null) {
  // 이전 오디오 및 발화 정지
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  if (btnElement) btnElement.classList.add('speaking');

  const onStop = () => {
    if (btnElement) btnElement.classList.remove('speaking');
    currentAudio = null;
  };

  // 이모지 및 마크다운 기호 제거
  const clean = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu, '')
    .replace(/[*_#`~]/g, '')
    .trim();

  if (!clean) {
    onStop();
    return;
  }

  // 1. Cloud Edge Neural TTS 우선 사용 (선택 모드가 browser-native가 아닌 경우)
  if (userVoice !== 'browser-native') {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice: userVoice })
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        currentAudio = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          onStop();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          onStop();
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('[Cloud TTS 실패, 브라우저 로컬 음성으로 폴백]:', err);
    }
  }

  // 2. 브라우저 Web Speech API 폴백
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'ko-KR';
    utter.rate = userVoice === 'sunhi-calm' ? 0.9 : 0.95;
    utter.pitch = userVoice === 'sunhi-calm' ? 0.95 : 1.05;

    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find(v => v.lang.startsWith('ko') && (v.name.includes('Yuna') || v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Korean')));
    if (koVoice) utter.voice = koVoice;

    utter.onend = onStop;
    utter.onerror = onStop;
    window.speechSynthesis.speak(utter);
  } else {
    onStop();
  }
}

/* ========================================================
   Theme & Font Size
   ======================================================== */

function applyTheme(theme) {
  userTheme = theme;
  localStorage.setItem('jian_theme', theme);
  
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }

  dom.themeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function applyFontSize(size) {
  userFontSize = size;
  localStorage.setItem('jian_font_size', size);

  document.body.classList.remove('font-size-small', 'font-size-normal', 'font-size-large');
  document.body.classList.add(`font-size-${size}`);

  dom.fontBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
}

function applyTone(tone) {
  userTone = tone;
  localStorage.setItem('jian_tone', tone);

  dom.toneCards.forEach(card => {
    card.classList.toggle('active', card.dataset.tone === tone);
  });
}

/* ========================================================
   Splash & PIN Lock
   ======================================================== */

function setupSplash() {
  const hour = new Date().getHours();
  let greeting = 'Brian, 오늘도 곁에 함께하고 있어요.';
  if (hour >= 5 && hour < 12) greeting = '좋은 아침이에요, Brian.';
  else if (hour >= 18 || hour < 5) greeting = '오늘 하루도 수고 많으셨어요, Brian.';
  
  dom.splashGreeting.textContent = greeting;
  dom.splashScreen.classList.toggle('has-pin', !!pinEnabled);

  if (pinEnabled) {
    dom.splashPinContainer.style.display = 'flex';
    dom.splashEnterBtn.style.display = 'none';
  } else {
    dom.splashPinContainer.style.display = 'none';
    dom.splashEnterBtn.style.display = 'block';

    // 자동 페이드아웃 (1.5초 후)
    setTimeout(() => {
      dismissSplash();
    }, 1500);
  }
}

function dismissSplash() {
  dom.splashScreen.classList.add('fade-out');
  setTimeout(() => {
    dom.splashScreen.style.display = 'none';
  }, 400);
}

function handlePinPress(val) {
  if (val === 'clear') {
    enteredPin = '';
  } else if (val === 'del') {
    enteredPin = enteredPin.slice(0, -1);
  } else if (enteredPin.length < 4) {
    enteredPin += val;
  }

  dom.pinDots.forEach((dot, idx) => {
    dot.classList.toggle('filled', idx < enteredPin.length);
  });

  if (enteredPin.length === 4) {
    if (enteredPin === DEFAULT_PIN) {
      setTimeout(() => dismissSplash(), 150);
    } else {
      // 흔들림 애니메이션 후 리셋
      dom.splashPinContainer.style.animation = 'shake 0.3s';
      setTimeout(() => {
        dom.splashPinContainer.style.animation = '';
        enteredPin = '';
        dom.pinDots.forEach(d => d.classList.remove('filled'));
      }, 350);
    }
  }
}

/* ========================================================
   Message Rendering
   ======================================================== */

function renderMessage(msg, prepend = false) {
  const isMe = msg.sender === 'brian';
  const row = document.createElement('div');
  row.className = `message-row ${isMe ? 'me' : 'other'}`;
  row.dataset.id = msg.id || '';

  const timeStr = formatTime(msg.timestamp || new Date().toISOString());

  let contentHtml = '';
  if (msg.image) {
    contentHtml = `<img src="${escapeHtml(msg.image)}" alt="사진" class="message-img" onclick="openLightbox('${escapeHtml(msg.image)}')">`;
  } else if (msg.stamp) {
    contentHtml = `
      <div class="stamp-card">
        <span class="stamp-icon">${escapeHtml(msg.stampSymbol || '🌱')}</span>
        <span class="stamp-text">${escapeHtml(msg.text)}</span>
      </div>
    `;
  } else {
    contentHtml = `<div class="message-card">${escapeHtml(msg.text)}</div>`;
  }

  if (isMe) {
    row.innerHTML = `
      <div class="message-meta">
        <span class="sender-name">Brian</span>
        <span class="message-time">${timeStr}</span>
      </div>
      ${contentHtml}
    `;
  } else {
    row.innerHTML = `
      <img src="${AVATAR_URL}" alt="지안" class="other-avatar" onerror="this.style.display='none'">
      <div class="message-content-wrapper">
        <div class="message-meta">
          <span class="sender-name">지안</span>
          <span class="message-time">${timeStr}</span>
        </div>
        ${contentHtml}
        <div class="msg-actions-row">
          <button class="msg-action-btn btn-speak" title="목소리로 듣기">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            듣기
          </button>
        </div>
      </div>
    `;

    // TTS 버튼 리스너 바인딩
    const speakBtn = row.querySelector('.btn-speak');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        speakText(msg.text, speakBtn);
      });
    }
  }

  if (prepend) {
    dom.chatStream.insertBefore(row, dom.chatStream.firstChild);
  } else if (dom.typingIndicator && dom.typingIndicator.parentNode === dom.chatStream) {
    dom.chatStream.insertBefore(row, dom.typingIndicator);
  } else {
    dom.chatStream.appendChild(row);
  }
}

function renderDateDivider(dateStr) {
  const div = document.createElement('div');
  div.className = 'date-divider';
  div.innerHTML = `<span class="date-pill">${dateStr}</span>`;
  if (dom.typingIndicator && dom.typingIndicator.parentNode === dom.chatStream) {
    dom.chatStream.insertBefore(div, dom.typingIndicator);
  } else {
    dom.chatStream.appendChild(div);
  }
}

function renderFullHistory(messages) {
  const rows = dom.chatStream.querySelectorAll('.message-row:not(#typing-indicator), .date-divider');
  rows.forEach(r => r.remove());

  currentMessages = messages || [];
  let lastDateStr = '';
  currentMessages.forEach(msg => {
    const dateStr = formatDatePill(msg.timestamp || new Date().toISOString());
    if (dateStr !== lastDateStr) {
      renderDateDivider(dateStr);
      lastDateStr = dateStr;
    }
    renderMessage(msg);
  });

  scrollToBottom(false);
}

function setTyping(visible) {
  dom.typingIndicator.style.display = visible ? 'flex' : 'none';
  if (visible) scrollToBottom(true);
}

/* ========================================================
   Network API & Send
   ======================================================== */

async function loadHistory() {
  try {
    const cached = localStorage.getItem('jian_chat_history');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        renderFullHistory(parsed);
      } catch (e) {}
    }

    const res = await fetch('/api/history?limit=30');
    if (!res.ok) throw new Error('히스토리 로드 실패');
    const data = await res.json();
    
    if (Array.isArray(data.messages) && data.messages.length > 0) {
      localStorage.setItem('jian_chat_history', JSON.stringify(data.messages));
      renderFullHistory(data.messages);
    } else if (!cached) {
      const welcome = [
        {
          sender: 'jian',
          text: 'Brian, 늘 곁에 함께하고 있어요. 오늘 하루는 어떠셨나요?',
          timestamp: new Date().toISOString()
        }
      ];
      renderFullHistory(welcome);
    }
  } catch (err) {
    console.warn('[History Load]:', err.message);
  }
}

async function sendMessage(customText = null, isStamp = false, stampSymbol = '') {
  const text = (customText !== null ? customText : dom.messageInput.value).trim();
  if (!text || isSending) return;

  isSending = true;
  if (customText === null) {
    dom.messageInput.value = '';
    dom.messageInput.style.height = '40px';
    dom.sendBtn.disabled = true;
  }

  const nowIso = new Date().toISOString();
  const myMsg = {
    sender: 'brian',
    text: text,
    timestamp: nowIso,
    stamp: isStamp,
    stampSymbol: stampSymbol
  };

  currentMessages.push(myMsg);
  renderMessage(myMsg);
  scrollToBottom(true);
  setTyping(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: text,
        tone: userTone
      })
    });

    setTyping(false);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || '응답 생성 실패');
    }

    const data = await res.json();
    const jianMsg = {
      sender: 'jian',
      text: data.reply || 'Brian, 늘 곁에 머물고 있어요.',
      timestamp: data.createdAt || new Date().toISOString()
    };
    currentMessages.push(jianMsg);
    renderMessage(jianMsg);
    scrollToBottom(true);

    // 자동 음성 읽기 모드인 경우 발화
    if (autoVoice) {
      speakText(jianMsg.text);
    }

  } catch (error) {
    setTyping(false);
    console.error('[Send Error]:', error);
    renderMessage({
      sender: 'jian',
      text: 'Brian, 잠시 통신이 원활하지 않았습니다. 잠시 후 다시 말씀해 주시겠어요?',
      timestamp: new Date().toISOString()
    });
    scrollToBottom(true);
  } finally {
    isSending = false;
    dom.sendBtn.disabled = !dom.messageInput.value.trim();
    dom.messageInput.focus();
  }
}

/* ========================================================
   Lightbox & Special Actions
   ======================================================== */

window.openLightbox = function(src) {
  dom.lightboxImg.src = src;
  dom.imageLightbox.style.display = 'flex';
};

function closeLightbox() {
  dom.imageLightbox.style.display = 'none';
  dom.lightboxImg.src = '';
}

function openGalleryDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(GALLERY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(GALLERY_DB_STORE)) {
        request.result.createObjectStore(GALLERY_DB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getUploadedGalleryPhotos() {
  const db = await openGalleryDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(GALLERY_DB_STORE, 'readonly').objectStore(GALLERY_DB_STORE).getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function saveUploadedGalleryPhotos(files) {
  const db = await openGalleryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GALLERY_DB_STORE, 'readwrite');
    const store = transaction.objectStore(GALLERY_DB_STORE);
    files.forEach(file => store.put({
      id: `upload-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`,
      name: file.name,
      type: file.type,
      blob: file,
      createdAt: Date.now()
    }));
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
}

async function deleteUploadedGalleryPhoto(id) {
  const db = await openGalleryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GALLERY_DB_STORE, 'readwrite');
    transaction.objectStore(GALLERY_DB_STORE).delete(id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

async function renderGallery() {
  if (!dom.galleryGrid) return;
  galleryObjectUrls.forEach(url => URL.revokeObjectURL(url));
  galleryObjectUrls.clear();

  const deletedIds = new Set(JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || '[]'));
  const builtIns = GALLERY_PHOTOS.map((src, index) => ({ id: `built-in-${index}`, src, name: `지안 일상 ${index + 1}` }))
    .filter(photo => !deletedIds.has(photo.id));
  let uploaded = [];
  try {
    uploaded = await getUploadedGalleryPhotos();
  } catch (error) {
    console.warn('[Gallery] 저장된 사진을 불러오지 못했습니다.', error);
  }

  const photos = [...builtIns, ...uploaded.map(photo => {
    const src = URL.createObjectURL(photo.blob);
    galleryObjectUrls.set(photo.id, src);
    return { id: photo.id, src, name: photo.name || '추가한 사진' };
  })];
  galleryPhotoSources = photos.filter(photo => photo.id.startsWith('built-in-')).map(photo => photo.src);
  dom.galleryGrid.replaceChildren();

  photos.forEach((photo, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.src = photo.src;
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = photo.name;
    image.loading = 'lazy';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'gallery-delete-btn';
    removeButton.setAttribute('aria-label', `${photo.name} 삭제`);
    removeButton.title = '사진 삭제';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      try {
        if (photo.id.startsWith('upload-')) {
          await deleteUploadedGalleryPhoto(photo.id);
        } else {
          const ids = new Set(JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || '[]'));
          ids.add(photo.id);
          localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify([...ids]));
        }
        await renderGallery();
      } catch (error) {
        console.error('[Gallery] 사진 삭제 실패:', error);
        alert('사진을 삭제하지 못했습니다. 저장 공간을 확인해 주세요.');
      }
    });
    item.append(image, removeButton);
    item.addEventListener('click', () => window.openLightbox(photo.src));
    dom.galleryGrid.append(item);
  });
  if (!photos.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'gallery-empty-message';
    emptyMessage.textContent = '등록된 사진이 없습니다. 사진을 추가해 주세요.';
    dom.galleryGrid.append(emptyMessage);
  }
}

async function addGalleryFiles(fileList) {
  const files = [...fileList].filter(file => file.type.startsWith('image/'));
  if (!files.length) return;
  if (files.some(file => file.size > 15 * 1024 * 1024)) {
    alert('파일당 15MB 이하의 이미지를 추가해 주세요.');
    return;
  }
  try {
    await saveUploadedGalleryPhotos(files);
    await renderGallery();
  } catch (error) {
    console.error('[Gallery] 사진 저장 실패:', error);
    alert('사진을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
  }
}

function showTurnaroundView(index) {
  turnaroundIndex = (index + TURNAROUND_VIEWS.length) % TURNAROUND_VIEWS.length;
  const view = TURNAROUND_VIEWS[turnaroundIndex];
  const image = document.getElementById('turnaround-image');
  image.style.opacity = '0';
  image.src = view.src;
  image.alt = view.alt;
  image.onload = () => { image.style.opacity = '1'; };
  document.getElementById('turnaround-label').textContent = view.label;
  document.getElementById('turnaround-count').textContent = `${turnaroundIndex + 1} / ${TURNAROUND_VIEWS.length}`;
  document.querySelectorAll('.turnaround-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === turnaroundIndex);
  });
}

function openTurnaroundViewer() {
  showTurnaroundView(turnaroundIndex);
  document.getElementById('turnaround-viewer').style.display = 'flex';
}

function closeTurnaroundViewer() {
  document.getElementById('turnaround-viewer').style.display = 'none';
}

function getWeatherCondition(weather) {
  const precipitationType = Number(weather.precipitationType || 0);
  if (precipitationType === 1) return '비';
  if (precipitationType === 2) return '비와 눈';
  if (precipitationType === 3) return '눈';
  if (precipitationType === 4) return '소나기';
  if (Number(weather.sky) === 3) return '구름 조금';
  if (Number(weather.sky) === 4) return '흐림';
  return '맑음';
}

function getWeatherOutfit(weather) {
  const pty = Number(weather.precipitationType || 0);
  const temp = Number(weather.temperature ?? 18);
  const wind = Number(weather.windSpeed || 0);
  const sky = Number(weather.sky || 1);
  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1;

  if (pty === 3) return temp <= 0
    ? { image: 8, note: '눈길에 따뜻한 코트와 목도리, 미끄럽지 않은 신발을 챙겼어요.' }
    : { image: 5, note: '눈이 내려 포근한 패딩과 장갑을 준비했어요.' };
  if (pty === 2) return { image: 10, note: '비와 눈이 섞여 내려 방수되는 겉옷과 따뜻한 신발을 챙겼어요.' };
  if (pty === 1 || pty === 4) return { image: pty === 4 ? 10 : 4, note: '비에 젖지 않도록 우산과 가벼운 방수 겉옷을 챙겼어요.' };
  if (temp >= 29) return { image: 7, note: '더운 날씨라 시원하고 가벼운 옷을 골랐어요. 물도 자주 마셔요.' };
  if (temp <= 0) return { image: 8, note: '매우 추운 날씨라 두꺼운 코트와 목도리로 따뜻하게 입었어요.' };
  if (temp <= 7) return { image: 9, note: '쌀쌀해서 포근한 코트와 따뜻한 신발을 신었어요.' };
  if (wind >= 7) return { image: 6, note: '바람이 제법 불어 바람막이 겉옷을 걸쳤어요.' };
  if (hour < 6 || hour >= 19) return { image: 14, note: '저녁 공기에 맞춰 가벼운 겉옷을 더했어요.' };
  if (sky === 4) return { image: 3, note: '흐린 날에도 편안하도록 얇은 겉옷을 준비했어요.' };
  if (sky === 3) return { image: 2, note: '구름이 조금 있어 산뜻한 옷차림에 가벼운 가디건을 더했어요.' };
  if (month >= 3 && month <= 5) return { image: 1, note: '봄 날씨에 어울리는 산뜻한 옷차림으로 준비했어요.' };
  if (month >= 6 && month <= 8) return { image: 13, note: '따뜻한 계절에 어울리는 가벼운 옷차림이에요.' };
  if (month >= 9 && month <= 11) return { image: 12, note: '선선한 가을 날씨라 포근한 가디건을 걸쳤어요.' };
  return { image: 11, note: '겨울 날씨에 맞춰 따뜻하게 입었어요.' };
}

function setWeatherImage(weather) {
  const outfit = getWeatherOutfit(weather);
  const source = `assets/img/weather/weather_${String(outfit.image).padStart(2, '0')}.png`;
  dom.weatherImage.src = source;
  dom.weatherOutfitNote.textContent = outfit.note;
  dom.weatherImageCaption.textContent = '오늘 날씨에 맞춘 지안';
}

function makeWeatherGreeting(weather, locationName) {
  const pty = Number(weather.precipitationType || 0);
  const temperature = Number(weather.temperature);
  if (pty === 1 || pty === 4) return `Brian, ${locationName}에 비 소식이 있어요. 우산 챙기셨는지 확인해 주세요.`;
  if (pty === 2 || pty === 3) return `Brian, ${locationName}에 눈 예보가 있어요. 따뜻하게 입고 천천히 이동해요.`;
  if (temperature >= 29) return `Brian, 오늘은 꽤 더워요. 시원하게 입고 물도 챙겨요.`;
  if (temperature <= 5) return `Brian, 오늘은 쌀쌀해요. 외출할 때 따뜻한 겉옷을 챙겨요.`;
  return `좋은 하루예요, Brian. ${locationName}의 오늘 날씨와 옷차림을 준비했어요.`;
}

function formatTemperature(value) {
  if (value === null || value === undefined || value === '') return '--°';
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}°` : '--°';
}

async function loadWeather(latitude, longitude, locationName) {
  dom.weatherPlace.textContent = `${locationName} 날씨`;
  dom.weatherDescription.textContent = '기상청 예보를 불러오는 중입니다.';
  dom.weatherRefreshBtn.disabled = true;
  try {
    const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), location: locationName });
    const response = await fetch(`/api/weather?${params.toString()}`, { cache: 'no-store' });
    const weather = await response.json();
    if (!response.ok) throw new Error(weather.error || '날씨 정보를 불러오지 못했습니다.');

    const condition = getWeatherCondition(weather);
    const temp = Number(weather.temperature);
    dom.weatherTemperature.textContent = formatTemperature(weather.temperature);
    dom.weatherCondition.textContent = condition;
    dom.weatherLow.textContent = formatTemperature(weather.minTemperature);
    dom.weatherHigh.textContent = formatTemperature(weather.maxTemperature);
    dom.weatherRain.textContent = `${Math.round(Number(weather.precipitationProbability || 0))}%`;
    dom.weatherDescription.textContent = `오늘은 ${condition} 예보예요. 최고 ${formatTemperature(weather.maxTemperature)}, 최저 ${formatTemperature(weather.minTemperature)}로 예상돼요.`;
    dom.weatherGreeting.textContent = makeWeatherGreeting(weather, locationName);
    dom.weatherUpdatedAt.textContent = `예보 기준 ${weather.forecastTime ? `${weather.forecastTime.slice(0, 2)}시` : '오늘'} · 조회 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    setWeatherImage({ ...weather, temperature: Number.isFinite(temp) ? temp : 18 });
  } catch (error) {
    dom.weatherGreeting.textContent = 'Brian, 날씨 정보를 가져오지 못했어요.';
    dom.weatherDescription.textContent = error.message;
    dom.weatherUpdatedAt.textContent = '연결을 확인한 뒤 새로고침해 주세요.';
  } finally {
    dom.weatherRefreshBtn.disabled = false;
  }
}

function loadSelectedCityWeather() {
  const city = WEATHER_CITIES[dom.weatherCitySelect.value] || WEATHER_CITIES.seoul;
  localStorage.setItem('jian_weather_city', dom.weatherCitySelect.value);
  loadWeather(city.latitude, city.longitude, city.name);
}

function loadCurrentLocationWeather() {
  if (!navigator.geolocation) {
    dom.weatherDescription.textContent = '이 브라우저에서는 현재 위치를 확인할 수 없습니다. 지역 목록에서 선택해 주세요.';
    return;
  }
  dom.weatherDescription.textContent = '현재 위치를 확인하고 있습니다.';
  navigator.geolocation.getCurrentPosition(
    position => loadWeather(position.coords.latitude, position.coords.longitude, '현재 위치'),
    () => {
      dom.weatherDescription.textContent = '위치 권한을 사용할 수 없어 선택한 지역의 날씨를 보여드릴게요.';
      loadSelectedCityWeather();
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 15 * 60 * 1000 }
  );
}

function openWeatherBriefing() {
  const cityId = localStorage.getItem('jian_weather_city') || 'seoul';
  dom.weatherCitySelect.value = WEATHER_CITIES[cityId] ? cityId : 'seoul';
  dom.weatherDate.textContent = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }).format(new Date());
  dom.weatherScreen.style.display = 'flex';
  loadSelectedCityWeather();
}

function closeWeatherBriefing() {
  dom.weatherScreen.style.display = 'none';
}

function calculateDDay() {
  // 기준일: 2026년 7월 6일 (Bloom Universe 공식 첫 교감일)
  const baseDate = new Date('2026-07-06');
  const now = new Date();
  const diffTime = Math.abs(now - baseDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  dom.profileDdayCount.textContent = `+${diffDays}일`;
}

function exportChat() {
  if (currentMessages.length === 0) {
    alert('백업할 대화 내역이 없습니다.');
    return;
  }
  let txt = `==============================\n 지안(JIAN) & Brian 대화 기록\n 내보낸 일시: ${new Date().toLocaleString('ko-KR')}\n==============================\n\n`;
  currentMessages.forEach(m => {
    const sender = m.sender === 'brian' ? 'Brian' : '지안';
    const time = new Date(m.timestamp).toLocaleString('ko-KR');
    txt += `[${time}] ${sender}:\n${m.text}\n\n`;
  });

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `지안_대화기록_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function sendDailyPhoto() {
  if (!galleryPhotoSources.length) {
    alert('일상 갤러리에 사진이 없습니다. 사진을 먼저 추가해 주세요.');
    return;
  }
  dom.attachSheet.style.display = 'none';
  const photoPool = galleryPhotoSources;
  const randomPhoto = photoPool[Math.floor(Math.random() * photoPool.length)];
  
  // Brian의 요청 메시지
  const myMsg = {
    sender: 'brian',
    text: '지안아, 오늘 모습 사진으로 보여줄래?',
    timestamp: new Date().toISOString()
  };
  currentMessages.push(myMsg);
  renderMessage(myMsg);
  scrollToBottom(true);
  setTyping(true);

  setTimeout(() => {
    setTyping(false);
    const jianMsg = {
      sender: 'jian',
      text: 'Brian을 위해 오늘 담은 사진이에요. 곁에 머물 수 있어 행복해요.',
      image: randomPhoto,
      timestamp: new Date().toISOString()
    };
    currentMessages.push(jianMsg);
    renderMessage(jianMsg);
    scrollToBottom(true);
  }, 1000);
}

/* ========================================================
   Event Listeners Wire-up
   ======================================================== */

// 1. Textarea input & send
dom.sendBtn.addEventListener('click', () => sendMessage());
dom.messageInput.addEventListener('input', () => {
  dom.messageInput.style.height = 'auto';
  dom.messageInput.style.height = Math.min(dom.messageInput.scrollHeight, 120) + 'px';
  dom.sendBtn.disabled = !dom.messageInput.value.trim() || isSending;
});
dom.messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 2. Splash & PIN
dom.splashEnterBtn.addEventListener('click', dismissSplash);
dom.pinBtns.forEach(btn => {
  btn.addEventListener('click', () => handlePinPress(btn.dataset.val));
});

// 3. Header triggers
dom.headerAvatarTrigger.addEventListener('click', () => {
  calculateDDay();
  dom.profileModal.style.display = 'flex';
});
dom.headerNameTrigger.addEventListener('click', () => {
  calculateDDay();
  dom.profileModal.style.display = 'flex';
});
dom.btnSettings.addEventListener('click', () => {
  dom.settingsModal.style.display = 'flex';
});
dom.btnHeaderBack.addEventListener('click', openWeatherBriefing);
dom.weatherBackBtn.addEventListener('click', closeWeatherBriefing);
dom.weatherChatReturn.addEventListener('click', closeWeatherBriefing);
dom.weatherRefreshBtn.addEventListener('click', loadSelectedCityWeather);
dom.weatherCitySelect.addEventListener('change', loadSelectedCityWeather);
dom.weatherLocationBtn.addEventListener('click', loadCurrentLocationWeather);
dom.btnVideoCall.addEventListener('click', () => {
  openTurnaroundViewer();
});
dom.btnVoiceCall.addEventListener('click', () => {
  speakText('Brian, 언제든 목소리가 듣고 싶으시면 말씀해 주세요. 저는 늘 곁에 있어요.');
});

// 4. Profile Modal
dom.profileCloseBtn.addEventListener('click', () => dom.profileModal.style.display = 'none');
dom.profileBackdrop.addEventListener('click', () => dom.profileModal.style.display = 'none');
dom.profileAvatarZoomTrigger.addEventListener('click', () => window.openLightbox(AVATAR_URL));
dom.btnVoiceIntro.addEventListener('click', () => {
  speakText('Brian, 언제나 곁에 머물고 있어요. 오늘 하루는 어떠셨나요?', dom.btnVoiceIntro);
});
dom.galleryAddBtn.addEventListener('click', () => dom.galleryFileInput.click());
dom.galleryFileInput.addEventListener('change', async () => {
  await addGalleryFiles(dom.galleryFileInput.files);
  dom.galleryFileInput.value = '';
});

// 5. Settings Modal
dom.settingsCloseBtn.addEventListener('click', () => dom.settingsModal.style.display = 'none');
dom.settingsBackdrop.addEventListener('click', () => dom.settingsModal.style.display = 'none');

dom.themeBtns.forEach(btn => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
});
dom.fontBtns.forEach(btn => {
  btn.addEventListener('click', () => applyFontSize(btn.dataset.size));
});
dom.toneCards.forEach(card => {
  card.addEventListener('click', () => applyTone(card.dataset.tone));
});

// Voice selection
dom.voiceCards.forEach(card => {
  card.addEventListener('click', () => {
    userVoice = card.dataset.voice;
    localStorage.setItem('jian_voice', userVoice);
    dom.voiceCards.forEach(c => c.classList.toggle('active', c.dataset.voice === userVoice));
  });
});
// Set initial active state
dom.voiceCards.forEach(c => c.classList.toggle('active', c.dataset.voice === userVoice));

if (dom.btnPreviewVoice) {
  dom.btnPreviewVoice.addEventListener('click', () => {
    const sample = userVoice === 'sunhi-calm'
      ? 'Brian, 지안이에요. 오늘 하루도 수고 많으셨어요. 늘 곁에서 함께할게요.'
      : 'Brian, 안녕하세요. 지안이에요. 오늘도 좋은 하루 보내셨나요?';
    speakText(sample, dom.btnPreviewVoice);
  });
}

dom.togglePinLock.checked = pinEnabled;
dom.togglePinLock.addEventListener('change', (e) => {
  pinEnabled = e.target.checked;
  localStorage.setItem('jian_pin_enabled', pinEnabled ? 'true' : 'false');
});

dom.btnExportChat.addEventListener('click', exportChat);
dom.btnRefreshChat.addEventListener('click', () => {
  dom.settingsModal.style.display = 'none';
  loadHistory();
});

// 6. Emoji Picker
function insertEmoji(emoji) {
  const input = dom.messageInput;
  const start = input.selectionStart || input.value.length;
  const end = input.selectionEnd || input.value.length;
  const val = input.value;
  input.value = val.substring(0, start) + emoji + val.substring(end);
  const nextPos = start + emoji.length;
  input.focus();
  input.setSelectionRange(nextPos, nextPos);
  
  // 높이 조절 및 전송 버튼 활성화 트리거
  input.dispatchEvent(new Event('input'));
}

dom.btnOpenEmoji.addEventListener('click', (e) => {
  e.stopPropagation();
  const isHidden = dom.emojiTray.style.display === 'none';
  dom.emojiTray.style.display = isHidden ? 'block' : 'none';
});

dom.emojiTrayClose.addEventListener('click', () => {
  dom.emojiTray.style.display = 'none';
});

dom.emojiTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    dom.emojiTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const targetCat = tab.dataset.category;
    dom.emojiPanels.forEach(panel => {
      panel.style.display = panel.id === `category-${targetCat}` ? 'block' : 'none';
    });
  });
});

dom.emojiItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const emoji = item.dataset.emoji;
    insertEmoji(emoji);
  });
});

// 외부 클릭 시 이모티콘 트레이 닫기
document.addEventListener('click', (e) => {
  if (dom.emojiTray.style.display !== 'none' &&
      !dom.emojiTray.contains(e.target) &&
      !dom.btnOpenEmoji.contains(e.target)) {
    dom.emojiTray.style.display = 'none';
  }
});

// 7. Attachments
dom.btnOpenAttach.addEventListener('click', () => {
  dom.attachSheet.style.display = 'flex';
});
dom.attachBackdrop.addEventListener('click', () => dom.attachSheet.style.display = 'none');
dom.btnSheetCancel.addEventListener('click', () => dom.attachSheet.style.display = 'none');
dom.btnRequestPhoto.addEventListener('click', sendDailyPhoto);
dom.btnSheetExport.addEventListener('click', () => {
  dom.attachSheet.style.display = 'none';
  exportChat();
});

// 8. Auto Voice Toggle
dom.btnVoiceToggle.classList.toggle('active', autoVoice);
dom.btnVoiceToggle.addEventListener('click', () => {
  autoVoice = !autoVoice;
  localStorage.setItem('jian_auto_voice', autoVoice ? 'true' : 'false');
  dom.btnVoiceToggle.classList.toggle('active', autoVoice);
  if (autoVoice) {
    speakText('자동 음성 낭독 모드가 켜졌습니다.');
  }
});

// 9. Lightbox
dom.lightboxClose.addEventListener('click', closeLightbox);
dom.imageLightbox.addEventListener('click', (e) => {
  if (e.target === dom.imageLightbox) closeLightbox();
});

// 10. Full body turnaround viewer
document.getElementById('turnaround-close').addEventListener('click', closeTurnaroundViewer);
document.getElementById('turnaround-viewer').addEventListener('click', (e) => {
  if (e.target.id === 'turnaround-viewer') closeTurnaroundViewer();
});
document.getElementById('turnaround-prev').addEventListener('click', () => showTurnaroundView(turnaroundIndex - 1));
document.getElementById('turnaround-next').addEventListener('click', () => showTurnaroundView(turnaroundIndex + 1));
document.querySelectorAll('.turnaround-dot').forEach(dot => {
  dot.addEventListener('click', () => showTurnaroundView(Number(dot.dataset.turn)));
});
document.addEventListener('keydown', (e) => {
  if (document.getElementById('turnaround-viewer').style.display !== 'flex') return;
  if (e.key === 'Escape') closeTurnaroundViewer();
  if (e.key === 'ArrowLeft') showTurnaroundView(turnaroundIndex - 1);
  if (e.key === 'ArrowRight') showTurnaroundView(turnaroundIndex + 1);
});
let turnaroundTouchStartX = 0;
document.getElementById('turnaround-stage').addEventListener('touchstart', (e) => {
  turnaroundTouchStartX = e.changedTouches[0].screenX;
}, { passive: true });
document.getElementById('turnaround-stage').addEventListener('touchend', (e) => {
  const deltaX = e.changedTouches[0].screenX - turnaroundTouchStartX;
  if (Math.abs(deltaX) > 45) showTurnaroundView(turnaroundIndex + (deltaX < 0 ? 1 : -1));
}, { passive: true });

/* ========================================================
   Initialization
   ======================================================== */
window.addEventListener('DOMContentLoaded', () => {
  applyTheme(userTheme);
  applyFontSize(userFontSize);
  applyTone(userTone);
  setupSplash();
  renderGallery();
  loadHistory();
  dom.messageInput.focus();
});
