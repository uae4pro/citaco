import React from 'react';
import { useAuth } from '@/hooks/useClerkAuth.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Lock } from 'lucide-react';

export default function ProtectedRoute({ children, requireAdmin = false, fallback = null }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="max-w-md mx-auto mt-8">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You need to sign in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Authenticated but not admin (when admin is required)
  if (requireAdmin && user?.role !== 'admin') {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="max-w-md mx-auto mt-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. Admin access required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // All checks passed, render children
  return children;
}
