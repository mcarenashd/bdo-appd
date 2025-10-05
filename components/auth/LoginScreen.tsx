import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MOCK_USERS } from '../../services/mockData';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, isLoading } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };
  
  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <img src="https://www.idu.gov.co/sites/default/files/2022-10/logo-bogota.png" className="h-12 mx-auto" alt="Bogota Logo" />
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Bitácora Digital de Obra
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión para acceder a tu proyecto
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input 
            label="Correo Electrónico"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
           <Input 
            label="Contraseña"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </div>
        </form>

        <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-semibold text-gray-700">Accesos de Prueba</h4>
            <p className="text-xs text-gray-500 mb-2">La contraseña para todos es: `password123`</p>
            <div className="grid grid-cols-2 gap-2">
                {MOCK_USERS.map(user => (
                    <button key={user.id} onClick={() => handleQuickLogin(user.email!)} className="text-xs text-left p-2 bg-white border rounded hover:bg-gray-100">
                        <p className="font-bold truncate">{user.fullName.split('(')[0]}</p>
                        <p className="text-gray-600">{user.projectRole}</p>
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;