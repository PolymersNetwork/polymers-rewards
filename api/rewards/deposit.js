const express = require('express');
const tf = require('@tensorflow/tfjs-node');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const autoencoder = tf.model(/* Load trained model */);
const threshold = 0.15; // Mean + 3σ

app.post('/api/rewards/deposit', async (req, res) => {
  const telemetry = req.body;
  const normalized = normalizeTelemetry(telemetry);
  const mse = computeMSE(autoencoder, normalized); // TF.js fraud check
  if (mse > threshold) {
    await supabase.from('fraud_logs').insert({ telemetry, mse, flagged: true });
    return res.status(400).json({ error: 'Fraud detected' });
  }
  try {
    const response = await axios.post('http://polymers-program:8080/mint', telemetry); // Solana endpoint
    await supabase.from('telemetry_logs').insert({ ...telemetry, deposit_id: response.data.deposit_id });
    res.json({ deposit_id: response.data.deposit_id });
  } catch (error) {
    await supabase.from('errors').insert({ error: 'Telemetry submission', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('API running on port 3000'));
