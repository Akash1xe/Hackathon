// File: c:\hackathon\src\components\DepartmentList.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch('/api/departments');
        
        if (!res.ok) {
          throw new Error('Failed to fetch departments');
        }
        
        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDepartments();
  }, []);
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {Array(3).fill().map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }
  
  if (departments.length === 0) {
    return (
      <div className="p-6">
        <div className="text-gray-500">No departments found</div>
        <Link href="/admin/departments/new" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
          Add a department
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <ul className="divide-y divide-gray-200">
        {departments.map((department) => (
          <li key={department._id} className="py-3">
            <Link href={`/admin/departments/${department._id}`} className="block hover:bg-gray-50">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-900">{department.name}</p>
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {department.categories && department.categories.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  {department.categories.map(c => formatCategory(c)).join(', ')}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatCategory(category) {
  return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}