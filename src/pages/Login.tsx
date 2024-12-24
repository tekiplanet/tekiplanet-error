import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LoginForm } from "@/components/auth/LoginForm";
import { TwoFactorDialog } from "@/components/auth/TwoFactorDialog";
import { useAuthStore } from "@/store/useAuthStore";

// Debug type
type LoginMethod = (email: string, password: string) => Promise<void>;

interface LoginFormData {
  login: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [show2FA, setShow2FA] = React.useState(false);
  const [loginCredentials, setLoginCredentials] = React.useState<LoginFormData | null>(null);

  console.log('Auth store methods:', Object.keys(authStore));

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    try {
      const { login, password } = data;
      console.log('Attempting login with:', { login });
      
      const response = await authStore.login(login, password);
      console.log('Login response:', response);

      if (response.requires_2fa) {
        console.log('2FA required, showing dialog');
        setLoginCredentials(data);
        setShow2FA(true);
        return;
      }

      console.log('No 2FA required, proceeding with login');
      // Only show success and navigate if 2FA is not required
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      toast.error(errorMessage);
      console.error('Login error details:', error);
    }
  };

  const handle2FASubmit = async (code: string) => {
    if (!loginCredentials) return;

    try {
      console.log('Submitting 2FA code');
      const response = await authStore.login(loginCredentials.login, loginCredentials.password, code);
      console.log('2FA verification response:', response);
      
      // Only proceed if we got a successful response with token
      if (response.token && response.user) {
        setShow2FA(false);
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      throw error;
    }
  };

  // Only render login form if not authenticated
  if (isAuthenticated) {
    return null; // Prevents flashing of login form before redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <LoginForm onSubmit={handleLogin} />
      <TwoFactorDialog
        open={show2FA}
        onSubmit={handle2FASubmit}
      />
    </div>
  );
};

export default Login;