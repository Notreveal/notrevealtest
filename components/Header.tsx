import React from 'react';
import { LayoutTemplate, User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <header className="bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <LayoutTemplate className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              AI Edital Verticalizer
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn && user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-200">{user.email}</span>
                </div>
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </>
            ) : (
              <button 
                onClick={onLoginClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
              >
                <LogIn size={16} />
                Login / Registrar
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
