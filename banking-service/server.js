const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/dhl-bank';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully (Banking database)');
    seedInitialAccounts();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Schema Definition
const AccountSchema = new mongoose.Schema({
  accountNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 }
}, { timestamps: true });

const Account = mongoose.model('Account', AccountSchema);

// Seeding helper
async function seedInitialAccounts() {
  try {
    const count = await Account.countDocuments();
    if (count === 0) {
      await Account.create([
        { accountNumber: '1234567890', customerName: 'John Doe', balance: 1000.00 },
        { accountNumber: '9876543210', customerName: 'Jane Smith', balance: 25.00 },
        { accountNumber: '1111222233', customerName: 'DHL Premium Client', balance: 5000.00 }
      ]);
      console.log('Seeded initial mock bank accounts.');
    }
  } catch (err) {
    console.error('Failed to seed bank accounts:', err);
  }
}

// --- ROUTES ---

// 1. Get all accounts (Admin / Debug)
app.get('/api/bank/accounts', async (req, res) => {
  try {
    const accounts = await Account.find({}).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bank accounts', error: error.message });
  }
});

// 2. Create account
app.post('/api/bank/accounts', async (req, res) => {
  try {
    const { customerName, balance, accountNumber } = req.body;
    if (!customerName || balance === undefined) {
      return res.status(400).json({ message: 'Customer Name and Initial Balance are required.' });
    }
    
    // Generate unique account number if not provided
    const finalAccountNumber = accountNumber || Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // Check duplicate
    const existing = await Account.findOne({ accountNumber: finalAccountNumber });
    if (existing) {
      return res.status(400).json({ message: 'Account number already exists.' });
    }

    const newAccount = new Account({
      accountNumber: finalAccountNumber,
      customerName,
      balance: parseFloat(balance)
    });

    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (error) {
    res.status(500).json({ message: 'Error creating bank account', error: error.message });
  }
});

// 3. Balance Enquiry
app.get('/api/bank/balance/:accountNumber', async (req, res) => {
  try {
    const account = await Account.findOne({ accountNumber: req.params.accountNumber });
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error querying balance', error: error.message });
  }
});

// 4. Deposit
app.post('/api/bank/deposit', async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;
    if (!accountNumber || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid account number and positive amount are required.' });
    }

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    account.balance = Number((account.balance + parseFloat(amount)).toFixed(2));
    await account.save();
    
    res.json({ message: 'Deposit successful.', account });
  } catch (error) {
    res.status(500).json({ message: 'Error processing deposit', error: error.message });
  }
});

// 5. Withdraw / Deduct Payment
app.post('/api/bank/withdraw', async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;
    if (!accountNumber || amount === undefined || amount <= 0) {
      return res.status(400).json({ message: 'Valid account number and positive amount are required.' });
    }

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance to fulfill the transaction.' });
    }

    account.balance = Number((account.balance - parseFloat(amount)).toFixed(2));
    await account.save();

    res.json({ message: 'Withdrawal successful.', account });
  } catch (error) {
    res.status(500).json({ message: 'Error processing withdrawal', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Banking microservice running on port ${PORT}`);
});
