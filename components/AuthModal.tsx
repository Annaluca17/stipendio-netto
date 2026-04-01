import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight } from 'lucide-react';
import { authService } from '../services/auth';
import { User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Compila tutti i campi');
      return;
    }

    if (isLogin) {
      const user = authService.login(email, password);
      if (user) {
        onLoginSuccess(user);
        onClose();
      } else {
        setError('Email o password non validi');
      }
    } else {
      const result = authService.register(email, password);
      if ('error' in result) {
        setError(result.error);
      } else {
        onLoginSuccess(result);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">
            {isLogin ? 'Accedi al tuo account' : 'Crea un nuovo account'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                <input 
                  type="email" 
                  className="w-full pl-10 border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2"
                  placeholder="nome@esempio.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                <input 
                  type="password" 
                  className="w-full pl-10 border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg"
            >
              {isLogin ? 'Accedi' : 'Registrati'} <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="ml-1 text-indigo-600 font-medium hover:underline"
            >
              {isLogin ? 'Registrati ora' : 'Accedi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};