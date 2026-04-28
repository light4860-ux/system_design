import './style.css';

const agents =[
  { id: 'sys', name: '수석 시스템 기획자', tag: 'SYSTEM', icon: '<i class="fa-solid fa-gamepad"></i>', desc: '코어 시스템과 밸런스, 구조를 담당합니다.' },
  { id: 'con', name: '콘텐츠 & 라이브 기획자', tag: 'CONTENT', icon: '<i class="fa-solid fa-chess-knight"></i>', desc: '이벤트, 스토리, 신규 던전 등을 기획합니다.' },
  { id: 'ops', name: '운영 & UX 담당자', tag: 'OPS', icon: '<i class="fa-solid fa-chart-line"></i>', desc: '유저 경험(UX)과 서비스 지표를 관리합니다.' }
];

// ── 탭 시스템 ──
let tabs = [{ id: 0, title: '회의 1', agenda: '' }];
let activeTab = 0;
let tabCounter = 1;
const MAX_TABS = 3;

function getActiveContainer() {
  return document.getElementById(`chat-container-${activeTab}`);
}

function createTab(tabId, title) {
  // 탭 헤더 버튼
  const tabsEl = document.getElementById('meeting-tabs');
  const btn = document.createElement('button');
  btn.className = 'meeting-tab';
  btn.dataset.tab = tabId;
  btn.innerHTML = `<i class="fa-solid fa-comments"></i> ${title}`;
  btn.addEventListener('click', () => switchTab(tabId));
  tabsEl.appendChild(btn);

  // 탭 컨텐츠
  const contentsEl = document.getElementById('tab-contents');
  const content = document.createElement('div');
  content.className = 'tab-content';
  content.dataset.tab = tabId;
  content.innerHTML = `
    <div class="chat-container" id="chat-container-${tabId}">
      <div class="welcome-message">
        <i class="fa-brands fa-hubspot"></i>
        <p>기획 안건을 입력하고 회의를 시작하면, 이곳에 실시간 회의 로그가 순차적으로 기록됩니다.</p>
      </div>
    </div>
    <div class="excerpt-confirm-bar" style="display:none;">
      <span style="font-size:12px;color:var(--text-secondary);margin-right:auto;">선택한 문단으로 아젠다를 생성합니다</span>
      <button class="action-btn outline btn-excerpt-cancel" style="font-size:12px;padding:6px 12px;">취소</button>
      <button class="action-btn primary btn-excerpt-confirm" style="font-size:12px;padding:6px 12px;"><i class="fa-solid fa-bolt"></i> 아젠다 생성</button>
    </div>
  `;
  contentsEl.appendChild(content);
}

function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.meeting-tab').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.tab) === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', parseInt(content.dataset.tab) === tabId);
  });
}

function addNewTab(agenda) {
  if (tabs.length >= MAX_TABS) {
    alert(`최대 ${MAX_TABS}개의 회의 탭을 사용할 수 있습니다.`);
    return false;
  }
  const tabId = ++tabCounter;
  const title = `회의 ${tabs.length + 1}`;
  tabs.push({ id: tabId, title, agenda });
  createTab(tabId, title);
  switchTab(tabId);
  return tabId;
}

let currentStep = 0;
let isMeeting = false;
let attachedFiles = [];

function updateStepIndicator() {
  const stepIndicator = document.getElementById('step-indicator');
  stepIndicator.innerHTML = agents.map((a, i) => `
    <div class="step" id="step-${i}">
      <div class="step-dot"></div> ${a.name}
    </div>
  `).join('');
}

// ── localStorage 유지 ──
function saveAgendaToStorage() {
  const val = document.getElementById('agenda-input')?.value || '';
  localStorage.setItem('dnf_agenda_draft', val);
}

function loadAgendaFromStorage() {
  const val = localStorage.getItem('dnf_agenda_draft');
  const el = document.getElementById('agenda-input');
  if (val && el) el.value = val;
}

function saveGuidesToStorage() {
  agents.forEach(a => {
    const el = document.querySelector(`.agent-card.${a.id} .agent-guide`);
    if (el) localStorage.setItem(`dnf_guide_${a.id}`, el.value);
  });
}

function loadGuidesFromStorage() {
  agents.forEach(a => {
    const el = document.querySelector(`.agent-card.${a.id} .agent-guide`);
    const val = localStorage.getItem(`dnf_guide_${a.id}`);
    if (el && val) el.value = val;
  });
}

function initAgents() {
  const container = document.getElementById('agents-container');
  container.innerHTML = agents.map(a => `
    <div class="agent-card ${a.id}">
      <div class="agent-header">
        <div class="agent-avatar">${a.icon}</div>
        <div class="agent-info">
          <input type="text" class="agent-name-input" data-id="${a.id}" value="${a.name}" />
          <span class="agent-tag">${a.tag}</span>
        </div>
      </div>
      <textarea class="agent-guide" placeholder="추가 지침 입력 (선택사항) — 기본 지침에 덧붙여 적용됩니다."></textarea>
    </div>
  `).join('');

  document.querySelectorAll('.agent-name-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const agentId = e.target.dataset.id;
      const agent = agents.find(a => a.id === agentId);
      if (agent) { agent.name = e.target.value; updateStepIndicator(); }
    });
  });

  // 지침 변경 시 자동 저장
  document.querySelectorAll('.agent-guide').forEach(textarea => {
    textarea.addEventListener('input', saveGuidesToStorage);
  });

  updateStepIndicator();
  loadGuidesFromStorage();
}

