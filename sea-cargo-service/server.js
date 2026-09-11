const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

const schedules = [
  { id: 'SC001', vesselName: 'DHL Oceanic', portOfLoading: 'Shanghai (CNSHA)', portOfDischarge: 'Rotterdam (NLRTM)', transitDays: 24, frequency: 'Weekly (Saturdays)', capacity: '18,000 TEU', status: 'On Schedule' },
  { id: 'SC002', vesselName: 'DHL Pacificus', portOfLoading: 'Singapore (SGSIN)', portOfDischarge: 'Seattle (USSEA)', transitDays: 16, frequency: 'Bi-weekly (Wed/Sun)', capacity: '14,000 TEU', status: 'On Schedule' },
  { id: 'SC003', vesselName: 'DHL Atlantic Star', portOfLoading: 'Antwerp (BEANT)', portOfDischarge: 'Houston (USHOU)', transitDays: 14, frequency: 'Weekly (Mondays)', capacity: '12,500 TEU', status: 'Weather Warning' },
  { id: 'SC004', vesselName: 'DHL Sea King', portOfLoading: 'Mumbai (INBOM)', portOfDischarge: 'Durban (ZADUR)', transitDays: 11, frequency: 'Weekly (Fridays)', capacity: '10,000 TEU', status: 'On Schedule' }
];

const bookings = [];

app.get('/api/sea-cargo/schedules', (req, res) => {
  res.json(schedules);
});

app.post('/api/sea-cargo/book', (req, res) => {
  const { consignmentNumber, vesselName, weight } = req.body;
  if (!consignmentNumber || !vesselName) {
    return res.status(400).json({ message: 'consignmentNumber and vesselName are required.' });
  }

  const booking = {
    id: 'B' + Math.floor(1000 + Math.random() * 9000),
    consignmentNumber,
    vesselName,
    weight,
    bookedAt: new Date()
  };
  bookings.push(booking);
  res.status(201).json({ message: 'Sea cargo space booked successfully', booking });
});

app.listen(PORT, () => {
  console.log(`Sea Cargo service running on port ${PORT}`);
});
