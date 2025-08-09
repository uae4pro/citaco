import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">CITACO</h1>
          <p className="text-slate-600">Sign in to your account</p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
            forceRedirectUrl="/"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-xl border-0 w-full",
                headerTitle: "text-2xl font-bold text-slate-900",
                headerSubtitle: "text-slate-600",
                socialButtonsBlockButton: "border border-slate-200 hover:bg-slate-50 transition-colors",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors",
                formFieldInput: "border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                identityPreviewText: "text-slate-700",
                identityPreviewEditButton: "text-blue-600 hover:text-blue-700"
              },
              variables: {
                colorPrimary: "#2563eb",
                colorBackground: "#ffffff",
                colorInputBackground: "#ffffff",
                colorInputText: "#1e293b",
                borderRadius: "0.5rem"
              }
            }}
          />
        </div>

        {/* Back to Home Link */}
        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>© 2024 AutoParts Store. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