function updateTime() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function addChatMessage(agentId, message) {
  const container = getActiveContainer();
  if (!container) return;

  const welcome = container.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  let agent = agents.find(a => a.id === agentId);
  if (agentId === 'master') {
    agent = { name: '총괄 디렉터 (MASTER)', icon: '<i class="fa-solid fa-crown"></i>' };
  }

  const msgHTML = `
    <div class="chat-msg msg-${agentId}">
      <div class="chat-avatar">${agent.icon}</div>
      <div class="chat-content">
        <div class="chat-meta">
          <span class="chat-name">${agent.name}</span>
          <span class="chat-time">${updateTime()}</span>
        </div>
        <div class="chat-text">${message}</div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', msgHTML);
  container.scrollTop = container.scrollHeight;
}

function addSummary(agent, text) {
  const container = document.getElementById('summary-content');
  const empty = container.querySelector('.empty-state');
  if (empty) empty.remove();

  const summaryHTML = `
    <div class="summary-card ${agent.id}">
      <div class="sc-header">
        ${agent.icon} <span>${agent.name}</span>
      </div>
      <div>${text}</div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', summaryHTML);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemini(systemPrompt, userMessage, retryCount = 0, isMaster = false) {
  const mode = localStorage.getItem('dnf_api_mode') || '1';

  let apiKey, model;

  if (mode === '2') {
    // 고급 모드: 에이전트/마스터 분리
    apiKey = localStorage.getItem('dnf_gemini_key_adv');
    model = isMaster
      ? (localStorage.getItem('dnf_model_master') || 'gemini-2.5-pro')
      : (localStorage.getItem('dnf_model_agent') || 'gemini-2.5-flash');
  } else {
    // 기본 모드
    apiKey = localStorage.getItem('dnf_gemini_key');
    model = localStorage.getItem('dnf_gemini_model') || 'gemini-2.5-flash';
  }

  if (!apiKey) {
    throw new Error(
      'API 키가 설정되지 않았습니다. 우측 상단 설정에서 입력해주세요.'
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents:[{
          role: 'user',
          parts: [{ text: userMessage }]
        }],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7
        }
      })
    });

    if(!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || res.statusText;
      
      // 503 오류 발생 시 최대 5번 재시도
      if (res.status === 503 && retryCount < 5) {
        const waitTime = 2000 * (retryCount + 1);
        await delay(waitTime);
        return callGemini(systemPrompt, userMessage, retryCount + 1, isMaster);
      }

      throw new Error(`API 오류 (${res.status}): ${msg}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text
      || '응답이 없습니다.';
  } catch (error) {
    if (retryCount < 5 && (error.message.includes('503') || error.message.includes('fetch'))) {
      const waitTime = 2000 * (retryCount + 1);
      await delay(waitTime);
      return callGemini(systemPrompt, userMessage, retryCount + 1, isMaster);
    }
    throw error;
  }
}

async function startMeeting() {
  const input = document.getElementById('agenda-input').value.trim();
  if (!input) {
    alert('기획 안건을 입력해주세요.');
    return;
  }

  // 첨부 파일 내용 합치기
  let fullAgenda = input;
  if (attachedFiles.length > 0) {
    fullAgenda += '\n\n[첨부 자료 참고]\n';
    attachedFiles.forEach(file => {
      fullAgenda += `\n--- 파일명: ${file.name} ---\n${file.content}\n`;
    });
  }

  if (isMeeting) return;
  isMeeting = true;

  const btnStart = document.getElementById('btn-start');
  btnStart.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 분석 중...';
  btnStart.disabled = true;

  document.getElementById('chat-container').innerHTML = '';
  document.getElementById('summary-content').innerHTML = '';

  // 각 에이전트 응답을 수집하여 다음 에이전트가 참고할 수 있도록 저장
  const agentResponses = [];

  // 에이전트별 기본 지침 (v1.1 공용 — 추가 지침과 합산)
  const agentSystemPrompts = [
  // SYSTEM
  `당신은 DNF 수석 시스템 기획자입니다.

[역할]
제시된 기획 아이디어의 시스템 구조를 설계합니다.

[사고 방식]
- 유저 문제 정의 → 핵심 기능 범위 설정
- 조건 분기 및 예외 처리 설계
- 타 시스템 연동 영향 검토
- A/B안 구조 비교 및 기존 DNF 시스템 충돌 여부
- 신규 시스템 필요 여부 및 구현 공수 판단

[출력 형식 — 각 항목 반드시 1줄 이내]
[결론] 1줄
[핵심 근거] 최대 3개 (각 1줄, 불릿)
[조건/예외] 최대 2개 (각 1줄, 불릿)
[리스크] 최대 2개 (각 1줄, 불릿)
[미확정] 최대 2개 (각 1줄, 불릿)

[출력 규칙]
- 전체 400자 이내 엄수. 초과 시 미확정 항목부터 축소
- 각 항목은 반드시 1줄. 줄바꿈 후 이어서 쓰는 것 금지
- 완전한 문장 대신 "핵심어 + 이유" 형태로 압축
- "고려해야 합니다" 등 모호한 표현 금지
- 결론 없이 나열만 하는 것 금지
- 근거 없는 동의 금지`,

  // CONTENT
  `당신은 DNF 콘텐츠 & 라이브 기획자입니다.

[역할]
유저 경험 설계, 라이브 서비스 리스크, 업데이트 타이밍을 담당합니다.

[사고 방식]
- 헤비/캐주얼/복귀/신규 유저별 경험 차이 분석
- PU(과금유저) 자산 보호 관점 리스크
- 강제 변경 vs 선택권 부여 방향 판단
- 기존 검증된 UI 패턴 재활용 우선

[출력 형식 — 각 항목 반드시 1줄 이내]
[결론] 1줄
[세그먼트 영향] 헤비/캐주얼/복귀 각 1줄 (불릿)
[리스크] 최대 2개 (각 1줄, 불릿)
[SYSTEM 검토] 수용 또는 반박 1줄 (반박 시 대안 포함)
[미확정] 최대 2개 (각 1줄, 불릿)

[출력 규칙]
- 전체 400자 이내 엄수. 초과 시 미확정 항목부터 축소
- 각 항목은 반드시 1줄. 줄바꿈 후 이어서 쓰는 것 금지
- 완전한 문장 대신 "핵심어 + 이유" 형태로 압축
- "고려해야 합니다" 등 모호한 표현 금지
- SYSTEM 검토는 반드시 수용/반박 중 하나 명시
- 근거 없는 동의 금지`,

  // OPS
  `당신은 DNF 운영 & UX 담당자입니다.

[역할]
커뮤니티 반응 예측, UI 정합성, CS 이슈를 담당합니다.

[사고 방식]
- DNF갤/루리웹/공식카페 예상 반응 구체적 예측
- CS 이슈 유형 및 대응 방향 선제 도출
- 기존 DNF UI 패턴 준수 여부 검토
- 일방적 변경 금지 원칙 — 선택지 제공 구조 권고

[출력 형식 — 각 항목 반드시 1줄 이내]
[결론] 1줄
[커뮤니티] 긍정 1줄 / 부정 1줄 (불릿)
[CS 이슈] 최대 2개 (각 1줄, 불릿)
[UI 정합성] 1줄
[SYSTEM 검토] 수용 또는 반박 1줄 (반박 시 대안 포함)
[CONTENT 검토] 수용 또는 반박 1줄 (반박 시 대안 포함)
[미확정] 최대 2개 (각 1줄, 불릿)

[출력 규칙]
- 전체 500자 이내 엄수. 초과 시 미확정 항목부터 축소
- 각 항목은 반드시 1줄. 줄바꿈 후 이어서 쓰는 것 금지
- 완전한 문장 대신 "핵심어 + 이유" 형태로 압축
- SYSTEM/CONTENT 검토는 반드시 수용/반박 중 하나 명시
- "유저들이 좋아할 것 같다" 근거 없는 낙관 금지
- 근거 없는 동의 금지`
];

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];

    document.querySelectorAll('.step')
      .forEach(el => el.classList.remove('active'));
    const stepEl = document.getElementById(`step-${i}`);
    if(stepEl) stepEl.classList.add('active');

    const guideEl = document.querySelector(
      `.agent-card.${agent.id} .agent-guide`
    );
    const userGuide = guideEl?.value?.trim() || "";
    
    const basePrompt = agentSystemPrompts[i];
    const systemPrompt = userGuide
      ? `${basePrompt}\n\n[추가 지침 — 아래 내용을 기본 지침에 더해 반영할 것]\n${userGuide}`
      : basePrompt;

    // 이전 에이전트 의견 컨텍스트 구성
    let prevContext = '';
    if (agentResponses.length > 0) {
      prevContext = '\n\n[이전 에이전트 의견 참고]\n';
      agentResponses.forEach((r, idx) => {
        prevContext += `\n--- ${agents[idx].name} 의견 ---\n${r}\n`;
      });
      prevContext += '\n위 내용을 참고하여, 동의하거나 반론할 부분을 명확히 구분하여 리포트를 작성하시오.';
    }

    addChatMessage(agent.id, '<i class="fa-solid fa-spinner fa-spin"></i> 분석 중...');

    try {
      const userMsg = `다음 기획 아이디어에 대해 당신의 전문 관점에서 구조화된 리포트를 작성하시오:\n\n[안건]\n${fullAgenda}${prevContext}`;
      const response = await callGemini(systemPrompt, userMsg);

      agentResponses.push(response);

      const msgs = document.querySelectorAll(`.chat-msg.msg-${agent.id}`);
      const lastMsg = msgs[msgs.length - 1];
      if(lastMsg) {
        lastMsg.querySelector('.chat-text').innerHTML =
          response.replace(/\n/g, '<br>');
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      addSummary(agent, response.slice(0, 100) + '...');

    } catch(err) {
      agentResponses.push(`[오류로 인한 응답 없음]`);
      const msgs = document.querySelectorAll(`.chat-msg.msg-${agent.id}`);
      const lastMsg = msgs[msgs.length - 1];
      if(lastMsg) {
        lastMsg.querySelector('.chat-text').innerHTML =
          `<span style="color:#f87171;">오류: ${err.message}</span>`;
      }
    }

    if(stepEl) {
      stepEl.classList.remove('active');
      stepEl.classList.add('done');
    }

    // 에이전트 간 간격 (API 부하 방지)
    if (i < agents.length - 1) {
      await delay(1000);
    }
  }

  btnStart.innerHTML = '<i class="fa-solid fa-check"></i> 회의 완료';
  document.getElementById('btn-summary').disabled = false;
  document.getElementById('btn-summary').classList.remove('disabled');
  document.getElementById('btn-show-result').style.display = 'flex';
  resultCache = '';
  isMeeting = false;
}

document.getElementById('btn-start')?.addEventListener('click', startMeeting);

// ── 첨부 파일 로직 ──
const btnAttach = document.getElementById('btn-attach');
const fileInput = document.getElementById('file-input');
const attachedFilesContainer = document.getElementById('attached-files-container');

btnAttach?.addEventListener('click', () => fileInput?.click());

fileInput?.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  for (const file of files) {
    // 중복 체크
    if (attachedFiles.some(f => f.name === file.name)) continue;

    try {
      const content = await readFileAsText(file);
      attachedFiles.push({ name: file.name, content });
      renderAttachedFiles();
    } catch (err) {
      console.error('파일 읽기 실패:', err);
      alert(`${file.name} 파일을 읽는 데 실패했습니다.`);
    }
  }
  fileInput.value = ''; // 초기화하여 동일 파일 재선택 가능하게 함
});

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

function renderAttachedFiles() {
  if (!attachedFilesContainer) return;
  attachedFilesContainer.innerHTML = attachedFiles.map((file, index) => `
    <div class="file-tag">
      <i class="fa-solid fa-file-lines"></i>
      <span>${file.name}</span>
      <i class="fa-solid fa-xmark btn-remove-file" data-index="${index}"></i>
    </div>
  `).join('');

  document.querySelectorAll('.btn-remove-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      attachedFiles.splice(index, 1);
      renderAttachedFiles();
    });
  });
}

document.getElementById('btn-reset')?.addEventListener('click', () => {
  if (!confirm('모든 회의 탭과 입력 내용을 초기화할까요?')) return;

  // 아젠다 초기화
  document.getElementById('agenda-input').value = '';
  localStorage.removeItem('dnf_agenda_draft');
  attachedFiles = [];
  renderAttachedFiles();

  // 탭 초기화 - 탭 1만 남기고 삭제
  tabs = [{ id: 0, title: '회의 1', agenda: '' }];
  activeTab = 0;
  tabCounter = 1;

  // 탭 헤더 초기화
  const tabsEl = document.getElementById('meeting-tabs');
  tabsEl.innerHTML = `
    <button class="meeting-tab active" data-tab="0">
      <i class="fa-solid fa-comments"></i> 회의 1
    </button>
  `;
  tabsEl.querySelector('[data-tab="0"]').addEventListener('click', () => switchTab(0));

  // 탭 컨텐츠 초기화
  const contentsEl = document.getElementById('tab-contents');
  contentsEl.innerHTML = `
    <div class="tab-content active" data-tab="0">
      <div class="chat-container" id="chat-container-0">
        <div class="welcome-message">
          <i class="fa-brands fa-hubspot"></i>
          <p>기획 안건을 입력하고 회의를 시작하면, 이곳에 실시간 회의 로그가 순차적으로 기록됩니다.</p>
        </div>
      </div>
      <div class="excerpt-confirm-bar" style="display:none;">
        <span style="font-size:12px;color:var(--text-secondary);margin-right:auto;">선택한 문단으로 아젠다를 생성합니다</span>
        <button class="action-btn outline btn-excerpt-cancel" style="font-size:12px;padding:6px 12px;">취소</button>
        <button class="action-btn primary btn-excerpt-confirm" style="font-size:12px;padding:6px 12px;"><i class="fa-solid fa-bolt"></i> 아젠다 생성</button>
      </div>
    </div>
  `;

  // 요약/버튼 초기화
  document.getElementById('summary-content').innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-hourglass-empty"></i>
      <p>회의가 진행되면 요약이 생성됩니다.</p>
    </div>
  `;
  document.getElementById('btn-start').innerHTML = '<i class="fa-solid fa-bolt"></i> 회의 시작';
  document.getElementById('btn-start').disabled = false;
  document.getElementById('btn-summary').disabled = true;
  document.getElementById('btn-summary').classList.add('disabled');
  document.getElementById('btn-show-result').style.display = 'none';
  resultCache = '';
  const btnAR = document.getElementById('btn-agenda-recommend');
  if (btnAR) { btnAR.style.display = 'none'; btnAR.disabled = true; }
  window._lastAgentResponses = null;
  window._lastFullAgenda = null;

  document.querySelectorAll('.step').forEach(el => {
    el.classList.remove('active', 'done');
  });

  isMeeting = false;
});

