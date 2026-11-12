/* 列表页：按院校聚合 */
const elQ = document.getElementById('q'), elKw = document.getElementById('kw'), elOut = document.getElementById('out');
const selCat = document.getElementById('cat'), selCity = document.getElementById('city');
const elSummary = document.getElementById('summary');
const distEls = { chong: document.getElementById('n-chong'), wen: document.getElementById('n-wen'), bao: document.getElementById('n-bao') };
let mode = 'fit', nat = '';
/* 只有结构性切换（类别/城市/性质/标签）才让榜单逐行落下；敲分数时不重放动画 */
let stag = true;
/* 兜底：任何环境下动画若没跑完（后台标签页、省电模式、动画被冻结），
   到点就把 stag 摘掉，元素立刻回到可见终态，绝不会停在 opacity:0。 */
let stagT = 0;
function unstag() {
  document.querySelectorAll('.ranklist.stag').forEach(x => x.classList.remove('stag'));
}

CATS.forEach((c, i) => {
  const o = document.createElement('option');
  o.value = i; o.textContent = c.replace('依学考录取·', '学考·');
  selCat.appendChild(o);
});

// 城市下拉：按院校数降序
(function () {
  const c = {};
  Object.keys(SCHOOLS).forEach(k => { const v = SCHOOLS[k].c || '广东'; c[v] = (c[v] || 0) + 1; });
  const arr = Object.keys(c).sort((a, b) => c[b] - c[a]);
  const all = document.createElement('option');
  all.value = ''; all.textContent = '全部城市（' + Object.keys(SCHOOLS).length + ' 所）';
  selCity.appendChild(all);
  arr.forEach(v => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v + '（' + c[v] + '）';
    selCity.appendChild(o);
  });
})();
document.getElementById('hsum').textContent = Object.keys(SCHOOLS).length + ' 所院校 / ' + GROUPS_N + ' 个专业组';

document.getElementById('tabs').onclick = e => {
  const t = e.target.closest('.tab'); if (!t) return;
  document.querySelectorAll('#tabs .tab').forEach(x => x.classList.toggle('on', x === t));
  mode = t.dataset.mode; stag = true; render();
};
document.getElementById('nat').onclick = e => {
  const c = e.target.closest('.chip'); if (!c) return;
  document.querySelectorAll('#nat .chip').forEach(x => x.classList.toggle('on', x === c));
  nat = c.dataset.nat; stag = true; render();
};
elQ.oninput = () => { stag = false; render(); };
elKw.oninput = () => { stag = false; render(); };
selCat.onchange = () => { stag = true; render(); };
selCity.onchange = () => { stag = true; render(); };

// 从详情页返回时带回分数与类别/城市
(function () {
  const p = new URLSearchParams(location.search);
  if (p.get('n')) elQ.value = p.get('n');
  if (p.get('cat')) selCat.value = p.get('cat');
  if (p.get('city')) selCity.value = p.get('city');
})();

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function tagOf(d) {
  if (d == null || d < 0) return '';
  if (d < 8) return '<span class="badge b-chong">冲</span>';
  if (d < 25) return '<span class="badge b-wen">稳</span>';
  return '<span class="badge b-bao">保</span>';
}

/* 把某校的组按分数筛成 {ok, near} */
function split(rows, score) {
  const ok = [], near = [];
  rows.forEach(r => {
    if (r.m == null) return;
    if (r.m <= score) ok.push(r);
    else if (r.m - score <= 15) near.push(r);
  });
  ok.sort((a, b) => b.m - a.m);
  near.sort((a, b) => a.m - b.m);
  return { ok, near };
}

