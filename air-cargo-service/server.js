const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

const schedules = [
  { id: 'AC001', flightNumber: 'DHL-A770', origin: 'New York (JFK)', destination: 'London (LHR)', frequency: 'Daily', capacity: '45,000 kg', status: 'On Time' },
  { id: 'AC002', flightNumber: 'DHL-A240', origin: 'Frankfurt (FRA)', destination: 'Tokyo (NRT)', frequency: 'Mon, Wed, Fri', capacity: '52,000 kg', status: 'On Time' },
  { id: 'AC003', flightNumber: 'DHL-A109', origin: 'Los Angeles (LAX)', destination: 'Sydney (SYD)', frequency: 'Daily', capacity: '45,000 kg', status: 'Delayed (30m)' },
  { id: 'AC004', flightNumber: 'DHL-A882', origin: 'Paris (CDG)', destination: 'Dubai (DXB)', frequency: 'Tue, Thu, Sat', capacity: '60,000 kg', status: 'On Time' }
];

const bookings = [];

app.get('/api/air-cargo/schedules', (req, res) => {
  res.json(schedules);
});

app.post('/api/air-cargo/book', (req, res) => {
  const { consignmentNumber, flightNumber, weight } = req.body;
  if (!consignmentNumber || !flightNumber) {
    return res.status(400).json({ message: 'consignmentNumber and flightNumber are required.' });
  }

  const booking = {
    id: 'B' + Math.floor(1000 + Math.random() * 9000),
    consignmentNumber,
    flightNumber,
    weight,
    bookedAt: new Date()
  };
  bookings.push(booking);
  res.status(201).json({ message: 'Air cargo space booked successfully', booking });
});

app.listen(PORT, () => {
  console.log(`Air Cargo service running on port ${PORT}`);
});