document.getElementById('btn-summary')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-summary');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 종합 중...';
  btn.disabled = true;

  const chatMsgs = getActiveContainer()?.querySelectorAll('.chat-msg:not(.msg-master)') || [];
  let agentLogs = '';
  chatMsgs.forEach(msg => {
    const name = msg.querySelector('.chat-name')?.textContent || '';
    const text = msg.querySelector('.chat-text')?.innerText || '';
    if (text && !text.includes('분석 중') && !text.includes('오류')) {
      agentLogs += `[${name}]:\n${text}\n\n${'─'.repeat(40)}\n\n`;
    }
  });

  const masterGuide = `당신은 DNF 수석 기획 디렉터입니다.
앞선 에이전트들의 회의를 종합하여 기획 회의록을 작성하세요.

[검수 역할]
- 결론 빠진 것, 근거 없는 주장, 형식적 수용 지적

[출력 형식]

# 📋 DNF 기획 회의록
**회의 주제:** (1줄)
**참석:** 수석 시스템 기획자 · 콘텐츠 기획자 · 운영 담당자 · 수석 디렉터

---

## 1. 회의 배경 (3줄 이내)

## 2. 주요 논의

### (논점명)
- **제기:** 1줄
- **반론:** 1줄
- **결론:** 1줄

(아젠다 수만큼 반복, 각 3줄 이내)

## 3. 확정 방향 (3줄 이내)

## 4. 기획서 핵심 포인트
(5개 이내, 각 1줄)

## 5. 미결 사항
(3개 이내, 각 1줄)

[출력 규칙]
- 반드시 1200자 이내. 초과 시 섹션 4, 5 순으로 축소
- 마크다운 형식으로만 출력 (JSON 절대 금지)
- 에이전트 원문 절대 복사 금지, 핵심만 재구성
- 각 항목 1줄 엄수. 길게 서술 금지
- 논의 흐름(제기→반론→결론) 반드시 포함`;

  try {
    const agendaInput = document.getElementById('agenda-input').value;
    let fullAgenda = agendaInput;
    if (attachedFiles.length > 0) {
      fullAgenda += '\n\n[첨부 자료 명단]\n';
      attachedFiles.forEach(file => {
        fullAgenda += `- ${file.name}\n`;
      });
    }

    const masterResponse = await callGemini(
      masterGuide,
      `기획 안건: ${fullAgenda}\n\n${agentLogs}\n\n위 내용을 종합하여 최종 회의록을 작성해주세요.`,
      0, true  // isMaster = true → 고급 모드 시 Pro 모델 사용
    );

    addChatMessage('master',
      masterResponse.replace(/\n/g, '<br>')
    );

    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;

    btn.innerHTML = '<i class="fa-solid fa-crown"></i> 디렉터 최종 판단 완료';

    // 디렉터 완료 후 추천 아젠다 버튼 활성화
    const btnAgendaRecommend = document.getElementById('btn-agenda-recommend');
    if (btnAgendaRecommend) {
      btnAgendaRecommend.style.display = 'flex';
      btnAgendaRecommend.disabled = false;
      // 에이전트 응답 저장 (버튼 클릭 시 사용)
      window._lastAgentResponses = Array.from(
        document.querySelectorAll('.chat-msg:not(.msg-master)')
      ).map(msg => msg.querySelector('.chat-text')?.innerText || '');
      window._lastFullAgenda = document.getElementById('agenda-input').value;
    }
  } catch(err) {
    addChatMessage('master',
      `<span style="color:#f87171;">오류: ${err.message}</span>`
    );
    btn.innerHTML = '<i class="fa-solid fa-crown"></i> 오류 발생';
    btn.disabled = false;
  }
});

