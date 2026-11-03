// D2 Directory (Bubble page "homes")
(() => {
  const { X, TX, B, mob, wf, A } = window.CB;
  const { P, S, OV, V, M, chain } = X;
  const { shell, bar, typed } = window.CBC;

  const cellHome = () => ({ type: 'ElementParent', is_slidable: false });
  const fulfilled = () => S('wishlistitem', [['home_custom_home', cellHome()], ['status_option_itemstatus', OV('itemstatus', 'Fulfilled')]], 'count');
  const total = () => S('wishlistitem', [['home_custom_home', cellHome()], ['status_option_itemstatus', OV('itemstatus', 'Paused'), 'not equal']], 'count');
  const urgentHere = () => S('wishlistitem', [['home_custom_home', cellHome()], ['priority_option_priority', OV('priority', 'High')], ['status_option_itemstatus', X.list(OV('itemstatus', 'Open'), OV('itemstatus', 'Partially pledged')), 'in']], 'count');

  const base = () => {
    const s = S('home', [
      ['status_option_homestatus', OV('homestatus', 'Approved')],
      ['type_option_hometype', V('Type Dropdown')],
      ['area_option_area', V('Area Dropdown')],
      ['name_text', V('Search Input'), 'text contains'],
    ]);
    s.properties.ignore_empty_constraints = true;
    return s;
  };
  const urgentHomes = () => chain(S('wishlistitem', [['homeapproved_boolean', true], ['priority_option_priority', OV('priority', 'High')], ['status_option_itemstatus', X.list(OV('itemstatus', 'Open'), OV('itemstatus', 'Partially pledged')), 'in']]), 'home_custom_home');

  const card = typed(B.Card('Home Card', { type: 'home', ds: cellHome(), pad: 0, gap: 0, r: 18 }, [
    B.G('Photo Box', { h: 130, bg: 'teallight', col: 1, cva: 'center', p: { border_roundness: 0 } }, [
      B.Img('Home Photo', chain(cellHome(), 'photo_image'), { h: 130, ha: 'stretch', hide: true, when: [[chain(cellHome(), 'photo_image', X.notEmpty()), { show: 1 }]], p: { stretch_or_rescale: true } }),
      B.T('Photo Type', TX(chain(cellHome(), 'type_option_hometype', 'display'), ' home'), { fc: 'primaryteal', fwt: 700, ha: 'center', ta: 'center', fw: true, when: [[chain(cellHome(), 'photo_image', X.notEmpty()), { p: { is_visible: false } }]], p: { collapse_when_hidden: true } }),
    ]),
    B.G('Card Body', { col: 1, gap: 10, pad: 16 }, [
      B.G('Title Row', { row: 1, gap: 8, cva: 'center' }, [
        B.H3('Home Name', TX(chain(cellHome(), 'name_text')), { fw: false }),
        B.Tag('Urgent Tag', 'Urgent need', 'red', { hide: true, when: [[chain(urgentHere(), X.gt(0)), { show: 1 }]] }),
      ]),
      B.Sm('Home Meta', TX(chain(cellHome(), 'type_option_hometype', 'display'), ' · ', chain(cellHome(), 'area_option_area', 'display'))),
      B.T('Home About', TX(chain(cellHome(), 'about_text')), { fc: 'mutedtext', fs: 13, maxh: 40, p: { overflow: 'hidden' } }),
      bar('Fulfil Bar', chain(fulfilled(), X.div(total()), X.times(100))),
      B.Sm('Fulfil Text', TX(fulfilled(), ' of ', total(), ' needs fulfilled')),
      B.Btn('View Home Button', 'View home', { full: true, ha: 'stretch' }),
    ]),
  ]), 'home');

  const rgDs = base();
  const rg = B.RG('Homes List', 'home', chain(rgDs, X.sortBy('name_text')), { cols: 3, sep: 16, when: [mob({ p: { columns: 1 } }), [chain(V('Urgent Checkbox'), X.eq(true)), { p: { data_source: chain(base(), M('intersect_with', urgentHomes()), X.sortBy('name_text')) } }]] }, card);

  const filters = B.Card('Filter Card', { row: 1, gap: 12, pad: 14, cva: 'center', when: [mob({ col: 1, gap: 10 })] }, [
    B.In('Search Input', 'Search homes by name', 'text', { fw: false, minw: 200 }),
    B.Drop('Type Dropdown', 'All types', 'hometype', { minw: 160 }),
    B.Drop('Area Dropdown', 'All areas', 'area', { minw: 160 }),
    B.Check('Urgent Checkbox', 'Urgent only'),
  ]);

  const main = [
    B.G('Title Group', { col: 1, gap: 6 }, [
      B.H1('Page Title', 'Welfare homes'),
      B.T('Page Sub', 'Approved homes in the Klang Valley. Open one to see exactly what it still needs.', { fc: 'mutedtext' }),
    ]),
    filters,
    rg,
    B.T('Empty Text', 'No homes match your filters.', { fc: 'mutedtext', hide: true, when: [[chain(base(), X.count(), X.eq(0)), { show: 1 }]] }),
  ];

  window.PAGE = {
    name: 'homes',
    elements: shell(main),
    workflows: [
      wf('View home', { type: 'ButtonClicked', el: 'View Home Button' }, [A.go('home', P())]),
    ],
  };
})();
