// ============================================================
//  墨学 · 中考备考 — 应用逻辑 v2
// ============================================================

var MOXUE_DATA = {
  EZ_WORDS: [], CLASSICAL_TEXTS: [], ESSAY_MATERIALS: [],
  READING_TIPS: [], ENGLISH_WORDS: [], TENSES: [],
  COLLOCATIONS: [], TRANSLATION_SENTENCES: []
};

// --- Data loading ---
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
  var keys = Object.keys(files), loaded = 0;
  keys.forEach(function(key) {
    fetch(files[key]).then(function(r) { return r.json(); }).then(function(data) {
      MOXUE_DATA[key] = data; loaded++;
      if (loaded === keys.length) callback();
    }).catch(function(err) { console.error('Load fail: ' + files[key], err); loaded++;
      if (loaded === keys.length) callback();
    });
  });
}

// --- State ---
function loadState() { try { return JSON.parse(localStorage.getItem('moxue_state') || '{}'); } catch(e) { return {}; } }
function saveState(s) { localStorage.setItem('moxue_state', JSON.stringify(s)); }
var state = Object.assign({ learnedWords: [], dictationCount: 0, errors: [], streak: 0, lastDate: null, checkedCollocations: [] }, loadState());

function updateStreak() {
  var today = new Date().toDateString();
  if (state.lastDate !== today) {
    var y = new Date(Date.now() - 86400000).toDateString();
    state.streak = (state.lastDate === y || state.lastDate === null) ? (state.lastDate === null ? 1 : state.streak + 1) : 1;
    state.lastDate = today; saveState(state);
  }
  document.getElementById('streakDays').textContent = state.streak;
}

function updateHomeStats() {
  document.getElementById('totalWords').textContent = state.learnedWords.length;
  document.getElementById('totalDictations').textContent = state.dictationCount;
  document.getElementById('totalErrors').textContent = state.errors.length;
  var total = MOXUE_DATA.ENGLISH_WORDS.length + MOXUE_DATA.EZ_WORDS.length;
  document.getElementById('progressFill').style.width = (total > 0 ? Math.min(100, state.learnedWords.length / total * 100) : 0) + '%';
}