function cardOf(sk, st, score, extra, index) {
  const s = SCHOOLS[sk];
  // 每校一个静态页 s/<skey>.html；类别/分数/城市走 query 传回详情页
  const href = 's/' + encodeURIComponent(sk) + '.html?cat=' + selCat.value
    + (score != null ? '&score=' + score : '') + (selCity.value ? '&city=' + encodeURIComponent(selCity.value) : '');
  const lo = st.ok.length ? st.ok[0].m : null;
  const diff = (score != null && lo != null) ? score - lo : null;
  const maj = [];
  st.ok.forEach(r => (r.j || []).forEach(m => { if (maj.indexOf(m) < 0) maj.push(m); }));
  let majHtml = '';
  if (maj.length) {
    const show = maj.slice(0, 10);
    majHtml = '<div class="majors">' + show.map(m => '<span class="maj">' + esc(m) + '</span>').join('')
      + (maj.length > show.length ? '<span class="none">+' + (maj.length - show.length) + '</span>' : '') + '</div>';
  }
  const nOk = st.ok.length, nAll = st.all;
  // 3+证书：选考证书摘要（组内拆分去重）
  let certHtml = '';
  if (String(CATS[+selCat.value]).indexOf('3+证书') === 0) {
    const items = [];
    let any = false, known = false;
    st.ok.forEach(r => {
      if (!r.k) return;
      known = true;
      if (r.k === '不限证书种类') { any = true; return; }
      r.k.split('；').forEach(x => { x = x.trim(); if (x && items.indexOf(x) < 0) items.push(x); });
    });
    if (known) {
      if (!items.length) certHtml = '<div class="certs"><span class="certtag">选考证书</span>不限证书种类</div>';
      else certHtml = '<div class="certs"><span class="certtag">选考证书</span>'
        + esc(items.slice(0, 3).join(' · ')) + (items.length > 3 ? ' 等 <b>' + items.length + '</b> 类' : '')
        + (any ? ' <span class="none">（部分组不限）</span>' : '') + '</div>';
    }
  }
  let feeTxt = '';
  (function () {
    const vs = [];
    (st.rows || st.ok || []).forEach(r => {
      if (r.fee == null) return;
      String(r.fee).split('~').forEach(v => { const n = +v; if (n) vs.push(n); });
    });
    if (!vs.length) return;
    const lo2 = Math.min.apply(null, vs), hi2 = Math.max.apply(null, vs);
    feeTxt = lo2 === hi2 ? lo2.toLocaleString() : lo2.toLocaleString() + '–' + hi2.toLocaleString();
  })();
  const scHtml = lo != null
    ? '<b>' + lo + '</b><i>' + (score != null && diff >= 0 ? '可报最低线' : '最低投档线') + '</i>'
    : (nAll ? '<b style="color:#a79e91">—</b><i>高于你的分数</i>' : '<b style="color:#a79e91">—</b><i>无人投档</i>');
  return '<a class="card' + (diff != null && diff >= 0 ? ' hit' : '') + '" style="--i:' + index + '" href="' + href + '">'
    + '<div class="idx">' + String(index + 1).padStart(2, '0') + '</div>'
    + '<div class="name">' + esc(s.n)
    + '<span class="nat ' + (s.t === '民办' ? 'pvt' : 'pub') + '">' + esc(s.t) + '</span>'
    + tagOf(diff) + '</div>'
    + '<div class="sc">' + scHtml + '</div>'
    + '<div class="meta">'
    + '<span>' + esc(s.c || '广东') + (s.q ? ' · ' + esc(s.q) : '') + '</span>'
    + (s.lv ? '<span>' + esc(s.lv) + '</span>' : '')
    + (s.ty ? '<span>' + esc(s.ty) + '</span>' : '')
    + (score != null && nOk && diff >= 0 ? '<span class="oktxt">可报 ' + nOk + ' 组</span>' : '')
    + '<span>共 ' + nAll + ' 组</span>'
    + (st.plan ? '<span>计划 ' + st.plan + ' 人</span>' : '')
    + (feeTxt ? '<span class="fee">学费 ' + feeTxt + '</span>' : '')
    + (lo != null && st.ok[0].r ? '<span class="rank">最低排位 ' + st.ok[0].r.toLocaleString() + '</span>' : '')
    + (diff != null ? '<span>' + (diff >= 0 ? '高出 ' + diff + ' 分' : '差 ' + (-diff) + ' 分') + '</span>' : '')
    + (extra || '')
    + '</div>' + (certHtml || '') + majHtml + '</a>';
}

function setDist(rows, score) {
  if (score == null) {
    elSummary.innerHTML = '输入分数，马上看能报哪些学校';
    ['chong', 'wen', 'bao'].forEach(k => setNum(distEls[k], '—'));
    return;
  }
  const seen = { chong: new Set(), wen: new Set(), bao: new Set() };
  let nOk = 0;
  Object.keys(GROUPS).forEach(sk => {
    const s = SCHOOLS[sk];
    if (nat && s.t !== nat) return;
    if (selCity.value && (s.c || '广东') !== selCity.value) return;
    (GROUPS[sk] || []).forEach(r => {
      if (r.c !== +selCat.value || r.m == null || r.m > score) return;
      const d = score - r.m, k = d < 8 ? 'chong' : d < 25 ? 'wen' : 'bao';
      seen[k].add(sk); nOk++;
    });
  });
  setNum(distEls.chong, seen.chong.size);
  setNum(distEls.wen, seen.wen.size);
  setNum(distEls.bao, seen.bao.size);
  elSummary.innerHTML = '<b>' + score + '</b> 分：达到 <b>' + nOk + '</b> 个专业组投档线';
}

