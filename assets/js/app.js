/**
 * jian_chat Microsoft Teams Client Application
 */

const AVATAR_URL = 'assets/img/jian_avatar.jpg';

const dom = {
  chatStream: document.getElementById('chat-stream'),
  messageInput: document.getElementById('message-input'),
  sendBtn: document.getElementById('send-btn'),
  typingIndicator: document.getElementById('typing-indicator'),
};

let isSending = false;

// 날짜 포맷 헬퍼 (Intl API)
function formatDatePill(isoString) {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(d);
}

// 시간 포맷 헬퍼 (오후 9:32)
function formatTime(isoString) {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(d);
}

// 스크롤 맨 아래로 이동
function scrollToBottom(smooth = true) {
  dom.chatStream.scrollTo({
    top: dom.chatStream.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

// 메시지 렌더링
function renderMessage(msg, prepend = false) {
  const isMe = msg.sender === 'brian';
  const row = document.createElement('div');
  row.className = `message-row ${isMe ? 'me' : 'other'}`;
  row.dataset.id = msg.id || '';

  const timeStr = formatTime(msg.timestamp || new Date().toISOString());

  if (isMe) {
    row.innerHTML = `
      <div class="message-meta">
        <span class="sender-name">Brian</span>
        <span class="message-time">${timeStr}</span>
      </div>
      <div class="message-card">${escapeHtml(msg.text)}</div>
    `;
  } else {
    row.innerHTML = `
      <img src="${AVATAR_URL}" alt="지안" class="other-avatar" onerror="this.style.display='none'">
      <div class="message-content-wrapper">
        <div class="message-meta">
          <span class="sender-name">지안</span>
          <span class="message-time">${timeStr}</span>
        </div>
        <div class="message-card">${escapeHtml(msg.text)}</div>
      </div>
    `;
  }

  if (prepend) {
    dom.chatStream.insertBefore(row, dom.chatStream.firstChild);
  } else if (dom.typingIndicator && dom.typingIndicator.parentNode === dom.chatStream) {
    dom.chatStream.insertBefore(row, dom.typingIndicator);
  } else {
    dom.chatStream.appendChild(row);
  }
}

// 날짜 구분선 렌더링
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

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 타이핑 인디케이터 표시/숨김
function setTyping(visible) {
  dom.typingIndicator.style.display = visible ? 'flex' : 'none';
  if (visible) {
    scrollToBottom(true);
  }
}

// 대화 내역 초기 로드
async function loadHistory() {
  try {
    // 로컬 캐시 먼저 렌더링
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
      // 초기 기본 환영 메시지
      const welcome = [
        {
          sender: 'jian',
          text: 'Brian님, 어서오세요. 오늘 하루도 고생 많으셨습니다. 퇴근길은 편안하신가요?',
          timestamp: new Date().toISOString()
        }
      ];
      renderFullHistory(welcome);
    }
  } catch (err) {
    console.warn('[History Load]:', err.message);
  }
}

function renderFullHistory(messages) {
  // 기존 메시지들 제거 (타이핑 인디케이터 제외)
  const rows = dom.chatStream.querySelectorAll('.message-row, .date-divider');
  rows.forEach(r => r.remove());

  let lastDateStr = '';
  messages.forEach(msg => {
    const dateStr = formatDatePill(msg.timestamp || new Date().toISOString());
    if (dateStr !== lastDateStr) {
      renderDateDivider(dateStr);
      lastDateStr = dateStr;
    }
    renderMessage(msg);
  });

  scrollToBottom(false);
}

// 메시지 전송
async function sendMessage() {
  const text = dom.messageInput.value.trim();
  if (!text || isSending) return;

  isSending = true;
  dom.messageInput.value = '';
  dom.messageInput.style.height = '40px';
  dom.sendBtn.disabled = true;

  // 1. 내 메시지 즉시 화면 렌더링
  const nowIso = new Date().toISOString();
  renderMessage({
    sender: 'brian',
    text: text,
    timestamp: nowIso
  });
  scrollToBottom(true);

  // 2. 타이핑 표시
  setTyping(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    setTyping(false);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || '응답 생성 실패');
    }

    const data = await res.json();
    renderMessage({
      sender: 'jian',
      text: data.reply || 'Brian, 늘 곁에 함께하고 있어요.',
      timestamp: data.createdAt || new Date().toISOString()
    });
    scrollToBottom(true);

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
    dom.sendBtn.disabled = false;
    dom.messageInput.focus();
  }
}

// 텍스트에어리어 자동 크기 조절
function handleTextareaInput() {
  dom.messageInput.style.height = 'auto';
  dom.messageInput.style.height = Math.min(dom.messageInput.scrollHeight, 120) + 'px';
  dom.sendBtn.disabled = !dom.messageInput.value.trim() || isSending;
}

// 이벤트 리스너 등록
dom.sendBtn.addEventListener('click', sendMessage);

dom.messageInput.addEventListener('input', handleTextareaInput);

dom.messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 초기화
window.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  dom.messageInput.focus();
});
