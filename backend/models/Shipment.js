const mongoose = require('mongoose');

const StatusUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Booked'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

const ShipmentSchema = new mongoose.Schema({
  consignmentNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous tracking/creation if needed, but set for authenticated booking
  },
  sender: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true }
  },
  receiver: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true }
  },
  packageDetails: {
    weight: { type: Number, required: true }, // in kg
    length: { type: Number, required: true }, // in cm
    width: { type: Number, required: true }, // in cm
    height: { type: Number, required: true }, // in cm
    contents: { type: String, required: true },
    cargoType: { type: String, default: 'Standard' }
  },
  price: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Booked'
  },
  statusHistory: [StatusUpdateSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Shipment', ShipmentSchema);
