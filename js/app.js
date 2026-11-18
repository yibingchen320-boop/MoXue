// ============================================================
//  墨学 · 中考备考 — 应用逻辑
//  全局数据在 window.MOXUE_DATA 中，由 data.js 从 JSON 加载
// ============================================================

// 数据容器（data.js 会填充）
var MOXUE_DATA = {
  EZ_WORDS: [],
  CLASSICAL_TEXTS: [],
  ESSAY_MATERIALS: [],
  READING_TIPS: [],
  ENGLISH_WORDS: [],
  TENSES: [],
  COLLOCATIONS: [],
  TRANSLATION_SENTENCES: []
};

// 数据加载
function loadData(callback) {
  var files = {
    EZ_WORDS: 'data/chinese-ezwords.json',
    CLASSICAL_TEXTS: 'data/chinese-classical.json',
    ESSAY_MATERIALS: 'data/chinese-essay.json',
    READING_TIPS: 'data/chinese-reading.json',
    ENGLISH_WORDS: 'data/english-words.json',
    TENSES: 'data/english-tenses.json',
    COLLOCATIONS: 'data/english-collocations.json',
    TRANSLATION_SENTENCES: 'data/english-translations.json'
  };
  var keys = Object.keys(files);
  var loaded = 0;
  keys.forEach(function(key) {
    fetch(files[key])
      .then(function(r) { return r.json(); })
      .then(function(data) {
        MOXUE_DATA[key] = data;
        loaded++;
        if (loaded === keys.length) callback();
      })
      .catch(function(err) {
        console.error('Failed to load ' + files[key] + ':', err);
        loaded++;
        if (loaded === keys.length) callback();
      });
  });
}

// ============================================================
//  数据管理（localStorage）
// ============================================================
function loadState() {
  try {
    return JSON.parse(localStorage.getItem('moxue_state') || '{}');
  } catch(e) { return {}; }
}
function saveState(s) {
  localStorage.setItem('moxue_state', JSON.stringify(s));
}
var state = Object.assign({
  learnedWords: [],
  dictationCount: 0,
  errors: [],
  streak: 0,
  lastDate: null
}, loadState());

// 计算streak
function updateStreak() {
  var today = new Date().toDateString();
  if (state.lastDate !== today) {
    var yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.lastDate === yesterday) {
      state.streak++;
    } else if (state.lastDate === null) {
      state.streak = 1;
    } else {
      state.streak = 1;
    }
    state.lastDate = today;
    saveState(state);
  }
  document.getElementById('streakDays').textContent = state.streak;
}

// 更新首页统计
function updateHomeStats() {
  document.getElementById('totalWords').textContent = state.learnedWords.length;
  document.getElementById('totalDictations').textContent = state.dictationCount;
  document.getElementById('totalErrors').textContent = state.errors.length;
  var total = MOXUE_DATA.ENGLISH_WORDS.length + MOXUE_DATA.EZ_WORDS.length;
  var pct = total > 0 ? Math.min(100, (state.learnedWords.length / total) * 100) : 0;
  document.getElementById('progressFill').style.width = pct + '%';
}

// ============================================================
//  页面导航
// ============================================================
function goTo(pageId) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active', 'fade-in');
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  if (pageId === 'page-home') document.querySelectorAll('.nav-item')[0].classList.add('active');
  else if (pageId === 'page-dictation') document.querySelectorAll('.nav-item')[1].classList.add('active');
  else if (pageId === 'page-errors') document.querySelectorAll('.nav-item')[2].classList.add('active');

  if (pageId === 'page-ezwords') renderEZWords('all');
  if (pageId === 'page-classical') renderClassical();
  if (pageId === 'page-essay') renderEssay('all');
  if (pageId === 'page-reading') renderReading();
  if (pageId === 'page-wordlist') renderWordList();
  if (pageId === 'page-tense') renderTenses();
  if (pageId === 'page-collocation') renderCollocations();
  if (pageId === 'page-dictation') renderDictIntro();
  if (pageId === 'page-errors') renderErrors();
  if (pageId === 'page-home') updateHomeStats();
}