// --- Speech ---
function speak(text) {
  if ('speechSynthesis' in window) {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.8;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
}

// --- Navigation ---
function goTo(pageId) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var page = document.getElementById(pageId);
  if (page) { page.classList.add('active', 'fade-in'); window.scrollTo(0, 0); }
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  if (pageId === 'page-home') document.querySelectorAll('.nav-item')[0].classList.add('active');
  else if (pageId === 'page-dictation') document.querySelectorAll('.nav-item')[1].classList.add('active');
  else if (pageId === 'page-errors') document.querySelectorAll('.nav-item')[2].classList.add('active');

  if (pageId === 'page-ezwords') renderEZWords('all');
  if (pageId === 'page-classical') renderClassical('all');
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

// --- Shuffle helper ---
function shuffle(arr) { return arr.slice().sort(function() { return Math.random() - 0.5; }); }
function sample(arr, n) { return shuffle(arr).slice(0, n); }

// ============================================================
//  语文：易错字词
// ============================================================
var ezCurrentFilter = 'all';
function renderEZWords(filter) {
  ezCurrentFilter = filter || ezCurrentFilter;
  var list = document.getElementById('ezwords-list');
  var pool = MOXUE_DATA.EZ_WORDS.filter(function(w) { return ezCurrentFilter === 'all' || w.type === ezCurrentFilter; });
  var items = pool.length > 15 ? sample(pool, 15) : pool;
  list.innerHTML = '';
  items.forEach(function(w) {
    var div = document.createElement('div');
    div.className = 'word-entry fade-in';
    div.innerHTML = '<div class="word">' + w.word +
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
//  语文：文言文字词积累
// ============================================================
var classicalCurrentCat = 'all';
function renderClassical(cat) {
  classicalCurrentCat = cat || classicalCurrentCat;
  var list = document.getElementById('classical-list');
  var pool = MOXUE_DATA.CLASSICAL_TEXTS.filter(function(t) {
    return classicalCurrentCat === 'all' || t.category === classicalCurrentCat;
  });
  var items = pool.length > 10 ? sample(pool, 10) : pool;
  list.innerHTML = '';
  items.forEach(function(t) {
    var div = document.createElement('div');
    div.className = 'classical-word-card fade-in';
    var meaningsHtml = '';
    if (t.meanings) {
      meaningsHtml = t.meanings.map(function(m) {
        return '<div class="cw-meaning">' +
          '<strong>' + m.meaning + '</strong>' +
          (m.example ? '<div class="cw-example">' + m.example + '</div>' : '') +
          (m.note ? '<div class="cw-note">' + m.note + '</div>' : '') +
          (m.source ? '<div class="cw-source">' + m.source + '</div>' : '') +
          '</div>';
      }).join('');
    }
    div.innerHTML =
      '<div class="cw-head">' +
        '<span class="cw-char">' + t.char + '</span>' +
        '<span class="cw-pinyin">' + t.pinyin + '</span>' +
        '<span class="cw-cat">' + t.category + '</span>' +
      '</div>' +
      (t.type ? '<div class="cw-type">' + t.type + '</div>' : '') +
      meaningsHtml;
    list.appendChild(div);
  });
}
function filterClassical(cat) {
  document.querySelectorAll('#page-classical .cat-tab').forEach(function(t) { t.classList.remove('active'); });
  event.target.classList.add('active');
  renderClassical(cat);
}

// ============================================================
//  语文：作文素材（随笔式）
// ============================================================
var essayCurrentFilter = 'all';
function renderEssay(filter) {
  essayCurrentFilter = filter || essayCurrentFilter;
  var list = document.getElementById('essay-list');
  var pool = MOXUE_DATA.ESSAY_MATERIALS.filter(function(e) {
    return essayCurrentFilter === 'all' || e.category === essayCurrentFilter;
  });
  list.innerHTML = '';
  pool.forEach(function(e) {
    var div = document.createElement('div');
    div.className = 'essay-passage-card fade-in';
    div.innerHTML =
      '<span class="ep-cat">' + e.category + '</span>' +
      '<div class="ep-title">' + e.title + '</div>' +
      '<div class="ep-content">' + e.content + '</div>';
    list.appendChild(div);
  });
}
function filterEssay(filter) {
  document.querySelectorAll('#page-essay .filter-tab').forEach(function(t) { t.classList.remove('active'); });
  event.target.classList.add('active');
  renderEssay(filter);
}

// ============================================================
//  语文：阅读理解（带练习题）
// ============================================================
function renderReading() {
  var list = document.getElementById('reading-list');
  list.innerHTML = '';
  MOXUE_DATA.READING_TIPS.forEach(function(r) {
    var div = document.createElement('div');
    div.className = 'reading-exercise-card fade-in';
    var html = '<span class="re-type">' + r.type + '</span>' +
      '<div class="re-title">' + r.title + '</div>' +
      '<div class="re-method"><span class="label">方法：</span>' + r.method + '</div>';
    if (r.answerTemplate) html += '<div class="re-template">答题模板：' + r.answerTemplate + '</div>';
    if (r.exercise) {
      html += '<div class="re-passage">' + r.exercise.passage +
        '<div class="src">' + r.exercise.title + '</div></div>' +
        '<div class="re-question">' + r.exercise.question + '</div>' +
        '<div class="re-answer"><span class="label">参考答案：</span>' + r.exercise.answer + '</div>' +
        '<div class="re-analysis"><span class="label">解析：</span>' + r.exercise.analysis + '</div>';
    }
    div.innerHTML = html;
    list.appendChild(div);
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
      return '<span class="rel-word">' + r.word + '</span><span style="font-size:11px;color:var(--ink-faded)">' + r.note + '</span>';
    }).join(' <span class="arrow-icon">&rarr;</span> ');
    div.innerHTML =
      '<div class="en-word">' + w.word + ' <span class="dict-speak-btn" onclick="speak(\'' + w.word.replace(/'/g, "\\'") + '\')">&#128266;</span></div>' +
      '<div class="phonetic">' + w.phonetic + '</div>' +
      '<div class="cn-meaning">' + w.meaning + '</div>' +
      '<div class="collocations"><span class="label">搭配：</span>' + w.collocations + '</div>' +
      '<div class="example">e.g. ' + w.example + '</div>' +
      '<div class="related"><span class="label" style="color:var(--ink);font-weight:600">关联词：</span>' + related + '</div>';
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
      return '<div class="ex">' + e.en + ' <span class="dict-speak-btn" style="font-size:14px" onclick="speak(\'' + e.en.replace(/'/g, "\\'") + '\')">&#128266;</span></div><div class="ex-cn">' + e.cn + '</div>';
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
//  英语：固定搭配（10个一组 + 打勾 + 变暗）
// ============================================================
var collPage = 0;
function renderCollocations() { collPage = 0; renderCollPage(); }
function renderCollPage() {
  var list = document.getElementById('collocation-list');
  var start = collPage * 10;
  var batch = MOXUE_DATA.COLLOCATIONS.slice(start, start + 10);
  list.innerHTML = '';
  var done = [], undone = [];
  batch.forEach(function(c, i) {
    var idx = start + i;
    if (state.checkedCollocations.indexOf(idx) !== -1) done.push({c: c, idx: idx});
    else undone.push({c: c, idx: idx});
  });
  undone.concat(done).forEach(function(item) {
    var checked = state.checkedCollocations.indexOf(item.idx) !== -1;
    var div = document.createElement('div');
    div.className = 'coll-check-item fade-in' + (checked ? ' checked' : '');
    div.innerHTML =
      '<div class="coll-check" onclick="toggleColl(' + item.idx + ')">' + (checked ? '&#10003;' : '') + '</div>' +
      '<div class="coll-content">' +
        '<div class="coll-phrase">' + item.c.phrase + '</div>' +
        '<div class="coll-meaning">' + item.c.meaning + '</div>' +
        '<div class="coll-example">e.g. ' + item.c.example + '</div>' +
      '</div>';
    list.appendChild(div);
  });
  var total = MOXUE_DATA.COLLOCATIONS.length;
  var totalPages = Math.ceil(total / 10);
  var nav = document.createElement('div');
  nav.className = 'btn-row'; nav.style.marginTop = '12px';
  nav.innerHTML =
    (collPage > 0 ? '<button class="btn btn-secondary" style="flex:1" onclick="collPage--;renderCollPage()">上一组</button>' : '<div style="flex:1"></div>') +
    '<div style="flex:1;text-align:center;font-size:12px;color:var(--ink-faded);padding:12px 0">' + (collPage + 1) + '/' + totalPages + '</div>' +
    (collPage < totalPages - 1 ? '<button class="btn btn-secondary" style="flex:1" onclick="collPage++;renderCollPage()">下一组</button>' : '<div style="flex:1"></div>') +
    '<button class="btn btn-secondary" style="flex:1" onclick="refreshColl()">换一批</button>';
  list.appendChild(nav);
}
function toggleColl(idx) {
  var pos = state.checkedCollocations.indexOf(idx);
  if (pos === -1) state.checkedCollocations.push(idx);
  else state.checkedCollocations.splice(pos, 1);
  saveState(state); renderCollPage();
}
function refreshColl() {
  MOXUE_DATA.COLLOCATIONS = shuffle(MOXUE_DATA.COLLOCATIONS);
  state.checkedCollocations = []; saveState(state);
  collPage = 0; renderCollPage();
}

// ============================================================
//  听写系统 v2：先预览 → 再听写 → 随机英中互换
// ============================================================
var dictSession = { questions: [], currentIdx: 0, answered: false, mode: 'all', phase: 'intro' };
var dictPreviewWords = [];

function renderDictIntro() {
  document.getElementById('dictDone').textContent = state.dictationCount;
  document.getElementById('dictErrors').textContent = state.errors.length;
  document.getElementById('dict-intro').style.display = 'block';
  document.getElementById('dict-preview').style.display = 'none';
  document.getElementById('dict-session').classList.remove('active');
  dictSession.phase = 'intro';
}

function startDictation(mode) {
  dictSession.mode = mode; dictSession.currentIdx = 0; dictSession.answered = false;
  if (mode === 'errors' && state.errors.length > 0) {
    dictSession.questions = state.errors.slice();
    dictSession.phase = 'dictating';
    document.getElementById('dict-intro').style.display = 'none';
    document.getElementById('dict-preview').style.display = 'none';
    document.getElementById('dict-session').classList.add('active');
    showDictQuestion();
  } else {
    prepareDictQuestions(); renderDictPreview();
  }
}

function prepareDictQuestions() {
  var questions = [];
  var words = sample(MOXUE_DATA.ENGLISH_WORDS, Math.min(8, MOXUE_DATA.ENGLISH_WORDS.length));
  var cols = sample(MOXUE_DATA.COLLOCATIONS, Math.min(5, MOXUE_DATA.COLLOCATIONS.length));
  var trs = sample(MOXUE_DATA.TRANSLATION_SENTENCES, Math.min(2, MOXUE_DATA.TRANSLATION_SENTENCES.length));
  dictPreviewWords = [];

  words.forEach(function(w) {
    var dir = Math.random() < 0.5 ? 'en2cn' : 'cn2en';
    var cnShort = w.meaning.replace(/^(adj\.|v\.|n\.|adv\.|prep\.|conj\.)\s*/, '').replace(/（.*?）/g, '');
    questions.push({
      type: 'word', direction: dir,
      q: dir === 'en2cn' ? w.word : cnShort,
      hint: dir === 'en2cn' ? '写出中文意思' : '写出英文单词',
      answer: dir === 'en2cn' ? cnShort : w.word,
      word: w.word, phonetic: w.phonetic, meaning: w.meaning, collocations: w.collocations,
      speakText: w.word
    });
    dictPreviewWords.push({ en: w.word, cn: cnShort, phonetic: w.phonetic });
  });

  cols.forEach(function(c) {
    var dir = Math.random() < 0.5 ? 'en2cn' : 'cn2en';
    questions.push({
      type: 'collocation', direction: dir,
      q: dir === 'en2cn' ? c.phrase : c.meaning,
      hint: dir === 'en2cn' ? '写出中文意思' : '写出英文搭配',
      answer: dir === 'en2cn' ? c.meaning : c.phrase,
      example: c.example
    });
    dictPreviewWords.push({ en: c.phrase, cn: c.meaning, phonetic: '' });
  });

  trs.forEach(function(t) {
    questions.push({ type: 'translation', direction: 'cn2en', q: t.cn, hint: '提示：' + t.hint, answer: t.answer, points: t.points });
  });

  dictSession.questions = questions;
}

function renderDictPreview() {
  dictSession.phase = 'preview';
  document.getElementById('dict-intro').style.display = 'none';
  document.getElementById('dict-preview').style.display = 'block';
  var container = document.getElementById('dict-preview-cards');
  container.innerHTML = '';
  dictPreviewWords.forEach(function(w) {
    var div = document.createElement('div');
    div.className = 'dp-card fade-in';
    div.innerHTML =
      '<div class="dp-en">' + w.en + '</div>' +
      (w.phonetic ? '<div style="font-size:12px;color:var(--ink-faded);flex:0">' + w.phonetic + '</div>' : '') +
      '<div class="dp-speak" onclick="speak(\'' + w.en.replace(/'/g, "\\'") + '\')">&#128266;</div>' +
      '<div class="dp-cn">' + w.cn + '</div>';
    container.appendChild(div);
  });
}

function startDictTest() {
  dictSession.phase = 'dictating';
  dictSession.currentIdx = 0; dictSession.answered = false;
  document.getElementById('dict-preview').style.display = 'none';
  document.getElementById('dict-session').classList.add('active');
  showDictQuestion();
}

function showDictQuestion() {
  if (dictSession.currentIdx >= dictSession.questions.length) { finishDictation(); return; }
  dictSession.answered = false;
  var q = dictSession.questions[dictSession.currentIdx];
  var progress = (dictSession.currentIdx / dictSession.questions.length) * 100;
  document.getElementById('dictBar').style.width = progress + '%';
  document.getElementById('dictCount').textContent = (dictSession.currentIdx + 1) + '/' + dictSession.questions.length;

  var area = document.getElementById('dict-question-area');
  var typeLabel = q.type === 'word' ? '单词' : (q.type === 'collocation' ? '搭配' : '翻译句子');
  var speakBtn = '';
  if (q.speakText) speakBtn = '<div class="dict-speak-btn" onclick="speak(\'' + q.speakText.replace(/'/g, "\\'") + '\')">&#128266; 点击听读音</div>';

  if (q.type === 'translation') {
    area.innerHTML = '<div class="translation-card"><div class="q-type">' + typeLabel + '</div>' +
      '<div class="cn-sentence">' + q.q + '</div><div class="hint">' + q.hint + '</div></div>';
  } else {
    area.innerHTML = '<div class="dict-question"><div class="q-type">' + typeLabel + ' · ' + q.hint + '</div>' +
      speakBtn + '<div class="q-cn">' + q.q + '</div></div>';
  }

  document.getElementById('dictInput').value = '';
  document.getElementById('dictInput').style.display = 'block';
  document.getElementById('dictInput').focus();
  document.getElementById('dictResult').className = 'dict-result';
  document.getElementById('dictResult').innerHTML = '';
  document.getElementById('dictSubmitBtn').style.display = 'block';
  document.getElementById('dictNextBtn').style.display = 'none';

  if (q.speakText && q.direction === 'en2cn') setTimeout(function() { speak(q.speakText); }, 300);
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
      keyWords.forEach(function(kw) { if (kw.length > 2 && lowerInput.indexOf(kw) !== -1) found = true; });
      if (!found && lowerInput.length > 5) {
        var answerLower = q.answer.toLowerCase();
        var words = answerLower.split(/\s+/); var mc = 0;
        words.forEach(function(w) { if (w.length > 2 && lowerInput.indexOf(w) !== -1) mc++; });
        if (mc / words.length > 0.5) found = true;
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
    result.innerHTML = '<div class="answer-label">参考答案：</div><div class="answer-text">' + q.answer + '</div>' +
      '<div class="scoring"><div class="sp-title">得分点（' + score + '/' + q.points.length + '）</div>' + pointsHtml + '</div>';
  } else {
    var userLower = userInput.toLowerCase().replace(/\s+/g, ' ');
    var answerLower = q.answer.toLowerCase().replace(/\s+/g, ' ');
    if (q.direction === 'en2cn' && /[\u4e00-\u9fa5]/.test(q.answer)) {
      isCorrect = userLower.indexOf(answerLower) !== -1 || answerLower.indexOf(userLower) !== -1;
      if (!isCorrect && userLower.length > 0) {
        var mc = 0;
        for (var i = 0; i < answerLower.length; i++) { if (userLower.indexOf(answerLower[i]) !== -1) mc++; }
        isCorrect = mc >= Math.min(2, answerLower.length);
      }
    } else {
      isCorrect = userLower === answerLower;
    }
    result.className = 'dict-result show ' + (isCorrect ? 'correct' : 'wrong');
    var extra = '';
    if (q.type === 'word' && q.collocations) extra = '<div style="margin-top:4px;font-size:12px;color:var(--ink-light)">搭配：' + q.collocations + '</div>';
    if (q.type === 'collocation' && q.example) extra = '<div style="margin-top:4px;font-size:12px;color:var(--ink-light);font-style:italic">例：' + q.example + '</div>';
    if (q.speakText && !isCorrect) extra += '<div class="dict-speak-btn" style="margin-top:4px" onclick="speak(\'' + q.speakText.replace(/'/g, "\\'") + '\')">&#128266; 再听一次</div>';
    result.innerHTML = (isCorrect ? '&#10003; 正确！' : '&#10007; 正确答案：' + q.answer) + extra;
  }

  if (!isCorrect) {
    state.errors.push({ type: q.type, direction: q.direction || '', question: q.q, answer: q.answer, userInput: userInput, date: new Date().toLocaleDateString(), hint: q.hint || '', points: q.points || null });
    saveState(state);
  }
  document.getElementById('dictInput').style.display = 'none';
  document.getElementById('dictSubmitBtn').style.display = 'none';
  document.getElementById('dictNextBtn').style.display = 'block';
}

function nextDictQuestion() { dictSession.currentIdx++; showDictQuestion(); }

function finishDictation() {
  state.dictationCount++; saveState(state);
  document.getElementById('dict-session').classList.remove('active');
  document.getElementById('dict-intro').style.display = 'block';
  document.getElementById('dictDone').textContent = state.dictationCount;
  document.getElementById('dictErrors').textContent = state.errors.length;
  document.getElementById('dict-question-area').innerHTML =
    '<div class="dict-question" style="min-height:180px"><div class="q-type">完成</div>' +
    '<div style="font-family:Noto Serif SC,serif;font-size:18px;font-weight:700;margin:8px 0">本次听写完成！</div>' +
    '<div class="q-hint">共 ' + dictSession.questions.length + ' 题</div>' +
    '<div class="q-hint">累计听写 ' + state.dictationCount + ' 次</div></div>';
  document.getElementById('dictInput').style.display = 'none';
  document.getElementById('dictSubmitBtn').style.display = 'none';
  document.getElementById('dictNextBtn').style.display = 'none';
  updateHomeStats();
}

function quitDictation() {
  document.getElementById('dict-session').classList.remove('active');
  document.getElementById('dict-preview').style.display = 'none';
  document.getElementById('dict-intro').style.display = 'block';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('dict-session').classList.contains('active')) {
    if (!dictSession.answered) submitDictAnswer(); else nextDictQuestion();
  }
});

// ============================================================
//  错题本
// ============================================================
function renderErrors() {
  var list = document.getElementById('error-list');
  list.innerHTML = '';
  if (state.errors.length === 0) {
    list.innerHTML = '<div class="error-book-empty">还没有错题<br>完成听写后这里会显示错题记录</div>'; return;
  }
  state.errors.slice().reverse().forEach(function(e, idx) {
    var realIdx = state.errors.length - 1 - idx;
    var div = document.createElement('div');
    div.className = 'error-item fade-in';
    var typeLabel = e.type === 'word' ? '单词' : (e.type === 'collocation' ? '搭配' : '翻译');
    var dirLabel = e.direction ? (e.direction === 'en2cn' ? ' EN-CN' : ' CN-EN') : '';
    var content;
    if (e.type === 'translation' && e.points) {
      content = '<div class="e-q">' + e.question + '</div><div class="e-a">参考：' + e.answer + '</div><div class="e-date">' + e.date + '</div>';
    } else {
      content = '<div class="e-q">' + e.question + '</div><div class="e-a">答案：' + e.answer + '</div><div class="e-date">' + e.date + ' · 你答：' + (e.userInput || '-') + '</div>';
    }
    div.innerHTML = '<div class="e-type">' + typeLabel + dirLabel + '</div><div class="e-content">' + content + '</div><div class="e-del" onclick="deleteError(' + realIdx + ')">&times;</div>';
    list.appendChild(div);
  });
}

function deleteError(idx) { state.errors.splice(idx, 1); saveState(state); renderErrors(); updateHomeStats(); }

// ============================================================
//  Init
// ============================================================
loadData(function() { updateStreak(); updateHomeStats(); });
