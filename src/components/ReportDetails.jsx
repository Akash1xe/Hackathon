// File: c:\hackathon\src\components\ReportDetails.jsx
import { format } from 'date-fns';

export default function ReportDetails({ report }) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
          <div className="mt-2 flex items-center">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(report.category)}`}>
              {formatCategory(report.category)}
            </span>
            <span className={`ml-3 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
              {formatStatus(report.status)}
            </span>
            <span className={`ml-3 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
              {formatPriority(report.priority)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Submitted on</p>
          <p className="text-sm font-medium">{format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <p className="text-gray-700 whitespace-pre-line">{report.description}</p>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Location</h3>
        <p className="text-gray-700">{report.location.address}</p>
        <p className="text-sm text-gray-500 mt-1">
          Coordinates: {report.location.coordinates[1]}, {report.location.coordinates[0]}
        </p>
      </div>
      
      {report.images && report.images.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {report.images.map((image, index) => (
              <img 
                key={index} 
                src={image} 
                alt={`Report image ${index + 1}`} 
                className="h-48 w-full object-cover rounded-md"
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Submitted By</h3>
        <p className="text-gray-700">{report.submittedBy.name}</p>
      </div>
      
      {report.assignedTo && report.assignedTo.department && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Assigned To</h3>
          <p className="text-gray-700">{report.assignedTo.department.name}</p>
          {report.assignedTo.assignedAt && (
            <p className="text-sm text-gray-500 mt-1">
              Assigned on {format(new Date(report.assignedTo.assignedAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Status History</h3>
        <div className="border rounded-md divide-y">
          {report.statusHistory.map((status, index) => (
            <div key={index} className="p-3 flex justify-between">
              <div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status.status)}`}>
                  {formatStatus(status.status)}
                </span>
                {status.comment && (
                  <p className="mt-1 text-sm text-gray-600">{status.comment}</p>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(status.timestamp), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatCategory(category) {
  return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatStatus(status) {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatPriority(priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function getCategoryColor(category) {
  switch (category) {
    case 'pothole':
      return 'bg-orange-100 text-orange-800';
    case 'streetlight':
      return 'bg-yellow-100 text-yellow-800';
    case 'trash':
      return 'bg-green-100 text-green-800';
    case 'graffiti':
      return 'bg-purple-100 text-purple-800';
    case 'water_leak':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'in_review':
      return 'bg-yellow-100 text-yellow-800';
    case 'assigned':
      return 'bg-purple-100 text-purple-800';
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}