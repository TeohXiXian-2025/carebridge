// Phone-layout CSS for the Bubble build. Bubble cannot switch a row to a column with a condition,
// so rows that stack on phones (like the coded app) are restacked here with a media query.
// Element ids come from the editor (copy-all); Bubble renders id "bTIHR" as class "baTaIaHaR".
(() => {
  const cls = (id) => '.' + (id.includes('_') ? id : id.replace(/(?!^)([A-Z])/g, 'a$1'));
  const stack = (ids) => ids.map(cls).map((c) => `${c}{flex-direction:column!important;align-items:stretch!important;flex-wrap:nowrap!important;height:auto!important}${c}>*{width:auto!important;max-width:none!important;min-width:0!important;flex:0 0 auto!important;align-self:stretch!important;margin-left:0!important;margin-right:0!important}`).join('');
  const grid = (id, n) => `${cls(id)}{display:grid!important;grid-template-columns:repeat(${n},minmax(0,1fr))!important;gap:10px!important}${cls(id)}>*{width:auto!important;min-width:0!important;max-width:none!important;margin:0!important}`;
  const phone = (css) => `@media (max-width:899px){${css}}`;
  const desk = (css) => `@media (min-width:900px){${css}}`;
  const wrap = (css) => `<style>${css}</style>`;

  // Donor pages (CSS lives in the Header reusable, which every donor page has)
  const donor = {
    stack: ['bTGXW', 'bTGYd', 'bTGaO', 'bTIHR', 'bTILC', 'bTILY', 'bTGph', 'bTGvC', 'bTGvP'],
    bell: 'bTJOg',
  };
  const donorCss = wrap(
    phone(stack(donor.stack) + `${cls('bTGZB')}{width:100%!important}`) +
    // bell before the avatar and vertically centred, like the coded header
    `${cls(donor.bell)}{order:1;align-self:center!important;margin:0!important}.hd_av{order:2;align-self:center!important}`
  );

  // Admin page
  const sidebarBell = (sidebar, bell, panel) => desk(`${cls(sidebar)}{position:relative!important}${cls(bell)}{position:absolute!important;top:26px;right:16px;z-index:5}${cls(panel)}{position:fixed!important;top:72px!important;left:150px!important}`);
  const adminCss = wrap(
    phone(stack(['bTIUg', 'bTIaf', 'bTIXr', 'bTIdw', 'bTIeb']) + grid('bTITe', 3) + `${cls('bTJRs')}{align-self:center!important}`) +
    sidebarBell('bTIOI', 'bTJRW', 'bTJSL')
  );
  // Platform page
  const platformCss = wrap(
    phone(stack(['bTIvC', 'bTIwO', 'bTIyZ', 'bTJEy']) + grid('bTIzy', 2) + `${cls('bTIvG')}{width:100%!important}${cls('bTJVW')}{align-self:center!important}`) +
    sidebarBell('bTIsO', 'bTJVA', 'bTJVp')
  );
  window.CBCSS = { donorCss, adminCss, platformCss, cls };
})();
