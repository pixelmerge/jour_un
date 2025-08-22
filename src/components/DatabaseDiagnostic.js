'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthProvider';

export default function DatabaseDiagnostic() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnosticResults = [];

    // Test 1: Basic connection
    try {
      const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
      diagnosticResults.push({
        test: 'Database Connection',
        status: error ? '❌ FAILED' : '✅ SUCCESS',
        details: error ? error.message : `Connected successfully`
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Database Connection',
        status: '❌ ERROR',
        details: err.message
      });
    }

    // Test 2: User authentication
    diagnosticResults.push({
      test: 'User Authentication',
      status: user ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED',
      details: user ? `User ID: ${user.id}` : 'No user logged in'
    });

    // Test 3: Try to fetch user profile (if authenticated)
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url, onboarding_complete')
          .eq('id', user.id)
          .single();

        diagnosticResults.push({
          test: 'User Profile Fetch',
          status: error ? '❌ FAILED' : '✅ SUCCESS',
          details: error ? error.message : `Profile found: ${data.full_name || 'No name'}`
        });
      } catch (err) {
        diagnosticResults.push({
          test: 'User Profile Fetch',
          status: '❌ ERROR',
          details: err.message
        });
      }
    }

    // Test 4: Try to check table structure
    try {
      const { data, error } = await supabase.rpc('get_table_info', { table_name: 'user_profiles' });
      diagnosticResults.push({
        test: 'Table Structure Check',
        status: error ? '❌ FAILED' : '✅ SUCCESS',
        details: error ? error.message : 'Table structure accessible'
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Table Structure Check',
        status: '⚠️ SKIPPED',
        details: 'RPC function not available (this is normal)'
      });
    }

    // Test 5: Test other tables
    const tables = ['food_entries', 'sleep_entries', 'activity_entries'];
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        diagnosticResults.push({
          test: `${table} Table`,
          status: error ? '❌ FAILED' : '✅ SUCCESS',
          details: error ? error.message : 'Table accessible'
        });
      } catch (err) {
        diagnosticResults.push({
          test: `${table} Table`,
          status: '❌ ERROR',
          details: err.message
        });
      }
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [user]);

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9',
      fontFamily: 'monospace'
    }}>
      <h2>🔍 Database Diagnostics</h2>
      <button 
        onClick={runDiagnostics} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          marginBottom: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Running...' : 'Refresh Diagnostics'}
      </button>
      
      {results.map((result, index) => (
        <div key={index} style={{ 
          marginBottom: '10px', 
          padding: '10px', 
          backgroundColor: 'white', 
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {result.status} {result.test}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {result.details}
          </div>
        </div>
      ))}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
        <strong>Next Steps:</strong>
        <ul>
          <li>If connection fails: Check your .env.local file</li>
          <li>If tables are missing: Run setup.sql in Supabase SQL Editor</li>
          <li>If user not authenticated: Make sure you're logged in</li>
          <li>If profile fetch fails: Check RLS policies and triggers</li>
        </ul>
      </div>
    </div>
  );
}
