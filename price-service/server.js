const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.post('/api/pricing/calculate', (req, res) => {
  const { weight, length, width, height, serviceType } = req.body;

  if (!weight || !length || !width || !height) {
    return res.status(400).json({ message: 'Weight and dimensions are required for rate calculation.' });
  }

  const volumeWeight = (length * width * height) / 5000;
  const billableWeight = Math.max(weight, volumeWeight);

  let ratePerKg = 15; // default standard
  if (serviceType === 'Express') ratePerKg = 35;
  else if (serviceType === 'Premium') ratePerKg = 25;
  else if (serviceType === 'Air Cargo') ratePerKg = 30;
  else if (serviceType === 'Sea Cargo') ratePerKg = 8;
  else if (serviceType === 'Standard') ratePerKg = 15;

  const basePrice = billableWeight * ratePerKg;
  const fuelSurcharge = basePrice * 0.12;
  const tax = (basePrice + fuelSurcharge) * 0.18;
  const totalPrice = parseFloat((basePrice + fuelSurcharge + tax).toFixed(2));

  res.json({
    billableWeight: billableWeight.toFixed(2),
    basePrice: basePrice.toFixed(2),
    fuelSurcharge: fuelSurcharge.toFixed(2),
    tax: tax.toFixed(2),
    totalPrice
  });
});

app.listen(PORT, () => {
  console.log(`Price service running on port ${PORT}`);
});
