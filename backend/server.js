const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Shipment = require('./models/Shipment');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dhl_clone_secret_key_12345';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/dhl-clone';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};

// --- AUTH ROUTES ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or Email already registered' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// --- SHIPMENT ROUTES ---

// Calculate shipping rates
app.post('/api/shipments/calculate-rate', async (req, res) => {
  try {
    const { weight, length, width, height, serviceType } = req.body;
    if (!weight || !length || !width || !height) {
      return res.status(400).json({ message: 'Dimensions and weight are required' });
    }

    const PRICE_SERVICE_URL = process.env.PRICE_SERVICE_URL || 'http://localhost:5002';
    const response = await fetch(`${PRICE_SERVICE_URL}/api/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight, length, width, height, serviceType })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ message: 'Pricing calculation failed', error: errText });
    }

    const pricing = await response.json();
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: 'Error calling pricing microservice', error: error.message });
  }
});

// Book a shipment
app.post('/api/shipments/book', authenticateToken, async (req, res) => {
  try {
    const { sender, receiver, packageDetails, price, accountNumber } = req.body;

    if (!accountNumber) {
      return res.status(400).json({ message: 'Bank Account Number is required for payment.' });
    }

    // Call banking service to withdraw funds
    const BANK_SERVICE_URL = process.env.BANK_SERVICE_URL || 'http://localhost:5005';
    try {
      const bankResponse = await fetch(`${BANK_SERVICE_URL}/api/bank/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, amount: price })
      });

      if (!bankResponse.ok) {
        const errData = await bankResponse.json();
        return res.status(400).json({
          message: `Payment failed: ${errData.message || 'Transaction declined by bank.'}`
        });
      }
    } catch (err) {
      console.error('Failed to connect to banking service:', err.message);
      return res.status(500).json({ message: 'Payment processing failed: Banking Service Unavailable.' });
    }
    
    // Generate DHL consignment number: DHL-9 digits-IN
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    const consignmentNumber = `DHL-${randomDigits}-IN`;

    const initialStatus = {
      status: 'Booked',
      location: sender.city + ', ' + sender.country,
      description: 'Shipment info received and payment processed successfully.'
    };

    const newShipment = new Shipment({
      consignmentNumber,
      userId: req.user.id,
      sender,
      receiver,
      packageDetails,
      price,
      paymentStatus: 'Paid',
      status: 'Booked',
      statusHistory: [initialStatus]
    });

    await newShipment.save();

    // Orchestrate with Air/Sea Cargo microservices
    const cargoType = packageDetails.cargoType;
    if (cargoType === 'Air Cargo') {
      const AIR_CARGO_SERVICE_URL = process.env.AIR_CARGO_SERVICE_URL || 'http://localhost:5003';
      try {
        await fetch(`${AIR_CARGO_SERVICE_URL}/api/air-cargo/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consignmentNumber, flightNumber: 'DHL-A770', weight: packageDetails.weight })
        });
      } catch (err) {
        console.error('Failed to log booking in Air Cargo Microservice:', err.message);
      }
    } else if (cargoType === 'Sea Cargo') {
      const SEA_CARGO_SERVICE_URL = process.env.SEA_CARGO_SERVICE_URL || 'http://localhost:5004';
      try {
        await fetch(`${SEA_CARGO_SERVICE_URL}/api/sea-cargo/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consignmentNumber, vesselName: 'DHL Oceanic', weight: packageDetails.weight })
        });
      } catch (err) {
        console.error('Failed to log booking in Sea Cargo Microservice:', err.message);
      }
    }

    res.status(201).json({ message: 'Shipment booked successfully', shipment: newShipment });
  } catch (error) {
    res.status(500).json({ message: 'Error booking shipment', error: error.message });
  }
});

// Get user shipments
app.get('/api/shipments/user', authenticateToken, async (req, res) => {
  try {
    const shipments = await Shipment.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving shipments', error: error.message });
  }
});

// Track Shipment by consignment number (public)
app.get('/api/shipments/track/:consignmentNumber', async (req, res) => {
  try {
    const { consignmentNumber } = req.params;
    const shipment = await Shipment.findOne({ consignmentNumber });
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Dynamic mock status simulation ONLY if the status is still 'Booked'
    // To allow Admin changes to be the absolute source of truth!
    if (shipment.status === 'Booked') {
      const diffMs = new Date() - new Date(shipment.createdAt);
      const diffMins = Math.floor(diffMs / 60000);
      let updated = false;

      const addStatusUpdate = (status, location, description) => {
        const exists = shipment.statusHistory.some(item => item.status === status);
        if (!exists) {
          shipment.status = status;
          shipment.statusHistory.push({
            status,
            location,
            description,
            timestamp: new Date(shipment.createdAt.getTime() + shipment.statusHistory.length * 5 * 60000)
          });
          updated = true;
        }
      };

      if (diffMins >= 2) {
        addStatusUpdate('Picked Up', shipment.sender.city + ', ' + shipment.sender.country, 'Courier picked up package.');
      }
      if (diffMins >= 4) {
        addStatusUpdate('In Transit', 'DHL Sort Facility, ' + shipment.sender.country, 'Shipment departed sort facility and is in transit.');
      }

      if (updated) {
        await shipment.save();
      }
    }

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: 'Error tracking shipment', error: error.message });
  }
});

// --- ADMIN ROUTES ---

// Get all shipments (Admin only)
app.get('/api/admin/shipments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const shipments = await Shipment.find({}).sort({ createdAt: -1 });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving all shipments', error: error.message });
  }
});

// Update shipment status (Admin only)
app.put('/api/admin/shipments/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, location, description } = req.body;
    if (!status || !location || !description) {
      return res.status(400).json({ message: 'Status, location, and description are required.' });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    shipment.status = status;
    shipment.statusHistory.push({
      status,
      location,
      description,
      timestamp: new Date()
    });

    await shipment.save();
    res.json({ message: 'Shipment status updated successfully', shipment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating shipment status', error: error.message });
  }
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
