import { Signal, SignalHigh, SignalMedium, SignalLow, Minus, CheckCircle, AlertCircle, Play, Pause, Ban, Eye, EyeOff, Clock } from 'lucide-react';

// Priority utilities
export const getPriorityColor = (priority?: string | null): string => {
  if (!priority || priority === '') return 'border-[#3b82f6]';
  switch (priority.toLowerCase()) {
    case 'urgent':
      return 'border-[#e11d48]';
    case 'high':
      return 'border-[#dc2626]';
    case 'medium':
      return 'border-[#f59e42]';
    case 'low':
      return 'border-[#22c55e]';
    default:
      return 'border-[#3b82f6]';
  }
};

export const getPriorityIcon = (priority?: string | null) => {
  if (!priority || priority === '') return <Minus size={14} className="text-gray-500" />;
  switch (priority.toLowerCase()) {
    case 'urgent':
      return <Signal size={14} className="text-[#e11d48]" />;
    case 'high':
      return <SignalHigh size={14} className="text-[#dc2626]" />;
    case 'medium':
      return <SignalMedium size={14} className="text-[#f59e42]" />;
    case 'low':
      return <SignalLow size={14} className="text-[#22c55e]" />;
    default:
      return <Minus size={14} className="text-gray-500" />;
  }
};

// Status utilities
export const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
      return <CheckCircle size={14} className="text-green-400" />;
    case 'in-progress':
    case 'doing':
      return <Play size={14} className="text-blue-400" />;
    case 'blocked':
      return <AlertCircle size={14} className="text-red-400" />;
    case 'review':
      return <Pause size={14} className="text-yellow-400" />;
    case 'canceled':
      return <Ban size={14} className="text-neutral-500" />;
    case 'backlog':
      return <EyeOff size={14} className="text-neutral-400" />;
    case 'todo':
      return <Eye size={14} className="text-neutral-400" />;
    default:
      return <Clock size={14} className="text-neutral-400" />;
  }
};

// Date utilities
export const formatDate = (dateString: string | null): string | null => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short'
    });
  } catch {
    return null;
  }
};

export const getEndOfWeek = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilFriday = 5 - dayOfWeek; // Friday is day 5
  const friday = new Date(today.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
  return friday.toISOString().split('T')[0];
};

export const getDueDatePresets = () => [
  { label: "Today", value: new Date().toISOString().split('T')[0] },
  { label: "Tomorrow", value: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  { label: "End of this week", value: getEndOfWeek() },
  { label: "In one week", value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
];

// Label utilities
export const getLabelColor = (labelName: string): string => {
  const availableLabels = [
    { name: "Bug", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    { name: "Feature", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { name: "Improvement", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { name: "KnowledgeBase", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    { name: "Documentation", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    { name: "Testing", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  ];
  
  const label = availableLabels.find(l => l.name === labelName);
  return label?.color || 'bg-neutral-800/30 text-neutral-400 border-neutral-700/30';
};

export const getLabelDotColor = (labelName: string): string => {
  switch (labelName) {
    case 'Bug': return 'bg-red-500';
    case 'Feature': return 'bg-purple-500';
    case 'Improvement': return 'bg-blue-500';
    case 'KnowledgeBase': return 'bg-green-500';
    case 'Documentation': return 'bg-yellow-500';
    case 'Testing': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};

// Priority options - Updated to handle null values properly
export const priorityOptions = [
  { value: '', label: 'No Priority', color: 'text-gray-500', icon: <Minus size={12} className="text-gray-500" /> },
  { value: 'urgent', label: 'Urgent', color: 'text-[#e11d48]', icon: <Signal size={12} className="text-[#e11d48]" /> },
  { value: 'high', label: 'High', color: 'text-[#dc2626]', icon: <SignalHigh size={12} className="text-[#dc2626]" /> },
  { value: 'medium', label: 'Medium', color: 'text-[#f59e42]', icon: <SignalMedium size={12} className="text-[#f59e42]" /> },
  { value: 'low', label: 'Low', color: 'text-[#22c55e]', icon: <SignalLow size={12} className="text-[#22c55e]" /> }
];

// Available labels
export const availableLabels = [
  { name: "Bug", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { name: "Feature", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { name: "Improvement", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { name: "KnowledgeBase", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { name: "Documentation", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { name: "Testing", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
];

// Helper function to process current labels
export const processTaskLabels = (labels: any[]): string[] => {
  return Array.isArray(labels)
    ? labels.map(label => typeof label === 'string' ? label : label.name || '')
    : [];
};