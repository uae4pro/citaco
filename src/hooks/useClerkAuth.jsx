import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useState, useEffect, createContext, useContext } from 'react';
import { supabaseHelpers } from '@/lib/supabase';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export function ClerkAuthProvider({ children }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken, signOut } = useClerkAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sync Clerk user with Supabase user profile
  useEffect(() => {
    if (clerkLoaded) {
      console.log('🔄 Clerk loaded, starting sync. User:', clerkUser?.id);
      syncUserProfile();
    }
  }, [clerkUser, clerkLoaded]);

  // Force sync when user changes
  useEffect(() => {
    if (clerkUser && clerkLoaded) {
      console.log('👤 Clerk user changed, forcing sync:', clerkUser.id);
      syncUserProfile();
    }
  }, [clerkUser?.id]);

  const syncUserProfile = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting user sync for:', clerkUser?.id);

      if (!clerkUser) {
        console.log('❌ No Clerk user found');
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      console.log('👤 Clerk user data:', {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: clerkUser.fullName || clerkUser.firstName
      });

      // Check if user exists in Supabase
      console.log('🔍 Checking if user exists in Supabase...');
      let supabaseUser = await supabaseHelpers.users.getByClerkId(clerkUser.id);
      
      if (!supabaseUser) {
        console.log('🆕 User not found, creating new user in Supabase...');
        // Create new user in Supabase
        const userData = {
          clerk_user_id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: clerkUser.fullName || clerkUser.firstName || 'User',
          role: 'customer', // Default role
          is_active: true,
          email_verified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };

        console.log('📝 Creating user with data:', userData);
        supabaseUser = await supabaseHelpers.users.create(userData);
        console.log('✅ Created new user in Supabase:', supabaseUser);
      } else {
        // Update existing user with latest Clerk data
        const updateData = {
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: clerkUser.fullName || clerkUser.firstName || supabaseUser.name,
          email_verified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          last_login: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };

        supabaseUser = await supabaseHelpers.users.update(clerkUser.id, updateData);
        console.log('✅ Updated user in Supabase:', supabaseUser);
      }

      setUser(supabaseUser);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('❌ Error syncing user profile:', error);
      console.error('❌ Full error details:', error.message, error.stack);
      // Still set authenticated if Clerk user exists
      if (clerkUser) {
        console.log('⚠️ Using fallback user data due to sync error');
        setUser({
          id: clerkUser.id,
          clerk_user_id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: clerkUser.fullName || clerkUser.firstName || 'User',
          role: 'customer'
        });
        setIsAuthenticated(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (!clerkUser) throw new Error('No authenticated user');
      
      const updatedUser = await supabaseHelpers.users.update(clerkUser.id, {
        ...profileData,
        updated_date: new Date().toISOString()
      });
      
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const getAuthToken = async () => {
    try {
      return await getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    user,
    clerkUser,
    isLoading,
    isAuthenticated,
    logout,
    updateProfile,
    getAuthToken,
    syncUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a ClerkAuthProvider');
  }
  return context;
}

export default useAuth;
