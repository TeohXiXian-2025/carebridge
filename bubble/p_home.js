// D3 Home profile + D4 pledge sheet (Bubble page "home", type Home) — W1 donor pledge.
(() => {
  const { X, TX, B, mob, wf, A } = window.CB;
  const { P, PI, CU, S, OV, V, M, URL, STEP, chain } = X;
  const { shell, bar, typed, photo, chip, priorityTag, itemStatusTag, still, pctItem, recalc, notify } = window.CBC;

  const cell = () => ({ type: 'ElementParent', is_slidable: false });
  const and = (a, b) => chain(a, X.and(b));
  const openSt = () => X.list(OV('itemstatus', 'Open'), OV('itemstatus', 'Partially pledged'));
  const isOpen = (base) => chain(chain(base(), 'status_option_itemstatus', X.eq(OV('itemstatus', 'Open'))), X.or(chain(base(), 'status_option_itemstatus', X.eq(OV('itemstatus', 'Partially pledged')))));
  const CATS = [['All', ''], ['Packaged food', 'Packaged food'], ['Hygiene', 'Hygiene'], ['Medical supplies', 'Medical supplies'], ['Clothing', 'Clothing'], ['Education', 'Education']];
  const catParam = () => URL('cat', 'option.category');

  const visibleItems = () => { const s = S('wishlistitem', [['home_custom_home', PI()], ['status_option_itemstatus', X.list(OV('itemstatus', 'Open'), OV('itemstatus', 'Partially pledged'), OV('itemstatus', 'Fully pledged')), 'in'], ['category_option_category', catParam()]]); s.properties.ignore_empty_constraints = true; return s; };
  const allVisible = () => S('wishlistitem', [['home_custom_home', PI()], ['status_option_itemstatus', X.list(OV('itemstatus', 'Open'), OV('itemstatus', 'Partially pledged'), OV('itemstatus', 'Fully pledged')), 'in']]);
  const fulfilledCount = () => S('wishlistitem', [['home_custom_home', PI()], ['status_option_itemstatus', OV('itemstatus', 'Fulfilled')]], 'count');
  const totalCount = () => S('wishlistitem', [['home_custom_home', PI()], ['status_option_itemstatus', OV('itemstatus', 'Paused'), 'not equal']], 'count');

  // ---------- left column ----------
  const left = B.G('Left Column', { col: 1, gap: 16, minw: 300, maxw: 340, when: [mob({ p: { min_width_css: '0px', max_width_css: '2000px' } })] }, [
    B.H1('Home Name', TX(chain(PI(), 'name_text')), { fs: 30, when: [mob({ fs: 24 })] }),
    B.G('Home Tags', { row: 1, gap: 8, cva: 'center' }, [
      B.Tag('Type Tag', TX(chain(PI(), 'type_option_hometype', 'display')), 'teal'),
      B.Sm('Area Text', TX(chain(PI(), 'area_option_area', 'display')), { fw: true, fs: 13 }),
    ]),
    B.Card('Fulfil Card', { gap: 10, pad: 16 }, [
      B.Sm('Fulfil Text', TX('[b]', fulfilledCount(), ' of ', totalCount(), '[/b] needs fulfilled'), { fs: 13 }),
      bar('Fulfil Bar', chain(fulfilledCount(), X.div(totalCount()), X.times(100))),
    ]),
    B.Card('About Card', { gap: 8, pad: 16 }, [B.H3('About Title', 'About us'), B.T('About Text', TX(chain(PI(), 'about_text')), { fc: 'mutedtext', lh: 1.5 })]),
    B.G('Dropoff Box', { col: 1, gap: 6, pad: 16, r: 16, bg: 'teallight' }, [
      B.T('Dropoff Title', 'Drop-off', { fwt: 800, fc: 'tealdark' }),
      B.T('Dropoff Address', TX(chain(PI(), 'address_text')), { fc: 'tealdark', fs: 13 }),
      B.T('Dropoff Hours', TX(chain(PI(), 'dropoffhours_text')), { fc: 'tealdark', fs: 13 }),
      B.T('Dropoff Email', TX('Contact: ', chain(PI(), 'notifyemail_text')), { fc: 'tealdark', fs: 13, hide: true, when: [[chain(PI(), 'notifyemail_text', X.notEmpty()), { show: 1 }]] }),
    ]),
  ]);

  // ---------- wishlist row ----------
  const pledgeBtn = B.Btn('Pledge Button', 'Pledge', {
    w: 92, when: [
      [chain(cell(), 'status_option_itemstatus', X.eq(OV('itemstatus', 'Fully pledged'))), { text: 'Pledged', bg: 'greybg', fc: 'mutedtext' }],
    ],
  });
  const row = typed(B.Card('Item Row', { type: 'wishlistitem', ds: cell(), row: 1, gap: 16, pad: 16, cva: 'center', when: [mob({ col: 1, gap: 12 })] }, [
    B.G('Item Main', { row: 1, gap: 14, cva: 'center' }, [
      chip('Item Chip', cell),
      B.G('Item Text', { col: 1, gap: 6 }, [
        B.H3('Item Name', TX(chain(cell(), 'name_text')), { fs: 15 }),
        B.G('Item Tags', { row: 1, gap: 6 }, [priorityTag('Item Priority', cell), itemStatusTag('Item Status', cell)]),
      ]),
    ]),
    B.G('Item Qty', { col: 1, gap: 6, minw: 200, maxw: 260, when: [mob({ p: { min_width_css: '0px', max_width_css: '2000px' } })] }, [
      bar('Item Bar', pctItem(cell)),
      B.Sm('Item Numbers', TX('[b]', chain(cell(), 'qtyneeded_number'), '[/b] needed · [b]', chain(cell(), 'qtypledged_number'), '[/b] pledged · [b]', chain(cell(), 'qtyreceived_number'), '[/b] received'), { fs: 12 }),
    ]),
    pledgeBtn,
  ]), 'wishlistitem');

  const catButtons = B.G('Category Chips', { row: 1, gap: 8, p: { wrap: true } }, CATS.map(([label, val]) => {
    const on = val ? chain(catParam(), X.eq(OV('category', val))) : chain(catParam(), X.empty());
    return el2(label, on);
  }));
  function el2(label, on) {
    return B.Ghost('Cat ' + label, label, { r: 18, fs: 13, h: 34, pad: [0, 14, 0, 14], when: [[on, { bg: 'primaryteal', fc: 'white', border: [1, 'primaryteal'] }]] });
  }

  const right = B.G('Right Column', { col: 1, gap: 14 }, [
    B.G('Wishlist Head', { row: 1, gap: 8, cva: 'center' }, [
      B.H2('Wishlist Title', TX('Wishlist (', chain(allVisible(), X.count()), ')'), { fw: false }),
      B.Sm('Sorted Text', 'Sorted by priority', { fw: true, fs: 13 }),
    ]),
    catButtons,
    B.RG('Items List', 'wishlistitem', chain(visibleItems(), X.sortBy('priority_option_priority')), { sep: 12 }, row),
    B.T('Empty Items', 'Nothing needed right now. Check back soon.', { fc: 'mutedtext', hide: true, when: [[chain(visibleItems(), X.count(), X.eq(0)), { show: 1 }]] }),
    B.Sm('Fulfilled Note', TX(fulfilledCount(), ' need(s) already fulfilled. Thank you, donors!'), { hide: true, when: [[chain(fulfilledCount(), X.gt(0)), { show: 1 }]] }),
  ]);

  const pendingNote = B.G('Preview Note', { col: 1, pad: 14, r: 12, bg: 'yellowbg', hide: true, when: [[chain(PI(), 'status_option_homestatus', X.ne(OV('homestatus', 'Approved'))), { show: 1 }]] }, [
    B.T('Preview Text', 'Preview: this home is waiting for approval, so donors cannot see it yet.', { fc: 'yellow', fwt: 700, fs: 13 }),
  ]);
  const content = B.G('Content', { col: 1, gap: 16, hide: true, when: [[chain(PI(), X.notEmpty()), { show: 1 }]] }, [
    pendingNote,
    B.G('Body Row', { row: 1, gap: 32, when: [mob({ col: 1, gap: 20 })] }, [left, right]),
  ]);
  const unavailable = B.Card('Unavailable', { gap: 10, pad: 24, hide: true, when: [[chain(PI(), X.empty()), { show: 1 }]] }, [
    B.H2('Unavailable Title', 'This home isn’t available'),
    B.T('Unavailable Text', 'It may still be waiting for approval. Browse the approved homes instead.', { fc: 'mutedtext' }),
    B.Link('Unavailable Link', 'See all homes →', 'homes'),
  ]);

  // ---------- pledge sheet ----------
  const label = (n, t) => B.T(n, t, { fs: 13, fwt: 700 });
  const pop = typed(el3(), 'wishlistitem');
  function el3() {
    return B.Popup('Pledge Popup', { style: null, bg: 'white', type: 'wishlistitem', gap: 14, pad: 28, r: 24, p: { width: 500, min_width_css: '320px', max_width_css: '500px', fit_width: false } }, [
      B.G('Pop Head', { row: 1, cva: 'center' }, [B.H2('Pop Title', 'Pledge an item'), B.Ghost('Pop Close', '×', { w: 36, h: 36, fs: 18, p: { border_width: 0 } })]),
      B.G('Pop Item', { row: 1, gap: 12, cva: 'center' }, [
        chip('Pop Chip', cell),
        B.G('Pop Item Text', { col: 1, gap: 2 }, [B.H3('Pop Item Name', TX(chain(cell(), 'name_text')), { fs: 16 }), B.Sm('Pop Home Name', TX(chain(cell(), 'homename_text')))]),
      ]),
      B.G('Pop Still', { col: 1, pad: [10, 12, 10, 12], r: 10, bg: 'teallight' }, [
        B.T('Pop Still Text', TX('[b]', still(cell), ' still needed[/b] · ', chain(cell(), 'qtyneeded_number'), ' needed · ', chain(cell(), 'qtypledged_number'), ' pledged'), { fc: 'tealdark', fs: 13 }),
      ]),
      label('Qty Label', 'Quantity'),
      B.In('Qty Input', '1', 'int_number', { p: { content_format: 'int_number', default: TX('1') } }),
      B.Sm('Qty Help', TX('Max ', still(cell), ' (what is still needed)')),
      B.G('Pop Row', { row: 1, gap: 14, when: [mob({ col: 1 })] }, [
        B.G('Date Col', { col: 1, gap: 6 }, [label('Date Label', 'Planned drop-off date'), B.Date('Date Input', 'Pick a date', { p: { min_date: X.NOW() } })]),
        B.G('Name Col', { col: 1, gap: 6 }, [label('Name Label', 'Contact name'), B.In('Name Input', 'Your name', 'text', { p: { content_format: 'text', default: TX(CU('fullname_text')) } })]),
      ]),
      label('Phone Label', 'Phone number'),
      B.In('Phone Input', '012-345 6789', 'text', { p: { content_format: 'text', default: TX(CU('phone_text')) } }),
      B.Sm('Pop Dropoff', TX('Drop-off: ', chain(cell(), 'home_custom_home', 'address_text'), ' · ', chain(cell(), 'home_custom_home', 'dropoffhours_text'))),
      B.T('Pop Error', TX('Choose a quantity between 1 and ', still(cell), ', a drop-off date, your name and phone.'), { fc: 'red', fs: 13, hide: true }),
      B.G('Pop Buttons', { row: 1, gap: 10, p: { container_horiz_alignment: 'flex-end' } }, [
        B.Ghost('Pop Cancel', 'Cancel', { h: 48, pad: [0, 20, 0, 20] }),
        B.Btn('Confirm Button', 'Confirm pledge', { h: 48, pad: [0, 20, 0, 20] }),
      ]),
    ]);
  }

  const banner = photo('Banner Photo', PI, { h: 200, r: 0, f: 28, el: { when: [mob({ minh: 160 })] } });

  // ---------- workflows ----------
  const qty = () => V('Qty Input');
  const valid = () => and(and(and(and(chain(qty(), X.gt(0)), chain(qty(), M('less_or_equal_than', still(cell)))), chain(V('Date Input'), X.notEmpty())), chain(V('Name Input'), X.notEmpty())), chain(V('Phone Input'), X.notEmpty()));
  const invalid = () => { const v = valid(); return chain(v, X.eq(false)); };
  const what = () => [chain(cell(), 'name_text'), ' × ', qty()];
  const W1 = [
    A.create('pledge', {
      pledgeno_text: TX('CB-', chain(X.NOW(), X.fmtDate('yymmdd')), '-', chain(X.NOW(), X.fmtDate('HHMM'))),
      donor_user: CU(), item_custom_wishlistitem: cell(), itemname_text: TX(chain(cell(), 'name_text')), home_custom_home: chain(cell(), 'home_custom_home'), homename_text: TX(chain(cell(), 'homename_text')),
      quantity_number: qty(), qtyreceived_number: 0, dropoffdate_date: V('Date Input'), contactname_text: TX(V('Name Input')), contactphone_text: TX(V('Phone Input')), status_option_pledgestatus: OV('pledgestatus', 'Pending'),
    }),
    A.change(cell(), { qtypledged_number: chain(cell(), 'qtypledged_number', X.plus(qty())) }),
    ...recalc(cell()),
    notify({ tohome_custom_home: chain(cell(), 'home_custom_home') }, 'New pledge', TX(V('Name Input'), ' pledged ', ...what()), '/admin?tab=pledges', { pledge_custom_pledge: STEP(0) }),
    notify({ touser_user: CU() }, 'Pledge sent', TX(chain(cell(), 'homename_text'), ' will review your pledge of ', ...what(), '.'), '/my-pledges', { pledge_custom_pledge: STEP(0) }),
    A.email(CU('email'), TX('Your CareBridge pledge ', STEP(0, 'pledgeno_text')), TX('Hi ', CU('fullname_text'), ',\n\nThank you! Your pledge ', STEP(0, 'pledgeno_text'), ' (', ...what(), ') was sent to ', chain(cell(), 'homename_text'), '.\nPlanned drop-off: ', chain(V('Date Input'), X.fmtDate('ddd, d mmm yyyy')), '\nDrop-off address: ', chain(cell(), 'home_custom_home', 'address_text'), ' (', chain(cell(), 'home_custom_home', 'dropoffhours_text'), ')\n\nThe home will review it and we will email you when it is accepted.\n\nCareBridge'), chain(CU('emailnotifications_boolean'), X.ne(false))),
    A.email(chain(cell(), 'home_custom_home', 'notifyemail_text'), TX('New pledge: ', ...what()), TX(V('Name Input'), ' (', V('Phone Input'), ') pledged ', ...what(), ' for ', chain(V('Date Input'), X.fmtDate('ddd, d mmm yyyy')), '.\nPledge no. ', STEP(0, 'pledgeno_text'), '\n\nOpen CareBridge to accept or decline it.'), chain(cell(), 'home_custom_home', 'notifyemail_text', X.notEmpty())),
    A.hide('Pledge Popup'),
    A.go('pledge-confirmed', null, { pledge: TX(STEP(0, '_id')) }),
  ];

  const go = (cat) => A.go('home', PI(), cat ? { cat: cat } : null);
  window.PAGE = {
    name: 'home',
    before: [banner],
    elements: [...shell([unavailable, content], {}, [banner]), pop],
    workflows: [
      ...CATS.map(([label, val]) => wf('Category ' + label, { type: 'ButtonClicked', el: 'Cat ' + label }, [go(val)])),
      wf('Pledge open', { type: 'ButtonClicked', el: 'Pledge Button', cond: and(X.CU('logged_in'), isOpen(cell)) }, [A.display('Pledge Popup', cell()), A.show('Pledge Popup')]),
      wf('Pledge needs login', { type: 'ButtonClicked', el: 'Pledge Button', cond: chain(X.CU('logged_in'), X.eq(false)) }, [A.go('login', null, { mode: 'login' })]),
      wf('Close sheet', { type: 'ButtonClicked', el: 'Pop Close' }, [A.hide('Pledge Popup')]),
      wf('Cancel sheet', { type: 'ButtonClicked', el: 'Pop Cancel' }, [A.hide('Pledge Popup')]),
      wf('Confirm pledge W1', { type: 'ButtonClicked', el: 'Confirm Button', cond: valid() }, W1),
      wf('Confirm invalid', { type: 'ButtonClicked', el: 'Confirm Button', cond: invalid() }, [A.show('Pop Error')]),
      wf('Open from link', { type: 'PageLoaded', cond: and(chain(URL('item', 'custom.wishlistitem'), X.notEmpty()), X.CU('logged_in')) }, [A.display('Pledge Popup', URL('item', 'custom.wishlistitem')), A.show('Pledge Popup')]),
    ],
  };
})();
