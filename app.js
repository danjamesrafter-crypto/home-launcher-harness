/* Flywheel Home launcher harness (spike, not the product). Read-only.
 * UI: Flywheel Vision Design System React bundle (window.FlywheelVisionDesignSystem_6c883d).
 * Data: Flywheel Extension SDK 0.14.9 apiRequest proxy (no token in the page). #demo = fictional data. */
(function () {
  'use strict';
  var VERSION = 'home-launcher-harness/0.1.0';
  var R = window.React, h = R.createElement, useState = R.useState, useEffect = R.useEffect, useRef = R.useRef;
  var V = window.FlywheelVisionDesignSystem_6c883d || {};
  var Button = V.Button, IconButton = V.IconButton, Icon = V.Icon, Tag = V.Tag, Typography = V.Typography, AppIcon = V.AppIcon,
    Avatar = V.Avatar, TextInput = V.TextInput, Select = V.Select, SelectItem = V.SelectItem, Switch = V.Switch, Tabs = V.Tabs, Tab = V.Tab,
    TabPanel = V.TabPanel, Table = V.Table, Snackbar = V.Snackbar, SnackbarContainer = V.SnackbarContainer, ContextLayout = V.ContextLayout,
    ProgressSpinner = V.ProgressSpinner, Ghost = V.Ghost, Tooltip = V.Tooltip, AlertPanel = V.AlertPanel;

  // ------------------------------------------------------------------ helpers
  var LOG = [];
  function note(s) { LOG.push(new Date().toLocaleTimeString() + '  ' + s); if (LOG.length > 400) LOG.shift(); }
  function rows(r) { return Array.isArray(r) ? r : (r && (r.results || r.items || r.data)) || []; }
  function day(iso) { var p = String(iso).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today0() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function daysTo(iso) { return iso ? Math.round((day(iso) - today0()) / 864e5) : null; }
  function fmtDay(iso) { return iso ? day(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function errMsg(e) { return (e && (e.status || e.message)) || String(e); }
  function initials(name) { var p = String(name || '?').replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase(); }
  function short(id) { return String(id || '').replace(/@.*/, ''); }
  function flywheelOrigin() {
    try { if (location.ancestorOrigins && location.ancestorOrigins.length) return location.ancestorOrigins[0]; } catch (e) {}
    try { return new URL(document.referrer).origin; } catch (e) { return ''; }
  }
  function openNew(url) { note('open ' + url); window.open(url, '_blank', 'noopener'); }

  // ------------------------------------------------------------------ personas and apps
  var PERSONAS = [
    { id: 'admin', label: 'Site Admin' },
    { id: 'dm', label: 'Data Manager' },
    { id: 'uploader', label: 'Uploader' },
    { id: 'reader', label: 'Reader' },
    { id: 'sponsor', label: 'Sponsor' }
  ];
  function personaLabel(id) { return (PERSONAS.filter(function (p) { return p.id === id; })[0] || {}).label || id; }

  var APPS = [
    { id: 'core', name: 'Core', roles: ['admin', 'dm', 'sponsor'], img: 'core.svg',
      desc: 'Flywheel Core is a platform for ingesting, classifying, curating, storing, searching and analyzing medical imaging and associated data.',
      sub: 'Includes Reading Ops, Subject View and Slide Review', learn: 'https://docs.flywheel.io/' },
    { id: 'reader', name: 'Reader Portal', roles: ['admin', 'reader'], icon: 'reader-studies', isNew: true, persona: 'For Readers',
      desc: 'A focused, blinded workspace for readers: assigned and pool reads, opened straight into the viewer, with study resources and help.' },
    { id: 'data', name: 'Data Portal', roles: ['admin', 'dm', 'uploader'], icon: 'cloud-upload', isNew: true, persona: 'For Uploaders',
      desc: 'Submit imaging from a site and see what has been received, what is missing against the visit schedule, and what needs a fix.' },
    { id: 'sponsor', name: 'Sponsor View', roles: ['admin', 'dm', 'sponsor'], icon: 'chart-trend-square', isNew: true, concept: true, persona: 'For Sponsors',
      desc: 'Study status at a glance: enrollment and imaging received, read progress against plan, and data packages ready for review.' },
    { id: 'exchange', name: 'Gear Exchange', roles: ['admin', 'dm'], img: 'exchange.svg',
      desc: 'Flywheel Gear Exchange offers a set of tools that automate tasks like metadata extraction, classification, and quality assurance.',
      learn: 'https://flywheel.io/gear-exchange/' }
  ];
  var HOME_APP = { admin: 'Core', dm: 'Core', uploader: 'Data Portal', reader: 'Reader Portal', sponsor: 'Sponsor View' };
  var PROMPTS = {
    admin: ['What is each study waiting on?', 'Which sites need retraining?', 'Will we hit the read target date?'],
    dm: ['What is the trial waiting on?', 'Why did the last gear jobs fail?', 'What is blocking an interim lock?'],
    uploader: ['What is missing for my next visit?', 'Why was my upload held?', 'Draft a reply to the open query'],
    reader: ['What should I read next?', 'What does the charter say about new lesions?', 'Draft a support request for my overdue read'],
    sponsor: ['Summarize study status this week', 'Are we on track for the interim analysis?', 'What changed since the last data package?']
  };
  // Persona rows the platform can't produce yet (no attention feeds for these apps). Shown with a Sample tag.
  var SAMPLE_ITEMS = {
    uploader: [
      { sev: 3, tag: 'Missing', text: 'Follow-up 2: CT chest series not received', app: 'Data Portal', when: 'visit window closes in 4 days', action: 'Upload', go: 'data' },
      { sev: 2, tag: 'Query', text: 'Re-send follow-up 1 at 1.25 mm slice thickness', app: 'Data Portal', when: 'raised 3 days ago', action: 'Reply', go: 'data' },
      { sev: 1, tag: 'Held', text: '1 upload held for de-identification review', app: 'Data Portal', when: 'today', action: 'View', go: 'data' }
    ],
    sponsor: [
      { sev: 2, tag: 'Ready', text: 'Interim data package ready for review', app: 'Sponsor View', when: 'IA2', action: 'Review', go: 'sponsor' },
      { sev: 1, tag: 'Update', text: 'Weekly study update is available', app: 'Sponsor View', when: 'Monday', action: 'Read', go: 'sponsor' }
    ]
  };
  var SEV = { 3: 'red', 2: 'orange', 1: 'primary' };

  // ------------------------------------------------------------------ connection
  var CONN = { ext: null, demo: false, origin: '' };
  function api(method, path, params) {
    note(method + ' ' + path + (params ? ' ' + JSON.stringify(params) : ''));
    var p = CONN.demo ? DEMO.request(method, path, params) : CONN.ext.apiRequest(method, path, params);
    return p.then(function (r) { note('  ok' + (Array.isArray(r) ? ' (' + r.length + ' rows)' : r && r.total != null ? ' (total ' + r.total + ')' : '')); return r; },
      function (e) { note('  failed: ' + errMsg(e)); throw e; });
  }
  function connect() {
    if (/demo/.test(location.hash) || /demo=1/.test(location.search)) { CONN.demo = true; note('Demo mode: fictional data.'); return Promise.resolve({ demo: true }); }
    if (!window.Flywheel || !Flywheel.initExtension) return Promise.reject(new Error('The Flywheel Extension SDK did not load from cdn.flywheel.io.'));
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('No connection from Flywheel. Open this page from a project’s Launch In menu inside Flywheel, or use demo data.')); }, 8000);
      Flywheel.initExtension({ scope: 'ReadWrite', validateOrigin: function (o) { return /^https:\/\/[a-z0-9.-]+\.flywheel\.io$/.test(o); } })
        .then(function (ext) {
          clearTimeout(t); CONN.ext = ext; CONN.origin = flywheelOrigin();
          note('Connected. Origin ' + (CONN.origin || 'unknown') + '. User ' + (ext.user ? ext.user._id : 'unknown') + '. Opened from ' + (ext.container ? ext.container.container_type + ' ' + ext.container._id : 'no container') + '.');
          resolve({ ext: ext });
        }, function (e) { clearTimeout(t); reject(e); });
    });
  }

  // Blinded column set (reader-shell harness, verified on r6nvg8): never parent_details, creator or parent_ref (whole).
  var COLS = 'task_id,created,status,priority,protocol_label,assignee,parents,due_date,subcategory,read_number,modified';
  function loadTasks() {
    var all = [], seen = {}, LIMIT = 100;
    function page(skip) {
      return api('GET', '/api/tasks/reader', { limit: LIMIT, skip: skip, sort: 'created:desc,task_id:asc', columns: COLS }).then(function (r) {
        var rs = rows(r);
        rs.forEach(function (t) { var k = t._id || t.task_id; if (!seen[k]) { seen[k] = 1; all.push(t); } });
        var total = r && typeof r.total === 'number' ? r.total : null;
        if (rs.length === LIMIT && (total == null || all.length < total) && skip < 5000) return page(skip + LIMIT);
        note('Loaded ' + all.length + (total != null ? ' of ' + total : '') + ' reader tasks.');
        return all;
      });
    }
    return page(0);
  }

  // ------------------------------------------------------------------ derived task views
  var OPEN = { todo: 1, in_progress: 1 };
  function assigneeId(t) { return t.assignee && t.assignee.type === 'user' ? t.assignee.id : null; }
  function isPool(t) { return t.assignee && t.assignee.type === 'staffing_pool'; }
  function caseKey(t) { var p = t.parents || {}; return p.acquisition || p.session || p.subject || p.project || t._id; }
  function projectOf(t) { return t.parents && t.parents.project; }
  function viewerUrl(t) { var pid = projectOf(t); return pid && CONN.origin ? CONN.origin + '/ohif-viewer-v3/project/' + pid + '/reader?taskId=' + encodeURIComponent(t._id) : null; }

  function readerBuckets(tasks, me) {
    var mine = tasks.filter(function (t) { return assigneeId(t) === me; });
    var open = mine.filter(function (t) { return OPEN[t.status]; });
    return {
      mine: open,
      overdue: open.filter(function (t) { var d = daysTo(t.due_date); return d != null && d < 0; }),
      soon: open.filter(function (t) { var d = daysTo(t.due_date); return d != null && d >= 0 && d <= 2; }),
      inProgress: open.filter(function (t) { return t.status === 'in_progress'; }),
      pool: tasks.filter(function (t) { return isPool(t) && t.status === 'todo'; }),
      done: mine.filter(function (t) { return t.status === 'completed'; })
    };
  }

  function attentionFor(persona, tasks, me) {
    if (SAMPLE_ITEMS[persona]) return { items: SAMPLE_ITEMS[persona].map(function (x) { return Object.assign({ sample: true }, x); }), total: SAMPLE_ITEMS[persona].length, sample: true };
    var items = [];
    if (persona === 'reader') {
      var b = readerBuckets(tasks, me);
      b.overdue.slice(0, 2).forEach(function (t) {
        items.push({ sev: 3, tag: 'Overdue', text: 'Read ' + (t.task_id || t._id), app: 'Reader Portal', when: (t.protocol_label || 'Protocol') + ' · due ' + fmtDay(t.due_date), action: 'Start Read', task: t });
      });
      if (b.soon.length) items.push({ sev: 2, tag: 'Due Soon', text: plural(b.soon.length, 'read') + ' due within 2 days', app: 'Reader Portal', when: 'next due ' + fmtDay(b.soon[0].due_date), action: 'Open Queue', go: 'reader' });
      if (b.inProgress.length) items.push({ sev: 1, tag: 'In Progress', text: plural(b.inProgress.length, 'read') + ' started and not submitted', app: 'Reader Portal', when: 'resume where you left off', action: 'Resume', go: 'reader' });
      if (b.pool.length) items.push({ sev: 1, tag: 'Pool', text: plural(b.pool.length, 'unclaimed read') + ' in a pool', app: 'Reader Portal', when: 'claim from the portal', action: 'Open Pool', go: 'reader' });
      return { items: items, total: b.mine.length + b.pool.length };
    }
    // Site admin / data manager: operational view across tasks this account can see.
    var open = tasks.filter(function (t) { return OPEN[t.status]; });
    var overdue = open.filter(function (t) { var d = daysTo(t.due_date); return d != null && d < 0; });
    var byWho = {};
    overdue.forEach(function (t) { var k = assigneeId(t) || (isPool(t) ? 'a pool' : 'unassigned'); byWho[k] = (byWho[k] || 0) + 1; });
    Object.keys(byWho).sort(function (a, b) { return byWho[b] - byWho[a]; }).slice(0, 2).forEach(function (k) {
      items.push({ sev: 3, tag: 'Overdue', text: plural(byWho[k], 'overdue read') + ' · ' + short(k), app: 'Reading Ops', when: 'reassign or follow up', action: 'Open', go: 'tasks' });
    });
    var cases = {};
    tasks.forEach(function (t) { var k = caseKey(t); (cases[k] = cases[k] || []).push(t); });
    var waiting = Object.keys(cases).filter(function (k) {
      var c = cases[k], adj = c.filter(function (t) { return t.subcategory === 'adjudicator'; }), reads = c.filter(function (t) { return t.subcategory !== 'adjudicator'; });
      return adj.some(function (t) { return t.status === 'blocked'; }) && reads.length > 1 && reads.every(function (t) { return t.status === 'completed' || t.status === 'cancelled'; });
    });
    if (waiting.length) items.push({ sev: 2, tag: 'Waiting', text: plural(waiting.length, 'case') + ' with reads in, adjudication still blocked', app: 'Reading Ops', when: 'waiting on comparison', action: 'Open', go: 'tasks' });
    var unassigned = open.filter(function (t) { return !t.assignee || !t.assignee.id; });
    if (unassigned.length) items.push({ sev: 2, tag: 'Unassigned', text: plural(unassigned.length, 'read') + ' with no reader', app: 'Reading Ops', when: 'assign before they slip', action: 'Assign', go: 'tasks' });
    var dueSoon = open.filter(function (t) { var d = daysTo(t.due_date); return d != null && d >= 0 && d <= 2; });
    if (dueSoon.length) items.push({ sev: 1, tag: 'Due Soon', text: plural(dueSoon.length, 'read') + ' due within 2 days', app: 'Reading Ops', when: 'across ' + plural(Object.keys(dueSoon.reduce(function (a, t) { a[projectOf(t)] = 1; return a; }, {})).length, 'project'), action: 'Open', go: 'tasks' });
    var total = overdue.length + waiting.length + unassigned.length + dueSoon.length;
    return { items: items, total: total };
  }

  // ------------------------------------------------------------------ small components
  function SectionTitle(p) {
    return h('h2', { className: 'hl-section-title', id: p.id },
      h(Icon, { name: p.icon, color: 'light', size: 'small', decorative: true }),
      h(Typography, { variant: 'h3', component: 'span' }, p.children));
  }

  function AppCard(p) {
    var a = p.app, on = p.on;
    var tile = a.img ? h('div', { className: 'tile' }, h('img', { src: a.img, alt: '' }))
      : h('div', { className: 'tile' }, h(AppIcon, { icon: a.icon, color: 'gradient', size: 'large', variant: 'static', locked: !on, 'aria-label': a.name }));
    var tags = [];
    if (a.persona) tags.push(h(Tag, { key: 'p', color: 'secondary', title: a.persona }));
    if (on && a.isNew) tags.push(h(Tag, { key: 'n', color: 'primary', title: 'New' }));
    if (a.concept) tags.push(h(Tag, { key: 'c', color: 'orange', title: 'Concept' }));
    if (!on) tags.push(h(Tag, { key: 'l', color: 'slate', icon: 'lock', title: 'Not In Your Role' }));
    var launch = h(Button, { color: 'primary', variant: 'solid', size: 'large', fullWidth: true, disabled: !on, endIcon: a.id === 'data' || a.id === 'exchange' ? 'open' : a.id === 'reader' ? 'full-screen-zoom' : undefined,
      onClick: function () { p.onLaunch(a); }, 'aria-label': 'Launch ' + a.name }, 'Launch');
    return h('article', { className: 'hl-card hl-app' + (on ? '' : ' off'), 'aria-disabled': on ? undefined : 'true' },
      h('div', { className: 'head' }, tile,
        h('div', { className: 'name' }, h(Typography, { variant: 'h3', component: 'h3' }, a.name),
          tags.length ? h('div', { className: 'tags' }, tags) : null)),
      h(Typography, { variant: 'p2', color: 'muted', className: 'desc' }, a.desc),
      a.sub ? h('div', { className: 'signal' }, h(Icon, { name: 'layers', color: 'light', style: { fontSize: 16, width: 16, height: 16 }, decorative: true }), h(Typography, { variant: 'p3', color: 'muted' }, a.sub)) : null,
      h('div', { className: 'actions' + (a.learn && on ? '' : ' one') },
        a.learn && on ? h(Button, { color: 'primary', variant: 'outlined', size: 'large', fullWidth: true, onClick: function () { openNew(a.learn); } }, 'Learn More') : null,
        launch));
  }

  function Attention(p) {
    var att = p.att, st = p.state;
    var body;
    if (st === 'loading') body = h('div', { style: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 } }, [0, 1, 2].map(function (i) { return h(Ghost, { key: i, variant: 'text', width: '100%', height: 20 }); }));
    else if (st === 'error') body = h('div', { style: { padding: 16 } }, h(AlertPanel, { severity: 'error', icon: 'warning', title: 'Tasks Did Not Load', description: p.error || 'The task list request failed. Open Diagnostics for the call log.' }));
    else if (!att.items.length) body = h(ContextLayout, { width: 'medium', size: 'compact', icon: 'done-check-tracked', iconColor: 'green', title: 'Nothing Needs You', description: 'No overdue, blocked or unassigned work in what you can see.' });
    else body = h('ul', null, att.items.slice(0, 4).map(function (it, i) {
      return h('li', { key: i },
        h('div', { className: 'txt' },
          h(Typography, { variant: 'h4' }, it.text),
          h('div', { className: 'meta' }, h(Tag, { color: SEV[it.sev], title: it.tag }), it.sample ? h(Tag, { color: 'slate', title: 'Sample' }) : null,
            h(Typography, { variant: 'p3', color: 'muted' }, it.app + ' · ' + it.when))),
        h(Button, { variant: 'outlined', color: 'primary', size: 'medium', onClick: function () { p.onAct(it); } }, it.action));
    }));
    return h('section', { className: 'hl-card hl-attn', 'aria-labelledby': 'attn-h' },
      h('div', { className: 'hl-panel-head' },
        h('div', { className: 't' }, h(Icon, { name: 'bell-notification', color: 'light', size: 'small', decorative: true }),
          h(Typography, { variant: 'h3', component: 'h2', id: 'attn-h' }, 'Needs Attention'),
          st === 'ok' ? h(Tag, { color: att.total ? 'red' : 'green', title: String(att.total) }) : null),
        h(Typography, { variant: 'p3', color: 'muted' }, att.sample ? 'Sample items: this app has no attention feed yet' : 'Your tasks and alerts across every app')),
      body,
      st === 'ok' && att.total ? h('div', { className: 'hl-panel-foot' },
        h(Button, { variant: 'ghost', color: 'primary', size: 'small', endIcon: 'arrow-forward', onClick: p.onViewAll }, 'View All ' + att.total + ' In ' + p.homeApp)) : null);
  }

  function Fermi(p) {
    var _q = useState(''), q = _q[0], setQ = _q[1];
    function ask(text) { p.onAsk(text); setQ(''); }
    return h('section', { className: 'hl-card hl-fermi', 'aria-labelledby': 'fermi-h' },
      h('div', { className: 'hl-panel-head' },
        h('div', { className: 't' }, h('span', { className: 'hl-fermi-mark' }, h(Icon, { name: 'star-ai-artificial-intelligence', color: 'primary', style: { fontSize: 18, width: 18, height: 18 }, decorative: true })),
          h(Typography, { variant: 'h3', component: 'h2', id: 'fermi-h' }, 'Ask Fermi')),
        h(Tag, { color: 'slate', title: 'Preview' })),
      h('div', { className: 'body' },
        h(Typography, { variant: 'p3', color: 'muted' }, 'Answers from what you can see, with links to the evidence. Anything that changes data comes back as a proposal for you to approve.'),
        h('div', { className: 'hl-stack', style: { gap: 8 } }, (PROMPTS[p.persona] || []).map(function (t) {
          return h('button', { key: t, type: 'button', className: 'hl-prompt', onClick: function () { ask(t); } },
            h(Icon, { name: 'arrow-forward', color: 'primary', style: { fontSize: 16, width: 16, height: 16 }, decorative: true }), t);
        })),
        h('form', { className: 'hl-ask', onSubmit: function (e) { e.preventDefault(); if (q.trim()) ask(q.trim()); } },
          h('label', { className: 'sr', htmlFor: 'fermi-q' }, 'Ask Fermi a question'),
          h('div', { style: { flex: 1, minWidth: 0 } }, h(TextInput, { id: 'fermi-q', name: 'fermi-q', value: q, onChange: setQ, placeholder: 'Ask about your studies, tasks or data', fullWidth: true, size: 'large' })),
          h(IconButton, { icon: 'send-message-share', color: 'primary', size: 'large', 'aria-label': 'Send to Fermi', onClick: function () { if (q.trim()) ask(q.trim()); } }))));
  }

  // ------------------------------------------------------------------ Reader Portal (full screen, Vision dark)
  function ReaderPortal(p) {
    var b = readerBuckets(p.tasks, p.me);
    var _t = useState('mine'), tab = _t[0], setTab = _t[1];
    var statusTag = function (t) {
      var d = daysTo(t.due_date);
      if (OPEN[t.status] && d != null && d < 0) return h(Tag, { color: 'red', title: 'Overdue' });
      if (t.status === 'in_progress') return h(Tag, { color: 'primary', title: 'In Progress' });
      if (t.status === 'completed') return h(Tag, { color: 'green', title: 'Complete' });
      if (t.status === 'blocked') return h(Tag, { color: 'slate', title: 'Blocked' });
      return h(Tag, { color: 'orange', title: 'To Do' });
    };
    function cols(kind) {
      return [
        { key: 'task_id', header: 'Task', noWrap: true, render: function (t) { return h('span', { className: 'rp-mono' }, t.task_id || t._id); } },
        { key: 'protocol_label', header: 'Protocol', render: function (t) { return t.protocol_label || '—'; } },
        { key: 'read', header: 'Read', noWrap: true, render: function (t) { return t.subcategory === 'adjudicator' ? 'Adjudication' : t.read_number ? 'Read ' + t.read_number : 'Read'; } },
        { key: 'status', header: 'Status', render: statusTag },
        { key: 'due_date', header: 'Due', noWrap: true, render: function (t) { return fmtDay(t.due_date); } },
        { key: 'priority', header: 'Priority', render: function (t) { return t.priority ? t.priority[0].toUpperCase() + t.priority.slice(1) : '—'; } },
        { key: 'act', header: h('span', { className: 'sr' }, 'Action'), align: 'right', render: function (t) {
          var u = viewerUrl(t);
          var label = kind === 'done' ? 'View' : t.status === 'in_progress' ? 'Resume' : kind === 'pool' ? 'Open' : 'Start Read';
          return h(Button, { size: 'small', variant: kind === 'done' ? 'outlined' : 'solid', color: 'primary', disabled: !u, endIcon: 'open',
            onClick: function () { if (u) openNew(u); } }, label);
        } }
      ];
    }
    function list(kind, data, empty) {
      return data.length ? h('div', { className: 'rp-table' }, h(Table, { columns: cols(kind), rows: data, rowKey: '_id' }))
        : h('div', { className: 'rp-table', style: { display: 'flex', justifyContent: 'center' } }, h(ContextLayout, { width: 'medium', icon: 'tasklist-to-do-checkmark', iconColor: 'primary', title: empty[0], description: empty[1] }));
    }
    var projects = Object.keys(b.mine.concat(b.pool).reduce(function (a, t) { if (t.protocol_label) a[t.protocol_label] = 1; return a; }, {}));
    return h('div', { className: 'rp vision-dark', 'data-mode': 'dark' },
      h('div', { className: 'rp-bar' },
        h('div', { className: 'grow' },
          h(AppIcon, { icon: 'reader-studies', color: 'gradient', size: 'medium', variant: 'static', 'aria-label': 'Reader Portal' }),
          h(Typography, { variant: 'h3', component: 'h1' }, 'Reader Portal'),
          projects.length ? h(Tag, { color: 'slate', title: projects.slice(0, 2).join(' · ') + (projects.length > 2 ? ' +' + (projects.length - 2) : '') }) : null,
          p.demo ? h(Tag, { color: 'orange', title: 'Demo Data' }) : h(Tag, { color: 'green', title: 'Live · Blinded' })),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
          !p.fs ? h(Button, { variant: 'outlined', color: 'primary', size: 'medium', startIcon: 'full-screen-zoom', onClick: p.enterFs }, 'Full Screen') : null,
          h(Button, { variant: 'outlined', color: 'slate', size: 'medium', startIcon: 'arrow-back', onClick: p.onExit }, 'Exit To Home'),
          h(Avatar, { content: 'initial', initial: p.userInitials, colorSeed: p.me || 'me', size: 'medium' }))),
      h('main', { className: 'rp-main' },
        h('div', { className: 'rp-kpis' },
          [['Overdue', b.overdue.length, 'red'], ['Due Within 2 Days', b.soon.length, 'orange'], ['In Progress', b.inProgress.length, 'primary'], ['Pool, Unclaimed', b.pool.length, 'typography']].map(function (k) {
            return h('div', { key: k[0], className: 'rp-kpi' }, h(Typography, { variant: 'h5', color: 'muted' }, k[0]), h('span', { className: 'n', style: { color: k[2] === 'typography' ? 'var(--typography-base)' : 'var(--' + k[2] + '-base)' } }, k[1]));
          })),
        h(Tabs, { value: tab, onChange: setTab },
          h(Tab, { value: 'mine', title: 'Mine · ' + b.mine.length }),
          h(Tab, { value: 'pool', title: 'Pool · ' + b.pool.length }),
          h(Tab, { value: 'done', title: 'Completed · ' + b.done.length }),
          h(TabPanel, { value: 'mine', padded: false }, h('div', { style: { paddingTop: 16 } }, list('mine', b.mine.slice().sort(function (x, y) { return String(x.due_date || '9').localeCompare(String(y.due_date || '9')); }), ['No Reads Assigned', 'Reads assigned to you appear here.']))),
          h(TabPanel, { value: 'pool', padded: false }, h('div', { style: { paddingTop: 16 } }, list('pool', b.pool, ['Pool Is Empty', 'Unclaimed reads in your pools appear here.']))),
          h(TabPanel, { value: 'done', padded: false }, h('div', { style: { paddingTop: 16 } }, list('done', b.done, ['No Completed Reads', 'Submitted reads appear here.'])))),
        h(Typography, { variant: 'p3', color: 'muted' }, 'Reads open in the viewer in a new tab. Subject, session and site labels are never requested or shown.')));
  }

  // ------------------------------------------------------------------ app
  function App() {
    var _c = useState({ state: 'connecting' }), conn = _c[0], setConn = _c[1];
    var _u = useState(null), user = _u[0], setUser = _u[1];
    var _p = useState(null), persona = _p[0], setPersona = _p[1];
    var _d = useState(null), detected = _d[0], setDetected = _d[1];
    var _o = useState(false), inactive = _o[0], setInactive = _o[1];
    var _t = useState({ state: 'loading', list: [] }), tasks = _t[0], setTasks = _t[1];
    var _v = useState('home'), view = _v[0], setView = _v[1];
    var _f = useState(false), fs = _f[0], setFs = _f[1];
    var _s = useState(null), snack = _s[0], setSnack = _s[1];
    var _g = useState(false), diag = _g[0], setDiag = _g[1];
    var snackT = useRef(null);

    function toast(title, description, severity) {
      setSnack({ title: title, description: description, severity: severity || 'info' });
      clearTimeout(snackT.current); snackT.current = setTimeout(function () { setSnack(null); }, 5000);
    }

    useEffect(function () {
      var onFs = function () { setFs(Boolean(document.fullscreenElement)); };
      document.addEventListener('fullscreenchange', onFs);
      return function () { document.removeEventListener('fullscreenchange', onFs); };
    }, []);

    function refresh(me) {
      return loadTasks().then(function (list) { setTasks({ state: 'ok', list: list, at: new Date() }); return list; },
        function (e) { setTasks({ state: 'error', list: [], error: errMsg(e) }); return []; });
    }

    useEffect(function () {
      connect().then(function () {
        setConn({ state: CONN.demo ? 'demo' : 'live' });
        return api('GET', '/api/users/self').then(function (u) {
          var me = u.email || u._id;
          var siteAdmin = u.root === true || (u.roles || []).indexOf('site_admin') >= 0;
          var nm = [u.firstname, u.lastname].filter(Boolean).join(' ') || me;
          setUser({ id: me, name: nm, initials: initials(nm), siteAdmin: siteAdmin });
          note('User ' + me + (siteAdmin ? ' (site admin)' : '') + '. Site roles: ' + JSON.stringify(u.roles || []));
          return refresh(me).then(function (list) {
            var mineCount = list.filter(function (t) { return assigneeId(t) === me; }).length;
            var det = siteAdmin ? 'admin' : mineCount ? 'reader' : 'dm';
            note('Detected persona: ' + det + ' (site admin ' + siteAdmin + ', ' + mineCount + ' reader tasks assigned).');
            setDetected(det); setPersona(det);
          });
        });
      }).catch(function (e) { note('ERROR ' + errMsg(e)); setConn({ state: 'error', error: errMsg(e) }); });
      var iv = setInterval(function () { if (CONN.ext || CONN.demo) loadTasks().then(function (list) { setTasks({ state: 'ok', list: list, at: new Date() }); }, function () {}); }, 60000);
      return function () { clearInterval(iv); };
    }, []);

    function enterFs() {
      var el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(function (e) { note('fullscreen refused: ' + errMsg(e)); toast('Full Screen Was Blocked', 'The frame refused full screen. The portal still opens here.', 'warning'); });
    }
    function exitPortal() {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
      setView('home');
    }
    function go(where, it) {
      if (where === 'reader') { setView('reader'); enterFs(); return; }
      if (where === 'data') {
        if (!CONN.origin) { toast('No Site Origin', 'Data Portal opens at <site>/upload/. Demo mode has no site.', 'warning'); return; }
        openNew(CONN.origin + '/upload/'); return;
      }
      if (where === 'sponsor') { toast('Sponsor View Is A Concept', 'There is no build yet. This card shows where it will launch from.', 'info'); return; }
      if (where === 'core') { if (CONN.origin) openNew(CONN.origin + '/'); else toast('No Site Origin', 'Demo mode has no site.', 'warning'); return; }
      if (where === 'exchange') { openNew('https://flywheel.io/gear-exchange/'); return; }
      if (where === 'tasks') { toast('Opens In Reading Ops', 'In the product this goes to the task admin view filtered to this item.', 'info'); return; }
    }
    function act(it) {
      note('Needs Attention action: ' + it.action + ' · ' + it.text);
      if (it.task) { var u = viewerUrl(it.task); if (u) openNew(u); else toast('No Viewer Link', 'Demo data has no site to open.', 'warning'); return; }
      go(it.go, it);
    }

    if (conn.state === 'connecting') return h('div', { className: 'hl', style: { display: 'grid', placeItems: 'center', minHeight: '100vh' } }, h(ProgressSpinner, { mode: 'indeterminate', size: 'medium', ariaLabel: 'Connecting to Flywheel' }));
    if (conn.state === 'error') return h('div', { className: 'hl', style: { display: 'grid', placeItems: 'center', minHeight: '100vh' } },
      h(ContextLayout, { width: 'medium', icon: 'earth-globe-fail', iconColor: 'orange', title: 'Not Connected', description: conn.error },
        h(Button, { color: 'primary', onClick: function () { location.hash = 'demo'; location.reload(); } }, 'Use Demo Data')));

    var me = user && user.id;
    if (view === 'reader') return h(R.Fragment, null,
      h(ReaderPortal, { tasks: tasks.list, me: me, userInitials: user ? user.initials : '?', demo: CONN.demo, fs: fs, enterFs: enterFs, onExit: exitPortal }),
      snack ? h(SnackbarContainer, null, h(Snackbar, { title: snack.title, description: snack.description, severity: snack.severity, showClose: true, onClose: function () { setSnack(null); } })) : null);

    var pid = persona || 'admin';
    var att = tasks.state === 'ok' ? attentionFor(pid, tasks.list, me) : { items: [], total: 0 };
    var apps = APPS.filter(function (a) { return inactive || a.roles.indexOf(pid) >= 0; })
      .sort(function (x, y) { var a = x.roles.indexOf(pid) >= 0, b = y.roles.indexOf(pid) >= 0; return a === b ? 0 : a ? -1 : 1; });
    var siteName = CONN.origin ? CONN.origin.replace('https://', '') : '';

    return h('div', { className: 'hl' },
      h('header', { className: 'hl-bar' },
        h('div', { className: 'grow' },
          h(Typography, { variant: 'h2', component: 'h1' }, 'Home'),
          h(Tag, { color: 'secondary', title: 'Launcher Harness' }),
          CONN.demo ? h(Tag, { color: 'orange', title: 'Demo Data' }) : h(Tag, { color: 'green', title: 'Live · ' + siteName + ' · Read-Only' })),
        h('div', { className: 'tools' },
          h(Typography, { variant: 'h5', color: 'muted', component: 'span' }, 'Preview As'),
          h(Select, { name: 'persona', value: pid, onChange: setPersona, width: 170, 'aria-label': 'Preview as persona' },
            PERSONAS.map(function (x) { return h(SelectItem, { key: x.id, value: x.id, title: x.label + (x.id === detected ? ' (You)' : '') }); })),
          h(Switch, { name: 'inactive', checked: inactive, onChange: setInactive, title: 'Show Other Apps Inactive' }),
          h(Tooltip, { title: 'Diagnostics', position: 'bottom' }, h(IconButton, { icon: 'code-text', color: 'slate', selected: diag, 'aria-label': 'Diagnostics', onClick: function () { setDiag(!diag); } })),
          h(Tooltip, { title: user ? user.name : '', position: 'bottom' }, h(Avatar, { content: 'initial', initial: user ? user.initials : '?', colorSeed: me || 'me' })))),
      h('main', { className: 'hl-main' },
        detected && pid !== detected ? h(AlertPanel, { severity: 'discover', icon: 'show-visible', title: 'Previewing As ' + personaLabel(pid),
          description: 'Apps and Needs Attention follow the ' + personaLabel(pid) + ' persona. Live task data is still what your own account can see.' }) : null,
        h('div', { className: 'hl-row' },
          h(Attention, { att: att, state: tasks.state, error: tasks.error, homeApp: HOME_APP[pid], onAct: act,
            onViewAll: function () { go(pid === 'reader' ? 'reader' : pid === 'uploader' ? 'data' : pid === 'sponsor' ? 'sponsor' : 'tasks'); } }),
          h(Fermi, { persona: pid, onAsk: function (q) { note('Fermi prompt: ' + q); toast('Fermi Is Not Connected Here', 'This panel previews the Fermi entry point. Answers arrive with the Loka assistant work.', 'info'); } })),
        h('section', { 'aria-labelledby': 'apps-h' },
          h(SectionTitle, { id: 'apps-h', icon: 'grid-layout' }, 'Apps'),
          h('div', { className: 'hl-apps' }, apps.map(function (a) {
            return h(AppCard, { key: a.id, app: a, on: a.roles.indexOf(pid) >= 0, onLaunch: function (x) { note('Launch ' + x.name); go(x.id); } });
          }))),
        h('div', { className: 'hl-links' },
          h('section', { 'aria-labelledby': 'sup-h' },
            h(SectionTitle, { id: 'sup-h', icon: 'question-circle' }, 'Support'),
            h('div', { className: 'hl-stack' },
              h('button', { type: 'button', className: 'hl-link', onClick: function () { openNew('https://docs.flywheel.io/'); } }, h(Icon, { name: 'documents-file', color: 'primary', size: 'small', decorative: true }), 'Flywheel Docs'),
              h('button', { type: 'button', className: 'hl-link', onClick: function () { openNew('https://docs.flywheel.io/'); } }, h(Icon, { name: 'message-chat-question-support', color: 'primary', size: 'small', decorative: true }), 'Flywheel Forum'))),
          pid === 'admin' ? h('section', { 'aria-labelledby': 'team-h' },
            h(SectionTitle, { id: 'team-h', icon: 'settings-gear' }, 'Team Settings'),
            h('div', { className: 'hl-stack' },
              h('button', { type: 'button', className: 'hl-link', onClick: function () { go('core'); } }, h(Icon, { name: 'user-group', color: 'primary', size: 'small', decorative: true }), 'Users'),
              h('button', { type: 'button', className: 'hl-link', onClick: function () { go('core'); } }, h(Icon, { name: 'settings-gear-square', color: 'primary', size: 'small', decorative: true }), 'Gears'),
              h('button', { type: 'button', className: 'hl-link', onClick: function () { toast('Apps And Access', 'Proposed: the site setting that maps each app to roles (launcher.other_apps, app → role IDs).', 'info'); } }, h(Icon, { name: 'grid-layout-9-square', color: 'primary', size: 'small', decorative: true }), 'Apps And Access'))) : null),
        diag ? h('section', { className: 'hl-card hl-diag', 'aria-labelledby': 'diag-h' },
          h('div', { className: 'hl-panel-head' }, h('div', { className: 't' }, h(Icon, { name: 'code-text', color: 'light', size: 'small', decorative: true }), h(Typography, { variant: 'h3', component: 'h2', id: 'diag-h' }, 'Diagnostics')),
            h(Typography, { variant: 'p3', color: 'muted' }, VERSION + ' · ' + tasks.list.length + ' tasks' + (tasks.at ? ' · updated ' + tasks.at.toLocaleTimeString() : ''))),
          h('pre', null, LOG.join('\n'))) : null),
      snack ? h(SnackbarContainer, null, h(Snackbar, { title: snack.title, description: snack.description, severity: snack.severity, showClose: true, onClose: function () { setSnack(null); } })) : null);
  }

  // ------------------------------------------------------------------ demo data (fictional, shaped like 23.x)
  var DEMO = (function () {
    var me = 'dana.reader@example.org';
    function iso(d) { var t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) + 'T00:00:00Z'; }
    var T = [], n = 0;
    function task(id, status, due, who, sub, rn) {
      n++; T.push({ _id: 'demo' + n, task_id: id, status: status, priority: n % 3 ? 'medium' : 'high', protocol_label: 'adjudication v1', due_date: iso(due), subcategory: sub || 'reader', read_number: rn || 1,
        assignee: who ? (who === 'pool' ? { type: 'staffing_pool', id: 'pool1' } : { type: 'user', id: who }) : null, parents: { project: 'demoProj', session: 'case' + id.split('-').slice(1, 3).join('') } });
    }
    task('R-3-4-1', 'todo', -1, me); task('R-3-5-1', 'in_progress', 1, me, 'reader', 2); task('R-3-5-2', 'todo', 2, me); task('R-3-6-1', 'todo', 8, me);
    task('R-3-7-1', 'todo', 5, 'pool'); task('R-3-8-1', 'todo', 6, 'pool'); task('R-3-9-1', 'todo', 7, 'pool');
    task('R-2-1-1', 'completed', -6, me); task('R-2-1-2', 'completed', -6, 'reader.two@example.org', 'reader', 2); task('A-2-1', 'blocked', 3, null, 'adjudicator');
    task('R-2-2-1', 'todo', -3, 'reader.two@example.org'); task('R-2-3-1', 'todo', 1, null);
    return {
      request: function (method, path) {
        return new Promise(function (res) { setTimeout(function () {
          if (path === '/api/users/self') return res({ _id: me, email: me, firstname: 'Dana', lastname: 'Reader', roles: [] });
          if (path === '/api/tasks/reader') return res({ results: T, total: T.length });
          res({});
        }, 250); });
      }
    };
  })();

  if (!V.Button) { document.getElementById('root').innerHTML = '<p style="padding:24px">The Vision component bundle did not load.</p>'; return; }
  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
