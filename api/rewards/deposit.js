const express = require('express');
const tf = require('@tensorflow/tfjs-node');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());
app.use(rateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 100 })); // 100/day
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const autoencoder = tf.model(/* Load trained model */);
const threshold = 0.15;

function validateTelemetry(telemetry) {
  return (
    Number.isFinite(telemetry.amount) &&
    telemetry.amount > 0 &&
    telemetry.amount <= 1_000_000 &&
    Number.isFinite(telemetry.contamination)
  );
}

function normalizeTelemetry(telemetry) {
  // Normalize to mean=0, std=1
  const values = Object.values(telemetry);
  return tf.tensor2d([values], [1, values.length]);
}

function computeMSE(model, input) {
  const reconstructed = model.predict(input);
  return tf.mean(tf.pow(input.sub(reconstructed), 2)).dataSync()[0];
}

app.post('/api/rewards/deposit', async (req, res) => {
  const telemetry = req.body;
  if (!validateTelemetry(telemetry)) {
    await supabase.from('errors').insert({ error: 'Invalid telemetry' });
    return res.status(400).json({ error: 'Invalid telemetry' });
  }
  const normalized = normalizeTelemetry(telemetry);
  const mse = computeMSE(autoencoder, normalized);
  if (mse > threshold) {
    await supabase.from('fraud_logs').insert({ telemetry, mse, flagged: true });
    return res.status(400).json({ error: 'Fraud detected' });
  }
  try {
    const response = await axios.post('http://polymers-program:8080/mint', telemetry); // Mock Solana endpoint
    await supabase.from('telemetry_logs').insert({ ...telemetry, deposit_id: response.data.deposit_id });
    res.json({ deposit_id: response.data.deposit_id });
  } catch (error) {
    await supabase.from('errors').insert({ error: 'Telemetry submission', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('API running on port 3000'));
