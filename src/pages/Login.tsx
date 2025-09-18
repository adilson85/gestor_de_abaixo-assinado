import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Login: React.FC = () => {
  const { signIn, user, loading, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Redirecionar se já estiver logado E for admin
  useEffect(() => {
    if (user && !loading && isAdmin) {
      const next = searchParams.get('next') || '/dashboard';
      navigate(next, { replace: true });
    }
  }, [user, loading, isAdmin, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada');
      } else {
        setError('Erro ao fazer login. Tente novamente');
      }
    } else {
      // Login bem-sucedido, redirecionar
      const next = searchParams.get('next') || '/dashboard';
      navigate(next, { replace: true });
    }

    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <button
        onClick={toggleTheme}
        title="Alternar tema (claro/escuro)"
        className="fixed top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-700 shadow-lg border border-gray-200 hover:shadow-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        <span className="text-sm font-medium">{theme === 'dark' ? 'Tema: Escuro' : 'Tema: Claro'}</span>
      </button>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-lg">
            <LogIn size={32} className="text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Sistema de Digitalização
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Faça login para acessar o sistema de gestão de abaixo-assinados
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-300"
                  placeholder="Digite seu email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-300"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white" />
                  ) : (
                    <Eye size={20} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn size={20} />
                    Entrar
                  </div>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Sistema Administrativo</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Acesso restrito a administradores autorizados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};