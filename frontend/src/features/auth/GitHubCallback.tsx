import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { githubAuthApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export const GitHubCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    if (!code) {
      navigate('/login');
      return;
    }

    githubAuthApi.login(code)
      .then(async (res) => {
        await login(res.data.access_token);
        navigate('/dashboard');
      })
      .catch(() => {
        navigate('/login?error=github-login-failed');
      });
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Signing in with GitHub...</p>
      </div>
    </div>
  );
};
