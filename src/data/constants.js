export const CATEGORIES = [
  { id: 'Garbage', label: 'Garbage & Waste', icon: 'Trash2', color: '#ea580c', bg: '#fff7ed' },
  { id: 'Pothole/Road Damage', label: 'Road Damage & Potholes', icon: 'AlertOctagon', color: '#e11d48', bg: '#fff1f2' },
  { id: 'Streetlight', label: 'Streetlight & Electrical', icon: 'Zap', color: '#d97706', bg: '#fffbeb' },
  { id: 'Water Leakage', label: 'Water Leakage & Drainage', icon: 'Droplets', color: '#0284c7', bg: '#f0f9ff' },
  { id: 'Other', label: 'Other Civic Grievances', icon: 'HelpCircle', color: '#64748b', bg: '#f8fafc' },
];

export const DEPARTMENTS = {
  'Garbage': 'Sanitation Department',
  'Pothole/Road Damage': 'Roads & Infrastructure Department',
  'Streetlight': 'Electrical & Lighting Department',
  'Water Leakage': 'Water Supply & Sewerage Board',
  'Other': 'General Civic Services'
};

export const DEPARTMENT_OFFICERS = {
  'Sanitation Department': 'Inspector Rajesh Verma',
  'Roads & Infrastructure Department': 'Engineer Priya Sundaram',
  'Electrical & Lighting Department': 'Officer Amit Kulkarni',
  'Water Supply & Sewerage Board': 'Superintendent Sarah Khan',
  'General Civic Services': 'Desk Officer Mohan Das'
};

export const STATUSES = [
  { id: 'Submitted', label: 'Submitted', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { id: 'AI Verified', label: 'AI Verified (Authority Queue)', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { id: 'Needs More Evidence', label: 'Needs More Evidence', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { id: 'Flagged for Review', label: 'Flagged for Review', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
  { id: 'Assigned', label: 'Assigned', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'In Progress', label: 'In Progress', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { id: 'Awaiting Verification', label: 'Awaiting Review', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'Resolved', label: 'Resolved', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'Reopened', label: 'Reopened', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { id: 'Escalated', label: 'Escalated (Overdue)', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
];

export const PRIORITIES = [
  { id: 'Critical', label: 'Critical', slaHours: 12, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { id: 'High', label: 'High', slaHours: 24, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { id: 'Medium', label: 'Medium', slaHours: 48, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { id: 'Low', label: 'Low', slaHours: 72, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
];

export const DEMO_SAMPLE_LOCATIONS = [
  'Sector 4 Market Main Road, near Metro Pillar 142',
  'Oakridge Ward 8, Opp. City Primary School',
  'Hillview Colony, 5th Cross Road, Lane 3',
  'Central Bus Terminus, Platform 2 Entry Gate',
  'Greenfield Park Promenade, Jogging Track East',
];
