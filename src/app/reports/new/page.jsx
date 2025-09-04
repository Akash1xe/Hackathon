// File: c:\hackathon\src\app\reports\new\page.jsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: {
      coordinates: [0, 0],
      address: ''
    },
    priority: 'medium',
    images: []
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'address') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          address: value
        }
      }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: [position.coords.longitude, position.coords.latitude]
            }
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Failed to get your location. Please enter the address manually.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser. Please enter the address manually.");
    }
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadingImage(true);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      setUploadedImages(prev => [...prev, data.url]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, data.url]
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create report');
      }
      
      const report = await response.json();
      
      // Redirect to the newly created report
      router.push(`/reports/${report._id}`);
    } catch (error) {
      console.error('Error creating report:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Report</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
              Report Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Brief title describing the issue"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Detailed description of the issue"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select a category</option>
              <option value="pothole">Pothole</option>
              <option value="streetlight">Streetlight</option>
              <option value="trash">Trash/Debris</option>
              <option value="graffiti">Graffiti</option>
              <option value="water_leak">Water Leak</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Location *
            </label>
            <div className="flex flex-col space-y-3">
              <button
                type="button"
                onClick={handleGetLocation}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Use My Current Location
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="longitude" className="block text-gray-700 text-xs mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    name="location.coordinates.0"
                    value={formData.location.coordinates[0]}
                    onChange={handleChange}
                    step="any"
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="latitude" className="block text-gray-700 text-xs mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    name="location.coordinates.1"
                    value={formData.location.coordinates[1]}
                    onChange={handleChange}
                    step="any"
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="address" className="block text-gray-700 text-xs mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.location.address}
                  onChange={handleChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Full address of the issue"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="priority" className="block text-gray-700 text-sm font-bold mb-2">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Images
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingImage}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
            
            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative">
                    <img src={url} alt="Uploaded" className="h-24 w-full object-cover rounded-md" />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-indigo-500 hover:text-indigo-700">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}