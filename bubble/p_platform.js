// Platform admin (Bubble page "platform", ?tab=homes|overview|admins|account) — P1 Approvals, Homes, P2 Overview, Admins, My account.
// Needs p_admin.js loaded first (shared admin shell).
(() => {
  const { X, TX, B, mob, wf, A } = window.CB;
  const { CU, S, SU, OV, V, M, URL, chain } = X;
  const { bar, typed, homeStatusTag, notify, photo } = window.CBC;
  const { adminShell } = window.CBA;
  const and = (a, b) => chain(a, X.and(b));
  const cell = () => ({ type: 'ElementParent', is_slidable: false });
  const label = (n, t) => B.T(n, t, { fs: 13, fwt: 700 });
  const field = (n, l, input) => B.G(n, { col: 1, gap: 6 }, [label(n + ' Label', l), input]);
  const tab = () => URL('tab');
  const isTab = (t) => (t ? chain(tab(), X.eq(t)) : chain(tab(), X.empty()));
  const hs = (s) => OV('homestatus', s);
  const isH = (s) => chain(cell(), 'status_option_homestatus', X.eq(hs(s)));
  const homes = (cons = []) => S('home', cons);
  const head = (n, title, sub) => B.G(n, { col: 1, gap: 4 }, [B.H1(n + ' Title', title, { fs: 26, when: [mob({ fs: 22 })] }), B.Sm(n + ' Sub', sub, { fs: 13 })]);
  const kv = (n, k, v) => B.G(n, { col: 1, gap: 2, minw: 120 }, [B.Sm(n + ' K', k, { fs: 11, fwt: 700 }), B.T(n + ' V', v, { fs: 13, fwt: 600 })]);

  const NAV = [
    { label: 'Approvals', icon: '✓', on: () => isTab(null), tab: null },
    { label: 'Homes', icon: '⌂', on: () => isTab('homes'), tab: 'homes' },
    { label: 'Overview', icon: '▦', on: () => isTab('overview'), tab: 'overview' },
    { label: 'Admins', icon: '👤', on: () => isTab('admins'), tab: 'admins' },
  ];

  // ---------- P1 Approvals ----------
  const pending = () => homes([['status_option_homestatus', hs('Pending')]]);
  const reviewed = () => homes([['status_option_homestatus', X.list(hs('Approved'), hs('Rejected')), 'in']]);
  const approvalCard = typed(B.Card('Approval Card', { type: 'home', ds: cell(), row: 1, gap: 18, pad: 18, when: [mob({ col: 1, gap: 12, pad: 16 })] }, [
    photo('AC Photo', cell, { h: 120, w: 160, f: 30, r: 14 }),
    B.G('AC Body', { col: 1, gap: 10 }, [
      B.G('AC Title Row', { row: 1, gap: 8, cva: 'center', p: { wrap: true } }, [
        B.H3('AC Name', TX(chain(cell(), 'name_text')), { fs: 17 }),
        homeStatusTag('AC Status', cell),
        B.Sm('AC Again', TX('Asked for review again ', chain(cell(), 'resubmittedat_date', X.fmtDate('d mmm, h:MM a'))), { hide: true, when: [[chain(cell(), 'resubmittedat_date', X.notEmpty()), { show: 1 }]] }),
      ]),
      B.G('AC Facts', { row: 1, gap: 18, p: { wrap: true }, when: [mob({ gap: 12 })] }, [
        kv('AC Type', 'TYPE', TX(chain(cell(), 'type_option_hometype', 'display'))),
        kv('AC Area', 'AREA', TX(chain(cell(), 'area_option_area', 'display'))),
        kv('AC Contact', 'CONTACT', TX(chain(cell(), 'notifyemail_text'))),
        kv('AC Submitted', 'SUBMITTED', TX(chain(cell(), 'Created Date', X.fmtDate('d mmm yyyy')))),
      ]),
      B.T('AC About', TX(chain(cell(), 'about_text')), { fs: 13, fc: 'mutedtext' }),
      B.Sm('AC Address', TX('Drop-off: ', chain(cell(), 'address_text'), ' · ', chain(cell(), 'dropoffhours_text'))),
      B.G('AC Buttons', { row: 1, gap: 10, p: { wrap: true } }, [
        B.Btn('Approve Button', 'Approve', { h: 40, fs: 14, pad: [0, 20, 0, 20] }),
        B.Ghost('Reject Button', 'Reject', { h: 40, fs: 14, pad: [0, 20, 0, 20], fc: 'red' }),
        B.Ghost('Preview Button', 'Preview public page →', { h: 40, fs: 13, fc: 'primaryteal', p: { border_width: 0 } }),
      ]),
    ]),
  ]), 'home');
  const reviewedRow = typed(B.G('Reviewed Row', { type: 'home', ds: cell(), row: 1, gap: 12, cva: 'center', pad: [12, 16, 12, 16], bg: 'white', border: [1, 'lines'], when: [mob({ col: 1, gap: 6 })] }, [
    B.T('RR Name', TX(chain(cell(), 'name_text')), { fwt: 700, fs: 14, minw: 220 }),
    B.G('RR Status Cell', { col: 1, minw: 90, maxw: 110 }, [homeStatusTag('RR Status', cell)]),
    B.Sm('RR Date', TX('Reviewed ', chain(cell(), 'reviewedat_date', X.fmtDate('d mmm yyyy'))), { minw: 140 }),
    B.Sm('RR Note', TX(chain(cell(), 'reviewnote_text')), { minw: 120 }),
    B.Ghost('RR Pending Button', 'Back to pending', { h: 34, fs: 12, pad: [0, 12, 0, 12] }),
  ]), 'home');
  const approvals = B.G('Approvals Tab', { col: 1, gap: 18, hide: true, when: [[isTab(null), { show: 1 }]] }, [
    head('Ap Head', 'Home approvals', TX(chain(pending(), X.count()), ' waiting for review · donors can’t see these homes yet')),
    B.RG('Pending Homes', 'home', chain(pending(), X.sortBy('Created Date')), { sep: 14 }, approvalCard),
    B.Card('Ap Empty', { pad: 22, hide: true, when: [[chain(pending(), X.count(), X.eq(0)), { show: 1 }]] }, [B.T('Ap Empty Text', 'No homes waiting for review. New registrations show up here straight away.', { fc: 'mutedtext' })]),
    B.H3('Rv Title', 'Recently reviewed', { fs: 16 }),
    B.Card('Rv Table', { pad: 0, gap: 0, r: 16, p: { overflow: 'hidden' } }, [
      B.RG('Reviewed Homes', 'home', chain(reviewed(), X.sortBy('reviewedat_date', true)), { sep: 0 }, reviewedRow),
    ]),
  ]);

  // ---------- Homes (every home, any status) ----------
  const homeRow = typed(B.G('Home Row', { type: 'home', ds: cell(), row: 1, gap: 14, cva: 'center', pad: [12, 16, 12, 16], bg: 'white', border: [1, 'lines'], when: [mob({ col: 1, gap: 8 })] }, [
    B.G('HR Name Cell', { row: 1, gap: 10, cva: 'center', minw: 240 }, [
      photo('HR Photo', cell, { h: 40, w: 40, f: 13, r: 10 }),
      B.G('HR Name Text', { col: 1, gap: 1 }, [B.T('HR Name', TX(chain(cell(), 'name_text')), { fwt: 700, fs: 14 }), B.Sm('HR Meta', TX(chain(cell(), 'type_option_hometype', 'display'), ' · ', chain(cell(), 'area_option_area', 'display')))]),
    ]),
    B.G('HR Status Cell', { col: 1, minw: 90, maxw: 110 }, [homeStatusTag('HR Status', cell)]),
    B.G('HR Actions', { row: 1, gap: 8, p: { wrap: true } }, [
      B.Btn('HR Approve', 'Approve', { h: 34, fs: 12, pad: [0, 12, 0, 12], hide: true, when: [[chain(cell(), 'status_option_homestatus', X.ne(hs('Approved'))), { show: 1 }]] }),
      B.Ghost('HR Reject', 'Reject', { h: 34, fs: 12, pad: [0, 12, 0, 12], fc: 'red', hide: true, when: [[chain(cell(), 'status_option_homestatus', X.ne(hs('Rejected'))), { show: 1 }]] }),
      B.Ghost('HR Pending', 'Back to pending', { h: 34, fs: 12, pad: [0, 12, 0, 12], hide: true, when: [[chain(cell(), 'status_option_homestatus', X.ne(hs('Pending'))), { show: 1 }]] }),
      B.Ghost('HR Managers', 'Managers', { h: 34, fs: 12, pad: [0, 12, 0, 12], fc: 'primaryteal' }),
    ]),
  ]), 'home');
  const homesTab = B.G('Homes Tab', { col: 1, gap: 18, hide: true, when: [[isTab('homes'), { show: 1 }]] }, [
    head('Hm Head', 'Homes', TX(chain(homes(), X.count()), ' homes · change any status, or which accounts manage a home')),
    B.Card('Hm Table', { pad: 0, gap: 0, r: 16, p: { overflow: 'hidden' } }, [
      B.RG('All Homes', 'home', chain(homes(), X.sortBy('name_text')), { sep: 0 }, homeRow),
    ]),
  ]);

  // ---------- P2 Overview ----------
  const pl = (cons = []) => S('pledge', cons);
  const ps = (...v) => X.list(...v.map((x) => OV('pledgestatus', x)));
  const pCount = (...v) => chain(pl([['status_option_pledgestatus', ps(...v), 'in']]), X.count());
  const allP = () => chain(pl(), X.count());
  const stat = (n, l, v, s, c) => B.Card(n, { gap: 6, pad: 18 }, [B.Sm(n + ' L', l, { fs: 13, fwt: 600 }), B.T(n + ' V', v, { fs: 30, fwt: 800, fc: c }), B.Sm(n + ' S', s, { fs: 11 })]);
  const statusBar = (n, l, v, color) => B.G(n, { row: 1, gap: 14, cva: 'center' }, [
    B.T(n + ' L', l, { fs: 13, fwt: 600, minw: 170, maxw: 170, when: [mob({ minw: 84, maxw: 84, fs: 12 })] }),
    B.G(n + ' Bar Cell', { col: 1 }, [bar(n + ' Bar', chain(v(), X.div(chain(allP(), M('max', 1))), X.times(100)), color)]),
    B.T(n + ' V', TX(v()), { fs: 13, fwt: 700, minw: 28, maxw: 28 }),
  ]);
  const items = (h, cons = []) => S('wishlistitem', [['home_custom_home', h], ...cons]);
  const fulRow = typed(B.G('Ful Row', { type: 'home', ds: cell(), col: 1, gap: 6, pad: [10, 0, 10, 0] }, [
    B.G('Ful Top', { row: 1, cva: 'center' }, [
      B.T('Ful Name', TX(chain(cell(), 'name_text')), { fwt: 700, fs: 13 }),
      B.T('Ful Pct', TX(chain(items(cell(), [['status_option_itemstatus', OV('itemstatus', 'Fulfilled')]]), X.count()), ' / ', chain(items(cell(), [['status_option_itemstatus', OV('itemstatus', 'Paused'), 'not equal']]), X.count())), { fs: 13, fwt: 800, fc: 'primaryteal', ta: 'right' }),
    ]),
    bar('Ful Bar', chain(items(cell(), [['status_option_itemstatus', OV('itemstatus', 'Fulfilled')]]), X.count(), X.div(chain(items(cell(), [['status_option_itemstatus', OV('itemstatus', 'Paused'), 'not equal']]), X.count(), M('max', 1))), X.times(100))),
    B.Sm('Ful Meta', TX(chain(items(cell(), [['status_option_itemstatus', OV('itemstatus', 'Fulfilled')]]), X.count()), ' of ', chain(items(cell(), [['status_option_itemstatus', OV('itemstatus', 'Paused'), 'not equal']]), X.count()), ' needs fulfilled'), { fs: 11 }),
  ]), 'home');
  const approved = () => homes([['status_option_homestatus', hs('Approved')]]);
  const overview = B.G('Overview Tab', { col: 1, gap: 18, hide: true, when: [[isTab('overview'), { show: 1 }]] }, [
    head('Ov Head', 'Overview', 'Live numbers from the database'),
    B.G('Ov Stats', { row: 1, gap: 16, when: [mob({ col: 1, gap: 10 })] }, [
      stat('Ov Homes', 'Approved homes', TX(chain(approved(), X.count())), TX(chain(pending(), X.count()), ' waiting for review'), 'textink'),
      stat('Ov Donors', 'Donors', TX(chain(SU([['role_option_role', OV('role', 'donor')]]), X.count())), 'Registered accounts', 'textink'),
      stat('Ov Pledges', 'Pledges', TX(allP()), TX(pCount('Pending'), ' pending now'), 'textink'),
      stat('Ov Received', 'Items received', TX(chain(pl([['status_option_pledgestatus', OV('pledgestatus', 'Received')]]), 'qtyreceived_number', M('sum'))), 'Across all homes', 'green'),
    ]),
    B.Card('Ov Status Card', { gap: 12, pad: 20, when: [mob({ pad: 16 })] }, [
      B.H3('Ov Status Title', 'Pledges by status', { fs: 15 }),
      statusBar('Ov Bar Pending', 'Pending', () => pCount('Pending'), '#C98A0B'),
      statusBar('Ov Bar Accepted', 'Accepted', () => pCount('Accepted'), '#0E7C6B'),
      statusBar('Ov Bar Received', 'Received', () => pCount('Received'), '#2E9E5B'),
      statusBar('Ov Bar Declined', 'Declined / cancelled', () => pCount('Declined', 'Cancelled'), '#D64545'),
    ]),
    B.H3('Ov Ful Title', 'Fulfilment by home', { fs: 15 }),
    B.Card('Ov Ful Card', { gap: 0, pad: [8, 20, 8, 20] }, [B.RG('Ful List', 'home', chain(approved(), X.sortBy('name_text')), { sep: 0 }, fulRow)]),
  ]);

  // ---------- Admins ----------
  const admins = () => SU([['role_option_role', OV('role', 'platformAdmin')]]);
  const adminInvites = () => S('invite', [['role_option_role', OV('role', 'platformAdmin')]]);
  const adminRow = typed(B.G('Admin Row', { type: 'user', ds: cell(), row: 1, gap: 10, cva: 'center', pad: [8, 0, 8, 0] }, [
    B.G('AR Avatar', { w: 34, h: 34, r: 17, bg: 'teallight', col: 1, cva: 'center' }, [B.T('AR Initial', TX(chain(cell(), 'fullname_text', M('truncated', 1))), { fs: 13, fwt: 800, fc: 'primaryteal', ta: 'center', ha: 'center', fw: true })]),
    B.G('AR Text', { col: 1, gap: 1 }, [
      B.G('AR Name Row', { row: 1, gap: 6, cva: 'center' }, [B.T('AR Name', TX(chain(cell(), 'fullname_text')), { fwt: 700, fs: 14 }), B.Tag('AR You', 'You', 'teal', { hide: true, when: [[chain(cell(), X.eq(CU())), { show: 1 }]] })]),
      B.Sm('AR Email', TX(chain(cell(), 'email'))),
    ]),
    B.Ghost('Remove Admin Button', 'Remove', { h: 34, fs: 13, pad: [0, 14, 0, 14], fc: 'red', hide: true, when: [[and(chain(cell(), X.ne(CU())), chain(admins(), X.count(), X.gt(1))), { show: 1 }]] }),
  ]), 'user');
  const invRow = (sfx) => typed(B.G('Invite Row' + sfx, { type: 'invite', ds: cell(), row: 1, gap: 10, cva: 'center', pad: [6, 0, 6, 0] }, [
    B.T('IV Email' + sfx, TX(chain(cell(), 'email_text')), { fs: 13 }), B.Tag('IV Tag' + sfx, 'Invited', 'teal', { bg: 'yellowbg', fc: 'yellow' }), B.G('IV Grow' + sfx, { col: 1 }),
    B.Ghost('Cancel Invite' + sfx, 'Cancel', { h: 32, fs: 12, pad: [0, 12, 0, 12] }),
  ]), 'invite');
  const adminsTab = B.G('Admins Tab', { col: 1, gap: 18, maxw: 640, hide: true, when: [[isTab('admins'), { show: 1 }]] }, [
    head('Ad Head', 'Platform admins', 'People who approve homes and keep CareBridge safe. There is always at least one admin.'),
    B.Card('Admins Card', { gap: 10, pad: 18 }, [
      B.RG('Admins List', 'user', admins(), { sep: 0 }, adminRow),
      B.RG('Admin Invites List', 'invite', adminInvites(), { sep: 0 }, invRow('')),
      label('Ad Add Label', 'Add by Gmail or email'),
      B.G('Ad Add Row', { row: 1, gap: 10 }, [B.In('Admin Email Input', 'name@gmail.com', 'email'), B.Btn('Add Admin Button', 'Add', { h: 46, pad: [0, 20, 0, 20] })]),
      B.Sm('Ad Help', 'They get an email and become admin the next time they sign in with that address.'),
    ]),
    B.Card('Pa Account Card', { gap: 12, pad: 18 }, [
      B.H3('Pa Title', 'My account', { fs: 16 }), B.Sm('Pa Signed', TX('Signed in as [b]', CU('email'), '[/b]')),
      B.G('Pa Row', { row: 1, gap: 12, when: [mob({ col: 1 })] }, [field('Pa Name F', 'Full name', B.In('Pa Name Input', '', 'text', { p: { content_format: 'text', default: TX(CU('fullname_text')) } })), field('Pa Phone F', 'Phone number', B.In('Pa Phone Input', '', 'text', { p: { content_format: 'text', default: TX(CU('phone_text')) } }))]),
      B.Check('Pa Email Checkbox', 'Email notifications (new homes to review)', { p: { default_value: CU('emailnotifications_boolean') } }),
      B.G('Pa Buttons', { row: 1, gap: 10, cva: 'center' }, [B.Ghost('Pa Save Button', 'Save', { h: 36, fs: 13, fc: 'primaryteal', border: [1, 'primaryteal'], pad: [0, 16, 0, 16] }), B.T('Pa Saved', 'Saved.', { fc: 'green', fs: 13, fwt: 700, hide: true })]),
    ]),
  ]);

  // ---------- popups ----------
  const popHead = (n, t) => B.G(n, { row: 1, cva: 'center' }, [B.H2(n + ' Title', t), B.Ghost(n + ' Close', '×', { w: 36, h: 36, fs: 18, p: { border_width: 0 } })]);
  const pop = (n, type, kids) => window.CB.el('Popup', n, { style: 'Popup_standard_popup_', col: 1, gap: 14, pad: 26, r: 22, type, p: { width: 520, min_width_css: '320px', max_width_css: '520px', fit_width: false } }, kids);
  const rejectPop = typed(pop('Reject Popup', 'custom.home', [
    popHead('Rj Head', 'Reject this home?'),
    B.Sm('Rj Info', TX('[b]', chain(cell(), 'name_text'), '[/b] stays hidden from donors. Its managers see your reason and can fix their details, then ask for review again.')),
    field('Rj Reason F', 'Reason (shown to the home)', B.Area('Reject Reason Input', 'e.g. Please add a full drop-off address and a photo of the home')),
    B.G('Rj Buttons', { row: 1, gap: 10 }, [B.Ghost('Rj Cancel', 'Cancel', { full: true, ha: 'stretch', h: 46 }), B.Btn('Confirm Reject Button', 'Reject home', { full: true, ha: 'stretch', h: 46, bg: 'red' })]),
  ]), 'home');
  const mgrs = () => SU([['home_custom_home', cell()]]);
  const mgrRow = typed(B.G('Pm Row', { type: 'user', ds: cell(), row: 1, gap: 10, cva: 'center', pad: [6, 0, 6, 0] }, [
    B.G('Pm Text', { col: 1, gap: 1 }, [B.T('Pm Name', TX(chain(cell(), 'fullname_text')), { fwt: 700, fs: 14 }), B.Sm('Pm Email', TX(chain(cell(), 'email')))]),
    B.Ghost('Pm Remove', 'Remove', { h: 32, fs: 12, pad: [0, 12, 0, 12], fc: 'red' }),
  ]), 'user');
  const mgrPop = typed(pop('Managers Popup', 'custom.home', [
    popHead('Pm Head', 'Home managers'),
    B.Sm('Pm Info', TX('Accounts that manage [b]', chain(cell(), 'name_text'), '[/b]. Add the new Gmail first, then remove the old one.')),
    B.RG('Pm Managers List', 'user', mgrs(), { sep: 0 }, mgrRow),
    B.RG('Pm Invites List', 'invite', S('invite', [['home_custom_home', cell()]]), { sep: 0 }, invRow(' M')),
    label('Pm Add Label', 'Add by Gmail or email'),
    B.G('Pm Add Row', { row: 1, gap: 10 }, [B.In('Pm Email Input', 'name@gmail.com', 'email'), B.Btn('Pm Add Button', 'Add', { h: 46, pad: [0, 20, 0, 20] })]),
  ]), 'home');

  // ---------- workflows ----------
  const go = (t) => A.go('platform', null, t ? { tab: t } : null);
  const homeItems = (h) => S('wishlistitem', [['home_custom_home', h]]);
  const mgrEmails = (h, subject, body) => A.email(chain(h(), 'admin_user', 'email'), subject, body, chain(h(), 'admin_user', 'emailnotifications_boolean', X.ne(false)));
  const approve = (h) => [
    A.change(h(), { status_option_homestatus: hs('Approved'), reviewedat_date: X.NOW() }),
    A.changeList('wishlistitem', homeItems(h()), { homeapproved_boolean: true }),
    notify({ tohome_custom_home: h() }, 'Your home is approved 🎉', TX(chain(h(), 'name_text'), ' is now visible to donors.'), '/admin'),
    mgrEmails(h, 'Your home is approved on CareBridge', TX('Good news! ', chain(h(), 'name_text'), ' is now live on CareBridge and donors can see your wishlist.\n\nCareBridge')),
  ];
  const toPending = (h) => [
    A.change(h(), { status_option_homestatus: hs('Pending') }),
    A.changeList('wishlistitem', homeItems(h()), { homeapproved_boolean: false }),
  ];
  const openReject = [A.display('Reject Popup', cell()), A.show('Reject Popup')];
  const reason = () => V('Reject Reason Input');
  const reject = [
    A.change(cell(), { status_option_homestatus: hs('Rejected'), reviewedat_date: X.NOW(), reviewnote_text: TX(reason()) }),
    A.changeList('wishlistitem', homeItems(cell()), { homeapproved_boolean: false }),
    notify({ tohome_custom_home: cell() }, 'Registration not approved', TX(chain(cell(), 'name_text'), ' was not approved. ', reason()), '/admin'),
    mgrEmails(cell, 'Your CareBridge registration needs changes', TX(chain(cell(), 'name_text'), ' was not approved yet.\n\nReason: ', reason(), '\n\nLog in, edit your home details and click "Ask for review again".\n\nCareBridge')),
    A.hide('Reject Popup'),
    A.reset(),
  ];
  const addAdmin = [
    A.create('invite', { email_text: TX(V('Admin Email Input')), role_option_role: OV('role', 'platformAdmin'), invitedby_user: CU() }),
    A.email(V('Admin Email Input'), 'You are now a CareBridge platform admin', TX(CU('fullname_text'), ' added you as a platform admin on CareBridge.\n\nLog in with this email address to review new welfare homes.')),
    A.reset(),
  ];
  const addMgr = [
    A.create('invite', { email_text: TX(V('Pm Email Input')), role_option_role: OV('role', 'homeAdmin'), home_custom_home: cell(), homename_text: TX(chain(cell(), 'name_text')), invitedby_user: CU() }),
    A.email(V('Pm Email Input'), TX('You were added as a manager of ', chain(cell(), 'name_text'), ' on CareBridge'), TX('A CareBridge admin added you as a manager of ', chain(cell(), 'name_text'), '.\n\nSign up or log in with this email address to manage the wishlist and pledges.')),
    A.reset(),
  ];
  const isPlatform = () => chain(CU('role_option_role'), X.eq(OV('role', 'platformAdmin')));

  window.PAGE = {
    name: 'platform',
    elements: adminShell({ prefix: 'P', subtitle: 'Platform admin', nav: NAV, content: [approvals, homesTab, overview, adminsTab], popups: [rejectPop, mgrPop] }),
    workflows: [
      wf('Needs login', { type: 'PageLoaded', cond: CU('not_logged_in') }, [A.go('login', null, { mode: 'login' })]),
      wf('Not platform admin', { type: 'PageLoaded', cond: and(CU('logged_in'), chain(CU('role_option_role'), X.ne(OV('role', 'platformAdmin')))) }, [A.go('index')]),
      ...NAV.flatMap((n) => [wf('Nav ' + n.label, { type: 'ButtonClicked', el: 'P Nav ' + n.label }, [go(n.tab)]), wf('Tab ' + n.label, { type: 'ButtonClicked', el: 'P Tab ' + n.label }, [go(n.tab)])]),
      wf('Log out', { type: 'ButtonClicked', el: 'P Logout' }, [A.logout(), A.go('index')]),
      wf('Log out phone', { type: 'ButtonClicked', el: 'P Phone Logout' }, [A.logout(), A.go('index')]),
      wf('Approve W9', { type: 'ButtonClicked', el: 'Approve Button' }, approve(cell)),
      wf('Open reject', { type: 'ButtonClicked', el: 'Reject Button' }, openReject),
      wf('Preview home', { type: 'ButtonClicked', el: 'Preview Button' }, [A.go('home', cell())]),
      wf('Reviewed back to pending', { type: 'ButtonClicked', el: 'RR Pending Button' }, toPending(cell)),
      wf('Homes approve W9', { type: 'ButtonClicked', el: 'HR Approve' }, approve(cell)),
      wf('Homes open reject', { type: 'ButtonClicked', el: 'HR Reject' }, openReject),
      wf('Homes back to pending', { type: 'ButtonClicked', el: 'HR Pending' }, toPending(cell)),
      wf('Open managers', { type: 'ButtonClicked', el: 'HR Managers' }, [A.display('Managers Popup', cell()), A.show('Managers Popup')]),
      wf('Close reject', { type: 'ButtonClicked', el: 'Rj Head Close' }, [A.hide('Reject Popup')]),
      wf('Cancel reject', { type: 'ButtonClicked', el: 'Rj Cancel' }, [A.hide('Reject Popup')]),
      wf('Confirm reject W10', { type: 'ButtonClicked', el: 'Confirm Reject Button' }, reject),
      wf('Close managers', { type: 'ButtonClicked', el: 'Pm Head Close' }, [A.hide('Managers Popup')]),
      wf('Add home manager', { type: 'ButtonClicked', el: 'Pm Add Button', cond: chain(V('Pm Email Input'), X.notEmpty()) }, addMgr),
      wf('Remove home manager', { type: 'ButtonClicked', el: 'Pm Remove' }, [A.change(cell(), { role_option_role: OV('role', 'donor'), home_custom_home: null })]),
      wf('Cancel manager invite', { type: 'ButtonClicked', el: 'Cancel Invite M' }, [A.del(cell())]),
      wf('Add admin', { type: 'ButtonClicked', el: 'Add Admin Button', cond: chain(V('Admin Email Input'), X.notEmpty()) }, addAdmin),
      wf('Remove admin', { type: 'ButtonClicked', el: 'Remove Admin Button', cond: chain(admins(), X.count(), X.gt(1)) }, [A.change(cell(), { role_option_role: OV('role', 'donor') })]),
      wf('Cancel admin invite', { type: 'ButtonClicked', el: 'Cancel Invite' }, [A.del(cell())]),
      wf('Save my account', { type: 'ButtonClicked', el: 'Pa Save Button' }, [A.change(CU(), { fullname_text: TX(V('Pa Name Input')), phone_text: TX(V('Pa Phone Input')), emailnotifications_boolean: V('Pa Email Checkbox') }), A.show('Pa Saved')]),
    ],
  };
  void isPlatform;
})();
