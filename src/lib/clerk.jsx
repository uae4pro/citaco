import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

// Clerk configuration
const clerkPublishableKey = 'pk_test_ZHluYW1pYy1yb3VnaHktNzcuY2xlcmsuYWNjb3VudHMuZGV2JA';

if (!clerkPublishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// Clerk appearance customization
export const clerkAppearance = {
  layout: {
    socialButtonsVariant: 'iconButton',
    socialButtonsPlacement: 'bottom',
    showOptionalFields: false
  },
  elements: {
    formButtonPrimary: 
      'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
    card: 'shadow-lg',
    headerTitle: 'text-2xl font-bold text-slate-900',
    headerSubtitle: 'text-slate-600',
    socialButtonsBlockButton: 
      'border border-slate-200 hover:bg-slate-50',
    formFieldInput: 
      'border border-slate-200 focus:border-blue-500 focus:ring-blue-500',
    footerActionLink: 'text-blue-600 hover:text-blue-700'
  },
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#1e293b',
    borderRadius: '0.5rem'
  }
};

// Custom Clerk Provider wrapper
export function CustomClerkProvider({ children }) {
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}

export { clerkPublishableKey };
export default CustomClerkProvider;
