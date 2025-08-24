'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('🧪 Testing API connection...');
        const response = await fetch('http://localhost:8080/api/v1/listings?limit=3');
        console.log('🧪 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('🧪 API Result:', result);
        setData(result);
      } catch (err) {
        console.error('🧪 API Error:', err);
        setError(err instanceof Error ? err.message : 'API call failed');
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return <div className="p-8">Loading test...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">API Test Failed</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-green-600">API Test Success!</h1>
      <p className="text-gray-600">Found {data?.listings?.length || 0} listings</p>
      {data?.listings?.map((listing: any, index: number) => (
        <div key={index} className="mt-2 p-2 border">
          <h3 className="font-semibold">{listing.title}</h3>
          <p className="text-sm text-gray-500">{listing.location}</p>
        </div>
      ))}
    </div>
  );
}