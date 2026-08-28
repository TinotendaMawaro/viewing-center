import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

const STORAGE_KEY = 'him_flame_registrations';
const AUTH_KEY = 'him_admin_auth';
const EMAIL_KEY = 'him_admin_email';
const ENCRYPTION_KEY = 'H1M-Fl@m3-2026-S3cur3';
const AUTHORIZED_ADMINS = ['holyhappy@gmail.com', 'tmawaro25@gmail.com', 'donaldmaminimini@gmail.com'];
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bppwrpxmlglfkhcjzicn.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GgKxsbGu_N9_wJ7umrgq8Q_ZQiww7tD';
const supabase = createClient(supabaseUrl, supabaseKey);
const categories = ['Family Viewing Centre', 'Homegroup Viewing Centre', 'Zonal Viewing Centre', 'College Viewing Centre'];

function encrypt(text) { return btoa([...text].map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))).join('')); }
function decrypt(encoded) { try { const text = atob(encoded); return [...text].map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))).join(''); } catch { return null; } }
function readLocal() { try { const value = localStorage.getItem(STORAGE_KEY); const decoded = value && decrypt(value); return decoded ? JSON.parse(decoded) : []; } catch { return []; } }
function writeLocal(registrations) { localStorage.setItem(STORAGE_KEY, encrypt(JSON.stringify(registrations))); }
function formatMessage(registration) { return `*HIM VIEWING CENTRE REGISTRATION*\n\n1. Centre Category: *${registration.category}*\n2. Centre Name: *${registration.name}*\n3. Country, Town/City/Village: *${registration.location}*\n4. Number of people who gather at the Centre: *${registration.total}*\n5. Genders, Adults, Children: *${registration.breakdown}*\n6. My Prayer Expectations: *${registration.prayerExpectations}*\nContact Number: *${registration.contact}*\n\n*One-Church-Many-Locations!*`; }

