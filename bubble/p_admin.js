// Home admin (Bubble page "admin", ?tab=wishlist|pledges|profile) — A1 Dashboard, A2 Wishlist, A3/A4 Pledges, Home profile.
(() => {
  const { X, TX, B, mob, wf, A } = window.CB;
  const { CU, S, SU, OV, V, M, URL, STEP, chain } = X;
  const { bar, typed, chip, priorityTag, itemStatusTag, pledgeStatusTag, recalc, notify } = window.CBC;
  const and = (a, b) => chain(a, X.and(b));
  const or = (a, b) => chain(a, X.or(b));
  const cell = () => ({ type: 'ElementParent', is_slidable: false });
  const H = (...f) => CU('home_custom_home', ...f);
  const label = (n, t) => B.T(n, t, { fs: 13, fwt: 700 });
  const field = (n, l, input) => B.G(n, { col: 1, gap: 6 }, [label(n + ' Label', l), input]);
  const tab = () => URL('tab');
  const isTab = (t) => (t ? chain(tab(), X.eq(t)) : chain(tab(), X.empty()));

  // ---------- shared admin shell (also used by the platform page) ----------
  function adminShell(cfg) {
    const { prefix, subtitle, nav, content, popups } = cfg;
    const navBtn = (n) => B.Ghost(prefix + ' Nav ' + n.label, n.icon + '   ' + n.label, { full: true, ha: 'stretch', h: 42, fs: 14, fwt: 600, bg: 'white', fc: 'textink', p: { border_width: 0, font_alignment: 'left', padding_left: 14 }, when: [[n.on(), { bg: 'teallight', fc: 'primaryteal' }]] });
    const sidebar = B.G(prefix + ' Sidebar', { col: 1, gap: 6, w: 240, bg: 'white', border: [1, 'lines'], pad: [24, 16, 20, 16], fh: false, p: { min_height_css: '100vh' }, when: [mob({ p: { is_visible: false } })], collapse: 1 }, [
      B.T(prefix + ' Logo', '[color=#0E7C6B]Care[/color][color=#E8833A]Bridge[/color]', { fs: 22, fwt: 800 }),
      B.Sm(prefix + ' Subtitle', subtitle, { fs: 12 }),
      B.G(prefix + ' Nav Gap', { col: 1, h: 16 }),
      ...nav.map(navBtn),
      B.G(prefix + ' Grow', { col: 1, fh: false, p: { min_height_css: '40px' } }),
      B.G(prefix + ' Me', { row: 1, gap: 10, cva: 'center' }, [
        B.G(prefix + ' Avatar', { w: 34, h: 34, r: 17, bg: 'teallight', col: 1, cva: 'center' }, [B.T(prefix + ' Avatar Text', TX(chain(CU('fullname_text'), M('truncated', 1))), { fs: 13, fwt: 800, fc: 'primaryteal', ta: 'center', ha: 'center', fw: true })]),
        B.G(prefix + ' Me Text', { col: 1, gap: 1 }, [B.T(prefix + ' Me Name', TX(CU('fullname_text')), { fs: 13, fwt: 700 }), B.Sm(prefix + ' Me Email', TX(CU('email')), { fs: 11 })]),
      ]),
      B.Ghost(prefix + ' Logout', 'Log out', { full: true, ha: 'stretch', h: 36, fs: 13, fc: 'mutedtext' }),
    ]);
    const phoneTop = B.G(prefix + ' Phone Header', { row: 1, cva: 'center', pad: [14, 16, 14, 16], bg: 'white', border: [1, 'lines'], hide: true, when: [mob({ show: 1 })] }, [
      B.G(prefix + ' Phone Brand', { col: 1, gap: 1 }, [B.T(prefix + ' Phone Logo', '[color=#0E7C6B]Care[/color][color=#E8833A]Bridge[/color]', { fs: 18, fwt: 800 }), B.Sm(prefix + ' Phone Sub', subtitle, { fs: 11 })]),
      B.Ghost(prefix + ' Phone Logout', 'Log out', { h: 32, fs: 12, fc: 'mutedtext', pad: [0, 12, 0, 12] }),
    ]);
    const tabBtn = (n) => B.Ghost(prefix + ' Tab ' + n.label, n.icon + '\n' + n.label, { full: true, ha: 'stretch', h: 56, fs: 11, fwt: 600, bg: 'white', fc: 'mutedtext', p: { border_width: 0 }, when: [[n.on(), { fc: 'primaryteal' }]] });
    const phoneTabs = el('FloatingGroup', prefix + ' Phone Tabs', { style: 'FloatingGroup_shadow_', row: 1, bg: 'white', border: [1, 'lines'], pad: [4, 8, 8, 8], hide: true, when: [mob({ show: 1 })], p: { floating_reference: 'bottom', fit_width: false } }, nav.map(tabBtn));
    function el(t, n, o, k) { return window.CB.el(t, n, o, k); }
    const main = B.G(prefix + ' Content', { col: 1, gap: 20, pad: [32, 32, 40, 32], maxw: 1040, when: [mob({ pad: [16, 16, 96, 16], gap: 16 })] }, content);
    return [phoneTop, B.G(prefix + ' Page Row', { row: 1, fh: false, p: { min_height_css: '100vh' }, when: [mob({ col: 1 })] }, [sidebar, main]), phoneTabs, ...(popups || [])];
  }
  window.CBA = { adminShell };

  const NAV = [
    { label: 'Dashboard', icon: '⌂', on: () => isTab(null), tab: null },
    { label: 'Wishlist', icon: '☰', on: () => isTab('wishlist'), tab: 'wishlist' },
    { label: 'Pledges', icon: '🎁', on: () => isTab('pledges'), tab: 'pledges' },
    { label: 'Profile', icon: '👤', on: () => isTab('profile'), tab: 'profile' },
  ];

  // ---------- data ----------
  const items = (cons = []) => S('wishlistitem', [['home_custom_home', H()], ...cons]);
  const pledges = (cons = []) => S('pledge', [['home_custom_home', H()], ...cons]);
  const pst = (...v) => X.list(...v.map((x) => OV('pledgestatus', x)));
  const ist = (...v) => X.list(...v.map((x) => OV('itemstatus', x)));
  const isP = (s) => chain(cell(), 'status_option_pledgestatus', X.eq(OV('pledgestatus', s)));

  // ---------- status banners ----------
  const statusNotes = [
    B.G('Pending Note', { col: 1, gap: 4, pad: 16, r: 14, bg: 'yellowbg', hide: true, when: [[chain(H('status_option_homestatus'), X.eq(OV('homestatus', 'Pending'))), { show: 1 }]] }, [
      B.T('Pending Note Title', 'Waiting for approval', { fwt: 800, fc: 'yellow' }),
      B.T('Pending Note Text', 'The CareBridge team is reviewing your home. You can prepare your wishlist now; donors will see it once you are approved.', { fc: 'yellow', fs: 13 }),
    ]),
    B.G('Rejected Note', { col: 1, gap: 8, pad: 16, r: 14, bg: 'redbg', hide: true, when: [[chain(H('status_option_homestatus'), X.eq(OV('homestatus', 'Rejected'))), { show: 1 }]] }, [
      B.T('Rejected Title', 'Your home was not approved', { fwt: 800, fc: 'red' }),
      B.T('Rejected Reason', TX('Reason: ', H('reviewnote_text')), { fc: 'red', fs: 13 }),
      B.G('Rejected Buttons', { row: 1, gap: 8 }, [B.Ghost('Edit Details Button', 'Edit home details', { h: 36, fs: 13 }), B.Btn('Ask Review Button', 'Ask for review again', { h: 36, fs: 13 })]),
    ]),
  ];

  // ---------- pledge row (used on dashboard and pledges tab) ----------
  const pledgeRow = (sfx) => typed(B.G('Pledge Row' + sfx, { type: 'pledge', ds: cell(), row: 1, gap: 14, pad: [12, 16, 12, 16], cva: 'center', bg: 'white', border: [1, 'lines'], when: [mob({ col: 1, gap: 8 })] }, [
    B.T('PR No' + sfx, TX(chain(cell(), 'pledgeno_text')), { fwt: 700, fs: 13, minw: 130, maxw: 150 }),
    B.G('PR Donor' + sfx, { col: 1, gap: 1, minw: 130, maxw: 150 }, [B.T('PR Donor Name' + sfx, TX(chain(cell(), 'contactname_text')), { fwt: 700, fs: 13 }), B.Sm('PR Donor Phone' + sfx, TX(chain(cell(), 'contactphone_text')))]),
    B.T('PR Item' + sfx, TX(chain(cell(), 'itemname_text')), { fs: 13, minw: 160 }),
    B.T('PR Qty' + sfx, TX(chain(cell(), 'quantity_number')), { fs: 13, minw: 40, maxw: 60 }),
    B.T('PR Date' + sfx, TX(chain(cell(), 'dropoffdate_date', X.fmtDate('ddd, d mmm'))), { fs: 13, minw: 90, maxw: 110 }),
    sfx ? pledgeStatusTag('PR Status' + sfx, cell) : null,
    B.G('PR Actions' + sfx, { row: 1, gap: 8, minw: 190, cva: 'center' }, [
      B.Btn('Accept Button' + sfx, 'Accept', { h: 36, fs: 13, pad: [0, 14, 0, 14], hide: true, when: [[isP('Pending'), { show: 1 }]] }),
      B.Ghost('Decline Button' + sfx, 'Decline', { h: 36, fs: 13, pad: [0, 14, 0, 14], hide: true, when: [[isP('Pending'), { show: 1 }]] }),
      B.Btn('Receive Button' + sfx, 'Mark received', { h: 36, fs: 13, pad: [0, 14, 0, 14], hide: true, when: [[isP('Accepted'), { show: 1 }]] }),
      B.Sm('Received Text' + sfx, TX('Received ', chain(cell(), 'qtyreceived_number'), ' · ', chain(cell(), 'receivedat_date', X.fmtDate('d mmm'))), { hide: true, when: [[isP('Received'), { show: 1 }]] }),
    ]),
  ]), 'pledge');
  const tableHead = (n, cols) => B.G(n, { row: 1, gap: 14, pad: [12, 16, 12, 16], bg: 'rgba(242,244,243,1)', when: [mob({ p: { is_visible: false } })], collapse: 1 }, cols.map(([t, mn, mx], i) => B.Sm(n + ' ' + i, t, { fwt: 700, minw: mn, ...(mx ? { maxw: mx } : {}) })));
  const PHEAD = [['Pledge no.', 130, 150], ['Donor', 130, 150], ['Item', 160], ['Qty', 40, 60], ['Drop-off', 90, 110]];

  // ---------- Dashboard ----------
  const stat = (n, l, v, s, c) => B.Card(n, { gap: 6, pad: 18 }, [B.Sm(n + ' L', l, { fs: 13, fwt: 600 }), B.T(n + ' V', v, { fs: 30, fwt: 800, fc: c }), B.Sm(n + ' S', s)]);
  const openNeeds = () => chain(items([['status_option_itemstatus', ist('Open', 'Partially pledged'), 'in']]), X.count());
  const highNeeds = () => chain(items([['status_option_itemstatus', ist('Open', 'Partially pledged'), 'in'], ['priority_option_priority', OV('priority', 'High')]]), X.count());
  const pendingP = () => pledges([['status_option_pledgestatus', OV('pledgestatus', 'Pending')]]);
  const received = () => chain(pledges([['status_option_pledgestatus', OV('pledgestatus', 'Received')]]), 'qtyreceived_number', M('sum'));
  const head = (n, title, sub) => B.G(n, { row: 1, cva: 'center', gap: 12 }, [
    B.G(n + ' Text', { col: 1, gap: 4 }, [B.H1(n + ' Title', title, { fs: 26, when: [mob({ fs: 22 })] }), B.Sm(n + ' Sub', sub, { fs: 13 })]),
    B.Btn(n + ' Add', '+ Add need', { h: 46, pad: [0, 22, 0, 22], fs: 15 }),
  ]);
  const dash = B.G('Dashboard Tab', { col: 1, gap: 18, hide: true, when: [[isTab(null), { show: 1 }]] }, [
    head('Dash Head', TX('Good day, ', H('name_text')), TX(chain(X.NOW(), X.fmtDate('dddd, d mmmm yyyy')))),
    B.G('Stats Row', { row: 1, gap: 16, when: [mob({ col: 1, gap: 10 })] }, [
      stat('Stat Open', 'Open needs', TX(openNeeds()), TX(highNeeds(), ' marked High priority'), 'red'),
      stat('Stat Pending', 'Pending pledges', TX(chain(pendingP(), X.count())), 'Waiting for you to accept', 'yellow'),
      stat('Stat Received', 'Items received', TX(received()), 'Across all pledges', 'green'),
    ]),
    B.G('Dash List Head', { row: 1, gap: 10, cva: 'center' }, [B.H3('Dash List Title', 'New pledges waiting for action', { fs: 16 }), B.Tag('Dash List Count', TX(chain(pendingP(), X.count())), 'teal', { bg: 'yellowbg', fc: 'yellow' }), B.G('Dash Head Grow', { col: 1 }), B.Ghost('See All Link', 'See all', { h: 30, fs: 13, fwt: 700, fc: 'primaryteal', p: { border_width: 0 } })]),
    B.Card('Dash Table', { pad: 0, gap: 0, r: 16, p: { overflow: 'hidden' } }, [
      tableHead('Dash Table Head', [...PHEAD, ['Actions', 190]]),
      B.RG('Dash Pledges', 'pledge', chain(pendingP(), X.sortBy('Created Date', true)), { sep: 0 }, pledgeRow('')),
      B.T('Dash Empty', 'No pledges waiting. New pledges show up here straight away.', { fc: 'mutedtext', pad: 18, hide: true, when: [[chain(pendingP(), X.count(), X.eq(0)), { show: 1 }]] }),
    ]),
  ]);

  // ---------- Pledges tab ----------
  const pf = () => URL('f');
  const pledgeSets = { '': null, pending: ['Pending'], accepted: ['Accepted'], received: ['Received'], declined: ['Declined', 'Cancelled'] };
  const pList = (k) => (pledgeSets[k] ? pledges([['status_option_pledgestatus', pst(...pledgeSets[k]), 'in']]) : pledges());
  const pTab = (k, label) => B.Ghost('PTab ' + (k || 'all'), TX(label + ' (', chain(pList(k), X.count()), ')'), { h: 38, fs: 14, fwt: 600, bg: 'pagebackground', fc: 'mutedtext', p: { border_width: 0 }, when: [[k ? chain(pf(), X.eq(k)) : chain(pf(), X.empty()), { fc: 'primaryteal', bg: 'teallight' }]] });
  const pledgeTab = B.G('Pledges Tab', { col: 1, gap: 16, hide: true, when: [[isTab('pledges'), { show: 1 }]] }, [
    B.G('Pl Head', { col: 1, gap: 4 }, [B.H1('Pl Title', 'Pledges', { fs: 26 }), B.Sm('Pl Sub', 'Accept pledges, then mark them received when the donor drops off', { fs: 13 })]),
    B.G('Pl Tabs', { row: 1, gap: 6, p: { wrap: true } }, [pTab('', 'All'), pTab('pending', 'Pending'), pTab('accepted', 'Accepted'), pTab('received', 'Received'), pTab('declined', 'Declined / cancelled')]),
    B.Card('Pl Table', { pad: 0, gap: 0, r: 16, p: { overflow: 'hidden' } }, [
      tableHead('Pl Table Head', [...PHEAD, ['Status', 90, 110], ['Actions', 190]]),
      B.RG('All Pledges', 'pledge', chain(pList(''), X.sortBy('Created Date', true)), { sep: 0, when: Object.keys(pledgeSets).filter(Boolean).map((k) => [chain(pf(), X.eq(k)), { p: { data_source: chain(pList(k), X.sortBy('Created Date', true)) } }]) }, pledgeRow(' P')),
      B.T('Pl Empty', 'No pledges in this list yet.', { fc: 'mutedtext', pad: 18, hide: true, when: [[chain(pList(''), X.count(), X.eq(0)), { show: 1 }]] }),
    ]),
  ]);

  // ---------- Wishlist tab ----------
  const wf_ = () => URL('f');
  const wSets = { '': null, unfulfilled: ['Open', 'Partially pledged', 'Fully pledged'], fulfilled: ['Fulfilled'], paused: ['Paused'] };
  const wList = (k) => (wSets[k] ? items([['status_option_itemstatus', ist(...wSets[k]), 'in']]) : items());
  const wTab = (k, label) => B.Ghost('WTab ' + (k || 'all'), TX(label + ' (', chain(wList(k), X.count()), ')'), { h: 36, fs: 13, r: 18, pad: [0, 14, 0, 14], when: [[k ? chain(wf_(), X.eq(k)) : chain(wf_(), X.empty()), { bg: 'primaryteal', fc: 'white', border: [1, 'primaryteal'] }]] });
  const isI = (s) => chain(cell(), 'status_option_itemstatus', X.eq(OV('itemstatus', s)));
  const itemRow = typed(B.G('Item Row', { type: 'wishlistitem', ds: cell(), row: 1, gap: 14, pad: [12, 16, 12, 16], cva: 'center', bg: 'white', border: [1, 'lines'], when: [mob({ col: 1, gap: 8 })] }, [
    B.G('IR Name Cell', { row: 1, gap: 10, cva: 'center', minw: 220 }, [chip('IR Chip', cell, 32), B.T('IR Name', TX(chain(cell(), 'name_text')), { fwt: 700, fs: 13 })]),
    B.G('IR Pri Cell', { col: 1, minw: 80, maxw: 90 }, [priorityTag('IR Priority', cell)]),
    B.T('IR Needed By', TX(chain(cell(), 'neededby_date', X.fmtDate('d mmm'))), { fs: 13, minw: 80, maxw: 90, when: [[chain(cell(), 'neededby_date', X.empty()), { text: '—' }]] }),
    B.T('IR Numbers', TX('[b]', chain(cell(), 'qtyneeded_number'), '[/b] / [b]', chain(cell(), 'qtypledged_number'), '[/b] / [b]', chain(cell(), 'qtyreceived_number'), '[/b]'), { fs: 13, minw: 150, maxw: 170 }),
    B.G('IR Status Cell', { col: 1, minw: 120, maxw: 130 }, [itemStatusTag('IR Status', cell)]),
    B.G('IR Actions', { row: 1, gap: 8, minw: 150 }, [
      B.Ghost('Edit Item Button', 'Edit', { h: 36, fs: 13, pad: [0, 14, 0, 14] }),
      B.Ghost('Pause Item Button', 'Pause', { h: 36, fs: 13, pad: [0, 14, 0, 14], when: [[isI('Paused'), { text: 'Resume' }]] }),
    ]),
  ]), 'wishlistitem');
  const wishTab = B.G('Wishlist Tab', { col: 1, gap: 16, hide: true, when: [[isTab('wishlist'), { show: 1 }]] }, [
    head('Wish Head', 'Wishlist', TX(chain(items(), X.count()), ' items · donors see these on your public page')),
    B.G('W Tabs', { row: 1, gap: 8, p: { wrap: true } }, [wTab('', 'All'), wTab('unfulfilled', 'Unfulfilled'), wTab('fulfilled', 'Fulfilled'), wTab('paused', 'Paused')]),
    B.Card('W Table', { pad: 0, gap: 0, r: 16, p: { overflow: 'hidden' } }, [
      tableHead('W Table Head', [['Item', 220], ['Priority', 80, 90], ['Needed by', 80, 90], ['Needed / Pledged / Received', 150, 170], ['Status', 120, 130], ['Actions', 150]]),
      B.RG('Items List', 'wishlistitem', chain(wList(''), X.sortBy('priority_option_priority')), { sep: 0, when: Object.keys(wSets).filter(Boolean).map((k) => [chain(wf_(), X.eq(k)), { p: { data_source: chain(wList(k), X.sortBy('priority_option_priority')) } }]) }, itemRow),
      B.T('W Empty', 'No needs yet. Add the first thing your home needs.', { fc: 'mutedtext', pad: 18, hide: true, when: [[chain(items(), X.count(), X.eq(0)), { show: 1 }]] }),
    ]),
  ]);

  // ---------- Profile tab ----------
  const managers = () => SU([['home_custom_home', H()]]);
  const invites = () => S('invite', [['home_custom_home', H()]]);
  const mgrRow = typed(B.G('Manager Row', { type: 'user', ds: cell(), row: 1, gap: 10, cva: 'center', pad: [8, 0, 8, 0] }, [
    B.G('MR Avatar', { w: 34, h: 34, r: 17, bg: 'teallight', col: 1, cva: 'center' }, [B.T('MR Initial', TX(chain(cell(), 'fullname_text', M('truncated', 1))), { fs: 13, fwt: 800, fc: 'primaryteal', ta: 'center', ha: 'center', fw: true })]),
    B.G('MR Text', { col: 1, gap: 1 }, [
      B.G('MR Name Row', { row: 1, gap: 6, cva: 'center' }, [B.T('MR Name', TX(chain(cell(), 'fullname_text')), { fwt: 700, fs: 14 }), B.Tag('MR You', 'You', 'teal', { hide: true, when: [[chain(cell(), X.eq(CU())), { show: 1 }]] })]),
      B.Sm('MR Email', TX(chain(cell(), 'email'))),
    ]),
    B.Ghost('Leave Button', 'Leave', { h: 34, fs: 13, pad: [0, 14, 0, 14], fc: 'mutedtext', hide: true, when: [[chain(cell(), X.eq(CU())), { show: 1 }]] }),
    B.Ghost('Remove Manager Button', 'Remove', { h: 34, fs: 13, pad: [0, 14, 0, 14], fc: 'red', hide: true, when: [[chain(cell(), X.ne(CU())), { show: 1 }]] }),
  ]), 'user');
  const invRow = typed(B.G('Invite Row', { type: 'invite', ds: cell(), row: 1, gap: 10, cva: 'center', pad: [6, 0, 6, 0] }, [
    B.T('IV Email', TX(chain(cell(), 'email_text')), { fs: 13 }), B.Tag('IV Tag', 'Invited', 'teal', { bg: 'yellowbg', fc: 'yellow' }), B.G('IV Grow', { col: 1 }),
    B.Ghost('Cancel Invite Button', 'Cancel', { h: 32, fs: 12, pad: [0, 12, 0, 12] }),
  ]), 'invite');
  const hd = (n) => H(n);
  const profileTab = B.G('Profile Tab', { col: 1, gap: 18, maxw: 640, hide: true, when: [[isTab('profile'), { show: 1 }]] }, [
    B.G('Pf Head', { row: 1, cva: 'center' }, [B.G('Pf Head Text', { col: 1, gap: 4 }, [B.H1('Pf Title', 'Home profile', { fs: 26 }), B.Sm('Pf Sub', 'Donors see this on your public page.', { fs: 13 })]), B.Ghost('Public Page Button', 'Public page →', { h: 34, fs: 13, fc: 'primaryteal', p: { border_width: 0 } })]),
    B.Card('Managers Card', { gap: 10, pad: 18 }, [
      B.H3('Mg Title', 'Home managers', { fs: 16 }),
      B.Sm('Mg Text', 'Everyone here can manage the wishlist and pledges and gets the notifications. To move the home to a new Gmail, add it first, then leave.'),
      B.RG('Managers List', 'user', managers(), { sep: 0 }, mgrRow),
      B.RG('Invites List', 'invite', invites(), { sep: 0 }, invRow),
      label('Add Label', 'Add by Gmail or email'),
      B.G('Add Row', { row: 1, gap: 10 }, [B.In('Invite Email Input', 'name@gmail.com', 'email'), B.Btn('Add Manager Button', 'Add', { h: 46, pad: [0, 20, 0, 20] })]),
      B.Sm('Add Help', 'They get an email and join when they sign in with that address.'),
    ]),
    B.Card('Account Card', { gap: 12, pad: 18 }, [
      B.H3('Ac Title', 'My account', { fs: 16 }), B.Sm('Ac Signed', TX('Signed in as [b]', CU('email'), '[/b]')),
      B.G('Ac Row', { row: 1, gap: 12, when: [mob({ col: 1 })] }, [field('Ac Name F', 'Full name', B.In('Ac Name Input', '', 'text', { p: { content_format: 'text', default: TX(CU('fullname_text')) } })), field('Ac Phone F', 'Phone number', B.In('Ac Phone Input', '', 'text', { p: { content_format: 'text', default: TX(CU('phone_text')) } }))]),
      B.Check('Ac Email Checkbox', 'Email notifications (pledge updates sent to my email)', { p: { default_value: CU('emailnotifications_boolean') } }),
      B.G('Ac Buttons', { row: 1, gap: 10, cva: 'center' }, [B.Ghost('Save Account Button', 'Save', { h: 36, fs: 13, fc: 'primaryteal', border: [1, 'primaryteal'], pad: [0, 16, 0, 16] }), B.T('Ac Saved', 'Saved.', { fc: 'green', fs: 13, fwt: 700, hide: true })]),
    ]),
    B.H3('Hd Title', 'Home details', { fs: 16 }),
    B.Card('Details Card', { gap: 14, pad: 20 }, [
      field('Hd Name F', 'Home name', B.In('Hd Name Input', '', 'text', { p: { content_format: 'text', default: TX(hd('name_text')) } })),
      B.G('Hd Row', { row: 1, gap: 12, when: [mob({ col: 1 })] }, [field('Hd Type F', 'Type', B.Drop('Hd Type Dropdown', 'Type', 'hometype', { p: { default_value: hd('type_option_hometype') } })), field('Hd Area F', 'Area', B.Drop('Hd Area Dropdown', 'Area', 'area', { p: { default_value: hd('area_option_area') } }))]),
      field('Hd Address F', 'Drop-off address', B.In('Hd Address Input', '', 'text', { p: { content_format: 'text', default: TX(hd('address_text')) } })),
      field('Hd Hours F', 'Drop-off hours', B.In('Hd Hours Input', '', 'text', { p: { content_format: 'text', default: TX(hd('dropoffhours_text')) } })),
      field('Hd About F', 'About the home', B.Area('Hd About Input', 'Who you care for and what you need most', { p: { default: TX(hd('about_text')) } })),
      field('Hd Email F', 'Public contact email (optional)', B.In('Hd Email Input', '', 'email', { p: { content_format: 'email', default: TX(hd('notifyemail_text')) } })),
      field('Hd Photo F', 'Home photo (optional)', window.CB.el('PictureInput', 'Hd Photo Input', { style: 'PictureInput_standard_image_uploader_', h: 120, ha: 'stretch', fh: false, p: { default_value: hd('photo_image') } })),
      B.Btn('Save Home Button', 'Save changes', { full: true, ha: 'stretch', h: 48 }),
      B.T('Hd Saved', 'Home details saved.', { fc: 'green', fs: 13, fwt: 700, hide: true }),
    ]),
  ]);

  // ---------- popups ----------
  const needForm = (sfx, item) => [
    field('NF Name F' + sfx, 'Item name', B.In('NF Name' + sfx, 'e.g. Adult diapers, size L', 'text', item ? { p: { content_format: 'text', default: TX(chain(item(), 'name_text')) } } : {})),
    B.G('NF Row' + sfx, { row: 1, gap: 12 }, [
      field('NF Cat F' + sfx, 'Category', B.Drop('NF Category' + sfx, 'Category', 'category', item ? { p: { default_value: chain(item(), 'category_option_category') } } : {})),
      field('NF Pri F' + sfx, 'Priority', B.Drop('NF Priority' + sfx, 'Priority', 'priority', item ? { p: { default_value: chain(item(), 'priority_option_priority') } } : {})),
    ]),
    B.G('NF Row2' + sfx, { row: 1, gap: 12 }, [
      field('NF Qty F' + sfx, 'Quantity needed', B.In('NF Qty' + sfx, '10', 'int_number', item ? { p: { content_format: 'int_number', default: TX(chain(item(), 'qtyneeded_number')) } } : {})),
      field('NF Date F' + sfx, 'Needed by (optional)', B.Date('NF Date' + sfx, 'Pick a date', item ? { p: { default_value: chain(item(), 'neededby_date') } } : {})),
    ]),
    field('NF Note F' + sfx, 'Note for donors (optional)', B.Area('NF Note' + sfx, 'Brand, size or anything donors should know', item ? { p: { default: TX(chain(item(), 'note_text')) } } : {})),
  ];
  const popHead = (n, t) => B.G(n, { row: 1, cva: 'center' }, [B.H2(n + ' Title', t), B.Ghost(n + ' Close', '×', { w: 36, h: 36, fs: 18, p: { border_width: 0 } })]);
  const pop = (n, type, kids) => window.CB.el('Popup', n, { style: 'Popup_standard_popup_', col: 1, gap: 14, pad: 26, r: 22, type, p: { width: 520, min_width_css: '320px', max_width_css: '520px', fit_width: false } }, kids);
  const addPop = pop('Add Need Popup', null, [popHead('Add Head', 'Add a need'), ...needForm('', null), B.T('Add Error', 'Give the item a name, category, priority and a quantity of at least 1.', { fc: 'red', fs: 13, hide: true }), B.Btn('Save Need Button', 'Save need', { full: true, ha: 'stretch', h: 48 })]);
  const editPop = typed(pop('Edit Need Popup', 'custom.wishlistitem', [popHead('Edit Head', 'Edit need'), ...needForm(' E', cell), B.Sm('Edit Help', TX('Quantity can’t be lower than what donors pledged and you received (', chain(cell(), 'qtypledged_number', X.plus(chain(cell(), 'qtyreceived_number'))), ').')), B.T('Edit Error', 'Check the quantity and fields.', { fc: 'red', fs: 13, hide: true }), B.Btn('Update Need Button', 'Save changes', { full: true, ha: 'stretch', h: 48 })]), 'wishlistitem');
  const recvPop = typed(pop('Receive Popup', 'custom.pledge', [
    popHead('Recv Head', 'Mark as received'),
    B.Sm('Recv Info', TX(chain(cell(), 'pledgeno_text'), ' · ', chain(cell(), 'itemname_text'), ' × ', chain(cell(), 'quantity_number'), ' from ', chain(cell(), 'contactname_text'))),
    field('Recv Qty F', 'Quantity actually delivered', B.In('Recv Qty Input', '', 'int_number', { p: { content_format: 'int_number', default: TX(chain(cell(), 'quantity_number')) } })),
    B.G('Recv Preview', { col: 1, pad: 12, r: 10, bg: 'teallight' }, [B.T('Recv Preview Text', TX('[b]Wishlist update:[/b] received +', V('Recv Qty Input'), ', pledged −', chain(cell(), 'quantity_number'), '. Anything not delivered becomes available again.'), { fc: 'tealdark', fs: 13 })]),
    B.G('Recv Buttons', { row: 1, gap: 10 }, [B.Ghost('Recv Cancel', 'Cancel', { full: true, ha: 'stretch', h: 46 }), B.Btn('Confirm Receive Button', 'Confirm received', { full: true, ha: 'stretch', h: 46 })]),
  ]), 'pledge');

  // ---------- workflows ----------
  const go = (t) => A.go('admin', null, t ? { tab: t } : null);
  const donorEmail = (subject, body) => A.email(chain(cell(), 'donor_user', 'email'), subject, body, chain(cell(), 'donor_user', 'emailnotifications_boolean', X.ne(false)));
  const item = () => chain(cell(), 'item_custom_wishlistitem');
  const W2 = () => [
    A.change(cell(), { status_option_pledgestatus: OV('pledgestatus', 'Accepted') }),
    notify({ touser_user: chain(cell(), 'donor_user') }, 'Pledge accepted', TX(chain(cell(), 'homename_text'), ' accepted ', chain(cell(), 'itemname_text'), ' × ', chain(cell(), 'quantity_number'), '. See you at drop-off!'), '/my-pledges', { pledge_custom_pledge: cell() }),
    donorEmail('Pledge accepted – drop-off details', TX('Good news! ', chain(cell(), 'homename_text'), ' accepted your pledge ', chain(cell(), 'pledgeno_text'), ' (', chain(cell(), 'itemname_text'), ' × ', chain(cell(), 'quantity_number'), ').\n\nPlease drop it off on ', chain(cell(), 'dropoffdate_date', X.fmtDate('ddd, d mmm yyyy')), ' at ', chain(cell(), 'home_custom_home', 'address_text'), ' (', chain(cell(), 'home_custom_home', 'dropoffhours_text'), ').\n\nThank you,\nCareBridge')),
  ];
  const W3 = () => [
    A.change(cell(), { status_option_pledgestatus: OV('pledgestatus', 'Declined') }),
    A.change(item(), { qtypledged_number: chain(item(), 'qtypledged_number', X.minus(chain(cell(), 'quantity_number')), M('max', 0)) }),
    ...recalc(item()),
    notify({ touser_user: chain(cell(), 'donor_user') }, 'Pledge declined', TX(chain(cell(), 'homename_text'), ' could not accept ', chain(cell(), 'itemname_text'), ' × ', chain(cell(), 'quantity_number'), '.'), '/my-pledges', { pledge_custom_pledge: cell() }),
    donorEmail('Pledge declined', TX('Sorry, ', chain(cell(), 'homename_text'), ' could not accept your pledge ', chain(cell(), 'pledgeno_text'), ' this time. Other homes may still need it – have a look on CareBridge.')),
  ];
  const qtyR = () => V('Recv Qty Input');
  const W5 = [
    A.change(cell(), { status_option_pledgestatus: OV('pledgestatus', 'Received'), qtyreceived_number: qtyR(), receivedat_date: X.NOW() }),
    A.change(item(), { qtyreceived_number: chain(item(), 'qtyreceived_number', X.plus(qtyR())), qtypledged_number: chain(item(), 'qtypledged_number', X.minus(chain(cell(), 'quantity_number')), M('max', 0)) }),
    ...recalc(item()),
    notify({ touser_user: chain(cell(), 'donor_user') }, 'Donation received – thank you!', TX(chain(cell(), 'homename_text'), ' received ', chain(cell(), 'itemname_text'), ' × ', qtyR(), '.'), '/my-pledges', { pledge_custom_pledge: cell() }),
    donorEmail('Thank you – your donation was received', TX(chain(cell(), 'homename_text'), ' received ', chain(cell(), 'itemname_text'), ' × ', qtyR(), ' from you. Thank you for giving exactly what was needed!\n\nCareBridge')),
    A.hide('Receive Popup'),
  ];
  const pledgeWfs = (sfx) => [
    wf('Accept W2' + sfx, { type: 'ButtonClicked', el: 'Accept Button' + sfx }, W2()),
    wf('Decline W3' + sfx, { type: 'ButtonClicked', el: 'Decline Button' + sfx }, W3()),
    wf('Open receive' + sfx, { type: 'ButtonClicked', el: 'Receive Button' + sfx }, [A.display('Receive Popup', cell()), A.show('Receive Popup')]),
  ];
  const nfOk = (sfx) => and(and(and(chain(V('NF Name' + sfx), X.notEmpty()), chain(V('NF Category' + sfx), X.notEmpty())), chain(V('NF Priority' + sfx), X.notEmpty())), chain(V('NF Qty' + sfx), X.gt(0)));
  const nfBad = (sfx) => or(or(or(chain(V('NF Name' + sfx), X.empty()), chain(V('NF Category' + sfx), X.empty())), chain(V('NF Priority' + sfx), X.empty())), chain(V('NF Qty' + sfx), X.lt(1)));
  const W6 = [
    A.create('wishlistitem', { home_custom_home: H(), homename_text: TX(H('name_text')), homeapproved_boolean: chain(H('status_option_homestatus'), X.eq(OV('homestatus', 'Approved'))), name_text: TX(V('NF Name')), category_option_category: V('NF Category'), priority_option_priority: V('NF Priority'), qtyneeded_number: V('NF Qty'), qtypledged_number: 0, qtyreceived_number: 0, neededby_date: V('NF Date'), note_text: TX(V('NF Note')), status_option_itemstatus: OV('itemstatus', 'Open') }),
    A.hide('Add Need Popup'),
    A.reset(),
  ];
  const editOk = () => and(nfOk(' E'), chain(V('NF Qty E'), M('greater_or_equal_than', chain(cell(), 'qtypledged_number', X.plus(chain(cell(), 'qtyreceived_number'))))));
  const W_EDIT = [
    A.change(cell(), { name_text: TX(V('NF Name E')), category_option_category: V('NF Category E'), priority_option_priority: V('NF Priority E'), qtyneeded_number: V('NF Qty E'), neededby_date: V('NF Date E'), note_text: TX(V('NF Note E')) }),
    ...recalc(cell()),
    A.hide('Edit Need Popup'),
  ];
  const W11 = [
    A.change(H(), { status_option_homestatus: OV('homestatus', 'Pending'), resubmittedat_date: X.NOW() }),
    notify({ torole_option_role: OV('role', 'platformAdmin') }, 'Home asks for review again', TX(H('name_text'), ' updated its details'), '/platform'),
  ];
  const isManager = () => chain(CU('role_option_role'), X.eq(OV('role', 'homeAdmin')));

  window.PAGE = {
    name: 'admin',
    elements: adminShell({ prefix: 'A', subtitle: TX(H('name_text')), nav: NAV, content: [...statusNotes, dash, wishTab, pledgeTab, profileTab], popups: [addPop, editPop, recvPop] }),
    workflows: [
      wf('Needs login', { type: 'PageLoaded', cond: CU('not_logged_in') }, [A.go('login', null, { mode: 'login' })]),
      wf('Not a manager', { type: 'PageLoaded', cond: and(CU('logged_in'), chain(CU('role_option_role'), X.ne(OV('role', 'homeAdmin')))) }, [A.go('index')]),
      ...NAV.flatMap((n) => [wf('Nav ' + n.label, { type: 'ButtonClicked', el: 'A Nav ' + n.label }, [go(n.tab)]), wf('Tab ' + n.label, { type: 'ButtonClicked', el: 'A Tab ' + n.label }, [go(n.tab)])]),
      wf('Log out', { type: 'ButtonClicked', el: 'A Logout' }, [A.logout(), A.go('index')]),
      wf('Log out phone', { type: 'ButtonClicked', el: 'A Phone Logout' }, [A.logout(), A.go('index')]),
      wf('Edit details', { type: 'ButtonClicked', el: 'Edit Details Button' }, [go('profile')]),
      wf('Ask review W11', { type: 'ButtonClicked', el: 'Ask Review Button' }, W11),
      wf('See all', { type: 'ButtonClicked', el: 'See All Link' }, [go('pledges')]),
      ...['Dash Head Add', 'Wish Head Add'].map((b) => wf('Open add ' + b, { type: 'ButtonClicked', el: b }, [A.show('Add Need Popup')])),
      wf('Close add', { type: 'ButtonClicked', el: 'Add Head Close' }, [A.hide('Add Need Popup')]),
      wf('Save need W6', { type: 'ButtonClicked', el: 'Save Need Button', cond: nfOk('') }, W6),
      wf('Save need invalid', { type: 'ButtonClicked', el: 'Save Need Button', cond: nfBad('') }, [A.show('Add Error')]),
      wf('Open edit', { type: 'ButtonClicked', el: 'Edit Item Button' }, [A.display('Edit Need Popup', cell()), A.show('Edit Need Popup')]),
      wf('Close edit', { type: 'ButtonClicked', el: 'Edit Head Close' }, [A.hide('Edit Need Popup')]),
      wf('Update need', { type: 'ButtonClicked', el: 'Update Need Button', cond: editOk() }, W_EDIT),
      wf('Update need invalid', { type: 'ButtonClicked', el: 'Update Need Button', cond: or(nfBad(' E'), chain(V('NF Qty E'), X.lt(chain(cell(), 'qtypledged_number', X.plus(chain(cell(), 'qtyreceived_number')))))) }, [A.show('Edit Error')]),
      wf('Pause W7', { type: 'ButtonClicked', el: 'Pause Item Button', cond: chain(cell(), 'status_option_itemstatus', X.ne(OV('itemstatus', 'Paused'))) }, [A.change(cell(), { status_option_itemstatus: OV('itemstatus', 'Paused') })]),
      wf('Resume W7', { type: 'ButtonClicked', el: 'Pause Item Button', cond: chain(cell(), 'status_option_itemstatus', X.eq(OV('itemstatus', 'Paused'))) }, [A.change(cell(), { status_option_itemstatus: OV('itemstatus', 'Open') }), ...recalc(cell())]),
      ...pledgeWfs(''), ...pledgeWfs(' P'),
      wf('Close receive', { type: 'ButtonClicked', el: 'Recv Head Close' }, [A.hide('Receive Popup')]),
      wf('Cancel receive', { type: 'ButtonClicked', el: 'Recv Cancel' }, [A.hide('Receive Popup')]),
      wf('Confirm receive W5', { type: 'ButtonClicked', el: 'Confirm Receive Button', cond: chain(qtyR(), M('greater_or_equal_than', 0)) }, W5),
      wf('Public page', { type: 'ButtonClicked', el: 'Public Page Button' }, [A.go('home', H())]),
      wf('Invite manager', { type: 'ButtonClicked', el: 'Add Manager Button', cond: chain(V('Invite Email Input'), X.notEmpty()) }, [
        A.create('invite', { email_text: TX(V('Invite Email Input')), role_option_role: OV('role', 'homeAdmin'), home_custom_home: H(), homename_text: TX(H('name_text')), invitedby_user: CU() }),
        A.email(V('Invite Email Input'), TX('You were added as a manager of ', H('name_text'), ' on CareBridge'), TX(CU('fullname_text'), ' added you as a manager of ', H('name_text'), ' on CareBridge.\n\nSign up or log in with this email address to start managing the wishlist and pledges.')),
        A.reset(),
      ]),
      wf('Cancel invite', { type: 'ButtonClicked', el: 'Cancel Invite Button' }, [A.del(cell())]),
      wf('Remove manager', { type: 'ButtonClicked', el: 'Remove Manager Button' }, [A.change(cell(), { role_option_role: OV('role', 'donor'), home_custom_home: null })]),
      wf('Leave home', { type: 'ButtonClicked', el: 'Leave Button', cond: chain(managers(), X.count(), X.gt(1)) }, [A.change(CU(), { role_option_role: OV('role', 'donor'), home_custom_home: null }), A.go('index')]),
      wf('Save my account', { type: 'ButtonClicked', el: 'Save Account Button' }, [A.change(CU(), { fullname_text: TX(V('Ac Name Input')), phone_text: TX(V('Ac Phone Input')), emailnotifications_boolean: V('Ac Email Checkbox') }), A.show('Ac Saved')]),
      wf('Save home details', { type: 'ButtonClicked', el: 'Save Home Button' }, [
        A.change(H(), { name_text: TX(V('Hd Name Input')), type_option_hometype: V('Hd Type Dropdown'), area_option_area: V('Hd Area Dropdown'), address_text: TX(V('Hd Address Input')), dropoffhours_text: TX(V('Hd Hours Input')), about_text: TX(V('Hd About Input')), notifyemail_text: TX(V('Hd Email Input')), photo_image: V('Hd Photo Input') }),
        A.show('Hd Saved'),
      ]),
    ],
  };
  void isManager;
})();
