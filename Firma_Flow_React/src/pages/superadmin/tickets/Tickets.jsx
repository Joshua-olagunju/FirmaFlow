import { useState, useEffect } from 'react';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  Eye,
  MessageSquare,
  X
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

export default function Tickets() {
  const { theme } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter !== 'all' ? statusFilter : '',
        priority: priorityFilter !== 'all' ? priorityFilter : ''
      });

      const response = await fetch(`http://localhost/FirmaFlow/superadmin/api/tickets.php?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return badges[priority] || badges.low;
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      resolved: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      closed: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    };
    return badges[status] || badges.open;
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertCircle size={16} className="text-red-500" />;
    }
    return <Clock size={16} className="text-gray-500" />;
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length
  };

  const viewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/tickets.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_status',
          ticket_id: ticketId,
          status: newStatus
        })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchTickets();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Support Tickets" subtitle="Manage customer support tickets">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={theme.textSecondary}>Loading tickets...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Support Tickets" subtitle="Manage customer support tickets">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <p className={`${theme.textSecondary} text-sm mb-2`}>Total Tickets</p>
            <p className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.total}</p>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <p className={`${theme.textSecondary} text-sm mb-2`}>Open</p>
            <p className="text-2xl font-bold text-green-600">{stats.open}</p>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <p className={`${theme.textSecondary} text-sm mb-2`}>In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <p className={`${theme.textSecondary} text-sm mb-2`}>Resolved</p>
            <p className="text-2xl font-bold text-gray-600">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${theme.bgCard} rounded-xl p-4 lg:p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="w-full lg:w-48">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className={`${theme.bgCard} rounded-xl ${theme.shadow} border ${theme.borderPrimary} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${theme.bgAccent} border-b ${theme.borderPrimary}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Ticket
                  </th>
                  <th className={`hidden lg:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Company
                  </th>
                  <th className={`hidden md:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Priority
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`hidden sm:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Date
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          {getPriorityIcon(ticket.priority)}
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium ${theme.textPrimary} truncate`}>
                              #{ticket.id} - {ticket.subject}
                            </p>
                            <p className={`text-sm ${theme.textSecondary} truncate lg:hidden`}>
                              {ticket.company_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`hidden lg:table-cell px-4 py-4 ${theme.textPrimary}`}>
                        {ticket.company_name || 'N/A'}
                      </td>
                      <td className="hidden md:table-cell px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`hidden sm:table-cell px-4 py-4 text-sm ${theme.textSecondary}`}>
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => viewTicket(ticket)}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={`px-4 py-8 text-center ${theme.textSecondary}`}>
                      <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No tickets found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bgCard} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${theme.shadow}`}>
            <div className={`sticky top-0 ${theme.bgCard} border-b ${theme.borderPrimary} p-6 flex justify-between items-start`}>
              <div>
                <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                  Ticket #{selectedTicket.id}
                </h2>
                <p className={theme.textSecondary}>{selectedTicket.subject}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Company</p>
                  <p className={`font-medium ${theme.textPrimary}`}>{selectedTicket.company_name}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Customer</p>
                  <p className={`font-medium ${theme.textPrimary}`}>{selectedTicket.customer_name}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Priority</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getPriorityBadge(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Created</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Email</p>
                  <p className={`font-medium ${theme.textPrimary}`}>{selectedTicket.email}</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <p className={`text-sm ${theme.textSecondary} mb-2`}>Message</p>
                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={theme.textPrimary}>{selectedTicket.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {selectedTicket.status !== 'in_progress' && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mark In Progress
                  </button>
                )}
                {selectedTicket.status !== 'resolved' && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedTicket.status !== 'closed' && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
