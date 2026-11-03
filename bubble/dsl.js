// CareBridge Bubble DSL: builds Bubble editor clipboard JSON (elements + workflows).
(() => {
  const SAID = 'eGl4aWFudGVvaA==';
  let n = 0;
  const uid = (p) => 'q' + p + (Date.now() % 1e5).toString(36) + (n++).toString(36);
  const C = (k) => (k && k.startsWith('rgba') ? k : `var(--color_${k}_default)`);
  const M = (name, args, props) => { const m = { type: 'Message', name, is_slidable: false }; if (args !== undefined) m.args = args; if (props) m.properties = props; return m; };
  // chain(root, 'field', M(...), ...) — returns root with .next links
  const chain = (root, ...ms) => { let last = root; for (const m of ms) { const mm = typeof m === 'string' ? M(m) : m; last.next = mm; last = mm; } return root; };
  const X = {
    P: (...f) => chain({ type: 'ElementParent', is_slidable: false }, ...f),            // parent group's thing / current cell
    CU: (...f) => chain({ type: 'CurrentUser', is_slidable: false }, ...f),
    PI: (...f) => chain({ type: 'CurrentPageItem', is_slidable: false }, ...f),         // current page's thing
    EL: (name, ...f) => chain({ type: 'GetElement', is_slidable: false, properties: { element_id: '@' + name } }, ...f),
    V: (name, ...f) => chain({ type: 'GetElement', is_slidable: false, properties: { element_id: '@' + name } }, 'get_data', ...f),
    STEP: (i, ...f) => chain({ type: 'PreviousStep', is_slidable: false, properties: { action_id: '#' + i } }, ...f),
    PD: (name, ...f) => chain({ type: 'PageData', is_slidable: false, properties: { name } }, ...f),
    NOW: (...f) => chain({ type: 'PageData', is_slidable: false, properties: { name: 'Current Date/Time' } }, ...f),
    URL: (param, vtype, ...f) => chain({ type: 'GetParamFromUrl', is_slidable: false, properties: { parameter_name: param, type: 'parameter', value: vtype || 'text' } }, ...f),
    OV: (set, val, ...f) => chain({ type: 'OptionValue', is_slidable: false, properties: { option_set: 'option.' + set, option_value: val } }, ...f),
    ALL: (set) => ({ type: 'AllOptionValue', is_slidable: false, properties: { option_set: 'option.' + set } }),
    S: (type, cons, ...f) => chain({ type: 'Search', is_slidable: false, properties: { type_to_find: 'custom.' + type, constraints: Object.fromEntries((cons || []).map((c, i) => [i, { key: c[0], value: c[1], constraint_type: c[2] || 'equals' }])) } }, ...f),
    SU: (cons, ...f) => chain({ type: 'Search', is_slidable: false, properties: { type_to_find: 'user', constraints: Object.fromEntries((cons || []).map((c, i) => [i, { key: c[0], value: c[1], constraint_type: c[2] || 'equals' }])) } }, ...f),
    W: () => X.PD('Current Page Width'),
    M, chain,
    // message helpers
    eq: (v) => M('equals', v), ne: (v) => M('not_equals', v), lt: (v) => M('less_than', v), gt: (v) => M('greater_than', v),
    plus: (v) => M('plus', v), minus: (v) => M('minus', v), times: (v) => M('times', v), div: (v) => M('divide', v),
    and: (v) => M('and_', v), or: (v) => M('or_', v),
    empty: () => M('is_empty'), notEmpty: () => M('is_not_empty'), count: () => M('count'), first: () => M('first_element'),
    sortBy: (field, desc) => M('sorted', undefined, { sort_field: field, descending: !!desc }),
    fmtDate: (fmt) => M('format_date', undefined, { formatting_type: 'custom', custom_format: fmt }),
    list: (...vals) => vals.slice(1).reduce((acc, v) => chain(acc, M('plus_element', v)), chain(vals[0], M('convert_to_list'))),
  };
  const TX = (...parts) => ({ type: 'TextExpression', entries: Object.fromEntries(parts.map((p, i) => [i, p])) });

  // ---------- element props shorthand ----------
  function props(o = {}) {
    const p = {};
    const set = (k, v) => { if (v !== undefined) p[k] = v; };
    if (o.col) p.container_layout = 'column';
    if (o.row) p.container_layout = 'row';
    if (o.align) p.container_layout = 'align_to_parent';
    if (o.gap !== undefined) { p.use_gap = true; p.row_gap = o.gap; p.column_gap = o.cgap ?? o.gap; }
    if (o.pad !== undefined) { const a = Array.isArray(o.pad) ? o.pad : [o.pad, o.pad, o.pad, o.pad]; const [t, r, b, l] = a.length === 2 ? [a[0], a[1], a[0], a[1]] : a; p.padding_top = t; p.padding_right = r; p.padding_bottom = b; p.padding_left = l; }
    if (o.bg) { p.background_style = 'bgcolor'; p.bgcolor = C(o.bg); }
    set('border_roundness', o.r);
    if (o.border) { p.border_style = 'solid'; p.border_width = o.border[0]; p.border_color = C(o.border[1]); }
    p.fit_height = o.fh === undefined ? true : o.fh;
    if (o.fw !== undefined) p.fit_width = o.fw;
    if (o.maxw) p.max_width_css = o.maxw + 'px';
    if (o.minw !== undefined) p.min_width_css = o.minw + 'px';
    if (o.minh !== undefined) p.min_height_css = o.minh + 'px';
    if (o.maxh) p.max_height_css = o.maxh + 'px';
    if (o.w) { p.width = o.w; p.single_width = true; p.min_width_css = o.w + 'px'; p.fit_width = false; }
    if (o.h) { p.height = o.h; p.single_height = true; p.min_height_css = o.h + 'px'; p.fit_height = false; }
    set('horiz_alignment', o.ha);
    set('container_vert_alignment', o.cva);
    set('container_horiz_alignment', o.cha);
    set('vert_alignment', o.va);
    if (o.ds) p.data_source = o.ds;
    if (o.type) p.group_type = o.type.includes('.') || o.type === 'user' ? o.type : 'custom.' + o.type;
    if (o.hide) { p.is_visible = false; p.collapse_when_hidden = true; }
    if (o.collapse) p.collapse_when_hidden = true;
    if (o.fc) p.font_color = C(o.fc);
    set('font_size', o.fs);
    if (o.fwt) p.font_weight = String(o.fwt);
    set('font_alignment', o.ta);
    set('line_height', o.lh);
    if (o.extra) Object.assign(p, o.extra);
    return p;
  }
  const states = (list) => list && list.length ? Object.fromEntries(list.map((s, i) => [i, { type: 'State', condition: s[0], properties: props({ fh: undefined, ...s[1], _state: 1 }) }])) : undefined;
  // In states we should not force fit_height; clean it.
  function cleanState(st) { if (!st) return st; for (const k in st) { const pr = st[k].properties; if (!('fh' in (st[k]._src || {}))) delete pr.fit_height; } return st; }

  function el(type, name, o = {}, kids = []) {
    const id = uid(type.slice(0, 2).toLowerCase());
    const p = props(o);
    if (o.text !== undefined) p.text = typeof o.text === 'string' ? TX(o.text) : (o.text.type === 'TextExpression' ? o.text : TX(o.text));
    if (o.label !== undefined) p.label = typeof o.label === 'string' ? TX(o.label) : o.label;
    if (o.ph !== undefined) p.placeholder = TX(o.ph);
    if (o.p) Object.assign(p, o.p);
    const e = { type, id, name, default_name: type + ' ' + id, properties: p };
    if (o.style) e.style = o.style;
    if (o.when) {
      e.states = Object.fromEntries(o.when.map((s, i) => { const sp = props({ ...s[1] }); if (!('fh' in s[1])) delete sp.fit_height; if (s[1].show) { sp.is_visible = true; } if (s[1].p) Object.assign(sp, s[1].p); if (s[1].text !== undefined) sp.text = typeof s[1].text === 'string' ? TX(s[1].text) : s[1].text; return [i, { type: 'State', condition: s[0], properties: sp }]; }));
    }
    kids = kids.filter(Boolean);
    if (kids.length) { e.elements = {}; kids.forEach((k, i) => { k.properties.order = i + 1; e.elements[k.id] = k; }); }
    return e;
  }
  const mob = (o) => [X.chain(X.W(), X.lt(900)), o];             // phone layout override
  const desk = (o) => [X.chain(X.W(), X.M('greater_than', 899)), o]; // desktop override

  const B = {
    G: (name, o, kids) => el('Group', name, { style: 'Group_transparent_', ...o }, kids),
    Card: (name, o, kids) => el('Group', name, { style: 'Group_card_cb_', col: 1, pad: 16, gap: 10, ...o }, kids),
    T: (name, text, o = {}) => el('Text', name, { style: 'Text_body_cb_', text, ...o }),
    H1: (name, text, o = {}) => el('Text', name, { style: 'Text_h1_cb_', text, ...o }),
    H2: (name, text, o = {}) => el('Text', name, { style: 'Text_h2_cb_', text, ...o }),
    H3: (name, text, o = {}) => el('Text', name, { style: 'Text_h3_cb_', text, ...o }),
    Sm: (name, text, o = {}) => el('Text', name, { style: 'Text_small_cb_', text, ...o }),
    Tag: (name, text, color, o = {}) => el('Text', name, { style: 'Text_tag_' + color + '_cb_', text, fw: true, ...o }),
    Btn: (name, text, o = {}) => el('Button', name, { style: 'Button_primary_cb_', text, fw: o.full ? false : true, ...o }),
    Ghost: (name, text, o = {}) => el('Button', name, { style: 'Button_ghost_cb_', text, fw: o.full ? false : true, ...o }),
    Link: (name, text, page, o = {}) => el('Link', name, { style: 'Link_link_light_primary_', text, fw: true, p: { linktype: 'pagelink', page, ...(o.p || {}) }, ...o }),
    In: (name, ph, fmt = 'text', o = {}) => el('Input', name, { style: 'Input_cb_', ph, fh: false, h: 46, ha: 'stretch', p: { content_format: fmt, ...(o.p || {}) }, ...o }),
    Area: (name, ph, o = {}) => el('MultiLineInput', name, { style: 'MultiLineInput_standard_multiline_input_', ph, fh: false, h: 96, ha: 'stretch', p: { padding_top: 11, padding_bottom: 11, ...(o.p || {}) }, ...o }),
    Drop: (name, ph, set, o = {}) => el('Dropdown', name, { style: 'Dropdown_standard_dropdown_', ph, fh: false, h: 46, ha: 'stretch', p: { data_source: X.ALL(set), dynamic_type: 'option.' + set, choices_style: 'dynamic', option_display_expression: TX(X.chain({ type: 'InjectedValue', is_slidable: false }, 'display')), ...(o.p || {}) }, ...o }),
    Date: (name, ph, o = {}) => el('DateInput', name, { style: 'DateInput_standard_date_picker_', ph, fh: false, h: 46, ha: 'stretch', p: { input_type: 'date', ...(o.p || {}) }, ...o }),
    Check: (name, label, o = {}) => el('Checkbox', name, { label, fw: true, minw: 24, minh: 24, ...o }),
    Html: (name, html, o = {}) => el('HTML', name, { fh: true, p: { html: typeof html === 'string' ? TX(html) : html, ...(o.p || {}) }, ...o }),
    Img: (name, src, o = {}) => el('Image', name, { p: { dynamic_image: src, ...(o.p || {}) }, ...o }),
    RG: (name, type, ds, o, cell) => el('RepeatingGroup', name, { style: 'RepeatingGroup_transparent_', type, ds, fh: true, col: 1, p: { columns: o.cols || 1, fixed_columns: true, fixed_rows: false, show_all_items: true, separator_style: 'solid', separator_width: o.sep ?? 12, separator_color: 'rgba(0,0,0,0)', cell_min_height_css: '0px', ...(o.p || {}) }, ...o }, [cell]),
    Popup: (name, o, kids) => el('Popup', name, { style: o.style || 'Popup_standard_popup_', col: 1, gap: 14, pad: 24, ...o }, kids),
  };

  // ---------- workflows ----------
  function wf(name, event, actions) {
    const id = uid('wf');
    const acts = {};
    actions.filter(Boolean).forEach((a, i) => { acts[i] = { ...a, id: id + '_a' + i }; });
    const ev = { type: event.type, id, name, actions: acts };
    if (event.el) ev.properties = { element_id: '@' + event.el };
    if (event.cond) ev.properties = { ...(ev.properties || {}), condition: event.cond };
    // resolve step refs
    const s = JSON.stringify(ev).replace(/"#(\d+)"/g, (_, k) => JSON.stringify(id + '_a' + k));
    return JSON.parse(s);
  }
  const fields = (o) => Object.fromEntries(Object.entries(o).map(([k, v], i) => [i, { key: k, value: v }]));
  const A = {
    create: (type, vals, cond) => ({ type: 'NewThing', properties: { thing_type: 'custom.' + type, initial_values: fields(vals), ...(cond ? { condition: cond } : {}) } }),
    change: (thing, vals, cond) => ({ type: 'ChangeThing', properties: { to_change: thing, changes: fields(vals), ...(cond ? { condition: cond } : {}) } }),
    changeList: (type, list, vals, cond) => ({ type: 'ChangeListOfThings', properties: { type_to_change: 'custom.' + type, to_change: list, changes: fields(vals), ...(cond ? { condition: cond } : {}) } }),
    del: (thing, cond) => ({ type: 'DeleteThing', properties: { to_delete: thing, ...(cond ? { condition: cond } : {}) } }),
    go: (page, data, params, cond) => ({ type: 'ChangePage', properties: { element_id: page, ...(data ? { data_to_send: data } : {}), ...(params ? { add_parameters: true, url_parameters: Object.fromEntries(Object.entries(params).map(([k, v], i) => [i, { key: k, value: typeof v === 'string' ? TX(v) : (v.type === 'TextExpression' ? v : TX(v)) }])) } : {}), ...(cond ? { condition: cond } : {}) } }),
    show: (elName, cond) => ({ type: 'ShowElement', properties: { element_id: '@' + elName, ...(cond ? { condition: cond } : {}) } }),
    hide: (elName, cond) => ({ type: 'HideElement', properties: { element_id: '@' + elName, ...(cond ? { condition: cond } : {}) } }),
    display: (elName, data, cond) => ({ type: 'DisplayGroupData', properties: { element_id: '@' + elName, data_source: data, ...(cond ? { condition: cond } : {}) } }),
    email: (to, subject, body, cond) => ({ type: 'SendEmail', properties: { to: TX(to), subject: typeof subject === 'string' ? TX(subject) : subject, body: typeof body === 'string' ? TX(body) : body, ...(cond ? { condition: cond } : {}) } }),
    signup: (email, pw, vals) => ({ type: 'SignUp', properties: { email, password: pw, ...(vals ? { changes: fields(vals) } : {}) } }),
    login: (email, pw) => ({ type: 'LogIn', properties: { email, password: pw, stay_logged_in: true } }),
    logout: () => ({ type: 'LogOut' }),
    reset: () => ({ type: 'ResetInputs' }),
  };

  // ---------- clipboard I/O ----------
  const tokens = () => { const c = JSON.parse(localStorage.getItem('cb_index_copy')); return c.elements[1].color_tokens; };
  function putElements(list) {
    const ct = tokens();
    const els = list.map((e) => ({ ...e, said: SAID, color_tokens: ct, font_tokens: {} }));
    const out = JSON.stringify({ type: 'copy', elements: els });
    const now = String(Date.now());
    localStorage.setItem('bubble_element_clipboard_most_recent', out);
    localStorage.setItem('bubble_element_clipboard', out);
    localStorage.setItem('_this_session_clipboard_bubble_element_clipboard_most_recent', now);
    localStorage.setItem('_this_session_clipboard_bubble_element_clipboard', now);
    return out.length;
  }
  // name -> id map from the last "copy all" in the editor
  function idMap() {
    const c = JSON.parse(localStorage.getItem('bubble_element_clipboard_most_recent'));
    const m = {}; const w = (e) => { if (e.name) m[e.name] = e.id; Object.values(e.elements || {}).forEach(w); }; c.elements.forEach(w); return m;
  }
  function putWorkflow(w, page, map) {
    let s = JSON.stringify(w).replace(/"@([^"]+)"/g, (_, nm) => { if (!map[nm]) throw new Error('No element named ' + nm); return JSON.stringify(map[nm]); });
    const data = JSON.parse(s); data.said = SAID; data.color_tokens = tokens(); data.font_tokens = {};
    localStorage.setItem('bubble_action_clipboard', JSON.stringify({ data, is_action: false, page }));
    localStorage.setItem('_this_session_clipboard_bubble_action_clipboard', String(Date.now()));
    return s.length;
  }
  window.CB = { X, TX, B, el, mob, desk, wf, A, putElements, putWorkflow, idMap, C };
})();
