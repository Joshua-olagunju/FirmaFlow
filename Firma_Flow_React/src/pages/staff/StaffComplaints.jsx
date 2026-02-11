import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useStaff } from '../../contexts/StaffContext';
import { buildApiUrl } from '../../config/api.config';
import StaffLayout from '../../components/StaffLayout';
import { AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, User } from 'lucide-react';

const StaffComplaints = () => {
  const { theme } = useTheme();
  const { staff } = useStaff();
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
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        // Show all complaints (no filtering for staff)
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
          status: status
        })
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
          response: responseText
        })
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-yellow-500';
      case 'in_progress': return 'text-blue-500';
      case 'resolved': return 'text-green-500';
      case 'closed': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return Clock;
      case 'in_progress': return AlertCircle;
      case 'resolved': return CheckCircle;
      case 'closed': return XCircle;
      default: return AlertCircle;
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filter === 'all') return true;
    return complaint.status === filter;
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <StaffLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Complaints Management</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Handle customer complaints and feedback
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-500" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Open</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Resolved</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-4">
          {['all', 'open', 'in_progress', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Complaints List */}
        <div className={`flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          {loading ? (
            <div className="p-8 text-center">Loading complaints...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No complaints found</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredComplaints.map((complaint) => {
                    const StatusIcon = getStatusIcon(complaint.status);
                    return (
                      <tr
                        key={complaint.id}
                        className={`${theme === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50'} cursor-pointer`}
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setModalOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-5 h-5 mr-2 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium">{complaint.name || 'Anonymous'}</div>
                              <div className="text-sm text-gray-500">{complaint.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">{complaint.subject}</div>
                          <div className="text-sm text-gray-500 truncate max-w-md">{complaint.message}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${getStatusColor(complaint.status)}`}>
                            <StatusIcon className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">
                              {complaint.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComplaint(complaint);
                              setModalOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {modalOpen && selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedComplaint.subject}</h2>
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setResponseText('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer</label>
                    <p>{selectedComplaint.name || 'Anonymous'} ({selectedComplaint.email})</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Message</label>
                    <p>{selectedComplaint.message}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className={getStatusColor(selectedComplaint.status)}>
                      {selectedComplaint.status.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                    rows="4"
                    className={`w-full px-3 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => respondToComplaint(selectedComplaint.id)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Send Response
                  </button>
                  
                  {selectedComplaint.status !== 'in_progress' && (
                    <button
                      onClick={() => updateStatus(selectedComplaint.id, 'in_progress')}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                    >
                      Mark In Progress
                    </button>
                  )}
                  
                  {selectedComplaint.status !== 'resolved' && (
                    <button
                      onClick={() => updateStatus(selectedComplaint.id, 'resolved')}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {toast.message}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffComplaints;
