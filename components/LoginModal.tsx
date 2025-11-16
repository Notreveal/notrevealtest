import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, User, Key, Mail } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register, continueAsGuest } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError('');
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
       setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    }
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md m-4 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors">
          <X size={24} />
        </button>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-slate-100 mb-2">
            {isRegister ? 'Criar Conta' : 'Acessar Conta'}
          </h2>
          <p className="text-center text-slate-400 mb-6 text-sm">
            {isRegister ? 'Crie uma conta para salvar seu progresso na nuvem.' : 'Acesse sua conta para carregar seu plano de estudos.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/70 text-slate-300 p-3 pl-10 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors"
                required
              />
            </div>
            <div className="relative">
              <Key className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/70 text-slate-300 p-3 pl-10 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors"
                required
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button type="submit" className="w-full p-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-300 transform hover:scale-105">
              {isRegister ? 'Registrar' : 'Entrar'}
            </button>
          </form>

          <div className="text-center mt-4">
            <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-indigo-400 hover:underline">
              {isRegister ? 'Já tem uma conta? Entre aqui.' : 'Não tem uma conta? Registre-se.'}
            </button>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-500">ou</span>
            </div>
          </div>

          <button onClick={handleContinueAsGuest} className="w-full p-3 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors">
            Continuar como Convidado
          </button>
          <p className="text-xs text-slate-500 text-center mt-3">Seu progresso será salvo apenas neste navegador.</p>
        </div>
      </div>
       <style>{`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
          }
        `}</style>
    </div>
  );
};

export default LoginModal;