// Sidebar Collapse Logic
const btnCollapseSidebar = document.getElementById('btn-collapse-sidebar');
const sidebar = document.getElementById('sidebar');
const dashboardLayout = document.querySelector('.dashboard-layout');

if (btnCollapseSidebar) {
  btnCollapseSidebar.addEventListener('click', () => {
    if (sidebar) sidebar.classList.toggle('collapsed');
    if (dashboardLayout) dashboardLayout.classList.toggle('sidebar-collapsed');
  });
}

// Settings Modal Logic
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnSaveModal = document.getElementById('btn-save-modal');

function openModal() {
  const overlay = document.getElementById('settings-modal');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';

  try {
    // 저장된 모드 복원
    const savedMode = localStorage.getItem('dnf_api_mode') || '1';
    const modeRadio = document.querySelector(`input[name="api-mode"][value="${savedMode}"]`);
    if (modeRadio) modeRadio.checked = true;
    toggleModeSettings(savedMode);

    // 기본 모드 값 복원
    const keyInput = document.getElementById('api-key-input');
    const modelSelect = document.getElementById('model-select');
    if (keyInput) keyInput.value = localStorage.getItem('dnf_gemini_key') || '';
    if (modelSelect) modelSelect.value = localStorage.getItem('dnf_gemini_model') || 'gemini-2.5-flash';

    // 고급 모드 값 복원
    const keyInputAdv = document.getElementById('api-key-input-adv');
    const modelAgent = document.getElementById('model-select-agent');
    const modelMaster = document.getElementById('model-select-master');
    if (keyInputAdv) keyInputAdv.value = localStorage.getItem('dnf_gemini_key_adv') || '';
    if (modelAgent) modelAgent.value = localStorage.getItem('dnf_model_agent') || 'gemini-2.5-flash';
    if (modelMaster) modelMaster.value = localStorage.getItem('dnf_model_master') || 'gemini-2.5-pro';
  } catch(e) {}
}

