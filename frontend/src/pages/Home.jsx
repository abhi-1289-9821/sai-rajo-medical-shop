import React, { useState } from 'react';
import API from '../services/api';
import { 
  Phone, MapPin, Clock, ShieldCheck, HeartPulse, 
  Upload, CheckCircle, AlertCircle, ShoppingBag, 
  FileText, Image as ImageIcon, Sparkles, Truck, Mail,
  Plus, Trash2
} from 'lucide-react';

const Home = () => {
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [medicinesList, setMedicinesList] = useState([{ name: '', qty: 1, unit: 'Strips' }]);
  const [prescription, setPrescription] = useState(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState('');

  // Medicines builder action helpers
  const handleAddMedicine = () => {
    setMedicinesList(prev => [...prev, { name: '', qty: 1, unit: 'Strips' }]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicinesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicinesList(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };
  
  // UI and submit states
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // File upload handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSubmitError('');
    if (!file) return;

    // Validate type (images + pdfs)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, prescription: 'Only PDF or images (JPEG, PNG, WEBP) are allowed.' }));
      setPrescription(null);
      setPrescriptionPreview('');
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, prescription: 'File size must be less than 5MB.' }));
      setPrescription(null);
      setPrescriptionPreview('');
      return;
    }

    setErrors(prev => {
      const copy = { ...prev };
      delete copy.prescription;
      return copy;
    });

    setPrescription(file);

    // Create preview if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPrescriptionPreview('pdf'); // PDF flag
    }
  };

  // Client-side validations
  const validateForm = () => {
    const tempErrors = {};
    if (!customerName.trim()) tempErrors.customerName = 'Name is required.';
    
    // Check phone format
    const phoneRegex = /^[0-9+\s-]{10,15}$/;
    if (!phone.trim()) {
      tempErrors.phone = 'Phone number is required.';
    } else if (!phoneRegex.test(phone.trim())) {
      tempErrors.phone = 'Please enter a valid phone number (at least 10 digits).';
    }

    if (!address.trim()) tempErrors.address = 'Delivery address is required.';
    
    // Check if at least one medicine has a name
    const validMedicines = medicinesList.filter(m => m.name.trim() !== '');
    if (validMedicines.length === 0) {
      tempErrors.medicines = 'Please add at least one medicine name.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) return;

    setLoading(true);

    // Format medicinesList to a structured clean text block
    const formattedMedicines = medicinesList
      .filter(m => m.name.trim() !== '')
      .map((m, index) => `${index + 1}. ${m.name.trim()} (${m.qty || 1} ${m.unit})`)
      .join('\n');

    // Prepare multipart form data (for file upload support)
    const formData = new FormData();
    formData.append('customer_name', customerName.trim());
    formData.append('phone', phone.trim());
    formData.append('address', address.trim());
    formData.append('medicines_requested', formattedMedicines);
    if (prescription) {
      formData.append('prescription', prescription);
    }

    try {
      const response = await API.post('/orders', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccessOrder(response.data.order);
        // Clear inputs
        setCustomerName('');
        setPhone('');
        setAddress('');
        setMedicinesList([{ name: '', qty: 1, unit: 'Strips' }]);
        setPrescription(null);
        setPrescriptionPreview('');
      } else {
        setSubmitError(response.data.message || 'Failed to submit order. Please try again.');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setSubmitError(
        err.response?.data?.message || 
        'Unable to submit order. Please check your network connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessOrder(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-medical-500 to-medical-600 rounded-xl text-white shadow-md shadow-medical-100">
              <HeartPulse size={24} />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight font-sans">
              SAI RAJO MEDICAL HALL
            </span>
          </div>
          
          <a
            href="/admin/login"
            className="text-xs font-semibold text-slate-500 hover:text-medical-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
          >
            Admin Access
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Promotional and Store Info Column (Grid 5/12) */}
        <div className="md:col-span-5 space-y-6 animate-fade-in">
          
          {/* Discount and Delivery Promo Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-medical-600 to-medical-800 text-white p-6 shadow-lg shadow-medical-200">
            <div className="absolute -right-8 -bottom-8 opacity-15 text-white">
              <ShoppingBag size={150} />
            </div>
            
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold w-max mb-4">
              <Sparkles size={12} className="animate-spin" />
              Special Local Offer
            </div>
            
            <h2 className="text-3xl font-extrabold tracking-tight">
              20% DISCOUNT
            </h2>
            <p className="text-sm font-medium text-medical-100 mt-1 leading-relaxed">
              Save big on medicines. Get 20% off all orders submitted today!
            </p>
            
            <div className="flex items-center gap-2 mt-5 text-sm bg-white/10 p-3 rounded-xl">
              <Truck size={20} className="text-teal-200" />
              <span>Free Doorstep Delivery on all orders. No minimum value.</span>
            </div>
          </div>

          {/* Store Location, Phone, Hours Card */}
          <div className="glass-card rounded-2xl p-6 space-y-5 border border-white/60">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">
              Store Details
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-medical-50 text-medical-600 rounded-lg">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Call Pharmacist</div>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <a href="tel:+918127152715" className="text-sm font-bold text-slate-700 hover:text-medical-600 transition-colors">+91 8127152715</a>
                    <a href="tel:+919565187777" className="text-sm font-bold text-slate-700 hover:text-medical-600 transition-colors">+91 9565187777</a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-medical-50 text-medical-600 rounded-lg">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</div>
                  <a href="mailto:sairajomedicalhall@gmail.com" className="text-sm font-bold text-slate-700 hover:text-medical-600 transition-colors">sairajomedicalhall@gmail.com</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-medical-50 text-medical-600 rounded-lg">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location Address</div>
                  <div className="text-sm font-medium text-slate-600 leading-snug">
                    Near ICICI Bank, Rikabganj, Niyawan Road, Faizabad
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-medical-50 text-medical-600 rounded-lg">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Business Hours</div>
                  <div className="text-sm font-medium text-slate-600 leading-snug">
                    Monday - Sunday: 9:00 AM - 12:00 AM
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
                <div className="p-2 bg-medical-50 text-medical-600 rounded-lg">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Regulatory details</div>
                  <div className="text-xs font-semibold text-slate-600 mt-1 space-y-1 font-mono">
                    <div>GSTIN: <span className="font-bold text-slate-800 select-all">09DEWPK2806B1ZE</span></div>
                    <div>D.L. No: <span className="font-bold text-slate-800 select-all">UP42200000289, UP42210000289</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 text-emerald-800 text-xs font-medium px-4 py-3 rounded-xl border border-emerald-100 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
              <span>Verified Local Pharmacists handling all orders securely.</span>
            </div>
          </div>
        </div>

        {/* Order Form or Success Column (Grid 7/12) */}
        <div className="md:col-span-7">
          
          {/* Order Placement Form */}
          {!successOrder ? (
            <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/60 shadow-lg animate-slide-up">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Place Medicine Order
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  No account registration required. Complete the fields below to submit.
                </p>
              </div>

              {submitError && (
                <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`glass-input ${errors.customerName ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : ''}`}
                    placeholder="Enter your name"
                    disabled={loading}
                  />
                  {errors.customerName && (
                    <span className="text-red-500 text-xs mt-1 block font-medium">{errors.customerName}</span>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`glass-input ${errors.phone ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : ''}`}
                    placeholder="e.g. +1 (555) 012-3456"
                    disabled={loading}
                  />
                  {errors.phone && (
                    <span className="text-red-500 text-xs mt-1 block font-medium">{errors.phone}</span>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className={`glass-input resize-none ${errors.address ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : ''}`}
                    placeholder="Enter your full home address for delivery"
                    disabled={loading}
                  />
                  {errors.address && (
                    <span className="text-red-500 text-xs mt-1 block font-medium">{errors.address}</span>
                  )}
                </div>

                {/* Medicines Area */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Medicines Required <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="text-xs font-bold text-medical-600 hover:text-medical-700 flex items-center gap-1 bg-medical-50 hover:bg-medical-100/80 px-2.5 py-1 rounded-lg transition-all"
                    >
                      <Plus size={14} />
                      Add Medicine
                    </button>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {medicinesList.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 sm:p-0 bg-slate-100/40 sm:bg-transparent rounded-xl border border-slate-200/50 sm:border-transparent animate-fade-in"
                      >
                        {/* Medicine Name Input */}
                        <div className="w-full sm:flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                            placeholder="e.g. Paracetamol 500mg"
                            className="glass-input text-sm py-2.5 bg-white sm:bg-white/50"
                            required={index === 0}
                            disabled={loading}
                          />
                        </div>

                        {/* Controls (Qty, Unit, Delete) Row */}
                        <div className="flex gap-2 w-full sm:w-auto items-center">
                          {/* Qty Input */}
                          <div className="w-20 shrink-0">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleMedicineChange(index, 'qty', val === '' ? '' : parseInt(val));
                              }}
                              onBlur={() => {
                                if (item.qty === '' || parseInt(item.qty) < 1) {
                                  handleMedicineChange(index, 'qty', 1);
                                }
                              }}
                              className="glass-input text-sm py-2.5 text-center px-1 bg-white sm:bg-white/50"
                              placeholder="Qty"
                              required
                              disabled={loading}
                            />
                          </div>

                          {/* Unit Select Dropdown */}
                          <div className="flex-1 sm:w-32">
                            <select
                              value={item.unit}
                              onChange={(e) => handleMedicineChange(index, 'unit', e.target.value)}
                              className="glass-input text-sm py-2.5 pr-2 focus:ring-0 focus:border-medical-500 cursor-pointer text-slate-600 font-medium bg-white sm:bg-white/50"
                              disabled={loading}
                            >
                              <option value="Strips">Strips</option>
                              <option value="Tablets">Tablets</option>
                              <option value="Capsules">Capsules</option>
                              <option value="Bottles">Bottles</option>
                              <option value="Tubes">Tubes</option>
                              <option value="Injections">Injections</option>
                              <option value="Boxes">Boxes</option>
                            </select>
                          </div>

                          {/* Delete Row Action */}
                          {medicinesList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(index)}
                              className="p-2.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all shrink-0"
                              disabled={loading}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.medicines && (
                    <span className="text-red-500 text-xs mt-1.5 block font-medium">{errors.medicines}</span>
                  )}
                </div>

                {/* Prescription Upload (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Upload Prescription (Optional)
                  </label>
                  
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    errors.prescription ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-medical-500 bg-white/40'
                  }`}>
                    <input
                      type="file"
                      id="prescription-file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf, image/jpeg, image/png, image/webp"
                      disabled={loading}
                    />
                    <label htmlFor="prescription-file" className="cursor-pointer block">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {prescriptionPreview === 'pdf' ? (
                          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <FileText size={24} />
                          </div>
                        ) : prescriptionPreview ? (
                          <img 
                            src={prescriptionPreview} 
                            alt="Prescription preview" 
                            className="max-h-24 rounded-lg object-contain shadow-sm border border-slate-100"
                          />
                        ) : (
                          <div className="p-3 bg-medical-50 text-medical-600 rounded-xl">
                            <Upload size={24} />
                          </div>
                        )}
                        
                        <div className="text-sm font-semibold text-slate-700">
                          {prescription ? prescription.name : 'Choose file or drag here'}
                        </div>
                        
                        <div className="text-xs text-slate-400">
                          Supports JPG, PNG, WEBP, or PDF (Max 5MB)
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {errors.prescription && (
                    <span className="text-red-500 text-xs mt-1 block font-medium">{errors.prescription}</span>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-base font-semibold tracking-wide py-4 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting Order...
                    </div>
                  ) : (
                    'Submit Medicine Order'
                  )}
                </button>
              </form>
            </div>
          ) : (
            
            /* Order Success View */
            <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/60 shadow-lg text-center animate-scale-up">
              <div className="flex justify-center mb-5">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-pulse-subtle">
                  <CheckCircle size={48} />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-800">
                Order Submitted Successfully!
              </h2>
              
              <div className="bg-medical-50 border border-medical-100 rounded-2xl p-4 my-6 inline-block">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Unique Order Number</span>
                <span className="text-xl font-extrabold text-medical-800 tracking-wide mt-1 block">
                  #{successOrder.order_number}
                </span>
              </div>

              <div className="text-left space-y-4 max-w-md mx-auto text-sm text-slate-600 border-t border-b border-slate-100 py-6 my-6">
                <div>
                  <span className="font-semibold text-slate-700">Name:</span> {successOrder.customer_name}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Phone:</span> {successOrder.phone}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Address:</span> {successOrder.address}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Medicines Requested:</span>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 mt-1.5 whitespace-pre-line text-xs font-mono">
                    {successOrder.medicines_requested}
                  </div>
                </div>
                {successOrder.prescription_url && (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <FileText size={16} className="text-medical-500" />
                    Prescription uploaded successfully.
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Our pharmacist will review your order details. If necessary, we will call you on your phone number to verify the prescription details.
              </p>

              <button
                onClick={handleReset}
                className="btn-secondary w-full py-3.5 text-sm font-semibold hover:border-slate-300"
              >
                Place Another Order
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Portal Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12">
        <p>&copy; {new Date().getFullYear()} SAI RAJO MEDICAL HALL. All rights reserved.</p>
        <p className="mt-1">For emergency support, please visit your nearest hospital center.</p>
      </footer>
    </div>
  );
};

export default Home;
