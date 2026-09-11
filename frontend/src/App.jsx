import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, Search, Calculator, ShieldCheck, MapPin, 
  Truck, ArrowRight, User as UserIcon, LogOut, CheckCircle2,
  DollarSign, FileText, CreditCard, Globe, Plane, Ship, ShieldAlert,
  Edit2
} from 'lucide-react';
import SupportChat from './components/SupportChat';
import MapTracker from './components/MapTracker';

const API_BASE = 'http://localhost:5000/api';
const LANG_API = 'http://localhost:5001/api';
const AIR_API = 'http://localhost:5003/api';
const SEA_API = 'http://localhost:5004/api';
const BANK_API = 'http://localhost:5005/api';

const defaultTranslations = {
  heroTitle: "Global Logistics. Delivered Faster.",
  heroSub: "Track your consignment, calculate shipping costs, and schedule global pickups with our premium Logistics Network.",
  trackPlaceholder: "Enter Consignment Number (e.g. DHL-419024091-IN)",
  trackBtn: "Track",
  rateCalc: "Rate Calculator",
  weight: "Weight (kg)",
  serviceType: "Service Type",
  length: "Length (cm)",
  width: "Width (cm)",
  height: "Height (cm)",
  estimateBtn: "Estimate Quote",
  marketingTitle: "Ship Globally with Confidence",
  marketingSub: "DHL is the global market leader in the logistics industry. We commit to delivering your products safely, on time, and across all borders. Register today to access our shipment creation tools and digital invoicing.",
  securedTitle: "100% Secured",
  securedSub: "Full cargo insurance on demand.",
  fastTransitTitle: "Fast Transit",
  fastTransitSub: "Next day priority flights.",
  navHome: "Home",
  navDashboard: "Dashboard",
  navBook: "Book Shipment",
  navLogin: "Login / Sign Up",
  navLogout: "Logout",
  dashboardTitle: "Customer Dashboard",
  dashboardSub: "Manage and track your active bookings.",
  bookBtn: "Book New Shipment",
  noShipments: "No shipments booked yet",
  noShipmentsSub: "Create your first consignment shipment quote right now."
};

