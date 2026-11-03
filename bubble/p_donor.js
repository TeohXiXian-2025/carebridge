// D5 Pledge sent ("pledge-confirmed"), D6 My pledges ("my-pledges"), Register a home ("register-home"), My account ("profile").
(() => {
  const { X, TX, B, mob, wf, A } = window.CB;
  const { CU, S, OV, V, M, URL, STEP, chain } = X;
  const { shell, pledgeStatusTag, recalc, notify, typed } = window.CBC;
  const and = (a, b) => chain(a, X.and(b));
  const or = (a, b) => chain(a, X.or(b));
  const cell = () => ({ type: 'ElementParent', is_slidable: false });
  const label = (n, t) => B.T(n, t, { fs: 13, fwt: 700 });
  const field = (n, l, input) => B.G(n, { col: 1, gap: 6 }, [label(n + ' Label', l), input]);
  const guard = () => wf('Needs login', { type: 'PageLoaded', cond: CU('not_logged_in') }, [A.go('login', null, { mode: 'login' })]);
  const pages = {};

  // ---------- D5 Pledge sent ----------
  {
    const p = () => URL('pledge', 'custom.pledge');
    const kv = (n, k, v) => B.G(n, { row: 1, cva: 'center' }, [B.Sm(n + ' K', k, { fs: 13 }), B.T(n + ' V', v, { fwt: 700, fs: 14, ta: 'right' })]);
    const card = typed(B.Card('Sent Card', { type: 'pledge', ds: p(), gap: 18, pad: 40, r: 20, maxw: 560, ha: 'center', when: [mob({ pad: 24 })] }, [
      B.G('Check Circle', { w: 88, h: 88, r: 44, bg: 'greenbg', col: 1, cva: 'center', ha: 'center' }, [B.T('Check Mark', '✓', { fs: 36, fwt: 800, fc: 'green', ta: 'center', ha: 'center', fw: true })]),
      B.H1('Sent Title', 'Pledge sent!', { fs: 30, ta: 'center', ha: 'center', fw: true }),
      B.T('Sent Sub', TX(chain(cell(), 'homename_text'), ' will review it. We’ve emailed you the details.'), { fc: 'mutedtext', ta: 'center' }),
      B.G('Sent Box', { col: 1, gap: 12, pad: 16, r: 14, bg: 'pagebackground' }, [
        kv('Row No', 'Pledge no.', TX(chain(cell(), 'pledgeno_text'))),
        kv('Row Item', 'Item', TX(chain(cell(), 'itemname_text'), ' × ', chain(cell(), 'quantity_number'))),
        kv('Row Date', 'Drop-off', TX(chain(cell(), 'dropoffdate_date', X.fmtDate('ddd, d mmm yyyy')))),
        B.G('Row Status', { row: 1, cva: 'center' }, [B.Sm('Row Status K', 'Status', { fs: 13 }), pledgeStatusTag('Row Status Tag', cell)]),
      ]),
      B.Sm('Sent Address', TX('[b]Drop-off address:[/b] ', chain(cell(), 'home_custom_home', 'address_text'), ' · ', chain(cell(), 'home_custom_home', 'dropoffhours_text')), { ta: 'center', fs: 13 }),
      B.G('Sent Buttons', { row: 1, gap: 12, when: [mob({ col: 1 })] }, [
        B.Btn('View Pledges Button', 'View my pledges', { full: true, ha: 'stretch', h: 48 }),
        B.Ghost('Back Homes Button', 'Back to homes', { full: true, ha: 'stretch', h: 48, fc: 'primaryteal', border: [1, 'primaryteal'] }),
      ]),
    ]), 'pledge');
    pages['pledge-confirmed'] = {
      elements: shell([B.G('Spacer Top', { col: 1, h: 40, when: [mob({ p: { height: 0, min_height_css: '0px' } })] }), card]),
      workflows: [
        guard(),
        wf('To my pledges', { type: 'ButtonClicked', el: 'View Pledges Button' }, [A.go('my-pledges')]),
        wf('To homes', { type: 'ButtonClicked', el: 'Back Homes Button' }, [A.go('homes')]),
      ],
    };
  }

  // ---------- D6 My pledges ----------
  {
    const tab = () => URL('tab');
    const st = (...v) => X.list(...v.map((x) => OV('pledgestatus', x)));
    const mine = (list) => chain(S('pledge', [['donor_user', CU()], ['status_option_pledgestatus', list, 'in']]), X.sortBy('Created Date', true));
    const nActive = () => chain(mine(st('Pending', 'Accepted')), X.count());
    const nDone = () => chain(mine(st('Received')), X.count());
    const isTab = (t) => (t ? chain(tab(), X.eq(t)) : chain(tab(), X.empty()));
    const tabBtn = (n, label, t) => B.Ghost(n, label, { full: true, h: 38, fs: 13, bg: 'rgba(233,237,236,1)', fc: 'mutedtext', p: { border_width: 0 }, when: [[isTab(t), { bg: 'white', fc: 'textink' }]] });
    const dots = (name) => B.Html(name, TX('<style>.tl{display:flex;align-items:center;gap:0;margin-top:6px}.tl i{width:9px;height:9px;border-radius:50%;background:#D5DADC;display:block}.tl b{height:2px;width:48px;background:#E4E8EA;display:block}.tl[data-s=Accepted] .d2,.tl[data-s=Received] .d2,.tl[data-s=Received] .d3,.tl[data-s=Pending] .d1,.tl[data-s=Accepted] .d1,.tl[data-s=Received] .d1{background:#0E7C6B}.tl[data-s=Accepted] .l1,.tl[data-s=Received] .l1,.tl[data-s=Received] .l2{background:#0E7C6B}</style><div class="tl" data-s="', chain(cell(), 'status_option_pledgestatus', 'display'), '"><i class="d1"></i><b class="l1"></b><i class="d2"></i><b class="l2"></b><i class="d3"></i></div>'), { minh: 20 });
    const row = typed(B.G('Pledge Row', { type: 'pledge', ds: cell(), row: 1, gap: 16, pad: [14, 16, 14, 16], cva: 'center', border: [1, 'lines'], r: 0, bg: 'white', when: [mob({ col: 1, gap: 8, r: 14 })] }, [
      B.T('P No', TX(chain(cell(), 'pledgeno_text')), { fwt: 700, fs: 13, minw: 140, maxw: 160 }),
      B.T('P Item', TX(chain(cell(), 'itemname_text'), ' × ', chain(cell(), 'quantity_number')), { fs: 13, minw: 180 }),
      B.T('P Home', TX(chain(cell(), 'homename_text')), { fs: 13, minw: 170 }),
      B.T('P Date', TX(chain(cell(), 'dropoffdate_date', X.fmtDate('ddd, d mmm'))), { fs: 13, minw: 100, maxw: 120 }),
      B.G('P Progress', { col: 1, gap: 4, minw: 170, maxw: 190 }, [pledgeStatusTag('P Status', cell), dots('P Dots')]),
      B.Ghost('Cancel Pledge Button', 'Cancel pledge', { fs: 13, h: 36, pad: [0, 14, 0, 14], fc: 'mutedtext', hide: true, when: [[or(chain(cell(), 'status_option_pledgestatus', X.eq(OV('pledgestatus', 'Pending'))), chain(cell(), 'status_option_pledgestatus', X.eq(OV('pledgestatus', 'Accepted')))), { show: 1 }]] }),
    ]), 'pledge');
    const ds = mine(st('Pending', 'Accepted'));
    const rg = B.RG('My Pledges List', 'pledge', ds, { sep: 0, when: [[isTab('completed'), { p: { data_source: mine(st('Received')) } }], [isTab('cancelled'), { p: { data_source: mine(st('Declined', 'Cancelled')) } }]] }, row);
    const step = (n, num, t, d) => B.G(n, { row: 1, gap: 12 }, [
      B.G(n + ' Num', { w: 28, h: 28, r: 14, bg: 'teallight', col: 1, cva: 'center' }, [B.T(n + ' N', num, { fs: 12, fwt: 800, fc: 'primaryteal', ta: 'center', ha: 'center', fw: true })]),
      B.G(n + ' Body', { col: 1, gap: 2 }, [B.T(n + ' T', t, { fwt: 700 }), B.Sm(n + ' D', d, { fs: 13 })]),
    ]);
    const main = [
      B.G('Title Group', { col: 1, gap: 4 }, [B.H1('Page Title', 'My pledges', { fs: 30, when: [mob({ fs: 26 })] }), B.T('Page Sub', 'Track each pledge from Pending to Received.', { fc: 'mutedtext' })]),
      B.G('Tabs', { row: 1, gap: 4, pad: 4, r: 12, bg: 'rgba(233,237,236,1)', maxw: 460 }, [
        tabBtn('Tab Active', TX('Active (', nActive(), ')'), null), tabBtn('Tab Completed', TX('Completed (', nDone(), ')'), 'completed'), tabBtn('Tab Cancelled', 'Cancelled', 'cancelled'),
      ]),
      B.Card('Table Card', { pad: 0, gap: 0, r: 16, p: { overflow: 'hidden' } }, [
        B.G('Table Head', { row: 1, gap: 16, pad: [12, 16, 12, 16], bg: 'rgba(242,244,243,1)', when: [mob({ p: { is_visible: false } })], collapse: 1 }, [
          B.Sm('H No', 'Pledge no.', { fwt: 700, minw: 140, maxw: 160 }), B.Sm('H Item', 'Item', { fwt: 700, minw: 180 }), B.Sm('H Home', 'Home', { fwt: 700, minw: 170 }), B.Sm('H Date', 'Drop-off', { fwt: 700, minw: 100, maxw: 120 }), B.Sm('H Progress', 'Progress', { fwt: 700, minw: 170, maxw: 190 }), B.Sm('H Actions', 'Actions', { fwt: 700, minw: 110 }),
        ]),
        rg,
        B.T('Empty Pledges', 'No pledges here yet. Browse the homes to make your first pledge.', { fc: 'mutedtext', pad: 20, hide: true, when: [[chain(ds, X.count(), X.eq(0)), { show: 1 }]] }),
      ]),
      B.Card('Steps Card', { row: 1, gap: 24, pad: 20, when: [mob({ col: 1, gap: 14 })] }, [
        step('Step 1', '1', 'Pending', 'The home checks your pledge. You get an email when they accept it.'),
        step('Step 2', '2', 'Accepted', 'Bring the items on your drop-off date during drop-off hours.'),
        step('Step 3', '3', 'Received', 'The home confirms delivery and the wishlist updates for everyone.'),
      ]),
    ];
    // W4 donor cancels
    const item = () => chain(cell(), 'item_custom_wishlistitem');
    const W4 = [
      A.change(cell(), { status_option_pledgestatus: OV('pledgestatus', 'Cancelled') }),
      A.change(item(), { qtypledged_number: chain(item(), 'qtypledged_number', X.minus(chain(cell(), 'quantity_number')), M('max', 0)) }),
      ...recalc(item()),
      notify({ tohome_custom_home: chain(cell(), 'home_custom_home') }, 'Pledge cancelled', TX(chain(cell(), 'contactname_text'), ' cancelled ', chain(cell(), 'itemname_text'), ' × ', chain(cell(), 'quantity_number')), '/admin?tab=pledges', { pledge_custom_pledge: cell() }),
      A.email(chain(cell(), 'home_custom_home', 'notifyemail_text'), TX('Pledge cancelled: ', chain(cell(), 'itemname_text'), ' × ', chain(cell(), 'quantity_number')), TX(chain(cell(), 'contactname_text'), ' cancelled pledge ', chain(cell(), 'pledgeno_text'), '. The quantity is available for other donors again.'), chain(cell(), 'home_custom_home', 'notifyemail_text', X.notEmpty())),
    ];
    pages['my-pledges'] = {
      elements: shell(main),
      workflows: [
        guard(),
        wf('Tab active', { type: 'ButtonClicked', el: 'Tab Active' }, [A.go('my-pledges')]),
        wf('Tab completed', { type: 'ButtonClicked', el: 'Tab Completed' }, [A.go('my-pledges', null, { tab: 'completed' })]),
        wf('Tab cancelled', { type: 'ButtonClicked', el: 'Tab Cancelled' }, [A.go('my-pledges', null, { tab: 'cancelled' })]),
        wf('Cancel pledge W4', { type: 'ButtonClicked', el: 'Cancel Pledge Button' }, W4),
      ],
    };
  }

  // ---------- Register a home (W8) ----------
  {
    const hasHome = () => chain(CU('home_custom_home'), X.notEmpty());
    const form = B.Card('Register Card', { gap: 16, pad: 28, r: 20, maxw: 720, when: [mob({ pad: 20 })] }, [
      B.G('Reg Row 1', { row: 1, gap: 14, when: [mob({ col: 1 })] }, [field('Name F', 'Home name', B.In('Home Name Input', 'e.g. Rumah Kasih Children’s Home', 'text')), field('Type F', 'Home type', B.Drop('Type Dropdown', 'Choose a type', 'hometype'))]),
      B.G('Reg Row 2', { row: 1, gap: 14, when: [mob({ col: 1 })] }, [field('Area F', 'Area', B.Drop('Area Dropdown', 'Choose an area', 'area')), field('Email F', 'Public contact email (optional)', B.In('Notify Email Input', 'For donors and notifications', 'email', { p: { content_format: 'email', default: TX(CU('email')) } }))]),
      field('Address F', 'Drop-off address', B.In('Address Input', 'Street, area, city', 'text')),
      field('Hours F', 'Drop-off hours', B.In('Hours Input', 'e.g. Mon–Sat, 10am–5pm', 'text')),
      field('About F', 'About the home', B.Area('About Input', 'Who you care for and what you need most')),
      field('Photo F', 'Photo (optional)', el('PictureInput', 'Photo Input', { h: 140, r: 14, border: [1, 'lines'], ha: 'stretch', fh: false, p: { placeholder: TX('Click to upload a photo') } })),
      B.T('Reg Error', 'Fill in the name, type, area, address and drop-off hours.', { fc: 'red', fs: 13, hide: true }),
      B.Btn('Submit Home Button', 'Submit for review', { full: true, ha: 'stretch', h: 48 }),
    ]);
    function el(type, name, o) { return window.CB.el(type, name, o); }
    const main = [
      B.G('Title Group', { col: 1, gap: 4 }, [B.H1('Page Title', 'Register a home', { fs: 30, when: [mob({ fs: 26 })] }), B.T('Page Sub', 'Tell donors about your home. The CareBridge team reviews every home before it goes live.', { fc: 'mutedtext' })]),
      B.G('Form Wrap', { col: 1, hide: true, when: [[and(X.CU('logged_in'), chain(CU('home_custom_home'), X.empty())), { show: 1 }]] }, [form]),
      B.Card('Has Home Card', { gap: 10, pad: 24, hide: true, when: [[hasHome(), { show: 1 }]] }, [B.H3('Has Home Title', 'This account already manages a home'), B.Link('Has Home Link', 'Go to your dashboard →', 'admin')]),
      B.Card('Need Login Card', { gap: 12, pad: 24, hide: true, when: [[CU('not_logged_in'), { show: 1 }]] }, [
        B.H3('Need Login Title', 'Create an account first'),
        B.T('Need Login Text', 'Your home will be linked to the account you sign up with.', { fc: 'mutedtext' }),
        B.G('Need Login Buttons', { row: 1, gap: 10 }, [B.Btn('Signup Home Button', 'Sign up as a welfare home'), B.Ghost('Have Account Button', 'I already have an account')]),
      ]),
    ];
    const ok = () => and(and(and(and(chain(V('Home Name Input'), X.notEmpty()), chain(V('Type Dropdown'), X.notEmpty())), chain(V('Area Dropdown'), X.notEmpty())), chain(V('Address Input'), X.notEmpty())), chain(V('Hours Input'), X.notEmpty()));
    const bad = () => or(or(or(or(chain(V('Home Name Input'), X.empty()), chain(V('Type Dropdown'), X.empty())), chain(V('Area Dropdown'), X.empty())), chain(V('Address Input'), X.empty())), chain(V('Hours Input'), X.empty()));
    const W8 = [
      A.create('home', { name_text: TX(V('Home Name Input')), type_option_hometype: V('Type Dropdown'), area_option_area: V('Area Dropdown'), address_text: TX(V('Address Input')), dropoffhours_text: TX(V('Hours Input')), about_text: TX(V('About Input')), photo_image: V('Photo Input'), notifyemail_text: TX(V('Notify Email Input')), status_option_homestatus: OV('homestatus', 'Pending'), admin_user: CU() }),
      A.change(CU(), { role_option_role: OV('role', 'homeAdmin'), home_custom_home: STEP(0) }),
      notify({ torole_option_role: OV('role', 'platformAdmin') }, 'New home to review', TX(V('Home Name Input'), ' (', chain(V('Area Dropdown'), 'display'), ') registered'), '/platform'),
      A.go('admin'),
    ];
    pages['register-home'] = {
      elements: shell(main),
      workflows: [
        wf('Submit home W8', { type: 'ButtonClicked', el: 'Submit Home Button', cond: ok() }, W8),
        wf('Submit home invalid', { type: 'ButtonClicked', el: 'Submit Home Button', cond: bad() }, [A.show('Reg Error')]),
        wf('Sign up as home', { type: 'ButtonClicked', el: 'Signup Home Button' }, [A.go('login', null, { mode: 'signup', as: 'home' })]),
        wf('Have account', { type: 'ButtonClicked', el: 'Have Account Button' }, [A.go('login', null, { mode: 'login' })]),
      ],
    };
  }

  // ---------- My account ----------
  {
    const roleName = () => chain(CU('role_option_role'), 'display');
    const main = [
      B.G('Title Group', { col: 1, gap: 4 }, [B.H1('Page Title', 'My account', { fs: 30, when: [mob({ fs: 26 })] }), B.T('Page Sub', TX(CU('email'), ' · ', roleName()), { fc: 'mutedtext' })]),
      B.Card('Account Card', { gap: 16, pad: 24, maxw: 560 }, [
        B.H3('Details Title', 'Your details'),
        field('Name F', 'Full name', B.In('Name Input', 'Your name', 'text', { p: { content_format: 'text', default: TX(CU('fullname_text')) } })),
        field('Phone F', 'Phone number', B.In('Phone Input', 'e.g. 012-345 6789', 'text', { p: { content_format: 'text', default: TX(CU('phone_text')) } })),
        B.Check('Email Checkbox', 'Send me email notifications', { p: { default_value: CU('emailnotifications_boolean') } }),
        B.T('Saved Text', 'Saved.', { fc: 'green', fwt: 700, fs: 13, hide: true }),
        B.G('Account Buttons', { row: 1, gap: 10 }, [B.Btn('Save Button', 'Save changes'), B.Ghost('Logout Button', 'Log out', { fc: 'red' })]),
      ]),
      B.Card('Home Link Card', { gap: 8, pad: 24, maxw: 560, hide: true, when: [[chain(CU('role_option_role'), X.eq(OV('role', 'donor'))), { show: 1 }]] }, [
        B.H3('Run Home Title', 'Run a welfare home?'), B.T('Run Home Text', 'Register it so donors can see what it needs.', { fc: 'mutedtext' }), B.Link('Register Link', 'Register a home →', 'register-home'),
      ]),
      B.Card('Dash Link Card', { gap: 8, pad: 24, maxw: 560, hide: true, when: [[chain(CU('role_option_role'), X.ne(OV('role', 'donor'))), { show: 1 }]] }, [
        B.Link('Admin Link', 'Go to the home dashboard →', 'admin', { hide: true, when: [[chain(CU('role_option_role'), X.eq(OV('role', 'homeAdmin'))), { show: 1 }]] }),
        B.Link('Platform Link', 'Go to the platform admin →', 'platform', { hide: true, when: [[chain(CU('role_option_role'), X.eq(OV('role', 'platformAdmin'))), { show: 1 }]] }),
      ]),
    ];
    pages['profile'] = {
      elements: shell(main),
      workflows: [
        guard(),
        wf('Save account', { type: 'ButtonClicked', el: 'Save Button' }, [A.change(CU(), { fullname_text: TX(V('Name Input')), phone_text: TX(V('Phone Input')), emailnotifications_boolean: V('Email Checkbox') }), A.show('Saved Text')]),
        wf('Log out', { type: 'ButtonClicked', el: 'Logout Button' }, [A.logout(), A.go('index')]),
      ],
    };
  }
  window.PAGES = pages;
})();
