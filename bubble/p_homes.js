// D2 Directory (Bubble page "homes") — matches the coded /homes page.
(() => {
  const { X, TX, B, mob, desk, wf, A } = window.CB;
  const { P, S, OV, V, M, chain } = X;
  const { shell, bar, typed, photo } = window.CBC;

  const cell = () => ({ type: 'ElementParent', is_slidable: false });
  const fulfilled = () => S('wishlistitem', [['home_custom_home', cell()], ['status_option_itemstatus', OV('itemstatus', 'Fulfilled')]], 'count');
  const total = () => S('wishlistitem', [['home_custom_home', cell()], ['status_option_itemstatus', OV('itemstatus', 'Paused'), 'not equal']], 'count');
  const openSt = () => X.list(OV('itemstatus', 'Open'), OV('itemstatus', 'Partially pledged'));
  const urgentHere = () => S('wishlistitem', [['home_custom_home', cell()], ['priority_option_priority', OV('priority', 'High')], ['status_option_itemstatus', openSt(), 'in']], 'count');

  // Filters: desktop sidebar inputs and phone inputs are separate elements; each search uses whichever is visible.
  const search = (sfx) => {
    const s = S('home', [
      ['status_option_homestatus', OV('homestatus', 'Approved')],
      ['type_option_hometype', V('Type Dropdown' + sfx)],
      ['area_option_area', V('Area Dropdown' + sfx)],
      ['name_text', V('Search Input'), 'text contains'],
    ]);
    s.properties.ignore_empty_constraints = true;
    return s;
  };
  const urgentHomes = () => chain(S('wishlistitem', [['homeapproved_boolean', true], ['priority_option_priority', OV('priority', 'High')], ['status_option_itemstatus', openSt(), 'in']]), 'home_custom_home');
  const catHomes = () => { const s = S('wishlistitem', [['homeapproved_boolean', true], ['category_option_category', V('Category Dropdown')], ['status_option_itemstatus', OV('itemstatus', 'Fulfilled'), 'not equal']]); return chain(s, 'home_custom_home'); };
  const isPhone = () => chain(X.W(), X.lt(900));
  const isDesk = () => chain(X.W(), X.M('greater_than', 899));
  const urgentOn = (sfx) => V('Urgent Checkbox' + sfx);
  const catOn = () => chain(V('Category Dropdown'), X.notEmpty());
  const and = (a, b) => chain(a, X.and(b));
  const sorted = (e) => chain(e, X.sortBy('name_text'));

  // Desktop card (photo on top)
  const deskCard = B.G('Desk Card', { col: 1, gap: 0, when: [mob({ p: { is_visible: false } })], collapse: 1 }, [
    photo('Desk Photo', cell, { h: 140, r: 0, f: 28 }),
    B.G('Desk Body', { col: 1, gap: 10, pad: [16, 16, 16, 16] }, [
      B.H3('Desk Name', TX(chain(cell(), 'name_text')), { fs: 16 }),
      B.G('Desk Tags', { row: 1, gap: 8, cva: 'center', p: { wrap: true } }, [
        B.Tag('Desk Type Tag', TX(chain(cell(), 'type_option_hometype', 'display')), 'teal'),
        B.Sm('Desk Area', TX(chain(cell(), 'area_option_area', 'display')), { fw: true, fs: 13 }),
        B.Tag('Desk Urgent Tag', 'Urgent need', 'red', { hide: true, when: [[chain(urgentHere(), X.gt(0)), { show: 1 }]] }),
      ]),
      bar('Desk Bar', chain(fulfilled(), X.div(total()), X.times(100))),
      B.Sm('Desk Fulfil', TX('[b]', fulfilled(), ' of ', total(), '[/b] needs fulfilled'), { fs: 13 }),
      B.Ghost('Desk View Button', 'View wishlist', { full: true, ha: 'stretch', fc: 'primaryteal', border: [1, 'primaryteal'] }),
    ]),
  ]);
  // Phone card (photo on the left)
  const phoneCard = B.G('Phone Card', { col: 1, gap: 12, pad: 16, hide: true, when: [mob({ show: 1 })] }, [
    B.G('Phone Top', { row: 1, gap: 14 }, [
      photo('Phone Photo', cell, { w: 72, h: 72, r: 14, f: 20 }),
      B.G('Phone Text', { col: 1, gap: 8 }, [
        B.H3('Phone Name', TX(chain(cell(), 'name_text')), { fs: 16 }),
        B.G('Phone Tags', { row: 1, gap: 8, cva: 'center', p: { wrap: true } }, [
          B.Tag('Phone Type Tag', TX(chain(cell(), 'type_option_hometype', 'display')), 'teal'),
          B.Sm('Phone Area', TX(chain(cell(), 'area_option_area', 'display')), { fw: true, fs: 13 }),
        ]),
        B.Tag('Phone Urgent Tag', 'Urgent need', 'red', { hide: true, when: [[chain(urgentHere(), X.gt(0)), { show: 1 }]] }),
      ]),
    ]),
    bar('Phone Bar', chain(fulfilled(), X.div(total()), X.times(100))),
    B.Sm('Phone Fulfil', TX('[b]', fulfilled(), ' of ', total(), '[/b] needs fulfilled'), { fs: 13 }),
  ]);
  const card = typed(B.Card('Home Card', { type: 'home', ds: cell(), pad: 0, gap: 0, r: 18, p: { is_clickable: true } }, [deskCard, phoneCard]), 'home');

  // Data source: desktop filters by default, phone filters on phone, plus urgent/category intersections
  const ds = (sfx, urgent, cat) => { let e = search(sfx); if (urgent) e = chain(e, M('intersect_with', urgentHomes())); if (cat) e = chain(e, M('intersect_with', catHomes())); return sorted(e); };
  const rg = B.RG('Homes List', 'home', ds('', false, false), {
    cols: 3, sep: 16,
    when: [
      [and(isDesk(), urgentOn('')), { p: { data_source: ds('', true, false) } }],
      [and(isDesk(), catOn()), { p: { data_source: ds('', false, true) } }],
      [and(and(isDesk(), urgentOn('')), catOn()), { p: { data_source: ds('', true, true) } }],
      mob({ p: { columns: 1, data_source: ds(' M', false, false) } }),
      [and(isPhone(), urgentOn(' M')), { p: { data_source: ds(' M', true, false) } }],
    ],
  }, card);

  const label = (n, t) => B.T(n, t, { fs: 12, fwt: 700, fc: 'mutedtext' });
  const sidebar = B.Card('Filter Sidebar', { col: 1, gap: 14, pad: 20, r: 16, w: 260, when: [mob({ p: { is_visible: false } })], collapse: 1 }, [
    B.H3('Filters Title', 'Filters', { fs: 16 }),
    B.Check('Urgent Checkbox', 'Urgent needs only', { p: { font_weight: '700' } }),
    label('Type Label', 'Home type'),
    B.Drop('Type Dropdown', 'All types', 'hometype'),
    label('Area Label', 'Area'),
    B.Drop('Area Dropdown', 'All areas', 'area'),
    label('Category Label', 'Item category'),
    B.Drop('Category Dropdown', 'All categories', 'category'),
    B.Ghost('Clear Button', 'Clear filters', { full: true, ha: 'stretch', fc: 'mutedtext' }),
  ]);
  const phoneFilters = B.G('Phone Filters', { row: 1, gap: 8, hide: true, when: [mob({ show: 1 })] }, [
    B.Check('Urgent Checkbox M', 'Urgent only', { fc: 'red' }),
    B.Drop('Type Dropdown M', 'All types', 'hometype', { minw: 110 }),
    B.Drop('Area Dropdown M', 'Area', 'area', { minw: 110 }),
  ]);
  const countText = B.Sm('Count Text', TX(chain(search(''), X.count()), ' approved homes · most urgent first'), { fs: 13, when: [mob({ text: TX(chain(search(' M'), X.count()), ' approved homes') })] });

  const right = B.G('Results Column', { col: 1, gap: 14 }, [
    B.In('Search Input', 'Search by home name or area', 'text'),
    phoneFilters,
    countText,
    rg,
    B.T('Empty Text', 'No homes match your filters.', { fc: 'mutedtext', hide: true, when: [[chain(search(''), X.count(), X.eq(0)), { show: 1 }]] }),
  ]);

  const main = [
    B.G('Title Group', { col: 1, gap: 4 }, [
      B.H1('Page Title', 'Welfare homes', { fs: 30, when: [mob({ fs: 26 })] }),
      B.T('Page Sub', 'Every home here has been reviewed by the CareBridge team.', { fc: 'mutedtext', when: [mob({ p: { is_visible: false } })], collapse: 1 }),
    ]),
    B.G('Body Row', { row: 1, gap: 24, when: [mob({ col: 1, gap: 12 })] }, [sidebar, right]),
  ];

  window.PAGE = {
    name: 'homes',
    elements: shell(main),
    workflows: [
      wf('Open home card', { type: 'ButtonClicked', el: 'Home Card' }, [A.go('home', P())]),
      wf('View wishlist', { type: 'ButtonClicked', el: 'Desk View Button' }, [A.go('home', P())]),
      wf('Clear filters', { type: 'ButtonClicked', el: 'Clear Button' }, [A.reset()]),
    ],
  };
})();
