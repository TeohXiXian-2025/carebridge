// D7 Log in / Sign up (Bubble page "login"). ?mode=signup shows sign up, &as=home for welfare homes.
(() => {
  const { X, TX, B, mob, wf, A } = window.CB;
  const { CU, S, OV, V, M, URL, chain } = X;
  const and = (a, b) => chain(a, X.and(b));
  const or = (a, b) => chain(a, X.or(b));
  const signup = () => chain(URL('mode'), X.eq('signup'));
  const login = () => chain(URL('mode'), X.ne('signup'));
  const asHome = () => chain(URL('as'), X.eq('home'));

  const seg = (name, kids) => B.G(name, { row: 1, gap: 4, pad: 4, r: 12, bg: 'rgba(233,237,236,1)' }, kids);
  const segBtn = (name, text, on) => B.Ghost(name, text, { full: true, h: 36, fs: 13, bg: 'rgba(233,237,236,1)', fc: 'mutedtext', p: { border_width: 0 }, when: [[on, { bg: 'white', fc: 'textink' }]] });
  const label = (n, t) => B.T(n, t, { fs: 13, fwt: 700 });
  const field = (n, l, input) => B.G(n, { col: 1, gap: 6 }, [label(n + ' Label', l), input]);

  const left = B.G('Brand Panel', { col: 1, bg: 'primaryteal', pad: [64, 64, 64, 64], w: 560, fh: false, minh: 600, p: { min_height_css: '100vh' }, when: [mob({ p: { is_visible: false } })], collapse: 1 }, [
    B.T('Brand Logo', '[color=#FFFFFF]Care[/color][color=#E8833A]Bridge[/color]', { fs: 28, fwt: 800 }),
    B.G('Brand Spacer', { col: 1, fh: false, p: { min_height_css: '200px' } }),
    B.H1('Brand Head', 'Give what is needed, not what is guessed.', { fs: 38, fc: 'white', lh: 1.15 }),
    B.T('Brand Text', 'Welfare homes post what they need. You pledge it, drop it off, and watch the wishlist update.', { fc: 'rgba(207,234,228,1)', fs: 16, lh: 1.5 }),
    B.G('Brand Spacer 2', { col: 1, fh: false, p: { min_height_css: '200px' } }),
    B.Sm('Brand Foot', 'A WIX2002 project · Universiti Malaya', { fc: 'rgba(207,234,228,1)' }),
  ]);

  const form = B.G('Form Column', { col: 1, gap: 18, maxw: 380, pad: [48, 24, 48, 24], ha: 'center', when: [mob({ pad: [28, 20, 40, 20] })] }, [
    B.T('Phone Logo', '[color=#0E7C6B]Care[/color][color=#E8833A]Bridge[/color]', { fs: 24, fwt: 800, hide: true, when: [mob({ show: 1 })] }),
    B.G('Form Head', { col: 1, gap: 6 }, [
      B.H1('Form Title', 'Welcome back', { fs: 28, when: [[signup(), { text: 'Create your account' }]] }),
      B.T('Form Sub', 'Log in to see your pledges.', { fc: 'mutedtext', when: [[signup(), { text: 'Sign up to pledge items to welfare homes.' }], [and(signup(), asHome()), { text: 'Sign up, then register your welfare home.' }]] }),
    ]),
    seg('Mode Seg', [segBtn('Tab Login', 'Log in', login()), segBtn('Tab Signup', 'Sign up', signup())]),
    B.G('Signup Fields', { col: 1, gap: 14, hide: true, when: [[signup(), { show: 1 }]] }, [
      label('Role Label', 'I am signing up as'),
      seg('Role Seg', [segBtn('Role Donor', 'A donor', chain(URL('as'), X.ne('home'))), segBtn('Role Home', 'A welfare home', asHome())]),
      field('Name Field', 'Full name', B.In('Name Input', '', 'text')),
      field('Phone Field', 'Phone number', B.In('Phone Input', 'e.g. 012-345 6789', 'text')),
      field('Email Field', 'Email', B.In('Signup Email', '', 'email')),
      field('Password Field', 'Password', B.In('Signup Password', '', 'password')),
      B.Sm('Password Help', 'At least 6 characters.'),
      B.T('Signup Error', 'Fill in your name, phone, email and a password of at least 6 characters.', { fc: 'red', fs: 13, hide: true }),
      B.Btn('Create Button', 'Create account', { full: true, ha: 'stretch', h: 48 }),
    ]),
    B.G('Login Fields', { col: 1, gap: 14, hide: true, when: [[login(), { show: 1 }]] }, [
      field('Login Email Field', 'Email', B.In('Login Email', '', 'email')),
      field('Login Password Field', 'Password', B.In('Login Password', '', 'password')),
      B.Btn('Login Button', 'Log in', { full: true, ha: 'stretch', h: 48 }),
      B.Sm('Login Help', 'Platform admins log in here too.'),
    ]),
    B.Link('Back Link', '← Back to CareBridge', 'index', { fs: 13 }),
  ]);
  const right = B.G('Form Side', { col: 1, cva: 'center', fh: false, p: { min_height_css: '100vh' }, when: [mob({ p: { min_height_css: '0px' } })] }, [form]);

  // After sign-in: accept an invite for this email, make the bootstrap admin a platform admin, then route by role.
  const invite = () => S('invite', [['email_text', CU('email')]], 'first_element');
  const after = (signupFlow) => [
    A.change(CU(), { role_option_role: chain(invite(), 'role_option_role'), home_custom_home: chain(invite(), 'home_custom_home') }, chain(invite(), X.notEmpty())),
    A.del(invite(), chain(invite(), X.notEmpty())),
    A.change(CU(), { role_option_role: OV('role', 'platformAdmin') }, chain(CU('email'), X.eq('xixianteoh@gmail.com'))),
    A.go('platform', null, null, chain(CU('role_option_role'), X.eq(OV('role', 'platformAdmin')))),
    A.go('admin', null, null, chain(CU('role_option_role'), X.eq(OV('role', 'homeAdmin')))),
    signupFlow ? A.go('register-home', null, null, and(asHome(), chain(CU('role_option_role'), X.eq(OV('role', 'donor'))))) : null,
    A.go('homes', null, null, chain(CU('role_option_role'), X.eq(OV('role', 'donor')))),
  ];
  const okSignup = () => and(and(and(chain(V('Name Input'), X.notEmpty()), chain(V('Phone Input'), X.notEmpty())), chain(V('Signup Email'), X.notEmpty())), chain(V('Signup Password'), X.notEmpty()));
  const badSignup = () => or(or(or(chain(V('Name Input'), X.empty()), chain(V('Phone Input'), X.empty())), chain(V('Signup Email'), X.empty())), chain(V('Signup Password'), X.empty()));

  window.PAGE = {
    name: 'login',
    elements: [B.G('Page Row', { row: 1, fh: false, p: { min_height_css: '100vh' }, when: [mob({ col: 1 })] }, [left, right])],
    workflows: [
      wf('Tab login', { type: 'ButtonClicked', el: 'Tab Login' }, [A.go('login', null, { mode: 'login' })]),
      wf('Tab signup', { type: 'ButtonClicked', el: 'Tab Signup' }, [A.go('login', null, { mode: 'signup' })]),
      wf('Role donor', { type: 'ButtonClicked', el: 'Role Donor' }, [A.go('login', null, { mode: 'signup', as: 'donor' })]),
      wf('Role home', { type: 'ButtonClicked', el: 'Role Home' }, [A.go('login', null, { mode: 'signup', as: 'home' })]),
      wf('Sign up', { type: 'ButtonClicked', el: 'Create Button', cond: okSignup() }, [
        A.signup(V('Signup Email'), V('Signup Password'), { fullname_text: TX(V('Name Input')), phone_text: TX(V('Phone Input')), role_option_role: OV('role', 'donor'), emailnotifications_boolean: true }),
        ...after(true),
      ]),
      wf('Sign up invalid', { type: 'ButtonClicked', el: 'Create Button', cond: badSignup() }, [A.show('Signup Error')]),
      wf('Log in', { type: 'ButtonClicked', el: 'Login Button' }, [A.login(V('Login Email'), V('Login Password')), ...after(false)]),
    ],
  };
})();
