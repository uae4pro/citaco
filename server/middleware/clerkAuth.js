import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { User } from '../models/index.js';

// Clerk secret key
const clerkSecretKey = process.env.CLERK_SECRET_KEY || 'sk_test_xxNYHW8XPDqoBgApdZZglZPq7t1T0ocFWIxN7tydrN';

if (!clerkSecretKey) {
  throw new Error('Missing Clerk Secret Key');
}

// Middleware to verify Clerk JWT token and sync user
export const requireClerkAuth = ClerkExpressRequireAuth({
  secretKey: clerkSecretKey,
  onError: (error) => {
    console.error('Clerk auth error:', error);
    return {
      status: 401,
      message: 'Unauthorized - Invalid or missing authentication token'
    };
  }
});

// Middleware to sync Clerk user with Supabase user profile
export const syncClerkUser = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'No authenticated user' });
    }

    const clerkUserId = req.auth.userId;
    const clerkUser = req.auth.user;

    // Check if user exists in our database
    let user = await User.getByClerkId(clerkUserId);

    if (!user) {
      // Create new user in database
      const userData = {
        clerk_user_id: clerkUserId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
        name: clerkUser?.fullName || clerkUser?.firstName || 'User',
        role: 'customer', // Default role
        is_active: true,
        email_verified: clerkUser?.emailAddresses?.[0]?.verification?.status === 'verified',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      user = await User.create(userData);
      console.log('✅ Created new user in database:', user.email);
    } else {
      // Update existing user with latest Clerk data
      const updateData = {
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || user.email,
        name: clerkUser?.fullName || clerkUser?.firstName || user.name,
        email_verified: clerkUser?.emailAddresses?.[0]?.verification?.status === 'verified',
        last_login: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      user = await User.update(user.id, updateData);
      console.log('✅ Updated user in database:', user.email);
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('❌ Error syncing Clerk user:', error);
    res.status(500).json({ error: 'Failed to sync user profile' });
  }
};

// Check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalClerkAuth = async (req, res, next) => {
  try {
    // Try to get Clerk user if token is present
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Use Clerk to verify token
      const clerkAuth = ClerkExpressRequireAuth({
        secretKey: clerkSecretKey,
        onError: () => null // Don't throw error for optional auth
      });

      // Apply Clerk auth middleware
      clerkAuth(req, res, (error) => {
        if (!error && req.auth?.userId) {
          // Sync user if authentication succeeded
          syncClerkUser(req, res, next);
        } else {
          // Continue without user context
          next();
        }
      });
    } else {
      // No token provided, continue without user context
      next();
    }
  } catch (error) {
    console.log('Optional Clerk auth failed:', error.message);
    next(); // Continue without user context
  }
};

// Helper function to get user from Clerk ID
export const getUserByClerkId = async (clerkUserId) => {
  try {
    return await User.getByClerkId(clerkUserId);
  } catch (error) {
    console.error('Error getting user by Clerk ID:', error);
    return null;
  }
};

export default {
  requireClerkAuth,
  syncClerkUser,
  requireAdmin,
  optionalClerkAuth,
  getUserByClerkId
};
