// File: c:\hackathon\src\components\admin\AdminMapFilters.jsx
export default function AdminMapFilters({ filters, onChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };
  
  return (
    <div className="flex flex-wrap gap-4">
      {/* Status filter */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="in_review">In Review</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      {/* Category filter */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={filters.category}
          onChange={handleChange}
          className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          <option value="pothole">Pothole</option>
          <option value="streetlight">Streetlight</option>
          <option value="trash">Trash</option>
          <option value="graffiti">Graffiti</option>
          <option value="water_leak">Water Leak</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      {/* Time range filter */}
      <div>
        <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1">
          Time Range
        </label>
        <select
          id="days"
          name="days"
          value={filters.days}
          onChange={handleChange}
          className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
          <option value="0">All time</option>
        </select>
      </div>
      
      {/* Map display type */}
      <div>
        <label htmlFor="mapType" className="block text-sm font-medium text-gray-700 mb-1">
          Display Type
        </label>
        <select
          id="mapType"
          name="mapType"
          value={filters.mapType}
          onChange={handleChange}
          className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="markers">Markers</option>
          <option value="clusters">Clusters</option>
          <option value="heatmap">Heat Map</option>
        </select>
      </div>
    </div>
  );
}