function switchSubject(subject) {
  document.querySelectorAll('.subject-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelector('[data-subject="' + subject + '"]').classList.add('active');
  document.getElementById('modules-chinese').style.display = subject === 'chinese' ? 'flex' : 'none';
  document.getElementById('modules-english').style.display = subject === 'english' ? 'flex' : 'none';
}

// ============================================================
//  语文：易错字词
// ============================================================
function renderEZWords(filter) {
  var list = document.getElementById('ezwords-list');
  list.innerHTML = '';
  MOXUE_DATA.EZ_WORDS.filter(function(w) { return filter === 'all' || w.type === filter; }).forEach(function(w) {
    var div = document.createElement('div');
    div.className = 'word-entry fade-in';
    div.innerHTML =
      '<div class="word">' + w.word +
      ' <span class="pinyin">' + w.pinyin + '</span>' +
      ' <span class="tag">' + w.tag + '</span></div>' +
      '<div class="explain">' + w.explain + '</div>' +
      (w.wrong ? '<div class="wrong-example">&#9888; ' + w.wrong + '</div>' : '');
    list.appendChild(div);
  });
}

function filterEZ(filter) {
  document.querySelectorAll('#page-ezwords .filter-tab').forEach(function(t) { t.classList.remove('active'); });
  event.target.classList.add('active');
  renderEZWords(filter);
}

// ============================================================
//  语文：文言文
// ============================================================
function renderClassical() {
  var list = document.getElementById('classical-list');
  list.innerHTML = '';
  MOXUE_DATA.CLASSICAL_TEXTS.forEach(function(t) {
    var div = document.createElement('div');
    div.className = 'classical-card fade-in';
    var kp = t.keyPoints.map(function(k) { return '<div class="kp-item">' + k + '</div>'; }).join('');
    div.innerHTML =
      '<div class="ctitle">' + t.title + '</div>' +
      '<div class="author">' + t.author + '</div>' +
      '<div class="original">' + t.original + '</div>' +
      '<div class="translation">' + t.translation + '</div>' +
      '<div class="key-points"><div class="kp-title">重点注释</div>' + kp + '</div>';
    list.appendChild(div);
  });
}

// ============================================================
//  语文：作文素材
// ============================================================
function renderEssay(filter) {
  var list = document.getElementById('essay-list');
  list.innerHTML = '';
  MOXUE_DATA.ESSAY_MATERIALS.filter(function(e) { return filter === 'all' || e.category === filter; }).forEach(function(e) {
    var div = document.createElement('div');
    div.className = 'essay-card fade-in';
    div.innerHTML =
      '<div class="category">' + e.category + '</div>' +
      '<div class="quote">' + e.quote + '</div>' +
      '<div class="source">' + e.source + '</div>' +
      '<div class="usage">' + e.usage + '</div>';
    list.appendChild(div);
  });
}

function filterEssay(filter) {
  document.querySelectorAll('#page-essay .filter-tab').forEach(function(t) { t.classList.remove('active'); });
  event.target.classList.add('active');
  renderEssay(filter);
}

// ============================================================
//  语文：阅读理解技巧
// ============================================================
function renderReading() {
  var list = document.getElementById('reading-list');
  list.innerHTML = '';
  MOXUE_DATA.READING_TIPS.forEach(function(r) {
    var card = document.createElement('div');
    card.className = 'classical-card fade-in';
    var items = r.items.map(function(i) { return '<div class="kp-item">' + i + '</div>'; }).join('');
    card.innerHTML =
      '<div class="ctitle">' + r.type + '</div>' +
      '<div class="key-points"><div class="kp-title">答题要点</div>' + items + '</div>';
    list.appendChild(card);
  });
}

// ============================================================
//  英语：单词列表
// ============================================================
function renderWordList() {
  var container = document.getElementById('wordlist-container');
  container.innerHTML = '';
  MOXUE_DATA.ENGLISH_WORDS.forEach(function(w) {
    var div = document.createElement('div');
    div.className = 'word-list-item fade-in';
    var related = w.related.map(function(r) {
      return '<span class="rel-word">' + r.word + '</span><span style="font-size:11px; color:var(--ink-faded)">' + r.note + '</span>';
    }).join(' <span class="arrow-icon">&rarr;</span> ');
    div.innerHTML =
      '<div class="en-word">' + w.word + '</div>' +
      '<div class="phonetic">' + w.phonetic + '</div>' +
      '<div class="cn-meaning">' + w.meaning + '</div>' +
      '<div class="collocations"><span class="label">搭配：</span>' + w.collocations + '</div>' +
      '<div class="example">e.g. ' + w.example + '</div>' +
      '<div class="related"><span class="label" style="color:var(--ink); font-weight:600">关联词：</span>' + related + '</div>';
    container.appendChild(div);
    if (state.learnedWords.indexOf(w.word) === -1) state.learnedWords.push(w.word);
  });
  saveState(state);
}

// ============================================================
//  英语：时态语态
// ============================================================
function renderTenses() {
  var list = document.getElementById('tense-list');
  list.innerHTML = '';
  MOXUE_DATA.TENSES.forEach(function(t) {
    var div = document.createElement('div');
    div.className = 'tense-card fade-in';
    var usageItems = t.usage.map(function(u) { return '<div class="li">' + u + '</div>'; }).join('');
    var examples = t.examples.map(function(e) {
      return '<div class="ex">' + e.en + '</div><div class="ex-cn">' + e.cn + '</div>';
    }).join('');
    div.innerHTML =
      '<div class="tense-name">' + t.name + '</div>' +
      '<div class="tense-en">' + t.en + '</div>' +
      '<div class="structure">' + t.structure + '</div>' +
      '<div class="usage-list">' + usageItems + '</div>' +
      '<div class="examples">' + examples + '</div>';
    list.appendChild(div);
  });
}

// ============================================================
//  英语：固定搭配
// ============================================================
function renderCollocations() {
  var list = document.getElementById('collocation-list');
  list.innerHTML = '';
  MOXUE_DATA.COLLOCATIONS.forEach(function(c) {
    var div = document.createElement('div');
    div.className = 'collocation-item fade-in';
    div.innerHTML =
      '<div class="phrase">' + c.phrase + '</div>' +
      '<div class="meaning">' + c.meaning + '</div>' +
      '<div class="ex-sentence">e.g. ' + c.example + '</div>';
    list.appendChild(div);
  });
}

// ============================================================
//  听写系统
// ============================================================
var dictSession = { questions: [], currentIdx: 0, answered: false, mode: 'all' };

function renderDictIntro() {
  document.getElementById('dictDone').textContent = state.dictationCount;
  document.getElementById('dictErrors').textContent = state.errors.length;
  document.getElementById('dict-intro').style.display = 'block';
  document.getElementById('dict-session').classList.remove('active');
}

function startDictation(mode) {
  dictSession.mode = mode;
  dictSession.currentIdx = 0;
  dictSession.answered = false;
  var questions = [];

  if (mode === 'errors' && state.errors.length > 0) {
    state.errors.forEach(function(e) { questions.push(e); });
  } else {
    // 8 words
    var shuffled = MOXUE_DATA.ENGLISH_WORDS.slice().sort(function() { return Math.random() - 0.5; });
    for (var i = 0; i < 8 && i < shuffled.length; i++) {
      questions.push({
        type: 'word', q: shuffled[i].word,
        hint: shuffled[i].meaning + ' (' + shuffled[i].phonetic + ')',
        answer: shuffled[i].word, collocations: shuffled[i].collocations
      });
    }
    // 5 collocations
    var shuffledCol = MOXUE_DATA.COLLOCATIONS.slice().sort(function() { return Math.random() - 0.5; });
    for (var j = 0; j < 5 && j < shuffledCol.length; j++) {
      questions.push({
        type: 'collocation', q: shuffledCol[j].meaning,
        hint: '固定搭配', answer: shuffledCol[j].phrase, example: shuffledCol[j].example
      });
    }
    // 2 translations
    var shuffledTr = MOXUE_DATA.TRANSLATION_SENTENCES.slice().sort(function() { return Math.random() - 0.5; });
    for (var k = 0; k < 2 && k < shuffledTr.length; k++) {
      questions.push({
        type: 'translation', q: shuffledTr[k].cn,
        hint: '提示：' + shuffledTr[k].hint,
        answer: shuffledTr[k].answer, points: shuffledTr[k].points
      });
    }
  }

  dictSession.questions = questions;
  document.getElementById('dict-intro').style.display = 'none';
  document.getElementById('dict-session').classList.add('active');
  showDictQuestion();
}

function showDictQuestion() {
  if (dictSession.currentIdx >= dictSession.questions.length) { finishDictation(); return; }
  dictSession.answered = false;
  var q = dictSession.questions[dictSession.currentIdx];
  var progress = ((dictSession.currentIdx) / dictSession.questions.length) * 100;
  document.getElementById('dictBar').style.width = progress + '%';
  document.getElementById('dictCount').textContent = (dictSession.currentIdx + 1) + '/' + dictSession.questions.length;

  var area = document.getElementById('dict-question-area');
  var typeLabel = q.type === 'word' ? '单词拼写' : (q.type === 'collocation' ? '固定搭配' : '翻译句子');

  if (q.type === 'translation') {
    area.innerHTML =
      '<div class="translation-card">' +
      '<div class="q-type">' + typeLabel + '</div>' +
      '<div class="cn-sentence">' + q.q + '</div>' +
      '<div class="hint">' + q.hint + '</div></div>';
  } else {
    area.innerHTML =
      '<div class="dict-question">' +
      '<div class="q-type">' + typeLabel + '</div>' +
      '<div class="q-cn">' + q.q + '</div>' +
      '<div class="q-hint">' + q.hint + '</div></div>';
  }

  document.getElementById('dictInput').value = '';
  document.getElementById('dictInput').style.display = 'block';
  document.getElementById('dictInput').focus();
  document.getElementById('dictResult').className = 'dict-result';
  document.getElementById('dictResult').innerHTML = '';
  document.getElementById('dictSubmitBtn').style.display = 'block';
  document.getElementById('dictNextBtn').style.display = 'none';
}

function submitDictAnswer() {
  if (dictSession.answered) return;
  dictSession.answered = true;
  var q = dictSession.questions[dictSession.currentIdx];
  var userInput = document.getElementById('dictInput').value.trim();
  var result = document.getElementById('dictResult');
  var isCorrect = false;

  if (q.type === 'translation') {
    var lowerInput = userInput.toLowerCase();
    var earnedPoints = [];
    q.points.forEach(function(p) {
      var keyWords = p.key.toLowerCase().split(/[\s\/]+/);
      var found = false;
      keyWords.forEach(function(kw) {
        if (kw.length > 2 && lowerInput.indexOf(kw) !== -1) found = true;
      });
      if (!found && lowerInput.length > 5) {
        var answerLower = q.answer.toLowerCase();
        var words = answerLower.split(/\s+/);
        var matchCount = 0;
        words.forEach(function(w) {
          if (w.length > 2 && lowerInput.indexOf(w) !== -1) matchCount++;
        });
        if (matchCount / words.length > 0.5) found = true;
      }
      if (found) earnedPoints.push(p);
    });
    var score = earnedPoints.length;
    isCorrect = score >= 2;
    var pointsHtml = q.points.map(function(p) {
      var earned = earnedPoints.indexOf(p) !== -1;
      return '<div class="sp-item"><span class="sp-check ' + (earned ? 'yes' : 'no') + '">' +
        (earned ? '&#10003;' : '&#10007;') + '</span><span>' + p.key + ' &mdash; ' + p.desc + '</span></div>';
    }).join('');
    result.className = 'dict-result show ' + (isCorrect ? 'correct' : 'wrong');
    result.innerHTML =
      '<div class="answer-label">参考答案：</div>' +
      '<div class="answer-text">' + q.answer + '</div>' +
      '<div class="scoring"><div class="sp-title">得分点（' + score + '/' + q.points.length + '）</div>' + pointsHtml + '</div>';
  } else {
    var userLower = userInput.toLowerCase().replace(/\s+/g, ' ');
    var answerLower = q.answer.toLowerCase().replace(/\s+/g, ' ');
    isCorrect = userLower === answerLower;
    result.className = 'dict-result show ' + (isCorrect ? 'correct' : 'wrong');
    var extra = '';
    if (q.type === 'word' && q.collocations) extra = '<div style="margin-top:4px; font-size:12px; color:var(--ink-light)">搭配：' + q.collocations + '</div>';
    if (q.type === 'collocation' && q.example) extra = '<div style="margin-top:4px; font-size:12px; color:var(--ink-light); font-style:italic">例：' + q.example + '</div>';
    result.innerHTML = (isCorrect ? '&#10003; 正确！' : '&#10007; 正确答案：') +
      (isCorrect ? '' : '<div class="answer-text">' + q.answer + '</div>') + extra;
  }

  if (!isCorrect) {
    state.errors.push({
      type: q.type, question: q.q, answer: q.answer, userInput: userInput,
      date: new Date().toLocaleDateString(), hint: q.hint || '', points: q.points || null
    });
    saveState(state);
  }

  document.getElementById('dictInput').style.display = 'none';
  document.getElementById('dictSubmitBtn').style.display = 'none';
  document.getElementById('dictNextBtn').style.display = 'block';
}

function nextDictQuestion() {
  dictSession.currentIdx++;
  showDictQuestion();
}

function finishDictation() {
  state.dictationCount++;
  saveState(state);
  document.getElementById('dict-session').classList.remove('active');
  document.getElementById('dict-intro').style.display = 'block';
  document.getElementById('dictDone').textContent = state.dictationCount;
  document.getElementById('dictErrors').textContent = state.errors.length;
  var area = document.getElementById('dict-question-area');
  area.innerHTML =
    '<div class="dict-question" style="min-height:180px">' +
    '<div class="q-type">完成</div>' +
    '<div style="font-family:Noto Serif SC,serif; font-size:18px; font-weight:700; margin:8px 0">本次听写完成！</div>' +
    '<div class="q-hint">共 ' + dictSession.questions.length + ' 题</div>' +
    '<div class="q-hint">累计听写 ' + state.dictationCount + ' 次</div></div>';
  document.getElementById('dictInput').style.display = 'none';
  document.getElementById('dictSubmitBtn').style.display = 'none';
  document.getElementById('dictNextBtn').style.display = 'none';
  updateHomeStats();
}

function quitDictation() {
  document.getElementById('dict-session').classList.remove('active');
  document.getElementById('dict-intro').style.display = 'block';
}

// Enter key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('dict-session').classList.contains('active')) {
    if (!dictSession.answered) submitDictAnswer();
    else nextDictQuestion();
  }
});

