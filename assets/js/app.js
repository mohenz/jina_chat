/**
 * jian_chat Microsoft Teams Client Application
 * Features: Teams UI, Splash/PIN lock, Persona Profile, Settings, Stickers, Reactions, TTS Voice, Daily Photo
 */

const AVATAR_URL = 'assets/img/jian_avatar.jpg';
const GALLERY_PHOTOS = [
  'assets/img/gallery/jian_1.png',
  'assets/img/gallery/jian_2.png',
  'assets/img/gallery/jian_3.png'
];

// App State
let isSending = false;
let currentMessages = [];
let userTone = localStorage.getItem('jian_tone') || 'daily';
let userTheme = localStorage.getItem('jian_theme') || 'system';
let userFontSize = localStorage.getItem('jian_font_size') || 'normal';
let pinEnabled = localStorage.getItem('jian_pin_enabled') === 'true';
let autoVoice = localStorage.getItem('jian_auto_voice') === 'true';
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
  btnVoiceCall: document.getElementById('btn-voice-call'),
  btnSettings: document.getElementById('btn-settings'),

  // Profile Modal
  profileModal: document.getElementById('profile-modal'),
  profileBackdrop: document.getElementById('profile-backdrop'),
  profileCloseBtn: document.getElementById('profile-close-btn'),
  profileAvatarZoomTrigger: document.getElementById('profile-avatar-zoom-trigger'),
  btnVoiceIntro: document.getElementById('btn-voice-intro'),
  profileDdayCount: document.getElementById('profile-dday-count'),
  galleryItems: document.querySelectorAll('.gallery-item'),

  // Settings Modal
  settingsModal: document.getElementById('settings-modal'),
  settingsBackdrop: document.getElementById('settings-backdrop'),
  settingsCloseBtn: document.getElementById('settings-close-btn'),
  themeBtns: document.querySelectorAll('.theme-btn'),
  fontBtns: document.querySelectorAll('.font-btn'),
  toneCards: document.querySelectorAll('.tone-card'),
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

function speakText(text, btnElement = null) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  // 이모지 및 특수문자 제거
  const clean = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu, '');
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = 'ko-KR';
  utter.rate = 0.95;
  utter.pitch = 1.05;

  const voices = window.speechSynthesis.getVoices();
  const koVoice = voices.find(v => v.lang.startsWith('ko') && (v.name.includes('Yuna') || v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Korean')));
  if (koVoice) utter.voice = koVoice;

  if (btnElement) {
    btnElement.classList.add('speaking');
    utter.onend = () => btnElement.classList.remove('speaking');
    utter.onerror = () => btnElement.classList.remove('speaking');
  }

  window.speechSynthesis.speak(utter);
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
  dom.attachSheet.style.display = 'none';
  const randomPhoto = GALLERY_PHOTOS[Math.floor(Math.random() * GALLERY_PHOTOS.length)];
  
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
dom.btnVideoCall.addEventListener('click', () => {
  window.openLightbox(AVATAR_URL);
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
dom.galleryItems.forEach(item => {
  item.addEventListener('click', () => {
    window.openLightbox(item.dataset.src);
  });
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

/* ========================================================
   Initialization
   ======================================================== */
window.addEventListener('DOMContentLoaded', () => {
  applyTheme(userTheme);
  applyFontSize(userFontSize);
  applyTone(userTone);
  setupSplash();
  loadHistory();
  dom.messageInput.focus();
});
