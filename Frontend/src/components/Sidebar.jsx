import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Droplet, LayoutList, FileText, Lock, LogOut, ChevronLeft, ChevronRight, ChevronDown, Layers, BookOpen, ShieldCheck, Wrench, BarChart2, Archive, Code2, Image } from 'lucide-react';

const NavItem = ({ icon: Icon, text, active, onClick, collapsed, className }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 mb-2 rounded-lg transition-all duration-200
      text-sm font-medium
      ${active
        ? 'bg-white/20 text-white shadow-sm'
        : 'text-gray-100 hover:bg-white/10'
      }
      ${className || ''}
    `}
  >
    <Icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
    {!collapsed && <span>{text}</span>}
  </button>
);

export default function Sidebar({ collapsed, setCollapsed, webAccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mastersOpen, setMastersOpen] = useState(() => location.pathname.startsWith('/masters'));

  useEffect(() => {
    if (location.pathname.startsWith('/masters')) {
      setMastersOpen(true);
    }
  }, [location.pathname]);

  const allowedScreens = useMemo(() => {
    return webAccess
      .filter(r => r.edit_only === 1 || r.read_only === 1)
      .map(r => r.screen);
  }, [webAccess]);

  const hasAccess = (screen) => {
    if (allowedScreens.length === 0) return true;
    return allowedScreens.includes(screen);
  };

  const navItems = [
    { screen: 'Tank details', text: 'Tank Master', path: '/', icon: LayoutList },
    { screen: 'Inspection Report', text: 'Inspection Report', path: '/inspection', icon: FileText },
    { screen: 'Generate PPT', text: 'Generate PPT', path: '/ppt', icon: BarChart2 },
  ];

  const mastersItems = [
    { screen: 'Tank Code/ISO Code', text: 'Tank Code/ISO Code', path: '/masters/tank-code', icon: Code2 },
    { screen: 'Regulations', text: 'Regulations', path: '/masters/regulations', icon: BookOpen },
    { screen: 'P&ID Drawings', text: 'P&ID Drawings', path: '/masters/drawings', icon: Image },
    { screen: 'Certificates', text: 'Certificates', path: '/masters/certificates', icon: ShieldCheck },
    { screen: 'Tank Frame & Outer Shell', text: 'Tank Frame', path: '/masters/tank-frame', icon: Wrench },
  ];

  const currentEmpId = sessionStorage.getItem('emp_id');
  const isRestrictedUser = currentEmpId === '1004';

  const filteredNavItems = isRestrictedUser ? [] : navItems.filter(item => hasAccess(item.screen));
  const filteredMastersItems = isRestrictedUser 
    ? mastersItems.filter(item => item.screen === 'Certificates')
    : mastersItems.filter(item => hasAccess(item.screen));

  const handleNavigation = (path) => {
    if (!path.startsWith('/masters')) {
      setMastersOpen(false);
    }
    navigate(path);
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`flex flex-col h-full text-white bg-[#546E7A] shadow-xl font-sans transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>

      {/* 1. Logo and Toggle */}
      <div className="flex items-center justify-between px-4 py-4 mb-2">
        {!collapsed && (
          <>
            <Droplet className="w-6 h-6 mr-2 fill-white text-white" />
            <span className="text-xl font-bold tracking-wide">i-Tank</span>
          </>
        )}
        {collapsed && <Droplet className="w-6 h-6 fill-white text-white mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white hover:bg-white/10 p-1 rounded"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Navigation */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {/* Masters Toggle Button - Visible if there are master items */}
        {filteredMastersItems.length > 0 && (
          <button
            onClick={() => setMastersOpen((prev) => !prev)}
            className={`flex w-full items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 mb-2 rounded-lg transition-all duration-200 text-sm font-medium ${mastersOpen ? 'bg-white/20 text-white shadow-sm' : 'text-gray-100 hover:bg-white/10'}`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {!collapsed && <span>Masters</span>}
            </div>
            {!collapsed && <ChevronDown className={`w-4 h-4 transition-transform ${mastersOpen ? 'rotate-180' : 'rotate-0'}`} />}
          </button>
        )}

        {/* Masters Submenu Items - Visible only when mastersOpen */}
        {mastersOpen &&
          filteredMastersItems
            .map(item => (
              <NavItem
                key={item.path}
                icon={item.icon}
                text={collapsed ? '' : item.text}
                active={isActive(item.path)}
                onClick={() => handleNavigation(item.path)}
                collapsed={collapsed}
                className="pl-8"
              />
            ))
        }


        {filteredNavItems
          .map(item => (
            <NavItem
              key={item.path}
              icon={item.icon}
              text={item.text}
              active={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              collapsed={collapsed}
            />
          ))
        }

        {/* Separator for User settings */}
        <div className="my-4 border-t border-white/20"></div>

        {!isRestrictedUser && (
          <NavItem
            icon={Lock}
            text="Change Password"
            active={location.pathname === '/change-password'}
            onClick={() => navigate('/change-password')}
            collapsed={collapsed}
          />
        )}
      </nav>

      {/* 3. Footer / Logout */}
      <div className="p-2 border-t border-white/10">
        <NavItem
          icon={LogOut}
          text="Logout"
          active={false}
          onClick={() => navigate('/logout')}
          collapsed={collapsed}
          className="hover:bg-red-500/20 text-red-100 hover:text-white"
        />
        {!collapsed && (
          <div className="text-xs text-gray-300 mt-2 text-center">
            iTank Version 1.0.0
          </div>
        )}
      </div>
    </div>
  );
}