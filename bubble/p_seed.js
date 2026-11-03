// Temporary page "seed": one button that loads the same sample data as the coded demo.
(() => {
  const { X, TX, B, wf, A } = window.CB;
  const { OV, STEP } = X;
  const homes = [
    { name: 'Sri Damai Elderly Home', type: 'Elderly', area: 'Cheras', about: 'A home for 38 elderly residents, many bedridden. Run by volunteers since 2004.', address: 'Jalan Damai 3, Cheras, Kuala Lumpur', hours: 'Mon–Sat, 10am–5pm', email: 'sridamai@example.org' },
    { name: 'Rumah Kasih Children’s Home', type: 'Children', area: 'Petaling Jaya', about: 'Shelter and schooling support for 45 children aged 4–17.', address: 'Jalan SS2/24, Petaling Jaya', hours: 'Daily, 9am–6pm', email: 'rumahkasih@example.org' },
    { name: 'Kasih Harapan Children’s Home', type: 'Children', area: 'Klang', about: 'Family-style home for 30 children, with a small after-school centre.', address: 'Jalan Kapar, Klang', hours: 'Mon–Fri, 9am–5pm', email: 'kasihharapan@example.org' },
  ];
  const items = [
    [0, 'Adult diapers, size L', 'Hygiene', 'High', 40, 12, 0],
    [0, 'Wet wipes (pack)', 'Hygiene', 'High', 60, 20, 0],
    [0, 'Disposable gloves (box)', 'Medical supplies', 'Medium', 20, 0, 0],
    [0, 'Rice (5kg bag)', 'Packaged food', 'Low', 10, 0, 10],
    [1, 'School exercise books', 'Education', 'High', 100, 30, 0],
    [1, 'Milk powder (900g)', 'Packaged food', 'Medium', 24, 0, 0],
    [1, 'Children’s T-shirts', 'Clothing', 'Low', 50, 50, 0],
    [2, 'Toothpaste and brushes', 'Hygiene', 'High', 30, 0, 0],
    [2, 'Cooking oil (2kg)', 'Packaged food', 'Medium', 12, 4, 0],
  ];
  const status = (p, r, n) => (r >= n ? 'Fulfilled' : p + r >= n ? 'Fully pledged' : p + r > 0 ? 'Partially pledged' : 'Open');
  const acts = [];
  homes.forEach((h) => acts.push(A.create('home', { name_text: TX(h.name), type_option_hometype: OV('hometype', h.type), area_option_area: OV('area', h.area), about_text: TX(h.about), address_text: TX(h.address), dropoffhours_text: TX(h.hours), notifyemail_text: TX(h.email), status_option_homestatus: OV('homestatus', 'Approved') })));
  items.forEach(([hi, name, cat, pri, need, pl, rec]) => acts.push(A.create('wishlistitem', { home_custom_home: STEP(hi), homename_text: TX(homes[hi].name), homeapproved_boolean: true, name_text: TX(name), category_option_category: OV('category', cat), priority_option_priority: OV('priority', pri), qtyneeded_number: need, qtypledged_number: pl, qtyreceived_number: rec, status_option_itemstatus: OV('itemstatus', status(pl, rec, need)) })));
  // a pending home for the approvals screen
  acts.push(A.create('home', { name_text: TX('Taman Ceria Children’s Shelter'), type_option_hometype: OV('hometype', 'Children'), area_option_area: OV('area', 'Kajang'), about_text: TX('Newly registered shelter for 20 children.'), address_text: TX('Jalan Reko, Kajang'), dropoffhours_text: TX('Sat–Sun, 10am–4pm'), notifyemail_text: TX('tamanceria@example.org'), status_option_homestatus: OV('homestatus', 'Pending') }));
  window.PAGE = {
    name: 'seed',
    elements: [B.G('Seed Group', { col: 1, gap: 12, pad: 40 }, [B.H2('Seed Title', 'Load sample data (temporary)'), B.Btn('Seed Button', 'Load sample data')])],
    workflows: [wf('Seed', { type: 'ButtonClicked', el: 'Seed Button' }, acts)],
  };
})();
