import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/store/auth-store';
import ShaderBackground from '@/components/ui/shader-background';

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <ShaderBackground />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">FinTrack</h1>
          <p className="text-white/70 mt-1">Personal Finance Manager</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