function closeModal() {
  const overlay = document.getElementById('settings-modal');
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.style.display = 'none';
}

function toggleModeSettings(mode) {
  const s1 = document.getElementById('mode-1-settings');
  const s2 = document.getElementById('mode-2-settings');
  if (s1) s1.style.display = mode === '1' ? 'block' : 'none';
  if (s2) s2.style.display = mode === '2' ? 'block' : 'none';
}

// 모드 라디오 변경 이벤트
document.querySelectorAll('input[name="api-mode"]').forEach(radio => {
  radio.addEventListener('change', (e) => toggleModeSettings(e.target.value));
});

if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

const btnSettings = document.getElementById('btn-settings');
if (btnSettings) btnSettings.addEventListener('click', openModal);

if (btnSaveModal) {
  btnSaveModal.addEventListener('click', () => {
    try {
      const mode = document.querySelector('input[name="api-mode"]:checked')?.value || '1';
      localStorage.setItem('dnf_api_mode', mode);

      if (mode === '1') {
        const key = document.getElementById('api-key-input')?.value.trim();
        const model = document.getElementById('model-select')?.value;
        if (key) localStorage.setItem('dnf_gemini_key', key);
        if (model) localStorage.setItem('dnf_gemini_model', model);
      } else {
        const keyAdv = document.getElementById('api-key-input-adv')?.value.trim();
        const modelAgent = document.getElementById('model-select-agent')?.value;
        const modelMaster = document.getElementById('model-select-master')?.value;
        if (keyAdv) localStorage.setItem('dnf_gemini_key_adv', keyAdv);
        if (modelAgent) localStorage.setItem('dnf_model_agent', modelAgent);
        if (modelMaster) localStorage.setItem('dnf_model_master', modelMaster);
      }
    } catch(e) {}
    alert('설정이 저장되었습니다.');
    closeModal();
  });
}
// ── 회의 로그 다운로드 ──
function downloadChatLog() {
  const container = getActiveContainer();
  const msgs = container?.querySelectorAll('.chat-msg') || [];
  if(!msgs.length) { alert('다운로드할 회의 로그가 없습니다.'); return; }
  const tabTitle = tabs.find(t => t.id === activeTab)?.title || '회의';
  let log = `DNF 기획 ${tabTitle} 로그\n일시: ${new Date().toLocaleString('ko-KR')}\n${'='.repeat(50)}\n\n`;
  msgs.forEach(msg => {
    const name = msg.querySelector('.chat-name')?.textContent || '';
    const time = msg.querySelector('.chat-time')?.textContent || '';
    const text = msg.querySelector('.chat-text')?.innerText || '';
    log += `[${name}] ${time}\n${text}\n\n${'─'.repeat(40)}\n\n`;
  });
  const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `회의로그_${tabTitle}_${new Date().toLocaleDateString('ko-KR').replace(/\. /g,'').replace('.','')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
document.getElementById('btn-download-log')?.addEventListener('click', downloadChatLog);

// ── 로그 확장 ──
let isExpanded = false;
document.getElementById('btn-expand-log')?.addEventListener('click', () => {
  const meetingLog = document.querySelector('.meeting-log');
  const btn = document.getElementById('btn-expand-log');
  isExpanded = !isExpanded;
  if(isExpanded) {
    meetingLog.style.cssText = 'position:fixed;inset:16px;z-index:900;margin:0;border-radius:12px;';
    btn.innerHTML = '<i class="fa-solid fa-compress"></i>';
  } else {
    meetingLog.style.cssText = '';
    btn.innerHTML = '<i class="fa-solid fa-expand"></i>';
  }
});

// ── 회의 결과 팝업 ──
let resultCache = '';

function markdownToHtml(md) {
  return md
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>');
}

async function showResult() {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-content');
  modal.classList.remove('hidden');
  if(resultCache) { content.innerHTML = resultCache; return; }

  content.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>회의 결과 생성 중...</p></div>';

  const msgs = document.querySelectorAll('.chat-msg');
  if(!msgs.length) {
    content.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>회의 로그가 없습니다.</p></div>';
    return;
  }

  let agentLogs = '';
  msgs.forEach(msg => {
    const name = msg.querySelector('.chat-name')?.textContent || '';
    const text = msg.querySelector('.chat-text')?.innerText || '';
    agentLogs += `[${name}]:\n${text}\n\n`;
  });

  const agenda = document.getElementById('agenda-input')?.value || '';
  try {
    const summary = await callGemini(
      `당신은 수석 기획 디렉터입니다. 에이전트 회의 내용을 종합하여 아래 마크다운 형식으로 회의 결과를 작성하세요. JSON 절대 금지. 한국어. 결론만 나열하지 말고 논의 흐름이 보이도록 작성.

# 📋 기획 회의 결과
## 1. 회의 배경 및 목적
## 2. 주요 논의 흐름
### 아젠다 A: (논점)
- **제기:**
- **반론/보완:**
- **결론:**
## 3. 최종 확정 방향
## 4. 기획서 핵심 포인트
## 5. 미결 사항`,
      `기획 안건: ${agenda}\n\n${agentLogs}`
    );
    resultCache = markdownToHtml(summary);
    content.innerHTML = resultCache;
  } catch(err) {
    content.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>오류: ${err.message}</p></div>`;
  }
}

document.getElementById('btn-show-result')?.addEventListener('click', showResult);
document.getElementById('btn-close-result')?.addEventListener('click', () => {
  document.getElementById('result-modal').classList.add('hidden');
});
document.getElementById('result-modal')?.addEventListener('click', (e) => {
  if(e.target.id === 'result-modal') e.target.classList.add('hidden');
});

// ══════════════════════════════════════════════
// 아젠다 추천 시스템
// ══════════════════════════════════════════════

let allExtractedSignals = []; // 전체 신호 풀
let usedSignalIndices = [];   // 이미 사용된 신호 인덱스
let recommendRound = 0;       // 현재 추천 라운드

async function generateAgendaRecommendations(agentResponses, agenda) {
  allExtractedSignals = [];
  usedSignalIndices = [];
  recommendRound = 0;

  // 모달 열기 및 로딩 표시
  const modal = document.getElementById('agenda-modal');
  const list = document.getElementById('agenda-recommend-list');
  if (!modal || !list) return;
  modal.classList.remove('hidden');
  list.innerHTML = '<div class="agenda-loading"><i class="fa-solid fa-spinner fa-spin"></i> 다음 아젠다 분석 중...</div>';

  const combinedLog = agentResponses.join('\n\n---\n\n');

  try {
    const raw = await callGemini(
      `당신은 기획 회의 분석가입니다.
회의 내용에서 아래 3가지 신호를 찾아 JSON 배열로 반환하세요.
신호가 있는 것만 추출하고, 억지로 채우지 마세요.

신호1: "추후 논의", "미정", "확정 필요" 등 명시적 미결 표현
신호2: A안/B안처럼 결론은 났지만 세부가 빠진 것
신호3: 에이전트 간 의견이 갈렸는데 합의 없이 넘어간 것

반환 형식 (JSON만, 다른 텍스트 없이):
[
  {
    "type": "신호1|신호2|신호3",
    "title": "아젠다 제목 (20자 이내)",
    "reason": "왜 다음 회의가 필요한가 (30자 이내)",
    "quote": "관련 발언 핵심 (30자 이내)"
  }
]`,
      `회의 안건: ${agenda}\n\n회의 내용:\n${combinedLog}`
    );

    const cleaned = raw.replace(/```json/g,'').replace(/```/g,'').trim();
    const signals = JSON.parse(cleaned);
    allExtractedSignals = Array.isArray(signals) ? signals : [];
    renderAgendaRecommendations();
  } catch(e) {
    list.innerHTML = '<div class="agenda-empty">신호를 추출하지 못했습니다.</div>';
  }
}

function renderAgendaRecommendations() {
  const list = document.getElementById('agenda-recommend-list');
  const rerollBtn = document.getElementById('btn-agenda-reroll');
  if (!list) return;

  // 이번 라운드에 사용할 신호 선택 (최대 4개)
  const available = allExtractedSignals
    .map((s, i) => ({ ...s, _idx: i }))
    .filter(s => !usedSignalIndices.includes(s._idx));

  const current = available.slice(0, 4);

  if (current.length === 0) {
    list.innerHTML = '<div class="agenda-empty">더 이상 추출할 아젠다가 없습니다.</div>';
    if (rerollBtn) {
      rerollBtn.disabled = true;
      rerollBtn.title = '신호 소진';
    }
    return;
  }

  // 사용된 인덱스 등록
  current.forEach(s => usedSignalIndices.push(s._idx));
  recommendRound++;

  const typeLabel = { '신호1': '미결', '신호2': '세부 미확정', '신호3': '이견 미합의' };
  const typeColor = { '신호1': '#f87171', '신호2': '#fbbf24', '신호3': '#60a5fa' };

  const html = current.map((s, i) => `
    <div class="agenda-card" data-idx="${s._idx}">
      <div class="agenda-card-top">
        <span class="agenda-type-badge" style="background:${typeColor[s.type] || '#888'}22;color:${typeColor[s.type] || '#888'}">
          ${typeLabel[s.type] || s.type}
        </span>
        <button class="agenda-select-btn" onclick="selectAgenda(${s._idx})">
          이 아젠다로 회의
        </button>
      </div>
      <div class="agenda-card-title">📌 ${s.title}</div>
      <div class="agenda-card-reason">${s.reason}</div>
      <div class="agenda-card-quote">"${s.quote}"</div>
    </div>
  `).join('');

  // 이전 라운드 흐리게 유지
  const prevItems = list.querySelectorAll('.agenda-card:not(.prev-round)');
  prevItems.forEach(el => {
    el.classList.add('prev-round');
    el.style.opacity = '0.4';
    el.querySelector('.agenda-select-btn')?.remove();
  });

  list.insertAdjacentHTML('beforeend', html);

  // 리롤 버튼 상태 업데이트
  const remaining = allExtractedSignals.filter(
    (_, i) => !usedSignalIndices.includes(i)
  ).length;

  if (rerollBtn) {
    rerollBtn.disabled = remaining === 0;
    rerollBtn.title = remaining > 0
      ? `${remaining}개 신호 남음`
      : '신호 소진';
  }
}

window.selectAgenda = selectAgenda;
async function selectAgenda(signalIdx) {
  const signal = allExtractedSignals[signalIdx];
  if (!signal) return;

  const newAgenda = `[${signal.title}] 구체화 회의\n\n이전 회의에서 미확정된 사항:\n- ${signal.reason}\n\n관련 맥락: "${signal.quote}"`;

  // 확인 팝업 표시
  const confirmModal = document.getElementById('agenda-confirm-modal');
  const previewEl = document.getElementById('agenda-confirm-preview');
  if (!confirmModal || !previewEl) return;

  previewEl.textContent = newAgenda;
  confirmModal.classList.remove('hidden');

  // 확인 버튼
  document.getElementById('btn-agenda-confirm-ok').onclick = () => {
    confirmModal.classList.add('hidden');
    document.getElementById('agenda-modal')?.classList.add('hidden');

    // 새 탭 생성
    const newTabId = addNewTab(newAgenda);
    if (newTabId === false) return;

    // 아젠다 입력란 업데이트
    document.getElementById('agenda-input').value = newAgenda;
    saveAgendaToStorage();

    // 에이전트 지침 컨텍스트 추가
    const contextAdd = `\n\n[이번 회의 컨텍스트]\n이전 미확정: ${signal.title}\n집중 논의: ${signal.reason}`;
    document.querySelectorAll('.agent-guide').forEach(textarea => {
      textarea.value = textarea.value + contextAdd;
    });
    saveGuidesToStorage();

    // 요약/버튼 초기화
    document.getElementById('summary-content').innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-hourglass-empty"></i>
        <p>회의가 진행되면 요약이 생성됩니다.</p>
      </div>
    `;
    document.getElementById('btn-start').innerHTML = '<i class="fa-solid fa-bolt"></i> 회의 시작';
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-summary').disabled = true;
    document.getElementById('btn-summary').classList.add('disabled');
    document.getElementById('btn-show-result').style.display = 'none';
    const btnAR = document.getElementById('btn-agenda-recommend');
    if (btnAR) { btnAR.style.display = 'none'; btnAR.disabled = true; }
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active', 'done'));
    isMeeting = false;
  };

  document.getElementById('btn-agenda-confirm-cancel').onclick = () => {
    confirmModal.classList.add('hidden');
  };
}

