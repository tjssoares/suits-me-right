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
<button 
  onClick={async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setMessage(error ? error.message : "Password reset email sent!");
  }} 
  className="text-xs text-gray-500 hover:text-white mt-4 underline block mx-auto"
>
  Forgot your password?
</button>

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl">
        <h1 className="text-3xl font-black mb-2 italic">SUITS ME RIGHT.AI</h1>
        <p className="text-gray-500 mb-8 text-sm">Save your habits. Find better products.</p>
        
        <div className="space-y-4">
          <input 
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-indigo-500"
          />
          <input 
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-indigo-500"
          />
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button onClick={() => handleAuth('LOGIN')} disabled={loading} className="bg-indigo-600 p-4 rounded-xl font-bold hover:bg-indigo-500 disabled:opacity-50">Login</button>
            <button onClick={() => handleAuth('SIGNUP')} disabled={loading} className="bg-white text-black p-4 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50">Sign Up</button>
          </div>
          {message && <p className="text-center text-xs mt-4 text-indigo-400">{message}</p>}
        </div>
      </div>
    </div>
  );
}