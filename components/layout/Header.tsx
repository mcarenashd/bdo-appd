
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDownIcon, BellIcon, Bars3Icon, ChevronUpIcon } from '../icons/Icon';
import { User } from '../../types';

interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return null; // Don't render header if no user is logged in
  }

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center">
         <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 focus:outline-none lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 ml-4 hidden md:block">Bitácora Digital de Obra</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
          <span className="sr-only">View notifications</span>
          <BellIcon />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(prev => !prev)} 
            className="flex items-center space-x-2 focus:outline-none p-1 rounded-md hover:bg-gray-100"
          >
            <img className="h-9 w-9 rounded-full object-cover" src={user.avatarUrl} alt={user.name} />
            <div className='hidden sm:block text-left'>
                <div className="font-semibold text-sm text-gray-700">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
            </div>
            {isDropdownOpen 
              ? <ChevronUpIcon className="h-5 w-5 text-gray-400 hidden sm:block"/> 
              : <ChevronDownIcon className="h-5 w-5 text-gray-400 hidden sm:block"/>
            }
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Perfil</a>
              <button
                onClick={logout}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;