function showContextUpdatePreview(signal) {
  const preview = document.getElementById('context-preview-modal');
  if (!preview) return;

  const contextAdd = `\n\n[이번 회의 컨텍스트 - 자동 추가]\n이전 회의 미확정: ${signal.title}\n집중 논의 사항: ${signal.reason}`;

  preview.querySelector('#context-preview-text').textContent = contextAdd;
  preview.classList.remove('hidden');

  // 확인 버튼
  document.getElementById('btn-context-confirm').onclick = () => {
    // 각 에이전트 지침에 컨텍스트 추가 (덮어쓰기 아님)
    document.querySelectorAll('.agent-guide').forEach(textarea => {
      textarea.value = textarea.value + contextAdd;
    });
    preview.classList.add('hidden');
    document.getElementById('agenda-modal')?.classList.add('hidden');
  };

  document.getElementById('btn-context-cancel').onclick = () => {
    preview.classList.add('hidden');
    document.getElementById('agenda-modal')?.classList.add('hidden');
  };
}

// 리롤 버튼
document.getElementById('btn-agenda-reroll')?.addEventListener('click', () => {
  renderAgendaRecommendations();
});

// 아젠다 모달 닫기
document.getElementById('btn-agenda-modal-close')?.addEventListener('click', () => {
  document.getElementById('agenda-modal')?.classList.add('hidden');
});

