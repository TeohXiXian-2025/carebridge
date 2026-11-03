// Shared CareBridge pieces for Bubble pages (needs dsl.js loaded first).
(() => {
  const { X, TX, B, el, mob, desk, A } = window.CB;
  const { P, CU, PI, V, EL, S, OV, M, chain } = X;

  // Donor page shell: Header + main column + filler + footer + tab bar (copied from the agent-built index page)
  function shell(mainKids, mainOpts = {}, before = []) {
    const sh = JSON.parse(localStorage.getItem('cb_shell'));
    const get = (id) => JSON.parse(JSON.stringify(sh.find((e) => e.id === id)));
    const hdr = get('ix_hdr'), fill = get('ix_fill'), foot = get('ix_foot'), pad = get('ix_tabpad'), tabs = get('ix_tabs');
    const main = B.G('Main Group', { col: 1, maxw: 1120, ha: 'center', pad: [32, 24, 32, 24], gap: 24, when: [mob({ pad: [16, 16, 24, 16], gap: 16 })], ...mainOpts }, mainKids);
    const all = [hdr, ...before, main, fill, foot, pad, tabs];
    all.forEach((e, i) => { e.properties.order = i + 1; delete e.current_parent; });
    return all;
  }

  // Progress bar as HTML: pct expression (number 0..100)
  const bar = (name, pct, color = '#0E7C6B') => B.Html(name, TX('<div style="height:8px;background:#E4E8EA;border-radius:4px;overflow:hidden"><div style="height:8px;border-radius:4px;background:' + color + ';width:', pct, '%"></div></div>'), { minh: 8 });

  // Item quantities
  const still = (base) => chain(base(), 'qtyneeded_number', X.minus(chain(base(), 'qtypledged_number')), X.minus(chain(base(), 'qtyreceived_number')), M('max', 0));
  const pctItem = (base) => chain(base(), 'qtypledged_number', X.plus(chain(base(), 'qtyreceived_number')), X.div(chain(base(), 'qtyneeded_number')), X.times(100));

  // status colour conditions for a Tag showing an option value
  const tagColors = (expr, map) => Object.entries(map).map(([val, c]) => [chain(expr(), X.eq(OV(c.set, val))), { bg: c.bg, fc: c.fc }]);
  const itemStatusTag = (name, base) => B.Tag(name, TX(chain(base(), 'status_option_itemstatus', 'display')), 'teal', {
    when: tagColors(() => chain(base(), 'status_option_itemstatus'), {
      Open: { set: 'itemstatus', bg: 'teallight', fc: 'primaryteal' },
      'Partially pledged': { set: 'itemstatus', bg: 'yellowbg', fc: 'yellow' },
      'Fully pledged': { set: 'itemstatus', bg: 'greybg', fc: 'mutedtext' },
      Fulfilled: { set: 'itemstatus', bg: 'greenbg', fc: 'green' },
      Paused: { set: 'itemstatus', bg: 'greybg', fc: 'mutedtext' },
    }),
  });
  const pledgeStatusTag = (name, base) => B.Tag(name, TX(chain(base(), 'status_option_pledgestatus', 'display')), 'teal', {
    when: tagColors(() => chain(base(), 'status_option_pledgestatus'), {
      Pending: { set: 'pledgestatus', bg: 'yellowbg', fc: 'yellow' },
      Accepted: { set: 'pledgestatus', bg: 'teallight', fc: 'primaryteal' },
      Received: { set: 'pledgestatus', bg: 'greenbg', fc: 'green' },
      Declined: { set: 'pledgestatus', bg: 'redbg', fc: 'red' },
      Cancelled: { set: 'pledgestatus', bg: 'greybg', fc: 'mutedtext' },
    }),
  });
  const homeStatusTag = (name, base) => B.Tag(name, TX(chain(base(), 'status_option_homestatus', 'display')), 'teal', {
    when: tagColors(() => chain(base(), 'status_option_homestatus'), {
      Pending: { set: 'homestatus', bg: 'yellowbg', fc: 'yellow' },
      Approved: { set: 'homestatus', bg: 'greenbg', fc: 'green' },
      Rejected: { set: 'homestatus', bg: 'redbg', fc: 'red' },
    }),
  });
  const priorityTag = (name, base) => B.Tag(name, TX(chain(base(), 'priority_option_priority', 'display')), 'red', {
    when: tagColors(() => chain(base(), 'priority_option_priority'), {
      Medium: { set: 'priority', bg: 'yellowbg', fc: 'yellow' },
      Low: { set: 'priority', bg: 'greybg', fc: 'mutedtext' },
    }),
  });

  // Category code chip (44px teal-light square)
  const CAT = { 'Packaged food': ['rgba(253,240,222,1)', 'rgba(184,104,26,1)'], Hygiene: ['rgba(227,238,251,1)', 'rgba(47,109,181,1)'], 'Medical supplies': ['rgba(251,228,228,1)', 'rgba(194,59,59,1)'], Clothing: ['rgba(226,244,232,1)', 'rgba(46,138,80,1)'], Education: ['rgba(237,230,250,1)', 'rgba(106,72,181,1)'] };
  const chip = (name, base, size = 40) => B.G(name, { w: size, h: size, r: 12, bg: 'teallight', col: 1, cva: 'center', when: Object.entries(CAT).map(([c, v]) => [chain(base(), 'category_option_category', X.eq(OV('category', c))), { bg: v[0] }]) }, [
    B.T(name + ' Code', TX(chain(base(), 'category_option_category', 'code')), { fs: 11, fwt: 800, fc: 'primaryteal', ta: 'center', fw: true, ha: 'center', when: Object.entries(CAT).map(([c, v]) => [chain(base(), 'category_option_category', X.eq(OV('category', c))), { fc: v[1] }]) }),
  ]);

  // Recalculate an item's status after its numbers change (spec section 4). thing = expression for the item.
  const recalc = (thing) => {
    const t = () => JSON.parse(JSON.stringify(thing));
    const f = (k) => chain(t(), k);
    const notPaused = chain(t(), 'status_option_itemstatus', X.ne(OV('itemstatus', 'Paused')));
    const and = (a, b) => chain(a, X.and(b));
    return [
      A.change(t(), { status_option_itemstatus: OV('itemstatus', 'Open') }, and(chain(f('qtypledged_number'), X.plus(f('qtyreceived_number')), X.eq(0)), JSON.parse(JSON.stringify(notPaused)))),
      A.change(t(), { status_option_itemstatus: OV('itemstatus', 'Partially pledged') }, and(and(chain(f('qtypledged_number'), X.plus(f('qtyreceived_number')), X.gt(0)), chain(f('qtypledged_number'), X.plus(f('qtyreceived_number')), X.lt(f('qtyneeded_number')))), JSON.parse(JSON.stringify(notPaused)))),
      A.change(t(), { status_option_itemstatus: OV('itemstatus', 'Fully pledged') }, and(and(chain(f('qtypledged_number'), X.plus(f('qtyreceived_number')), M('greater_or_equal_than', f('qtyneeded_number'))), chain(f('qtyreceived_number'), X.lt(f('qtyneeded_number')))), JSON.parse(JSON.stringify(notPaused)))),
      A.change(t(), { status_option_itemstatus: OV('itemstatus', 'Fulfilled') }, and(chain(f('qtyreceived_number'), M('greater_or_equal_than', f('qtyneeded_number'))), JSON.parse(JSON.stringify(notPaused)))),
    ];
  };

  // In-app notification + email (email only when address present)
  const notify = (to, title, body, path, extra = {}) => A.create('notification', { ...to, title_text: TX(title), body_text: typeof body === 'string' ? TX(body) : body, path_text: TX(path), read_boolean: false, ...extra });

  // Home photo tile (photo if set, else gradient + initials like the coded app). base() -> Home expression
  const PH_JS = '<script>(function(){if(window.cbPh)return;window.cbPh=1;var G=[["#BFDCD5","#8FC3B7"],["#F6D9B8","#EDB27C"],["#D7D0F0","#A99AD9"],["#C9E4F2","#8EC1DE"],["#FBE0C8","#F2B98A"]];function run(){document.querySelectorAll(".cbph").forEach(function(e){var n=e.getAttribute("data-n")||"",p=e.getAttribute("data-p")||"",id=e.getAttribute("data-id")||n,k=n+"|"+p;if(e.getAttribute("data-k")===k)return;e.setAttribute("data-k",k);if(p){e.style.background="center/cover no-repeat url(\'"+(p.indexOf("//")===0?"https:"+p:p)+"\')";e.textContent=""}else{var h=0;for(var i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))>>>0;var g=G[h%5];e.style.background="linear-gradient(90deg,"+g[0]+","+g[1]+")";e.textContent=n.replace(/[^A-Za-z ]/g,"").split(" ").filter(function(w){return w&&["of","the","home","Home"].indexOf(w)<0}).slice(0,2).map(function(w){return w[0]}).join("").toUpperCase()}})}run();setInterval(run,400)})()</script>';
  const photo = (name, base, o = {}) => {
    const h = o.h || 140, r = o.r ?? 14, f = o.f || 26, w = o.w ? o.w + 'px' : '100%';
    return B.Html(name, TX('<div class="cbph" data-n="', chain(base(), 'name_text'), '" data-id="', chain(base(), '_id'), '" data-p="', chain(base(), 'photo_image'), '" style="width:' + w + ';height:' + h + 'px;border-radius:' + r + 'px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:' + f + 'px;background:#E3F2EF"></div>' + PH_JS), { minh: h, ...(o.w ? { w: o.w, minw: o.w } : {}), ...(o.el || {}) });
  };

  const loggedIn = () => CU('logged_in');
  const notLoggedIn = () => chain(CU('logged_in'), X.eq(false));
  // Give every untyped group inside a cell the cell's type, so "Parent group's thing" works at any depth.
  function typed(root, type) {
    const gt = type.includes('.') || type === 'user' ? type : 'custom.' + type;
    const w = (e) => { Object.values(e.elements || {}).forEach((k) => { if (k.type === 'Group' && !k.properties.group_type) { k.properties.group_type = gt; k.properties.data_source = { type: 'ElementParent', is_slidable: false }; } if (k.type !== 'RepeatingGroup') w(k); }); };
    w(root); return root;
  }

  window.CBC = { shell, bar, still, pctItem, itemStatusTag, pledgeStatusTag, homeStatusTag, priorityTag, chip, recalc, notify, loggedIn, notLoggedIn, tagColors, typed, photo };
})();
