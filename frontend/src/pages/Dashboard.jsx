import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import NotificationPopup from '../components/NotificationPopup';
import { 
  ShoppingBag, Clock, CheckCircle, Truck, 
  LogOut, Filter, Phone, MapPin, Calendar, 
  FileImage, Eye, User, Trash2, ClipboardCheck, XCircle 
} from 'lucide-react';

const Dashboard = () => {
  const { admin, logout, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  const BACKEND_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000';

  // Fetch initial orders on load
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get('/orders');
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Failed to fetch orders from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update filtered list when search query, filter, or orders array changes
  useEffect(() => {
    let result = [...orders];

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Search Query (Search by Name, Order Number, Phone, or Medicine details)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(o => 
        o.customer_name.toLowerCase().includes(query) ||
        o.order_number.toLowerCase().includes(query) ||
        o.phone.includes(query) ||
        o.medicines_requested.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(result);
  }, [orders, statusFilter, searchQuery]);

  // Real-time handler callback for Socket events
  const handleNewOrderSocket = (newOrder) => {
    // Check if order already exists in state to avoid duplication
    setOrders(prev => {
      if (prev.some(o => o.id === newOrder.id)) return prev;
      return [newOrder, ...prev];
    });
  };

  // Update order status trigger
  const updateStatus = async (id, newStatus) => {
    setActionLoadingId(id);
    try {
      const response = await API.patch(`/orders/${id}/status`, { status: newStatus });
      if (response.data.success) {
        setOrders(prev => prev.map(o => o.id === id ? response.data.order : o));
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Error updating order status. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Fetch prescription image securely using token header and display in a new tab via blob url
  const viewPrescription = async (prescriptionUrl) => {
    try {
      const response = await fetch(`${BACKEND_URL}${prescriptionUrl}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to retrieve file from server.');
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Error fetching prescription:', err);
      alert('Unable to load prescription file securely.');
    }
  };

  // Calculations for KPI Metrics cards
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  // Status Badge visual styles mapping
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'accepted':
        return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-100';
    }
  };

  // Date Formatting helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Real-time notification popup */}
      <NotificationPopup onNewOrderReceived={handleNewOrderSocket} />

      {/* Admin Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-medical-500 rounded-lg text-white">
            <ShoppingBag size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">
            SAI RAJO MEDICAL HALL <span className="text-xs text-medical-400 bg-slate-800 px-2 py-0.5 rounded-full ml-2 font-mono">ADMIN</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-200">Welcome, {admin?.username || 'Pharmacist'}</span>
            <span className="text-[10px] text-slate-400">Live Status Connected</span>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors text-slate-300 hover:text-white"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Statistics Metric Card Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Total Orders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <ShoppingBag size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Orders</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.total}</div>
            </div>
          </div>

          {/* Card 2: Pending Orders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.pending}</div>
            </div>
          </div>

          {/* Card 3: Accepted Orders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Accepted</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.accepted}</div>
            </div>
          </div>

          {/* Card 4: Delivered Orders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Truck size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Delivered</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.delivered}</div>
            </div>
          </div>
        </section>

        {/* Search, Status Tabs and Filter Controls */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto gap-0.5 shrink-0">
            {['all', 'pending', 'accepted', 'rejected', 'delivered'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === tab 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Filter size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
              placeholder="Search by name, ID, phone..."
            />
          </div>
        </section>

        {/* Dashboard Orders Table / Cards View */}
        <section className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-10 h-10 border-4 border-medical-200 border-t-medical-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 text-sm mt-3 font-semibold">Loading orders from server...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm text-red-500 font-semibold">
              {error}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm text-slate-400">
              <ShoppingBag size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold">No orders found matching this filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
                    order.status === 'pending' ? 'border-l-4 border-l-amber-500' : ''
                  }`}
                >
                  {/* Status indicator banner on mobile */}
                  <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">#{order.order_number}</span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Calendar size={12} />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>

                    {/* Prescription Badge */}
                    {order.prescription_url ? (
                      <button
                        onClick={() => viewPrescription(order.prescription_url)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-medical-50 text-medical-700 hover:bg-medical-100 border border-medical-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <FileImage size={12} />
                        View Prescription
                        <Eye size={12} />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                        No Prescription
                      </span>
                    )}
                  </div>

                  {/* Order Core Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-sm text-slate-600 mb-4">
                    
                    {/* Customer Identity Contact (Grid 4/12) */}
                    <div className="md:col-span-4 space-y-2.5 border-r border-slate-100 pr-2">
                      <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <User size={16} className="text-slate-400" />
                        <span>{order.customer_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <Phone size={14} className="text-slate-400" />
                        <a href={`tel:${order.phone}`} className="hover:text-medical-600 font-medium transition-colors">{order.phone}</a>
                      </div>

                      <div className="flex items-start gap-2 text-xs leading-relaxed">
                        <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                        <span>{order.address}</span>
                      </div>
                    </div>

                    {/* Medicines Textarea (Grid 8/12) */}
                    <div className="md:col-span-8 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Medicines Requested</div>
                      <div className="whitespace-pre-line text-xs font-mono text-slate-700 leading-relaxed max-h-28 overflow-y-auto">
                        {order.medicines_requested}
                      </div>
                    </div>
                  </div>

                  {/* Administration Order Action Panel */}
                  <div className="flex justify-end items-center gap-2 border-t border-slate-100 pt-3.5">
                    {actionLoadingId === order.id ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mr-2">
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                        Updating status...
                      </div>
                    ) : (
                      <>
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(order.id, 'rejected')}
                              className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                            <button
                              onClick={() => updateStatus(order.id, 'accepted')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm shadow-blue-100"
                            >
                              <ClipboardCheck size={14} />
                              Accept Order
                            </button>
                          </>
                        )}
                        
                        {order.status === 'accepted' && (
                          <button
                            onClick={() => updateStatus(order.id, 'delivered')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm shadow-emerald-100"
                          >
                            <Truck size={14} />
                            Mark as Delivered
                          </button>
                        )}

                        {(order.status === 'delivered' || order.status === 'rejected') && (
                          <span className="text-xs text-slate-400 font-semibold italic">
                            Order is archived ({order.status})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
