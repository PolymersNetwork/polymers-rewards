import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import TelemetryForm from './components/TelemetryForm';
import FraudViz from './components/FraudViz';
import NftTracker from './components/NftTracker';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

function App() {
  const [telemetry, setTelemetry] = useState(null);
  const [fraudScore, setFraudScore] = useState(null);

  const handleSubmit = async (data) => {
    if (!validateTelemetry(data)) {
      await supabase.from('errors').insert({ error: 'Invalid telemetry' });
      return alert('Invalid telemetry');
    }
    const normalized = normalizeTelemetry(data);
    const autoencoder = await tf.loadLayersModel('/models/autoencoder.json');
    const mse = computeMSE(autoencoder, normalized);
    setFraudScore(mse);
    if (mse > 0.15) {
      await supabase.from('fraud_logs').insert({ telemetry: data, mse, flagged: true });
      return alert('Fraud detected!');
    }
    try {
      const response = await axios.post(import.meta.env.VITE_API_URL, data);
      setTelemetry(response.data);
      await supabase.from('telemetry_logs').insert({ ...data, deposit_id: response.data.deposit_id });
    } catch (error) {
      await supabase.from('errors').insert({ error: 'Telemetry submission', details: error.message });
      alert('Submission failed');
    }
  };

  function validateTelemetry(data) {
    return Object.values(data).every(val => Number.isFinite(val) && val >= 0);
  }

  function normalizeTelemetry(data) {
    const values = Object.values(data);
    const tensor = tf.tensor2d([values], [1, values.length]);
    const { mean, variance } = tf.moments(tensor, 0);
    return tensor.sub(mean).div(variance.sqrt());
  }

  function computeMSE(model, input) {
    const reconstructed = model.predict(input);
    return tf.mean(tf.pow(input.sub(reconstructed), 2)).dataSync()[0];
  }

  return (
    <div>
      <h1>Polymers Rewards Dashboard</h1>
      <TelemetryForm onSubmit={handleSubmit} />
      <FraudViz score={fraudScore} />
      <NftTracker telemetry={telemetry} />
    </div>
  );
}

export default App;
