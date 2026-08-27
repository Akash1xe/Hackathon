export const REPORT_CATEGORIES = [
  { value: 'pothole', label: 'Roads & potholes', icon: 'road' },
  { value: 'streetlight', label: 'Streetlights', icon: 'light' },
  { value: 'trash', label: 'Waste & sanitation', icon: 'trash' },
  { value: 'graffiti', label: 'Public property', icon: 'building' },
  { value: 'water_leak', label: 'Water supply', icon: 'water' },
  { value: 'other', label: 'Other civic issue', icon: 'other' }
];

export const REPORT_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In review' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' }
];

export const REPORT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const CATEGORY_VALUES = REPORT_CATEGORIES.map((category) => category.value);
export const STATUS_VALUES = REPORT_STATUSES.map((status) => status.value);

export function categoryLabel(value) {
  return REPORT_CATEGORIES.find((category) => category.value === value)?.label || 'Other civic issue';
}

export function statusLabel(value) {
  return REPORT_STATUSES.find((status) => status.value === value)?.label || value;
}