function App() {
  const [splash, setSplash] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);
  const [pendingView, setPendingView] = useState(null);
  const [view, setView] = useState('register');
  const [form, setForm] = useState({ category: '', name: '', location: '', total: '', contact: '', breakdown: '', prayerExpectations: '' });
  const [saved, setSaved] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [email, setEmail] = useState(sessionStorage.getItem(EMAIL_KEY) || '');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [transition, setTransition] = useState(null);

  useEffect(() => {
    if (splash && !splashExiting) {
      const timer = window.setTimeout(() => setSplashExiting(true), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [splash, splashExiting]);

  useEffect(() => {
    if (splashExiting) {
      const timer = window.setTimeout(() => {
        setSplash(false);
        setSplashExiting(false);
        if (pendingView) { setView(pendingView); setPendingView(null); }
      }, 3000);
      return () => window.clearTimeout(timer);
    }
  }, [splashExiting, pendingView]);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3200); };
  const showView = (nextView) => {
    if (splash && !splashExiting) { setPendingView(nextView); setSplashExiting(true); return; }
    if (splashExiting) return;
    if (nextView === 'admin' && sessionStorage.getItem(AUTH_KEY) !== 'true') { setView('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (nextView === view) return;
    const target = nextView === 'login' ? 'login' : nextView;
    setTransition(target);
    window.setTimeout(() => { setTransition(null); setView(nextView); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 700);
  };
  const loadRegistrations = async () => {
    const { data, error } = await supabase.from('Viwers').select('*').order('id', { ascending: false });
    const local = readLocal();
    if (error) {
      console.error('Supabase load error:', error);
      setRegistrations(local);
      notify('Unable to load cloud data. Showing local data.');
    } else setRegistrations(data || local);
  };
  useEffect(() => { const cleaned = readLocal().filter((item) => item.name && item.location && item.contact && !/test|dummy|placeholder/i.test(item.name)); writeLocal(cleaned); }, []);
  useEffect(() => { if (view === 'admin') loadRegistrations(); }, [view]);

  const submitRegistration = async (event) => {
    event.preventDefault();
    const registration = { id: Date.now().toString(), date: new Date().toLocaleDateString(), ...form, total: Number(form.total) || 0 };
    const local = [registration, ...readLocal()];
    writeLocal(local);
    setSaved(registration);
    setForm({ category: '', name: '', location: '', total: '', contact: '', breakdown: '', prayerExpectations: '' });
    notify('Viewing Centre successfully registered!');
    const cloudRecord = {
      id: registration.id,
      date: registration.date,
      category: registration.category,
      name: registration.name,
      location: registration.location,
      total: registration.total,
      contact: registration.contact,
      breakdown: registration.breakdown,
      prayer_expectations: registration.prayerExpectations
    };
    const { data, error } = await supabase.from('Viwers').insert([cloudRecord]);
    if (error) {
      console.error('Supabase insert error:', error);
      notify('Saved locally. Cloud sync failed: ' + (error.message || 'Unknown error'));
    } else {
      console.log('Cloud sync success:', data);
      notify('Viewing Centre registered and synced to cloud!');
    }
  };
  const login = (event) => { event.preventDefault(); const normalized = loginEmail.trim().toLowerCase(); if (!AUTHORIZED_ADMINS.includes(normalized)) { setLoginError('Access denied. This email is not authorized.'); return; } sessionStorage.setItem(AUTH_KEY, 'true'); sessionStorage.setItem(EMAIL_KEY, normalized); setEmail(normalized); setLoginError(''); setLoginEmail(''); notify('Access granted. Welcome, Admin!'); setView('admin'); };
  const logout = () => { sessionStorage.removeItem(AUTH_KEY); sessionStorage.removeItem(EMAIL_KEY); setEmail(''); setSplash(true); setView('register'); notify('Logged out successfully.'); };
  const remove = async (id) => { if (!window.confirm('Are you sure you want to delete this viewing centre record?')) return; const next = readLocal().filter((item) => item.id !== id); writeLocal(next); await supabase.from('Viwers').delete().eq('id', id); setRegistrations((items) => items.filter((item) => item.id !== id)); notify('Viewing Centre record deleted.'); };
  const clearAll = async () => { if (!window.confirm('Are you sure you want to clear all registered viewing centres?')) return; localStorage.removeItem(STORAGE_KEY); await supabase.from('Viwers').delete().neq('id', ''); setRegistrations([]); notify('All records cleared.'); };
  const exportCsv = () => { const rows = filtered.map((item) => [item.id, item.date, item.category, item.name, item.location, item.total, item.contact, item.breakdown, item.prayer_expectations || item.prayerExpectations || '']); if (!rows.length) return notify('No data available to export.'); const csv = ['ID,Date,Category,Name,Location,TotalPeople,Contact,Breakdown,Prayer Expectations', ...rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'him_flame_viewing_centres.csv'; link.click(); notify('CSV export successful!'); };
  const filtered = registrations.filter((item) => `${item.name} ${item.location} ${item.category} ${item.prayer_expectations || item.prayerExpectations || ''}`.toLowerCase().includes(query.toLowerCase().trim()));
  const stats = { centres: filtered.length, attendees: filtered.reduce((sum, item) => sum + (Number(item.total) || 0), 0), categories: new Set(filtered.map((item) => item.category)).size };
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const transitionTitle = { register: 'Registering...', admin: 'Loading Admin Portal...', login: 'Authenticating...' };

  return <div className="app-shell">
    {splash && <div className={`splash ${splashExiting ? 'transition' : ''}`}><img src="/catchfire2026.jpeg" alt="HIM Logo" /><span>Heartfelt International Ministries</span><h1>HIM <em>Online viewers registration</em></h1><p>One-Church | Many-Locations Mandate</p><button onClick={() => setSplashExiting(true)}><i className="fa-solid fa-fire" /> Enter portal</button></div>}
    {transition && <div className="splash transition"><img src="/catchfire2026.jpeg" alt="HIM Logo" /><span>Heartfelt International Ministries</span><h1>{transitionTitle[transition] || 'Loading...'}</h1><p>One-Church | Many-Locations Mandate</p></div>}
    <header><button className="brand" onClick={() => showView('register')}><img src="/catchfire2026.jpeg" alt="HIM Logo" /><span><strong>HIM Online viewers registration</strong><small>Heartfelt Ministries</small></span></button><nav><button className={view === 'register' ? 'active' : ''} onClick={() => showView('register')}><i className="fa-solid fa-pen-to-square" /> Register Centre</button><button className={view !== 'register' ? 'active' : ''} onClick={() => showView('admin')}><i className="fa-solid fa-lock" /> Admin Portal</button></nav></header>
    <main>
      {view === 'register' && <section className="stack"><div className="hero"><span>One-Church | Many-Locations</span><h2>Viewing Centre <em>Registration</em></h2><p>Fill in your viewing centre details below to register and generate your WhatsApp submission.</p></div><div className="panel"><div className="panel-heading"><div><h3>Centre Information Form</h3><p>Please provide accurate details as requested by the mandate.</p></div><img src="/catchfire2026.jpeg" alt="HIM Logo" /></div><form onSubmit={submitRegistration}><label>1. Centre Category *<select required value={form.category} onChange={update('category')}><option value="">-- Select Centre Category --</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>2. Centre Name *<input required value={form.name} onChange={update('name')} placeholder="e.g. Grace Flame Centre / Smith Family" /></label><label>3. Country, Town/City/Village *<input required value={form.location} onChange={update('location')} placeholder="e.g. Zimbabwe, Harare" /></label><div className="two-col"><label>4. Number of people who gather *<input required min="1" type="number" value={form.total} onChange={update('total')} /></label><label>5. Leader WhatsApp Contact *<input required value={form.contact} onChange={update('contact')} placeholder="e.g. +263770000000" /></label></div><label>6. Genders, Adults, Children breakdown *<textarea required rows="3" value={form.breakdown} onChange={update('breakdown')} /></label><label>7. My Prayer Expectations<textarea rows="3" value={form.prayerExpectations} onChange={update('prayerExpectations')} /></label><button className="primary" type="submit"><i className="fa-solid fa-paper-plane" /> Submit Registration</button></form>{saved && <div className="success"><h4>Registration Successful!</h4><p>Your viewing centre details have been saved successfully.</p><pre>{formatMessage(saved)}</pre><button onClick={() => setSaved(null)}>Register Another Centre</button></div>}</div></section>}
      {view === 'login' && <section className="login panel"><img src="/catchfire2026.jpeg" alt="HIM Logo" /><h2>Admin Authentication</h2><p>Enter your authorized email to access the admin portal.</p><form onSubmit={login}><label>Email Address *<input required type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="your.email@gmail.com" /></label>{loginError && <div className="error">{loginError}</div>}<button className="primary" type="submit"><i className="fa-solid fa-lock-open" /> Authenticate & Access</button></form><button className="link" onClick={() => showView('register')}>Back to Registration</button></section>}
      {view === 'admin' && <section className="stack"><div className="dashboard"><div><span>Management Dashboard</span><h2>HIM Online viewers registration</h2><p>Logged in as: <b>{email}</b></p></div><div className="actions"><button onClick={exportCsv}><i className="fa-solid fa-download" /> Export CSV</button><button onClick={clearAll}>Clear All</button><button onClick={logout}>Logout</button></div></div><div className="stats"><div><small>Total Centres</small><strong>{stats.centres}</strong></div><div><small>Total Attendees</small><strong>{stats.attendees}</strong></div><div><small>Categories Active</small><strong>{stats.categories}</strong></div></div><div className="panel table-panel"><div className="table-heading"><h3>Registered Centres Feed</h3><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, location..." /></div>{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Category & Name</th><th>Location</th><th>Attendees</th><th>Contact</th><th>Breakdown</th><th>Prayer Expectations</th><th /></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><b>{item.name}</b><small>{item.category}</small></td><td>{item.location}</td><td>{item.total} people</td><td>{item.contact}</td><td>{item.breakdown}</td><td>{item.prayer_expectations || item.prayerExpectations || ''}</td><td><button title="Message Leader" onClick={() => window.open(`https://wa.me/${item.contact.replace(/[^0-9]/g, '')}`, '_blank')}>WhatsApp</button><button title="Delete" onClick={() => remove(item.id)}>Delete</button></td></tr>)}</tbody></table></div> : <div className="empty">No viewing centres registered yet.</div>}</div></section>}
    </main><footer>Heartfelt International Ministries <small>One-Church-Many-Locations Mandate | HIM Online viewers registration</small></footer>{toast && <div className="toast">{toast}</div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
