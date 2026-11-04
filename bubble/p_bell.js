// In-app notification bell: button with unread badge + dropdown list (Group Focus). Same behaviour as the coded NotificationBell.
// Privacy rules already limit Notification searches to the current user's own (toUser / toHome / toRole), so a plain search is enough.
(() => {
  const { X, TX, B, el, wf, A } = window.CB;
  const { CU, S, OV, M, chain } = X;
  const cell = () => ({ type: 'ElementParent', is_slidable: false });
  const all = () => S('notification', []);
  const unread = () => S('notification', [['read_boolean', false]]);

  function build(pfx, opts = {}) {
    const btn = B.G(pfx + ' Bell Btn', { row: 1, w: 38, h: 38, r: 19, cva: 'center', cha: 'center', bg: opts.bg || 'white', border: [1, 'lines'], hide: true, when: [[CU('logged_in'), { show: 1 }]], collapse: 1 }, [
      el('Icon', pfx + ' Bell Glyph', { w: 20, h: 20, p: { icon: 'phosphor regular bell', icon_color: 'var(--color_textink_default)', padding_top: 0, padding_left: 0, padding_right: 0, padding_bottom: 0 } }),
      B.G(pfx + ' Bell Badge', { col: 1, minw: 18, h: 18, r: 9, bg: 'red', cva: 'center', pad: [0, 5, 0, 5], hide: true, collapse: 1, when: [[chain(unread(), X.count(), X.gt(0)), { show: 1 }]] }, [
        B.T(pfx + ' Bell Count', TX(chain(unread(), X.count())), { fs: 10, fwt: 800, fc: 'white', ta: 'center', fw: true, ha: 'center' }),
      ]),
    ]);
    const row = B.G(pfx + ' Notif Row', { type: 'custom.notification', ds: cell(), col: 1, gap: 2, pad: [10, 14, 10, 14], bg: 'teallight', border: [1, 'lines'], when: [[chain(cell(), 'read_boolean'), { bg: 'white' }]] }, [
      B.T(pfx + ' Notif Title', TX(chain(cell(), 'title_text')), { fs: 13, fwt: 700 }),
      B.T(pfx + ' Notif Body', TX(chain(cell(), 'body_text')), { fs: 12, fc: 'mutedtext' }),
      B.Sm(pfx + ' Notif Time', TX(chain(cell(), 'Created Date', X.fmtDate('d mmm, h:MM a'))), { fs: 11 }),
    ]);
    const panel = (refId) => el('GroupFocus', pfx + ' Notif Panel', { col: 1, gap: 0, bg: 'white', border: [1, 'lines'], r: 16, p: { reference: refId, offset_top: opts.top ?? 46, offset_left: opts.left ?? -300, width: 340, single_width: true, min_width_css: '300px', max_width_css: '340px', is_visible: false, boxshadow_style: 'outset', boxshadow_horizontal: 0, boxshadow_vertical: 8, boxshadow_blur: 24, boxshadow_color: 'rgba(31,42,46,0.12)', overflow: 'hidden' } }, [
      B.G(pfx + ' Notif Head', { row: 1, cva: 'center', pad: [12, 14, 12, 14] }, [
        B.H3(pfx + ' Notif Head Title', 'Notifications', { fs: 15 }),
        B.Ghost(pfx + ' Mark All Read', 'Mark all read', { h: 28, fs: 12, fwt: 700, fc: 'primaryteal', p: { border_width: 0 }, hide: true, when: [[chain(unread(), X.count(), X.gt(0)), { show: 1 }]] }),
      ]),
      B.RG(pfx + ' Notif List', 'custom.notification', chain(all(), X.sortBy('Created Date', true)), { sep: 0, maxh: 380, p: { scrollable: true } }, row),
      B.T(pfx + ' Notif Empty', 'No notifications yet. Updates about your pledges show up here.', { fs: 13, fc: 'mutedtext', pad: 16, hide: true, when: [[chain(all(), X.count(), X.eq(0)), { show: 1 }]] }),
    ]);
    const role = (r) => chain(CU('role_option_role'), X.eq(OV('role', r)));
    const workflows = [
      wf(pfx + ' Open bell', { type: 'ButtonClicked', el: pfx + ' Bell Btn' }, [A.show(pfx + ' Notif Panel')]),
      wf(pfx + ' Mark all read', { type: 'ButtonClicked', el: pfx + ' Mark All Read' }, [A.changeList('notification', unread(), { read_boolean: true })]),
      wf(pfx + ' Open notification', { type: 'ButtonClicked', el: pfx + ' Notif Row' }, [
        A.change(cell(), { read_boolean: true }),
        A.go('my-pledges', null, null, role('donor')),
        A.go('admin', null, { tab: 'pledges' }, role('homeAdmin')),
        A.go('platform', null, null, role('platformAdmin')),
      ]),
    ];
    return { btn, panel, workflows };
  }
  window.CBBELL = build;
})();
