'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleAuth = async (type: 'LOGIN' | 'SIGNUP') => {
    setLoading(true);
    setMessage('');
    const { error } = type === 'LOGIN' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(type === 'LOGIN' ? 'Success! Redirecting...' : 'Check your email for the link!');
      if (type === 'LOGIN') router.push('/');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage("Please enter your email address first.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset email sent! Check your inbox.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-black mb-2 italic tracking-tighter">SUITS ME RIGHT<span className="text-indigo-500">.AI</span></h1>
        <p className="text-gray-500 mb-8 text-sm font-medium">Find products that actually last.</p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-indigo-500 transition"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={() => handleAuth('LOGIN')} 
              disabled={loading} 
              className="bg-indigo-600 p-4 rounded-xl font-bold hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              Login
            </button>
            <button 
              onClick={() => handleAuth('SIGNUP')} 
              disabled={loading} 
              className="bg-white text-black p-4 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50 transition"
            >
              Sign Up
            </button>
          </div>

          <button 
            onClick={handleResetPassword}
            disabled={loading}
            className="text-[10px] text-gray-500 hover:text-indigo-400 mt-4 underline block mx-auto uppercase tracking-widest font-bold transition"
          >
            Forgot your password?
          </button>

          {message && (
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
              <p className="text-xs text-indigo-300 font-medium">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}