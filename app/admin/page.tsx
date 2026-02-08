'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Note: For a real app, use a Server Action to call supabase.auth.admin
  // This is a simplified view of user profiles if you have a public.profiles table
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-8">God View Dashboard</h1>
      <table className="w-full border-collapse bg-zinc-900 rounded-2xl overflow-hidden">
        <thead>
          <tr className="text-left bg-zinc-800">
            <th className="p-4">Email</th>
            <th className="p-4">Plan</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t border-zinc-800">
              <td className="p-4">{u.email}</td>
              <td className="p-4">
                <span className={`px-3 py-1 rounded-full text-xs ${u.plan === 'premium' ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                  {u.plan || 'free'}
                </span>
              </td>
              <td className="p-4">
                <button className="text-blue-400 hover:underline">Upgrade to Premium</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}