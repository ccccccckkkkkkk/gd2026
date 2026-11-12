/* 每所院校一个静态页 s/<skey>.html，院校 key 由 <main data-sk> 给出。
   ?cat=<idx>&score=<n>&city=<城市> 由列表页带入，用于回填筛选态与冲稳保。 */
const elOut = document.getElementById('out');
const P = new URLSearchParams(location.search);
let sk = elOut.dataset.sk || '';
let ci = P.get('cat') === null ? 0 : +P.get('cat');
const score = P.get('score') === null || P.get('score') === '' ? null : parseInt(P.get('score'), 10);
const city = P.get('city') || '';
const keep = (score != null ? '&score=' + score : '') + (city ? '&city=' + encodeURIComponent(city) : '');
const ROOT = '../';                              // 站点根（assets/ 与 data/ 都在上一级）
let s = SCHOOLS[sk];
const esc = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (name) => {
  const paths = {
    back: '<path d="m15 5-7 7 7 7"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    book: '<path d="M4 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4ZM20 5h-4a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h4Z"/>',
    warn: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths[name] + '</svg>';
};

if (!s) {
  elOut.innerHTML = '<div class="empty"><strong>404</strong>没有找到这所院校<br><a href="../index.html">返回院校列表</a></div>';
} else {
  document.title = s.n + ' · 2026 广东春季高考分数线';
  render();
}

function mapUrl(q) {
  return 'https://uri.amap.com/search?keyword=' + encodeURIComponent(q) + '&city=广东&view=map&callnative=1';
}

/* 选考证书：不限 → 绿色单行；清单 → 拆条，超过 5 条折叠计数；推断值加标记 */
function certCell(r) {
  if (!r.k) return '<span class="none">见招生专业目录</span>';
  const tag = r.ki ? '<i class="guess">推断</i>' : '';
  if (r.k === '不限证书种类') return '<span class="cert any">不限证书种类</span>' + tag;
  const items = r.k.split('；').map(s => s.trim()).filter(Boolean);
  const head = items.slice(0, 5).map(s => esc(s)).join('、');
  const more = items.length > 5 ? ' <span class="more">等 ' + items.length + ' 项</span>' : '';
  return '<span class="cert">' + head + more + '</span>' + tag;
}

/* 六维画像：六个 0–100 指数，画成正六边形雷达 + 顶点读数 */
function hexPoints(cx, cy, r, vals) {
  // 从正上方开始，顺时针六个顶点
  return vals.map(function (v, i) {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    const rr = r * Math.max(0, Math.min(100, v)) / 100;
    return (cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1);
  }).join(' ');
}
function hexGrid(cx, cy, r, k) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    pts.push((cx + r * k * Math.cos(a)).toFixed(1) + ',' + (cy + r * k * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}
function hexChart(s) {
  const HEX = ['层次', '门槛', '资质', '区位', '专业', '成本'];
  const v = s.h;
  if (!v || v.length !== 6) return '';
  const W = 330, H = 322, cx = W / 2, cy = 160, R = 96;
  let g = '';
  [1, .75, .5, .25].forEach(function (k) {
    g += '<polygon class="hg' + (k === 1 ? ' hgout' : '') + '" points="' + hexGrid(cx, cy, R, k) + '"/>';
  });
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    g += '<line class="haxis" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + R * Math.cos(a)).toFixed(1)
      + '" y2="' + (cy + R * Math.sin(a)).toFixed(1) + '"/>';
  }
  // 顶点标签 + 读数
  HEX.forEach(function (name, i) {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    const lx = cx + (R + 30) * Math.cos(a), ly = cy + (R + 30) * Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < .2 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
    const dy = Math.sin(a) < -.7 ? -2 : (Math.sin(a) > .7 ? 12 : 4);
    g += '<text class="hlab" x="' + lx.toFixed(1) + '" y="' + (ly + dy).toFixed(1)
      + '" text-anchor="' + anchor + '">' + name + '</text>';
    g += '<text class="hval" x="' + lx.toFixed(1) + '" y="' + (ly + dy + 15).toFixed(1)
      + '" text-anchor="' + anchor + '">' + v[i] + '</text>';
  });
  g += '<polygon class="harea" points="' + hexPoints(cx, cy, R, v) + '"/>';
  v.forEach(function (val, i) {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    const rr = R * Math.max(0, Math.min(100, val)) / 100;
    g += '<circle class="hdot" cx="' + (cx + rr * Math.cos(a)).toFixed(1) + '" cy="' + (cy + rr * Math.sin(a)).toFixed(1) + '" r="3.2"/>';
  });
  return '<figure class="hexfig"><svg class="hex" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="'
    + esc(s.n) + ' 六维画像">' + g + '</svg>'
    + '<figcaption>六维指数 0–100，越靠外越强。'
    + (s.loc ? '主校区区位：<b>' + esc(s.tier) + ' 档</b> · ' + esc(s.loc) + '。' : '')
    + (s.hs != null ? '门槛取自 <b>' + s.hs + ' 分</b>（' + (s.lv === '本科' ? '综合成绩' : '投档最低分') + '）。' : '门槛按同批次基准估算。')
    + '</figcaption></figure>';
}

/* 学费：单值直出，区间折叠；fe=1 表示按本校区间推断 */
function feeCell(r) {
  if (r.fee == null) return '<span class="none">见招生目录</span>';
  const txt = String(r.fee).indexOf('~') > 0
    ? String(r.fee).split('~').map(v => (+v).toLocaleString()).join('–')
    : (+r.fee).toLocaleString();
  return '<span class="feev">' + txt + '</span>' + (r.fe ? '<i class="guess">估</i>' : '');
}

function majorsOf(rows) {
  const out = [];
  rows.forEach(r => (r.j || []).forEach(m => { if (out.indexOf(m) < 0) out.push(m); }));
  return out.sort((a, b) => a.localeCompare(b, 'zh'));
}

function render() {
  const rowsAll = GROUPS[sk] || [];
  const t = s.t === '民办' ? 'pvt' : 'pub';
  const addr = s.a || '';
  const maplink = addr
    ? '<a class="maplink" href="' + mapUrl(s.n + ' ' + addr) + '" target="_blank" rel="noopener">' + icon('pin') + '地图</a>'
    : '';

  let h = '<a class="back" href="' + ROOT + 'index.html?cat=' + ci + (score != null ? '&n=' + score : '') + (city ? '&city=' + encodeURIComponent(city) : '') + '">' + icon('back') + '返回院校列表</a>'
    + '<div class="hero"><div class="herohead"><div><h2>' + esc(s.n)
    + ' <span class="nat ' + t + '">' + esc(s.t) + '</span></h2>'
    + '<div class="sub">'
    + '<span>' + esc(s.lv || '—') + '</span>'
    + (s.ty ? '<span>' + esc(s.ty) + '</span>' : '')
    + '<span>' + esc(s.c || '广东') + (s.q ? ' · ' + esc(s.q) : '') + '</span>'
    + (s.dep ? '<span>' + esc(s.dep) + '主管</span>' : '')
    + '</div></div><div class="levelmark">院校档案</div></div>'
    + '<dl class="kv">'
    + '<dt>地址</dt><dd>' + (addr ? esc(addr) + maplink : '<span class="none">暂未收录</span>') + '</dd>'
    + (s.tel ? '<dt>招办电话</dt><dd><a href="tel:' + esc(String(s.tel).replace(/[^\d+\-]/g, '')) + '">' + esc(s.tel) + '</a></dd>' : '')
    + (s.w ? '<dt>官网</dt><dd><a href="' + esc(s.w) + '" target="_blank" rel="noopener">' + esc(s.w.replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</a></dd>' : '')
    + (s.z ? '<dt>招生网</dt><dd><a href="' + esc(s.z) + '" target="_blank" rel="noopener">' + esc(s.z.replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</a></dd>' : '')
    + (s.mid ? '<dt>标识码</dt><dd>' + esc(s.mid) + '</dd>' : '')
    + '</dl>'
    + hexChart(s)
    + '<div class="btnrow">' + (addr ? '<a class="btn primary" href="' + mapUrl(s.n + ' ' + addr) + '" target="_blank" rel="noopener">' + icon('pin') + '地图导航</a>' : '')
    + (s.z ? '<a class="btn" href="' + esc(s.z) + '" target="_blank" rel="noopener">' + icon('book') + '招生网</a>' : '')
    + (s.w ? '<a class="btn" href="' + esc(s.w) + '" target="_blank" rel="noopener">' + icon('globe') + '学校官网</a>' : '')
    + '</div></div>';

  // 分档位切类别
  const hasCat = {};
  rowsAll.forEach(r => { hasCat[r.c] = 1; });
  const cats = Object.keys(hasCat).map(Number).sort((a, b) => a - b);
  if (cats.indexOf(ci) < 0) ci = cats[0];

  h += '<div class="cat-tabs" id="ctab">' + cats.map(c => {
    const n = rowsAll.filter(r => r.c === c).length;
    return '<a class="tab' + (c === ci ? ' on' : '') + '" href="?cat=' + c
      + (score != null ? '&score=' + score : '') + '">' + esc(CATS[c].replace('依学考录取·', '')) + ' ' + n + '</a>';
  }).join('') + '</div>';

  // 各类别概览
  h += '<div class="secttl">各类别投档概况<small>最低 / 最高投档线</small></div><div class="tablewrap slim"><table><thead><tr>'
    + '<th>类别</th><th class="num">组数</th><th class="num">计划</th><th class="num">最低线</th><th class="num">最高线</th></tr></thead><tbody>';
  cats.forEach(c => {
    const rs = rowsAll.filter(r => r.c === c);
    const sc = rs.filter(r => r.m != null).map(r => r.m);
    const plan = rs.reduce((a, r) => a + (r.p || 0), 0);
    h += '<tr' + (c === ci ? ' class="me"' : '') + '><td>' + esc(CATS[c].replace('依学考录取·', '')) + '</td>'
      + '<td class="num">' + rs.length + '</td><td class="num">' + (plan || '—') + '</td>'
      + '<td class="num">' + (sc.length ? Math.min.apply(null, sc) : '—') + '</td>'
      + '<td class="num">' + (sc.length ? Math.max.apply(null, sc) : '—') + '</td></tr>';
  });
  h += '</tbody></table></div>';

  // 当前类别的专业组明细
  const rows = rowsAll.filter(r => r.c === ci).sort((a, b) => (b.m || 0) - (a.m || 0));
  const maj = majorsOf(rows);
  h += '<aside class="notice" role="note">' + icon('warn')
    + '<div><strong>先看排位，再看分数。</strong>下表「最低排位」是该专业组最后一名被投档考生的位次，'
    + '把 <b>你的一分一段排位</b> 和它比，小于它才算够；分数会随当年试题难度整体浮动，排位不会。</div></aside>';
  h += '<div class="secttl">' + esc(CATS[ci]) + ' · 投档明细</div>';
  h += '<div class="totline">共 <b>' + rows.length + '</b> 个专业组，'
    + '计划 <b>' + (rows.reduce((a, r) => a + (r.p || 0), 0) || '—') + '</b> 人，'
    + '投档 <b>' + rows.reduce((a, r) => a + (r.e || 0), 0) + '</b> 人'
    + (score != null ? ' · 你的分数 <b>' + score + '</b>' : '') + '</div>';
  const c3 = CATS[ci].indexOf('3+证书') === 0;   // 只有 3+证书 才有选考证书要求
  if (c3) h += '<div class="swipehint">证书清单较长，表格可左右滑动</div>';
  h += '<div class="tablewrap"><table' + (c3 ? ' class="wide"' : '') + '><thead><tr><th>专业组</th><th class="num">计划</th><th class="num">投档</th>'
    + '<th class="num">' + (CATS[ci].indexOf('本科') >= 0 ? '综合分' : '投档线') + '</th>'
    + '<th class="num">最低排位</th><th class="num">学费/年</th>' + (c3 ? '<th>选考证书</th>' : '') + '<th>专业</th></tr></thead><tbody>';
  rows.forEach(r => {
    const d = (score != null && r.m != null) ? score - r.m : null;
    const tag = d == null ? '' : (d < 0 ? '<span class="badge b-chong">差' + (-d) + '</span>'
      : d < 8 ? '<span class="badge b-chong">冲</span>'
        : d < 25 ? '<span class="badge b-wen">稳</span>' : '<span class="badge b-bao">保</span>');
    const jf = r.jf || [];
    const mj = ((r.j || []).length
      ? r.j.map((m, i) => '<span class="maj">' + esc(m)
        + (jf[i] != null && String(r.fee || '').indexOf('~') > 0 ? '<i class="mf">' + (+jf[i]).toLocaleString() + '</i>' : '') + '</span>').join('')
      : '<span class="none">未收录，见招生专业目录</span>')
      + (r.f ? '<div class="feat">' + esc(r.f) + '</div>' : '');
    h += '<tr' + (d != null && d >= 0 ? ' class="me"' : '') + '>'
      + '<td class="gcode">' + esc(r.g) + ' ' + tag + '</td>'
      + '<td class="num">' + (r.p || '—') + '</td>'
      + '<td class="num">' + (r.e || 0) + '</td>'
      + '<td class="num' + (r.m != null ? ' big' : '') + '">' + (r.m != null ? r.m : '—') + '</td>'
      + '<td class="num">' + (r.r ? r.r.toLocaleString() : '—') + '</td>'
      + '<td class="num fee">' + feeCell(r) + '</td>'
      + (c3 ? '<td class="certcell">' + certCell(r) + '</td>' : '')
      + '<td>' + mj + '</td></tr>';
  });
  h += '</tbody></table></div>';
  if (c3) h += '<div class="srcnote">选考证书依据《广东省2026年“3+证书”专科中职生征集志愿招生计划表》（考试院附件5）整理；标“推断”的组按该校同类专业的证书要求推定，最终以招生专业目录和院校招生章程为准。</div>';
  if (maj.length) {
    h += '<div class="secttl">该类别全部专业<small>' + maj.length + ' 个</small></div>'
      + '<div class="majors flat">' + maj.map(m => '<span class="maj">' + esc(m) + '</span>').join('') + '</div>';
  }
  // 同城院校：限定当前类别有招生、最多 12 个
  const same = Object.keys(SCHOOLS).filter(k => k !== sk && SCHOOLS[k].c === s.c
    && (GROUPS[k] || []).some(r => r.c === ci));
  if (same.length) {
    const show = same.slice(0, 12);
    h += '<div class="secttl">' + esc(s.c || '广东') + '同类别其它院校<small>' + same.length + ' 所</small></div><div class="majors flat">'
      + show.map(k => '<a class="maj" href="' + k + '.html?cat=' + ci
        + keep + '">' + esc(SCHOOLS[k].n) + '</a>').join('')
      + (same.length > show.length ? '<span class="none">等 ' + same.length + ' 所，可回列表按城市筛</span>' : '')
      + ' <a class="maj" href="' + ROOT + 'index.html?cat=' + ci
      + (score != null ? '&n=' + score : '') + '&city=' + encodeURIComponent(s.c || '') + '">查看同城全部 →</a>'
      + '</div>';
  }

  h += '<div class="totline" style="margin-top:16px">提示：点击返回可回到列表；分数会一并带回去。</div>';
  elOut.innerHTML = h;
}
