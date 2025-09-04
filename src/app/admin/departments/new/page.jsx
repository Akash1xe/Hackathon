// File: c:\hackathon\src\app\admin\departments\new\page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewDepartmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categories: [],
    contactEmail: '',
    contactPhone: '',
    active: true
  });
  
  const categoryOptions = [
    { value: 'pothole', label: 'Pothole' },
    { value: 'streetlight', label: 'Streetlight' },
    { value: 'trash', label: 'Trash/Debris' },
    { value: 'graffiti', label: 'Graffiti' },
    { value: 'water_leak', label: 'Water Leak' },
    { value: 'other', label: 'Other' }
  ];
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, value]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat !== value)
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create department');
      }
      
      const department = await response.json();
      
      // Redirect to the admin dashboard
      router.push('/admin');
    } catch (error) {
      console.error('Error creating department:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Department</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Department Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g. Public Works Department"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Department description"
            />
          </div>
          
          <div className="mb-6">
            <span className="block text-gray-700 text-sm font-bold mb-2">
              Categories
            </span>
            <div className="grid grid-cols-2 gap-2">
              {categoryOptions.map((category) => (
                <div key={category.value} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category.value}`}
                    name="categories"
                    value={category.value}
                    checked={formData.categories.includes(category.value)}
                    onChange={handleCategoryChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`category-${category.value}`} className="ml-2 block text-sm text-gray-700">
                    {category.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="contactEmail" className="block text-gray-700 text-sm font-bold mb-2">
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="department@example.com"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="contactPhone" className="block text-gray-700 text-sm font-bold mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="(123) 456-7890"
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-indigo-500 hover:text-indigo-700">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}