// ============================================================
//  错题本
// ============================================================
function renderErrors() {
  var list = document.getElementById('error-list');
  list.innerHTML = '';
  if (state.errors.length === 0) {
    list.innerHTML = '<div class="error-book-empty">还没有错题<br>完成听写后这里会显示错题记录</div>';
    return;
  }
  var sorted = state.errors.slice().reverse();
  sorted.forEach(function(e, idx) {
    var realIdx = state.errors.length - 1 - idx;
    var div = document.createElement('div');
    div.className = 'error-item fade-in';
    var typeLabel = e.type === 'word' ? '单词' : (e.type === 'collocation' ? '搭配' : '翻译');
    var content = '';
    if (e.type === 'translation' && e.points) {
      content = '<div class="e-q">' + e.question + '</div><div class="e-a">参考：' + e.answer + '</div><div class="e-date">' + e.date + '</div>';
    } else {
      content = '<div class="e-q">' + e.question + '</div><div class="e-a">答案：' + e.answer + '</div><div class="e-date">' + e.date + ' · 你的回答：' + (e.userInput || '—') + '</div>';
    }
    div.innerHTML = '<div class="e-type">' + typeLabel + '</div><div class="e-content">' + content + '</div><div class="e-del" onclick="deleteError(' + realIdx + ')">&times;</div>';
    list.appendChild(div);
  });
}

function deleteError(idx) {
  state.errors.splice(idx, 1);
  saveState(state);
  renderErrors();
  updateHomeStats();
}

// ============================================================
//  初始化
// ============================================================
loadData(function() {
  updateStreak();
  updateHomeStats();
});