// Navigation Bar Component
function Navigation({ user, onLogout, lang, setLang, t }) {
  return (
    <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" className="nav-logo">
          DHL<span>Express</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">{t.navHome || "Home"}</Link>
          <Link to="/bank" className="nav-link" style={{ color: 'var(--success)', fontWeight: 'bold' }}>DHL Bank Portal</Link>
          {user && (
            <>
              <Link to="/dashboard" className="nav-link">{t.navDashboard || "Dashboard"}</Link>
              <Link to="/book" className="nav-link">{t.navBook || "Book Shipment"}</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link" style={{ color: 'var(--dhl-yellow)', fontWeight: 'bold' }}>
                  Admin Portal
                </Link>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
          <Globe size={14} style={{ color: 'var(--dhl-yellow)' }} />
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
          >
            <option value="en" style={{ color: '#000' }}>EN</option>
            <option value="de" style={{ color: '#000' }}>DE</option>
            <option value="es" style={{ color: '#000' }}>ES</option>
            <option value="fr" style={{ color: '#000' }}>FR</option>
          </select>
        </div>

        {user ? (
          <>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Hi, <strong>{user.username}</strong>
            </span>
            <button onClick={onLogout} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
              <LogOut size={16} /> {t.navLogout || "Logout"}
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <UserIcon size={16} /> {t.navLogin || "Login / Sign Up"}
          </Link>
        )}
      </div>
    </nav>
  );
}

// Landing & Tracking Page
function Home({ t }) {
  const [consignmentNumber, setConsignmentNumber] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [calcData, setCalcData] = useState({ weight: 1, length: 10, width: 10, height: 10, serviceType: 'Standard' });
  const [rateResult, setRateResult] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [activeTab, setActiveTab] = useState('rates'); // rates, schedules
  const [schedulesTab, setSchedulesTab] = useState('air'); // air, sea
  const [airSchedules, setAirSchedules] = useState([]);
  const [seaSchedules, setSeaSchedules] = useState([]);
  const location = useLocation();

  useEffect(() => {
    // Auto track from query param
    const params = new URLSearchParams(location.search);
    const trackNum = params.get('track');
    if (trackNum) {
      setConsignmentNumber(trackNum);
      triggerTracking(trackNum);
    }
  }, [location]);

  useEffect(() => {
    // Fetch Schedules
    const fetchSchedules = async () => {
      try {
        const airRes = await fetch(`${AIR_API}/air-cargo/schedules`);
        if (airRes.ok) setAirSchedules(await airRes.json());
        
        const seaRes = await fetch(`${SEA_API}/sea-cargo/schedules`);
        if (seaRes.ok) setSeaSchedules(await seaRes.json());
      } catch (err) {
        console.error('Error fetching schedules:', err);
      }
    };
    fetchSchedules();
  }, []);

  const triggerTracking = async (number) => {
    if (!number.trim()) return;
    setTrackError('');
    setTrackingData(null);
    try {
      const res = await fetch(`${API_BASE}/shipments/track/${number.trim()}`);
      if (!res.ok) {
        throw new Error('No shipment found with this consignment number.');
      }
      const data = await res.json();
      setTrackingData(data);
    } catch (err) {
      setTrackError(err.message);
    }
  };

  const handleTrack = (e) => {
    e.preventDefault();
    triggerTracking(consignmentNumber);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoadingRate(true);
    try {
      const res = await fetch(`${API_BASE}/shipments/calculate-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calcData)
      });
      const data = await res.json();
      setRateResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRate(false);
    }
  };

  return (
    <div>
      {/* Hero Header */}
      <header className="hero">
        <h1>{t.heroTitle}</h1>
        <p>{t.heroSub}</p>
        
        {/* Track Widget */}
        <form onSubmit={handleTrack} style={{ maxWidth: '600px', margin: '2rem auto', display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder={t.trackPlaceholder} 
            value={consignmentNumber}
            onChange={(e) => setConsignmentNumber(e.target.value)}
            style={{ fontSize: '1.1rem', padding: '0.85rem 1.25rem' }}
          />
          <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <Search size={20} /> {t.trackBtn}
          </button>
        </form>
      </header>

      <main className="container">
        {/* Tracking Details View */}
        {trackingData && (
          <section className="card" style={{ marginBottom: '3rem', borderColor: 'var(--dhl-yellow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CONSIGNMENT NUMBER</p>
                <h2 style={{ color: 'var(--dhl-yellow)', fontFamily: 'var(--font-title)' }}>{trackingData.consignmentNumber}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CURRENT STATUS</p>
                <span className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', cursor: 'default' }}>
                  {trackingData.status}
                </span>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: '2rem' }}>
              <div>
                <h3>Delivery Progress</h3>
                <div className="timeline">
                  {trackingData.statusHistory.map((history, i) => (
                    <div key={i} className="timeline-item completed">
                      <div className="timeline-date">{new Date(history.timestamp).toLocaleString()}</div>
                      <div className="timeline-status">{history.status} - {history.location}</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{history.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3>Shipment Specifications</h3>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p><strong>Cargo Mode:</strong> {trackingData.packageDetails?.cargoType || 'Standard'}</p>
                  <p><strong>Sender:</strong> {trackingData.sender.name}, {trackingData.sender.city}, {trackingData.sender.country}</p>
                  <p><strong>Receiver:</strong> {trackingData.receiver.name}, {trackingData.receiver.city}, {trackingData.receiver.country}</p>
                  <p><strong>Weight:</strong> {trackingData.packageDetails.weight} kg</p>
                  <p><strong>Dimensions:</strong> {trackingData.packageDetails.length} x {trackingData.packageDetails.width} x {trackingData.packageDetails.height} cm</p>
                  <p><strong>Value / Contents:</strong> {trackingData.packageDetails.contents}</p>
                </div>
                
                {/* Visual Route Tracker Map Component */}
                <MapTracker 
                  status={trackingData.status} 
                  senderCity={trackingData.sender.city} 
                  receiverCity={trackingData.receiver.city} 
                />
              </div>
            </div>
          </section>
        )}

        {trackError && (
          <div className="card" style={{ marginBottom: '3rem', borderLeft: '4px solid var(--dhl-red)', color: 'var(--dhl-red)' }}>
            <strong>Error:</strong> {trackError}
          </div>
        )}

        {/* Tab Switching Panel for Calculator vs Cargo Schedules */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setActiveTab('rates')} 
            className={`nav-link ${activeTab === 'rates' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', padding: '1rem', fontSize: '1.1rem', cursor: 'pointer', borderBottom: activeTab === 'rates' ? '2px solid var(--dhl-yellow)' : 'none', color: activeTab === 'rates' ? 'var(--dhl-yellow)' : 'var(--text-secondary)' }}
          >
            {t.rateCalc}
          </button>
          <button 
            onClick={() => setActiveTab('schedules')} 
            className={`nav-link ${activeTab === 'schedules' ? 'active' : ''}`}
            style={{ border: 'none', background: 'none', padding: '1rem', fontSize: '1.1rem', cursor: 'pointer', borderBottom: activeTab === 'schedules' ? '2px solid var(--dhl-yellow)' : 'none', color: activeTab === 'schedules' ? 'var(--dhl-yellow)' : 'var(--text-secondary)' }}
          >
            Global Schedules
          </button>
        </div>

        {activeTab === 'rates' ? (
          <div className="grid-2">
            {/* Rate Calculator */}
            <div className="card">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Calculator style={{ color: 'var(--dhl-yellow)' }} /> {t.rateCalc}
              </h2>
              <form onSubmit={handleCalculate}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t.weight}</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={calcData.weight} 
                      onChange={e => setCalcData({...calcData, weight: parseFloat(e.target.value)})} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t.serviceType}</label>
                    <select 
                      className="form-control" 
                      value={calcData.serviceType}
                      onChange={e => setCalcData({...calcData, serviceType: e.target.value})}
                    >
                      <option value="Standard">Standard Delivery</option>
                      <option value="Premium">Premium Delivery</option>
                      <option value="Express">DHL Express (Next Day)</option>
                      <option value="Air Cargo">DHL Air Cargo (Flight Transit)</option>
                      <option value="Sea Cargo">DHL Sea Cargo (Container Ship)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t.length}</label>
                    <input type="number" className="form-control" value={calcData.length} onChange={e => setCalcData({...calcData, length: parseInt(e.target.value)})} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t.width}</label>
                    <input type="number" className="form-control" value={calcData.width} onChange={e => setCalcData({...calcData, width: parseInt(e.target.value)})} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t.height}</label>
                    <input type="number" className="form-control" value={calcData.height} onChange={e => setCalcData({...calcData, height: parseInt(e.target.value)})} required />
                  </div>
                </div>

                <button type="submit" className="btn-secondary" style={{ width: '100%' }} disabled={loadingRate}>
                  {loadingRate ? 'Calculating...' : t.estimateBtn}
                </button>
              </form>

              {rateResult && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--dhl-yellow)', marginBottom: '0.75rem' }}>Estimated Pricing</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <span>Base Fare:</span>
                    <span>${rateResult.basePrice}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <span>Fuel Surcharge:</span>
                    <span>${rateResult.fuelSurcharge}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <span>Tax (18%):</span>
                    <span>${rateResult.tax}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span>Total Cost:</span>
                    <span style={{ color: 'var(--success)' }}>${rateResult.totalPrice}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Marketing pitch */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t.marketingTitle}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{t.marketingSub}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <ShieldCheck style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                  <h4>{t.securedTitle}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.securedSub}</p>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <Truck style={{ color: 'var(--dhl-yellow)', marginBottom: '0.5rem' }} />
                  <h4>{t.fastTransitTitle}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.fastTransitSub}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            {/* Cargo Schedules */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setSchedulesTab('air')} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: schedulesTab === 'air' ? 'var(--dhl-yellow)' : 'transparent', color: schedulesTab === 'air' ? '#000' : 'var(--text-primary)' }}
              >
                <Plane size={18} /> Air Freight Flights
              </button>
              <button 
                onClick={() => setSchedulesTab('sea')} 
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: schedulesTab === 'sea' ? 'var(--dhl-yellow)' : 'transparent', color: schedulesTab === 'sea' ? '#000' : 'var(--text-primary)' }}
              >
                <Ship size={18} /> Ocean Freight Vessels
              </button>
            </div>

            {schedulesTab === 'air' ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <th style={{ padding: '0.75rem' }}>Flight Number</th>
                      <th style={{ padding: '0.75rem' }}>Route</th>
                      <th style={{ padding: '0.75rem' }}>Frequency</th>
                      <th style={{ padding: '0.75rem' }}>Capacity Limit</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {airSchedules.map(sched => (
                      <tr key={sched.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--dhl-yellow)' }}>{sched.flightNumber}</td>
                        <td style={{ padding: '0.75rem' }}>{sched.origin} &rarr; {sched.destination}</td>
                        <td style={{ padding: '0.75rem' }}>{sched.frequency}</td>
                        <td style={{ padding: '0.75rem' }}>{sched.capacity}</td>
                        <td style={{ padding: '0.75rem', color: sched.status.includes('Delay') ? 'var(--dhl-red)' : 'var(--success)' }}>● {sched.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <th style={{ padding: '0.75rem' }}>Vessel Name</th>
                      <th style={{ padding: '0.75rem' }}>Port Journey</th>
                      <th style={{ padding: '0.75rem' }}>Transit Time</th>
                      <th style={{ padding: '0.75rem' }}>Frequency</th>
                      <th style={{ padding: '0.75rem' }}>Capacity</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seaSchedules.map(sched => (
                      <tr key={sched.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--dhl-yellow)' }}>{sched.vesselName}</td>
                        <td style={{ padding: '0.75rem' }}>{sched.portOfLoading} &rarr; {sched.portOfDischarge}</td>
                        <td style={{ padding: '0.75rem' }}>{sched.transitDays} Days</td>
                        <td style={{ padding: '0.75rem' }}>{sched.frequency}</td>
                        <td style={{ padding: '0.75rem' }}>{sched.capacity}</td>
                        <td style={{ padding: '0.75rem', color: sched.status.includes('Warning') ? 'var(--dhl-red)' : 'var(--success)' }}>● {sched.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Login & Signup page
function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isRegister) {
        setSuccess('Registration successful! You can now log in.');
        setIsRegister(false);
      } else {
        localStorage.setItem('dhl_token', data.token);
        localStorage.setItem('dhl_user', JSON.stringify(data.user));
        setUser(data.user);
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '450px', marginTop: '4rem' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--dhl-yellow)' }}>
          {isRegister ? 'Create DHL Account' : 'Sign in to DHL'}
        </h2>
        {error && <div style={{ color: 'var(--dhl-red)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                required 
              />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span 
            onClick={() => setIsRegister(!isRegister)} 
            style={{ color: 'var(--dhl-yellow)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Login here' : 'Register here'}
          </span>
        </p>
      </div>
    </div>
  );
}

// User Dashboard
function Dashboard({ user, t }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      const token = localStorage.getItem('dhl_token');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/shipments/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setShipments(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>{t.dashboardTitle || "Customer Dashboard"}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t.dashboardSub || "Manage and track your active bookings."}</p>
        </div>
        <Link to="/book" className="btn-primary">
          <Package size={18} /> {t.bookBtn || "Book New Shipment"}
        </Link>
      </div>

      {loading ? (
        <div>Loading shipments...</div>
      ) : shipments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Truck size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
          <h3>{t.noShipments}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{t.noShipmentsSub}</p>
          <Link to="/book" className="btn-primary">Get Started</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {shipments.map((shipment) => (
            <div key={shipment._id} className="card" style={{ borderLeft: '4px solid var(--dhl-yellow)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CONSIGNMENT NUMBER</span>
                  <h3 style={{ color: 'var(--dhl-yellow)' }}>{shipment.consignmentNumber}</h3>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CARGO TYPE</span>
                  <p><strong>{shipment.packageDetails?.cargoType || 'Standard'}</strong></p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>RECEIVER</span>
                  <p><strong>{shipment.receiver.name}</strong> ({shipment.receiver.city}, {shipment.receiver.country})</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STATUS</span>
                  <p><span style={{ color: 'var(--success)', fontWeight: 'bold' }}>●</span> {shipment.status}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PRICE</span>
                  <p style={{ fontWeight: 'bold', color: 'var(--success)' }}>${shipment.price}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Link 
                    to={`/?track=${shipment.consignmentNumber}`} 
                    className="btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem' }}
                  >
                    Track Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Book Shipment Page
function BookShipment() {
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Completed
  const [sender, setSender] = useState({ name: '', address: '', city: '', country: '', email: '' });
  const [receiver, setReceiver] = useState({ name: '', address: '', city: '', country: '', email: '' });
  const [packageDetails, setPackageDetails] = useState({ weight: 1, length: 10, width: 10, height: 10, contents: '', cargoType: 'Standard' });
  const [price, setPrice] = useState(0);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [accountNumber, setAccountNumber] = useState('');
  const [bookedShipment, setBookedShipment] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const navigate = useNavigate();

  // Calculate pricing using price microservice whenever we advance to step 2
  useEffect(() => {
    if (step === 2) {
      const getCalculatedPrice = async () => {
        setLoadingPrice(true);
        try {
          const res = await fetch(`${API_BASE}/shipments/calculate-rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weight: packageDetails.weight,
              length: packageDetails.length,
              width: packageDetails.width,
              height: packageDetails.height,
              serviceType: packageDetails.cargoType
            })
          });
          if (res.ok) {
            const data = await res.json();
            setPrice(data.totalPrice);
          } else {
            console.error('Failed calculation API');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingPrice(false);
        }
      };
      getCalculatedPrice();
    }
  }, [step, packageDetails]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('dhl_token');
    if (!token) return navigate('/login');

    try {
      const res = await fetch(`${API_BASE}/shipments/book`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sender, receiver, packageDetails, price, accountNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setBookedShipment(data.shipment);
        setStep(3);
      } else {
        alert(data.message || 'Failed to book shipment');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend API');
    }
  };

  if (step === 3 && bookedShipment) {
    return (
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center', marginTop: '4rem' }}>
        <div className="card" style={{ borderColor: 'var(--success)' }}>
          <CheckCircle2 size={64} style={{ color: 'var(--success)', margin: '0 auto 1.5rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Shipment Booked Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Your payment has been cleared and the cargo space has been scheduled.</p>
          
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '2rem', textAlign: 'left' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>CONSIGNMENT NUMBER</p>
            <h3 style={{ color: 'var(--dhl-yellow)', fontFamily: 'var(--font-title)', fontSize: '1.75rem', marginBottom: '1rem' }}>{bookedShipment.consignmentNumber}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <strong>From:</strong>
                <p>{bookedShipment.sender.name}<br/>{bookedShipment.sender.city}, {bookedShipment.sender.country}</p>
              </div>
              <div>
                <strong>To:</strong>
                <p>{bookedShipment.receiver.name}<br/>{bookedShipment.receiver.city}, {bookedShipment.receiver.country}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to={`/?track=${bookedShipment.consignmentNumber}`} className="btn-primary">Track Shipment</Link>
            <Link to="/dashboard" className="btn-secondary">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1>Book new shipment</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Provide addresses and package dimensions to generate dispatch orders.</p>
      
      {step === 1 ? (
        <form onSubmit={() => setStep(2)}>
          <div className="grid-2">
            {/* Sender Address */}
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Sender (Origin)</h3>
              <div className="form-group">
                <label>Sender Name</label>
                <input type="text" className="form-control" value={sender.name} onChange={e => setSender({...sender, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" className="form-control" value={sender.address} onChange={e => setSender({...sender, address: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>City</label>
                  <input type="text" className="form-control" value={sender.city} onChange={e => setSender({...sender, city: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Country</label>
                  <input type="text" className="form-control" value={sender.country} onChange={e => setSender({...sender, country: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={sender.email} onChange={e => setSender({...sender, email: e.target.value})} required />
              </div>
            </div>

            {/* Receiver Address */}
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Receiver (Destination)</h3>
              <div className="form-group">
                <label>Receiver Name</label>
                <input type="text" className="form-control" value={receiver.name} onChange={e => setReceiver({...receiver, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" className="form-control" value={receiver.address} onChange={e => setReceiver({...receiver, address: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>City</label>
                  <input type="text" className="form-control" value={receiver.city} onChange={e => setReceiver({...receiver, city: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Country</label>
                  <input type="text" className="form-control" value={receiver.country} onChange={e => setReceiver({...receiver, country: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={receiver.email} onChange={e => setReceiver({...receiver, email: e.target.value})} required />
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Package Specifications</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" className="form-control" value={packageDetails.weight} onChange={e => setPackageDetails({...packageDetails, weight: parseFloat(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label>Length (cm)</label>
                <input type="number" className="form-control" value={packageDetails.length} onChange={e => setPackageDetails({...packageDetails, length: parseInt(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label>Width (cm)</label>
                <input type="number" className="form-control" value={packageDetails.width} onChange={e => setPackageDetails({...packageDetails, width: parseInt(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input type="number" className="form-control" value={packageDetails.height} onChange={e => setPackageDetails({...packageDetails, height: parseInt(e.target.value)})} required />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Cargo / Service Mode</label>
                <select 
                  className="form-control" 
                  value={packageDetails.cargoType}
                  onChange={e => setPackageDetails({...packageDetails, cargoType: e.target.value})}
                >
                  <option value="Standard">Standard Delivery</option>
                  <option value="Premium">Premium Delivery</option>
                  <option value="Express">DHL Express (Next Day)</option>
                  <option value="Air Cargo">DHL Air Cargo (Flight Freight)</option>
                  <option value="Sea Cargo">DHL Sea Cargo (Ocean Freight)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contents Description</label>
                <input type="text" className="form-control" placeholder="e.g. Electronic Components" value={packageDetails.contents} onChange={e => setPackageDetails({...packageDetails, contents: e.target.value})} required />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary">
              Proceed to Payment <ArrowRight size={16} />
            </button>
          </div>
        </form>
      ) : (
        /* Step 2: Payment Gateway Checkout via DHL Bank */
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign style={{ color: 'var(--success)' }} /> DHL Secure Banking Payment
          </h2>
          
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Total Shipment Cost:</span>
              <strong style={{ color: 'var(--success)' }}>
                {loadingPrice ? 'Calculating...' : `$${price}`}
              </strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Funds will be deducted directly from your DHL Bank Account.</span>
          </div>

          <form onSubmit={handleCreateBooking}>
            <div className="form-group">
              <label>DHL Bank Account Number</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Enter 10-digit Account Number (e.g. 1234567890)"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                required 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                💡 <strong>Testing accounts:</strong> <code>1234567890</code> (John Doe - $1000) or <code>9876543210</code> (Jane Smith - $25).
              </span>
            </div>

            <div style={{ margin: '1.5rem 0', padding: '0.75rem 1rem', borderRadius: '6px', borderLeft: '3px solid var(--dhl-yellow)', backgroundColor: 'rgba(255,255,0,0.02)', fontSize: '0.85rem' }}>
              Want to check your balance, deposit money, or create a new account? Visit the <Link to="/bank" target="_blank" style={{ color: 'var(--dhl-yellow)', textDecoration: 'underline' }}>DHL Banking Portal</Link>.
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>
                Back
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loadingPrice}>
                Pay & Book Now {loadingPrice ? '' : `($${price})`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Banking Portal Component
function BankingPortal() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create account form state
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('100.00');
  
  // Deposit form state
  const [depositAccount, setDepositAccount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  // Balance enquiry state
  const [enquiryAccount, setEnquiryAccount] = useState('');
  const [enquiryResult, setEnquiryResult] = useState(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${BANK_API}/bank/accounts`);
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      setError('Could not connect to DHL Banking service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BANK_API}/bank/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: newName, balance: parseFloat(newBalance) })
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Account created successfully! Account Number: ${data.accountNumber}`);
        setNewName('');
        setNewBalance('100.00');
        fetchAccounts();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create account.');
      }
    } catch (err) {
      setError('Network error creating account.');
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BANK_API}/bank/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: depositAccount, amount: parseFloat(depositAmount) })
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Deposited $${depositAmount} successfully to account ${depositAccount}.`);
        setDepositAccount('');
        setDepositAmount('');
        fetchAccounts();
      } else {
        const data = await res.json();
        setError(data.message || 'Deposit failed.');
      }
    } catch (err) {
      setError('Network error processing deposit.');
    }
  };

  const handleEnquiry = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEnquiryResult(null);
    try {
      const res = await fetch(`${BANK_API}/bank/balance/${enquiryAccount}`);
      if (res.ok) {
        const data = await res.json();
        setEnquiryResult(data);
      } else {
        const data = await res.json();
        setError(data.message || 'Account not found.');
      }
    } catch (err) {
      setError('Network error fetching balance.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <header className="hero" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '8px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <DollarSign size={36} style={{ color: 'var(--success)' }} /> DHL Secure Banking System
        </h1>
        <p>Manage customer bank accounts, query balances, and deposit mock funds for seamless checkout payment processing.</p>
      </header>

      {error && <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--error)', color: 'var(--error)' }}>{error}</div>}
      {success && <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--success)', color: 'var(--success)' }}>{success}</div>}

      <div className="grid-2">
        {/* Left Column: Create & Deposit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Create Mock Account */}
          <div className="card">
            <h3>Create Customer Account</h3>
            <form onSubmit={handleCreateAccount} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Customer Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Alice Johnson" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Initial Deposit Balance ($)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="100.00" 
                  value={newBalance} 
                  onChange={e => setNewBalance(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Create Account
              </button>
            </form>
          </div>

          {/* Deposit Funds */}
          <div className="card">
            <h3>Deposit Mock Funds</h3>
            <form onSubmit={handleDeposit} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Bank Account Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter 10-digit number" 
                  value={depositAccount} 
                  onChange={e => setDepositAccount(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Deposit Amount ($)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 250" 
                  value={depositAmount} 
                  onChange={e => setDepositAmount(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', backgroundColor: 'var(--success)' }}>
                Deposit Amount
              </button>
            </form>
          </div>

          {/* Balance Enquiry */}
          <div className="card">
            <h3>Quick Balance Enquiry</h3>
            <form onSubmit={handleEnquiry} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Account Number" 
                value={enquiryAccount} 
                onChange={e => setEnquiryAccount(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                Enquire
              </button>
            </form>
            {enquiryResult && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                <p><strong>Customer Name:</strong> {enquiryResult.customerName}</p>
                <p><strong>Account Number:</strong> {enquiryResult.accountNumber}</p>
                <p><strong>Available Balance:</strong> <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>${enquiryResult.balance.toFixed(2)}</span></p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Existing Mock Accounts List */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Active Bank Accounts</h3>
          {loading ? (
            <div>Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No active accounts found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {accounts.map(acc => (
                <div key={acc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{acc.customerName}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>A/C: <code>{acc.accountNumber}</code></span>
                  </div>
                  <strong style={{ color: 'var(--success)', fontSize: '1.1rem' }}>${acc.balance.toFixed(2)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: 'Picked Up', location: '', description: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchAllShipments = async () => {
    const token = localStorage.getItem('dhl_token');
    if (!token) return navigate('/login');
    try {
      const res = await fetch(`${API_BASE}/admin/shipments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setShipments(await res.json());
      } else {
        setMessage('Access denied. Administrator credentials required.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllShipments();
  }, []);

  const handleStatusUpdate = async (e, id) => {
    e.preventDefault();
    const token = localStorage.getItem('dhl_token');
    try {
      const res = await fetch(`${API_BASE}/admin/shipments/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateForm)
      });
      if (res.ok) {
        setMessage('Shipment status updated successfully.');
        setUpdatingId(null);
        setUpdateForm({ status: 'Picked Up', location: '', description: '' });
        fetchAllShipments();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <ShieldAlert size={28} style={{ color: 'var(--dhl-yellow)' }} />
        <h1>DHL Administrative Control Center</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Modify package status history, dispatch statuses, and trigger sorting scans.</p>
      
      {message && <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--dhl-yellow)' }}>{message}</div>}

      {loading ? (
        <div>Loading logistics manifest...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {shipments.map(shipment => (
            <div key={shipment._id} className="card" style={{ borderLeft: '4px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CONSIGNMENT</span>
                  <h4 style={{ color: 'var(--dhl-yellow)' }}>{shipment.consignmentNumber}</h4>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SENDER &rarr; RECEIVER</span>
                  <p style={{ fontSize: '0.9rem' }}>{shipment.sender.city} ({shipment.sender.country}) &rarr; {shipment.receiver.city} ({shipment.receiver.country})</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CURRENT STATE</span>
                  <p><span style={{ color: 'var(--dhl-yellow)', fontWeight: 'bold' }}>●</span> {shipment.status}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ACTION</span>
                  <p>
                    <button 
                      onClick={() => {
                        setUpdatingId(updatingId === shipment._id ? null : shipment._id);
                        setUpdateForm({ ...updateForm, location: shipment.sender.city + ', ' + shipment.sender.country });
                      }}
                      className="btn-secondary" 
                      style={{ padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Edit2 size={12} /> Shift State
                    </button>
                  </p>
                </div>
              </div>

              {updatingId === shipment._id && (
                <form onSubmit={(e) => handleStatusUpdate(e, shipment._id)} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--dhl-yellow)' }}>Update Shipment Progress</h4>
                  <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group">
                      <label>New Status</label>
                      <select 
                        className="form-control" 
                        value={updateForm.status}
                        onChange={e => setUpdateForm({...updateForm, status: e.target.value})}
                      >
                        <option value="Picked Up">Picked Up</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. London Sort Hub" 
                        value={updateForm.location}
                        onChange={e => setUpdateForm({...updateForm, location: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Log Message / Description</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Arrived at Sort Hub and is being sorted" 
                        value={updateForm.description}
                        onChange={e => setUpdateForm({...updateForm, description: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setUpdatingId(null)} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Commit Status Update</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Global Layout / Main App Wrapper
function Layout() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const [translations, setTranslations] = useState(defaultTranslations);

  useEffect(() => {
    const savedUser = localStorage.getItem('dhl_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch translations when language changes
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const res = await fetch(`${LANG_API}/translations/${lang}`);
        if (res.ok) {
          const dict = await res.json();
          setTranslations(dict);
        }
      } catch (err) {
        console.error('Translation service failed. Using fallback defaults.', err);
        setTranslations(defaultTranslations);
      }
    };
    fetchTranslations();
  }, [lang]);

  const handleLogout = () => {
    localStorage.removeItem('dhl_token');
    localStorage.removeItem('dhl_user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <div>
      <Navigation user={user} onLogout={handleLogout} lang={lang} setLang={setLang} t={translations} />
      <Routes>
        <Route path="/" element={<Home t={translations} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/dashboard" element={<Dashboard user={user} t={translations} />} />
        <Route path="/book" element={<BookShipment />} />
        <Route path="/bank" element={<BankingPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <SupportChat />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
