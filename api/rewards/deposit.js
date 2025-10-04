const tf = require('@tensorflow/tfjs-node');

const autoencoder = tf.model(/* Load trained model */);
const threshold = 0.15; // Mean + 3σ from training

app.post('/api/rewards/deposit', async (req, res) => {
  const telemetry = req.body; // {amount, contamination, ...}
  const normalized = normalizeTelemetry(telemetry);
  const mse = computeMSE(autoencoder, normalized);
  if (mse > threshold) {
    await supabase.from('fraud_logs').insert({ telemetry, mse, flagged: true });
    return res.status(400).json({ error: 'Fraud detected' });
  }
  // Proceed to Solana mint
});
