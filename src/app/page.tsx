'use client';

import React, { useState, useEffect } from 'react';
import { User, dbClient } from '../lib/db';
import AuthScreen from '../components/AuthScreen';
import ParticipantDashboard from '../components/ParticipantDashboard';
import FacilitatorDashboard from '../components/FacilitatorDashboard';
import AdminDashboard from '../components/AdminDashboard';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is cached in local session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('mythos_current_user');
      if (cached) {
        setCurrentUser(JSON.parse(cached));
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mythos_current_user', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mythos_current_user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080f1e] text-mythos-sky font-semibold">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-mythos-sky border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs uppercase tracking-wider">Loading MyTHOS...</span>
        </div>
      </div>
    );
  }

  // Auth Screen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Role Routing
  if (currentUser.role === 'Admin') {
    return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === 'Facilitator') {
    return <FacilitatorDashboard user={currentUser} onLogout={handleLogout} />;
  }

  // Default: Participant
  return <ParticipantDashboard user={currentUser} onLogout={handleLogout} />;
}
