import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './admin.css';

const NAV = [
  { to: '/admin',                  label: 'Overview',          end: true },
  { to: '/admin/students',         label: 'Students' },
  { to: '/admin/trainers',         label: 'Trainers' },
  { to: '/admin/course-manager',   label: 'Course Manager' },
  { to: '/admin/home-classes',     label: 'Home Free Classes' },
  { to: '/admin/live-classes',     label: 'Live Classes' },
  { to: '/admin/sessions',              label: 'Sessions & Calls' },
  { to: '/admin/educator-applications', label: 'Educator Applications' },
  { to: '/admin/transactions',          label: 'Transactions' },
  { to: '/admin/payouts',               label: 'Trainer Payouts' },
  { to: '/admin/permissions',           label: 'Permissions' },
  { to: '/admin/reports',              label: 'Reports' },
];

const TITLES: Record<string, string> = {
  '/admin':                  'Overview',
  '/admin/students':         'Students',
  '/admin/trainers':         'Trainers',
  '/admin/course-manager':   'Course Manager',
  '/admin/home-classes':     'Home Free Classes',
  '/admin/live-classes':     'Live Classes',
  '/admin/sessions':              'Sessions & Calls',
  '/admin/educator-applications': 'Educator Applications',
  '/admin/transactions':          'Transactions',
  '/admin/payouts':               'Trainer Payouts',
  '/admin/permissions':           'Permissions',
  '/admin/reports':              'Reports',
};

const ICONS: Record<string, string> = {
  'Overview': '▣', 'Students': '👥', 'Trainers': '🎓', 'Courses': '📚',
  'Course Manager': '⚙️', 'Home Free Classes': '🎬', 'Live Classes': '📡', 'Sessions & Calls': '📋',
  'Educator Applications': '🎓', 'Transactions': '₹', 'Trainer Payouts': '💸', 'Permissions': '🔐', 'Reports': '📊',
};

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const title = TITLES[location.pathname] ?? 'Admin';
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'A';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="adm-wrapper">
      <div className={`adm-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`adm-sidebar ${open ? 'open' : ''}`}>
        <div className="adm-brand">
          <div className="adm-brand-icon">🧠</div>
          <div className="adm-brand-text">
            <span>BSH Admin</span>
            <span>Dashboard</span>
          </div>
        </div>

        <nav className="adm-nav">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setOpen(false)}
            >
              <span style={{ width: 18, textAlign: 'center' }}>{ICONS[item.label]}</span>
              {item.label}
            </NavLink>
          ))}
          <div className="adm-nav-divider" />
          <button className="adm-nav-btn" onClick={() => navigate('/')}>
            <span>🏠</span> Back to Home
          </button>
          <button className="adm-nav-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-av">{initials}</div>
          <div>
            <div className="adm-av-name">{user?.name ?? 'Admin'}</div>
            <div className="adm-av-role">Administrator</div>
          </div>
        </div>
      </aside>

      <main className="adm-main">
        <div className="adm-topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="adm-hamburger" onClick={() => setOpen(true)}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="adm-topbar-title">{title}</span>
          </div>
          <span className="adm-role-pill">Admin</span>
        </div>

        <div className="adm-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