/* 数字变化时给一次短促的顶起，值没变就不动 */
function setNum(el, v) {
  v = String(v);
  if (el.textContent === v) return;
  el.textContent = v;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

function render() {
  const ci = +selCat.value, cat = CATS[ci];
  const score = elQ.value === '' ? null : Math.max(0, Math.min(450, parseInt(elQ.value, 10) || 0));
  const kw = elKw.value.trim().toLowerCase();
  const city = selCity.value;
  const bySchool = {};
  const distRows = {};
  Object.keys(GROUPS).forEach(sk => {
    const s = SCHOOLS[sk];
    if (nat && s.t !== nat) return;
    if (city && (s.c || '广东') !== city) return;
    distRows[sk] = (GROUPS[sk] || []).filter(r => r.c === +selCat.value);
  });
  setDist(distRows, score);

  Object.keys(GROUPS).forEach(sk => {
    const rows = GROUPS[sk].filter(r => r.c === ci);
    if (!rows.length) return;
    const s = SCHOOLS[sk];
    if (nat && s.t !== nat) return;
    if (city && (s.c || '广东') !== city) return;
    if (kw && !(s.n.toLowerCase().includes(kw) || rows.some(r => (r.j || []).some(m => m.toLowerCase().includes(kw))))) return;
    let plan = 0, all = rows.length, any = false;
    rows.forEach(r => { plan += r.p || 0; if (r.m != null) any = true; });
    bySchool[sk] = { rows, plan, all, any };
  });

  const keys = Object.keys(bySchool);
  const RL = 'ranklist' + (stag ? ' stag' : '');
  clearTimeout(stagT);
  if (stag) stagT = setTimeout(unstag, 700);
  const nPub = keys.filter(k => SCHOOLS[k].t === '公办').length;
  const nPvt = keys.filter(k => SCHOOLS[k].t === '民办').length;
  const statOf = txt => '<div class="stat"><span>' + txt + (city ? ' · ' + esc(city) : '') + '</span><span>共 <b>' + keys.length + '</b> 所院校（公办 <b>' + nPub + '</b> / 民办 <b>' + nPvt + '</b>）</span></div>';

  if (mode === 'all') {
    keys.sort((a, b) => SCHOOLS[a].n.localeCompare(SCHOOLS[b].n, 'zh'));
    elOut.innerHTML = statOf(esc(cat)) + '<div class="' + RL + '">' + keys.map((sk, i) => {
      const st = bySchool[sk];
      const ok = score == null ? st.rows.filter(r => r.m != null).sort((a, b) => b.m - a.m) : split(st.rows, score).ok;
      return cardOf(sk, { ok: ok.length ? ok : st.rows.filter(r => r.m != null).sort((a, b) => b.m - a.m), all: st.all, plan: st.plan, rows: st.rows }, score, '', i);
    }).join('') + '</div>';
    return;
  }

  if (score == null) {
    if (!kw) { elOut.innerHTML = '<div class="empty"><strong>输 入 分 数</strong>院校、专业组与冲稳保一次看清<br>也可以切到「全部院校」先按城市或办学性质浏览</div>'; return; }
    keys.sort((a, b) => SCHOOLS[a].n.localeCompare(SCHOOLS[b].n, 'zh'));
    elOut.innerHTML = '<div class="stat"><span>「' + esc(elKw.value.trim()) + '」命中 <b>' + keys.length + '</b> 所院校</span></div>'
      + '<div class="' + RL + '">' + keys.map((sk, i) => {
        const st = bySchool[sk], ok = st.rows.filter(r => r.m != null).sort((a, b) => b.m - a.m);
        return cardOf(sk, { ok, all: st.all, plan: st.plan, rows: st.rows }, null, '', i);
      }).join('') + '</div>';
    return;
  }

  const okList = [], nearList = [];
  keys.forEach(sk => {
    const st = bySchool[sk], sp = split(st.rows, score);
    if (sp.ok.length) okList.push({ sk, sp, all: st.all, plan: st.plan, rows: st.rows });
    else if (sp.near.length) nearList.push({ sk, sp, all: st.all, plan: st.plan, rows: st.rows });
  });
  okList.sort((a, b) => b.sp.ok.length - a.sp.ok.length || b.sp.ok[0].m - a.sp.ok[0].m);
  nearList.sort((a, b) => a.sp.near[0].m - b.sp.near[0].m);

  if (!okList.length && !nearList.length) {
    elOut.innerHTML = '<div class="empty"><strong>' + score + '</strong>该类别下没有匹配的院校<br>试试其它招生类别，或查看全部院校</div>';
    return;
  }
  const nOkPub = okList.filter(x => SCHOOLS[x.sk].t === '公办').length;
  const nOkPvt = okList.filter(x => SCHOOLS[x.sk].t === '民办').length;
  const nGrp = okList.reduce((a, x) => a + x.sp.ok.length, 0);
  let h = '<div class="stat"><span>' + esc(cat) + ' · <b class="r">' + score + '</b> 分可报 <b>' + nGrp + '</b> 个专业组</span><span><b>'
    + okList.length + '</b> 所院校（公办 <b>' + nOkPub + '</b> / 民办 <b>' + nOkPvt + '</b>）</span></div>';
  if (okList.length) h += '<div class="' + RL + '">' + okList.map((x, i) => cardOf(x.sk, { ok: x.sp.ok, all: x.all, plan: x.plan, rows: x.rows }, score, '', i)).join('') + '</div>';
  else h += '<div class="hint">没有达到任何院校的投档线，下面是差 15 分以内的院校。</div>';
  if (nearList.length) {
    h += '<div class="near-ttl">差一点 · 投档线高于你的分数（' + nearList.length + ' 所）</div>'
      + '<div class="' + RL + '">' + nearList.map((x, i) => cardOf(x.sk, { ok: x.sp.near, all: x.all, plan: x.plan }, score, '', i)).join('') + '</div>';
  }
  elOut.innerHTML = h;
}
render();
