import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { buildApiUrl } from '../../config/api.config';
import StaffLayout from '../../components/StaffLayout';
import { AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, User } from 'lucide-react';

const StaffComplaints = () => {
  const { theme } = useTheme();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchComplaints = async () => {
    try {
      const url = buildApiUrl('superadmin/api/complaints.php');
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      showToast('Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (complaintId, status) => {
    try {
      const url = buildApiUrl('superadmin/api/complaints.php');
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          complaint_id: complaintId,
          status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Complaint marked as ${status}`, 'success');
        fetchComplaints();
        setModalOpen(false);
      } else {
        showToast(data.error || 'Failed to update complaint', 'error');
      }
    } catch (error) {
      console.error('Failed to update complaint:', error);
      showToast('Failed to update complaint', 'error');
    }
  };

  const respondToComplaint = async (complaintId) => {
    if (!responseText.trim()) {
      showToast('Please enter a response', 'error');
      return;
    }

    try {
      const url = buildApiUrl('superadmin/api/complaints.php');
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_response',
          complaint_id: complaintId,
          response: responseText,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Response sent successfully', 'success');
        setResponseText('');
        fetchComplaints();
        setModalOpen(false);
      } else {
        showToast(data.error || 'Failed to send response', 'error');
      }
    } catch (error) {
      console.error('Failed to respond:', error);
      showToast('Failed to send response', 'error');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-300';
      case 'in_progress':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300';
      case 'resolved':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300';
      case 'closed':
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-300';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return Clock;
      case 'in_progress':
        return AlertCircle;
      case 'resolved':
        return CheckCircle;
      case 'closed':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const filteredComplaints = complaints.filter((complaint) => (filter === 'all' ? true : complaint.status === filter));

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === 'open').length,
    inProgress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Complaints</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Track and respond to customer complaints in one queue.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: AlertCircle, tone: 'text-slate-500' },
            { label: 'Open', value: stats.open, icon: Clock, tone: 'text-amber-500' },
            { label: 'In Progress', value: stats.inProgress, icon: MessageSquare, tone: 'text-indigo-500' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle, tone: 'text-emerald-500' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`rounded-2xl border p-5 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{card.label}</p>
                    <p className="text-3xl font-semibold mt-1">{card.value}</p>
                  </div>
                  <Icon className={`w-7 h-7 ${card.tone}`} />
                </div>
              </div>
            );
          })}
        </section>

        <section
          className={`rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex flex-wrap gap-2">
              {['all', 'open', 'in_progress', 'resolved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    filter === status
                      ? 'bg-indigo-500 text-white'
                      : theme === 'dark'
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading complaints...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No complaints found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={theme === 'dark' ? 'bg-slate-950/70 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Date</th>
                    <th className="px-5 py-3 text-left font-medium">Customer</th>
                    <th className="px-5 py-3 text-left font-medium">Subject</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'}`}>
                  {filteredComplaints.map((complaint) => {
                    const StatusIcon = getStatusIcon(complaint.status);
                    return (
                      <tr
                        key={complaint.id}
                        className={`${theme === 'dark' ? 'hover:bg-slate-800/70' : 'hover:bg-slate-50'} cursor-pointer transition`}
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setModalOpen(true);
                        }}
                      >
                        <td className="px-5 py-4">{new Date(complaint.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="font-medium">{complaint.name || 'Anonymous'}</p>
                              <p className="text-xs text-slate-500">{complaint.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium">{complaint.subject}</p>
                          <p className="text-xs text-slate-500 truncate max-w-md">{complaint.message}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${getStatusClass(complaint.status)}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {complaint.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComplaint(complaint);
                              setModalOpen(true);
                            }}
                            className="text-indigo-500 hover:text-indigo-600"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {modalOpen && selectedComplaint && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className={`p-5 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                <h2 className="text-xl font-semibold">{selectedComplaint.subject}</h2>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setResponseText('');
                  }}
                  className={`${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="text-xs text-slate-500 mb-1">Customer</p>
                  <p className="text-sm">{selectedComplaint.name || 'Anonymous'} ({selectedComplaint.email})</p>
                  <p className="text-xs text-slate-500 mt-3 mb-1">Message</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedComplaint.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response..."
                    rows="4"
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => respondToComplaint(selectedComplaint.id)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600"
                  >
                    Send Response
                  </button>

                  {selectedComplaint.status !== 'in_progress' && (
                    <button
                      onClick={() => updateStatus(selectedComplaint.id, 'in_progress')}
                      className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600"
                    >
                      Mark In Progress
                    </button>
                  )}

                  {selectedComplaint.status !== 'resolved' && (
                    <button
                      onClick={() => updateStatus(selectedComplaint.id, 'resolved')}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-xl text-white shadow-lg z-50 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {toast.message}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffComplaints;
