/* 免责声明闸门：同意一次后记住（localStorage），拒绝则停在遮罩上，可再次阅读 */
(function () {
  var KEY = 'gd2026-gate-v1';

  // 页脚常驻入口：已同意过也能重新查看说明
  function addReopen() {
    var fn = document.querySelector('.footnote');
    if (!fn || fn.querySelector('.gateagain')) return;
    var a = document.createElement('a');
    a.className = 'gateagain';
    a.href = '#';
    a.textContent = '使用说明与免责声明';
    a.style.cssText = 'color:inherit;text-decoration:underline;text-underline-offset:2px';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      try { localStorage.removeItem(KEY); } catch (err) {}
      location.reload();
    });
    fn.appendChild(document.createElement('br'));
    fn.appendChild(a);
  }

  try { if (localStorage.getItem(KEY) === '1') { addReopen(); return; } } catch (e) {}

  var CSS = ''
    + '.gate{position:fixed;inset:0;z-index:99;display:grid;place-items:center;padding:20px;'
    + 'background:rgba(28,37,48,.42);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}'
    + '.gate[hidden]{display:none}'
    + '.gatebox{width:100%;max-width:430px;background:var(--sheet,#fffdf9);color:var(--ink,#1c2530);'
    + 'border:1px solid var(--line,#e3ddd1);border-top:4px solid var(--red,#b23a2b);border-radius:12px;'
    + 'box-shadow:0 18px 48px #1c253022;padding:22px 22px 18px;'
    + 'transition:transform .26s cubic-bezier(.23,1,.32,1)}'
    + '@starting-style{.gatebox{transform:translateY(10px) scale(.985)}}'
    + '.gatebox h2{margin:0 0 4px;font-size:17px;letter-spacing:.01em}'
    + '.gatebox .gsub{margin:0 0 14px;font-size:11.5px;letter-spacing:.08em;color:var(--muted,#7d8794);text-transform:uppercase}'
    + '.gatebox ul{margin:0 0 16px;padding:0;list-style:none;display:grid;gap:9px}'
    + '.gatebox li{position:relative;padding-left:19px;font-size:12.5px;line-height:1.72;color:var(--ink2,#43505f)}'
    + '.gatebox li:before{content:"";position:absolute;left:4px;top:.62em;width:5px;height:5px;'
    + 'background:var(--red,#b23a2b);border-radius:1px}'
    + '.gatebox b{color:var(--ink,#1c2530)}'
    + '.gateact{display:flex;gap:9px;flex-wrap:wrap}'
    + '.gateact button{font:inherit;cursor:pointer;border-radius:7px;padding:10px 16px;font-size:13px;'
    + 'font-weight:600;transition:background .15s ease,border-color .15s ease}'
    + '.gateok{flex:1;min-width:150px;border:1px solid var(--red,#b23a2b);background:var(--red,#b23a2b);color:#fff}'
    + '.gateok:disabled{opacity:.45;cursor:not-allowed}'
    + '.gateno{border:1px solid var(--line,#e3ddd1);background:transparent;color:var(--ink2,#43505f)}'
    + '@media(hover:hover) and (pointer:fine){.gateok:not(:disabled):hover{background:#9c3125}'
    + '.gateno:hover{background:#f2ede4}}'
    + '.gatestop{margin:12px 0 0;font-size:11.5px;line-height:1.7;color:var(--red,#b23a2b);display:none}'
    + '.gatestop.on{display:block}'
    + '@media(prefers-reduced-motion:reduce){.gatebox{transition:none}}';

  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  var wrap = document.createElement('div');
  wrap.className = 'gate';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-labelledby', 'gateTitle');
  wrap.innerHTML = ''
    + '<div class="gatebox">'
    + '  <h2 id="gateTitle">使用前请确认</h2>'
    + '  <p class="gsub">Data notice</p>'
    + '  <ul>'
    + '    <li><b>本站内容全部由 AI 从公开渠道自动收集整理</b>，未逐条人工核对，可能存在错漏、滞后或归类偏差。</li>'
    + '    <li>投档线、排位、计划数、学费、证书要求等，<b>一律以广东省教育考试院与院校官方公布为准</b>。</li>'
    + '    <li>冲稳保与分差仅为参考，<b>不构成任何录取承诺</b>；志愿填报的最终判断与后果由使用者自行承担。</li>'
    + '  </ul>'
    + '  <div class="gateact">'
    + '    <button class="gateok" type="button">我已了解，准确性请自行判断</button>'
    + '    <button class="gateno" type="button">不同意</button>'
    + '  </div>'
    + '  <p class="gatestop">需要同意上方说明后才能使用查询功能。</p>'
    + '</div>';
  document.body.appendChild(wrap);

  var ok = wrap.querySelector('.gateok');
  var no = wrap.querySelector('.gateno');
  var tip = wrap.querySelector('.gatestop');
  document.documentElement.style.overflow = 'hidden';

  function close() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    wrap.hidden = true;
    document.documentElement.style.overflow = '';
    document.body.removeAttribute('aria-hidden');
    document.dispatchEvent(new CustomEvent('gatepass'));
    addReopen();
  }
  ok.addEventListener('click', close);
  no.addEventListener('click', function () {
    tip.classList.add('on');
    ok.focus();
  });
  wrap.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === ok ? no : ok).focus(); }
    if (e.key === 'Escape') { tip.classList.add('on'); }
  });
  setTimeout(function () { ok.focus(); }, 60);
  wrap.addEventListener('gatepass', addReopen);
})();