// 추천 아젠다 버튼 (디렉터 완료 후 활성화)
document.getElementById('btn-agenda-recommend')?.addEventListener('click', () => {
  if (window._lastAgentResponses && window._lastFullAgenda) {
    generateAgendaRecommendations(window._lastAgentResponses, window._lastFullAgenda);
  }
});

// ══════════════════════════════════════════════
// 발췌 회의 — 문단 체크박스
// ══════════════════════════════════════════════

function enableExcerptMode() {
  const msgs = document.querySelectorAll('.chat-msg');
  msgs.forEach((msg, i) => {
    if (msg.querySelector('.excerpt-checkbox')) return;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'excerpt-checkbox';
    checkbox.dataset.idx = i;
    msg.style.position = 'relative';
    msg.insertBefore(checkbox, msg.firstChild);
  });

  const btn = document.getElementById('btn-excerpt-mode');
  const confirmBar = document.getElementById('excerpt-confirm-bar');
  if (btn) btn.style.display = 'none';
  if (confirmBar) confirmBar.style.display = 'flex';
}

async function confirmExcerpt() {
  const checked = document.querySelectorAll('.excerpt-checkbox:checked');
  if (checked.length === 0) {
    alert('선택한 문단이 없습니다.');
    return;
  }

  let excerptText = '';
  checked.forEach(cb => {
    const msg = cb.closest('.chat-msg');
    const name = msg.querySelector('.chat-name')?.textContent || '';
    const text = msg.querySelector('.chat-text')?.innerText || '';
    excerptText += `[${name}]: ${text}\n\n`;
  });

  // 로딩
  const confirmBar = document.getElementById('excerpt-confirm-bar');
  if (confirmBar) confirmBar.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> 아젠다 생성 중...';

  try {
    const result = await callGemini(
      `선택된 회의 내용을 분석하여 구체화 아젠다를 생성하세요.
JSON으로만 반환하세요:
{
  "title": "아젠다 제목 (25자 이내)",
  "unresolved": ["미확정 사항1", "미확정 사항2"],
  "context": "이번 회의 집중 논의 방향 (50자 이내)"
}`,
      excerptText
    );

    const cleaned = result.replace(/```json/g,'').replace(/```/g,'').trim();
    const parsed = JSON.parse(cleaned);

    // 아젠다 설정
    const agendaInput = document.getElementById('agenda-input');
    agendaInput.value =
      `[${parsed.title}]\n\n미확정 사항:\n${parsed.unresolved.map(u => `- ${u}`).join('\n')}\n\n방향: ${parsed.context}`;

    // 지침 컨텍스트 추가 미리보기
    showContextUpdatePreview({
      title: parsed.title,
      reason: parsed.context
    });

    // 체크박스 제거
    document.querySelectorAll('.excerpt-checkbox').forEach(cb => cb.remove());
    const btn = document.getElementById('btn-excerpt-mode');
    if (btn) btn.style.display = 'flex';

  } catch(e) {
    if (confirmBar) confirmBar.innerHTML =
      `<span style="color:#f87171">오류: ${e.message}</span>`;
  }
}

