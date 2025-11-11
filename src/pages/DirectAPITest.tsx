import React, { useState, useEffect } from 'react';

const DirectAPITest: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [apiData, setApiData] = useState<any>(null);
  const [cacheData, setCacheData] = useState<any>(null);
  const [loading, setLoading] = useState<string>('');

  useEffect(() => {
    // Auto-load token
    const storedToken = localStorage.getItem('authToken');
    setToken(storedToken || 'No token found');
  }, []);

  const testAPI = async () => {
    setLoading('api');
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        setApiData({ error: `API Error: ${response.status}` });
        return;
      }

      const data = await response.json();
      const students = data.users?.filter((u: any) => u.role === 'student') || [];
      
      setApiData({
        total: data.users?.length,
        students: students,
        sectionDist: students.reduce((acc: any, s: any) => {
          const section = s.section || 'UNDEFINED';
          acc[section] = (acc[section] || 0) + 1;
          return acc;
        }, {})
      });
    } catch (error: any) {
      setApiData({ error: error.message });
    } finally {
      setLoading('');
    }
  };

  const checkCache = () => {
    const cached = localStorage.getItem('students');
    if (!cached) {
      setCacheData({ error: 'No students in localStorage' });
      return;
    }

    try {
      const students = JSON.parse(cached);
      setCacheData({
        total: students.length,
        students: students,
        sectionDist: students.reduce((acc: any, s: any) => {
          const section = s.section || 'UNDEFINED';
          acc[section] = (acc[section] || 0) + 1;
          return acc;
        }, {})
      });
    } catch (error: any) {
      setCacheData({ error: error.message });
    }
  };

  const clearCache = () => {
    if (confirm('Clear ALL cache and reload?')) {
      localStorage.removeItem('students');
      localStorage.removeItem('studentElectives');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🔍 DIRECT API RAW DATA TEST</h1>

      {/* Token */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Auth Token</h2>
        <div className={`p-4 rounded ${token.includes('No token') ? 'bg-red-900' : 'bg-green-900'}`}>
          <pre className="text-sm overflow-x-auto">{token.substring(0, 100)}...</pre>
        </div>
      </div>

      {/* API Test */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 2: Call API Directly</h2>
        <button
          onClick={testAPI}
          disabled={loading === 'api'}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded mb-4"
        >
          {loading === 'api' ? '⏳ Loading...' : '🚀 Call /api/users'}
        </button>

        {apiData && (
          <div className="mt-4">
            {apiData.error ? (
              <div className="bg-red-900 p-4 rounded">{apiData.error}</div>
            ) : (
              <div>
                <div className="bg-green-900 p-4 rounded mb-4">
                  <p>✅ API Response</p>
                  <p>Total users: {apiData.total}</p>
                  <p>Students: {apiData.students?.length}</p>
                  <p>Section distribution: {JSON.stringify(apiData.sectionDist)}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold">Students with sections:</p>
                  {apiData.students?.slice(0, 5).map((s: any, i: number) => (
                    <div key={i} className="bg-gray-700 p-3 rounded">
                      <p className="font-medium">{i + 1}. {s.name}</p>
                      <p>Section: <span className={s.section ? 'text-green-400' : 'text-red-400'}>
                        {s.section ? `✅ "${s.section}"` : '❌ MISSING'}
                      </span></p>
                      <p className="text-sm text-gray-400">Email: {s.email}</p>
                    </div>
                  ))}
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-400">Show raw JSON</summary>
                  <pre className="bg-black p-4 rounded mt-2 overflow-x-auto text-xs">
                    {JSON.stringify(apiData.students?.[0], null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cache Test */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 3: Check localStorage</h2>
        <button
          onClick={checkCache}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded mb-4"
        >
          📦 Check Cached Students
        </button>

        {cacheData && (
          <div className="mt-4">
            {cacheData.error ? (
              <div className="bg-yellow-900 p-4 rounded">{cacheData.error}</div>
            ) : (
              <div>
                <div className="bg-green-900 p-4 rounded mb-4">
                  <p>✅ LocalStorage Data</p>
                  <p>Total students: {cacheData.total}</p>
                  <p>Section distribution: {JSON.stringify(cacheData.sectionDist)}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold">Cached students:</p>
                  {cacheData.students?.slice(0, 5).map((s: any, i: number) => (
                    <div key={i} className="bg-gray-700 p-3 rounded">
                      <p className="font-medium">{i + 1}. {s.name}</p>
                      <p>Section: <span className={s.section ? 'text-green-400' : 'text-red-400'}>
                        {s.section ? `✅ "${s.section}"` : '❌ UNDEFINED'}
                      </span></p>
                      <p className="text-sm text-gray-400">Email: {s.email}</p>
                    </div>
                  ))}
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-400">Show raw cached JSON</summary>
                  <pre className="bg-black p-4 rounded mt-2 overflow-x-auto text-xs">
                    {JSON.stringify(cacheData.students?.[0], null, 2)}
                  </pre>
                </details>

                <button
                  onClick={clearCache}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded mt-4"
                >
                  🗑️ Clear Cache & Reload
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📝 Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Make sure you're logged in</li>
          <li>Click "Call /api/users" to see RAW API data</li>
          <li>Click "Check Cached Students" to see localStorage</li>
          <li>Compare the two - sections should MATCH!</li>
        </ol>
      </div>
    </div>
  );
};

export default DirectAPITest;