function cancelExcerpt() {
  document.querySelectorAll('.excerpt-checkbox').forEach(cb => cb.remove());
  const btn = document.getElementById('btn-excerpt-mode');
  const confirmBar = document.getElementById('excerpt-confirm-bar');
  if (btn) btn.style.display = 'flex';
  if (confirmBar) confirmBar.style.display = 'none';
}

document.getElementById('btn-excerpt-mode')?.addEventListener('click', enableExcerptMode);
document.getElementById('btn-excerpt-confirm')?.addEventListener('click', confirmExcerpt);
document.getElementById('btn-excerpt-cancel')?.addEventListener('click', cancelExcerpt);

// ══════════════════════════════════════════════
// 탭 기반 발췌 회의 및 초기화
// ══════════════════════════════════════════════

// 기존 발췌 함수 오버라이드
enableExcerptMode = function() {
  const container = getActiveContainer();
  if (!container) return;
  const msgs = container.querySelectorAll('.chat-msg');
  msgs.forEach((msg) => {
    if (msg.querySelector('.excerpt-checkbox')) return;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'excerpt-checkbox';
    msg.style.position = 'relative';
    msg.insertBefore(checkbox, msg.firstChild);
  });
  const btn = document.getElementById('btn-excerpt-mode');
  const activeContent = document.querySelector('.tab-content.active');
  const confirmBar = activeContent?.querySelector('.excerpt-confirm-bar');
  if (btn) btn.style.display = 'none';
  if (confirmBar) confirmBar.style.display = 'flex';
};

// 이벤트 위임으로 탭별 발췌 버튼 처리
document.getElementById('tab-contents')?.addEventListener('click', (e) => {
  if (e.target.closest('.btn-excerpt-confirm')) {
    // 현재 활성 탭의 체크된 항목 처리
    const checked = document.querySelectorAll('.excerpt-checkbox:checked');
    if (!checked.length) { alert('선택한 문단이 없습니다.'); return; }
    let excerptText = '';
    checked.forEach(cb => {
      const msg = cb.closest('.chat-msg');
      const name = msg.querySelector('.chat-name')?.textContent || '';
      const text = msg.querySelector('.chat-text')?.innerText || '';
      excerptText += `[${name}]: ${text}\n\n`;
    });
    const activeContent = document.querySelector('.tab-content.active');
    const confirmBar = activeContent?.querySelector('.excerpt-confirm-bar');
    if (confirmBar) confirmBar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 아젠다 생성 중...';
    callGemini(
      `선택된 내용으로 구체화 아젠다를 JSON으로 반환:
{"title":"제목(25자이내)","unresolved":["항목1","항목2"],"context":"방향(50자이내)"}`,
      excerptText
    ).then(result => {
      try {
        const parsed = JSON.parse(result.replace(/```json/g,'').replace(/```/g,'').trim());
        const newAgenda = `[${parsed.title}]\n\n미확정 사항:\n${parsed.unresolved.map(u=>`- ${u}`).join('\n')}\n\n방향: ${parsed.context}`;
        document.getElementById('agenda-input').value = newAgenda;
        saveAgendaToStorage();
        document.querySelectorAll('.excerpt-checkbox').forEach(cb => cb.remove());
        document.getElementById('btn-excerpt-mode').style.display = 'flex';
        if (confirmBar) { confirmBar.style.display = 'none'; confirmBar.innerHTML = `<span style="font-size:12px;color:var(--text-secondary);margin-right:auto;">선택한 문단으로 아젠다를 생성합니다</span><button class="action-btn outline btn-excerpt-cancel" style="font-size:12px;padding:6px 12px;">취소</button><button class="action-btn primary btn-excerpt-confirm" style="font-size:12px;padding:6px 12px;"><i class="fa-solid fa-bolt"></i> 아젠다 생성</button>`; }
      } catch(err) { if (confirmBar) confirmBar.innerHTML = `<span style="color:#f87171">파싱 오류</span>`; }
    }).catch(err => { if (confirmBar) confirmBar.innerHTML = `<span style="color:#f87171">오류: ${err.message}</span>`; });
  }
  if (e.target.closest('.btn-excerpt-cancel')) {
    document.querySelectorAll('.excerpt-checkbox').forEach(cb => cb.remove());
    document.getElementById('btn-excerpt-mode').style.display = 'flex';
    const activeContent = document.querySelector('.tab-content.active');
    const confirmBar = activeContent?.querySelector('.excerpt-confirm-bar');
    if (confirmBar) confirmBar.style.display = 'none';
  }
});

// ── 초기화 ──
initAgents();
loadAgendaFromStorage();

// 아젠다 입력 시 자동 저장
document.getElementById('agenda-input')?.addEventListener('input', saveAgendaToStorage);

// 탭 0 클릭 이벤트
document.querySelector('[data-tab="0"]')?.addEventListener('click', () => switchTab(0));
