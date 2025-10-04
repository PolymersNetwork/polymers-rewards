# Polymers Protocol Rewards System

**⚠️ Disclaimer: Sample / Untested Implementation**  
This is a demo AI-driven rewards platform on Solana. The code, including AI compliance scoring, token/NFT minting, Wormhole cross-chain bridging, relayer automation, TensorFlow.js fraud detection, frontend, and backend, is illustrative and **untested**. Do not deploy on mainnet without thorough testing, validation, and professional security audits. Use at your own risk.

## Overview

Polymers Protocol is a multi-tenant, AI-driven Solana program for minting **PLY**, **CARB**, **EWASTE** tokens, and **ESG NFTs** based on IoT telemetry and ESG metrics. It features:
- **AI-Driven Compliance Scoring**: Evaluates telemetry (e.g., contamination, temperature) using fixed-point math (~3,000 CUs).
- **Fraud Detection**: TensorFlow.js autoencoder flags anomalous telemetry in the backend API and frontend dashboard.
- **Multi-Tenant Support**: Partner-specific multipliers and thresholds.
- **Multi-Sig Governance**: Requires ≥2 admin approvals via Squads.
- **Cross-Chain Bridging**: Automates ESG NFT bridging to Ethereum via Wormhole with a relayer toolkit.
- **Frontend Dashboard**: React-based UI for telemetry submission, fraud visualization, and NFT tracking.
- **Backend API**: Node.js endpoint for telemetry processing and Solana/Ethereum interactions.
- **Real-Time Analytics**: Supabase logs for Grafana dashboards.
- **Optimizations**: Bitwise validation, reduced accounts, and batched CPIs to stay under 1.4M CU limit.

---

## Directory Structure

```
/programs/src
├── lib.rs              # Program entry point
├── errors.rs           # Custom errors (InvalidTelemetry, LowComplianceScore)
├── state.rs            # Structs (RewardVault, BatchDeposit, EsgMetrics)
├── instructions/
│   ├── mod.rs
│   ├── initialize.rs   # Initializes RewardVault
│   ├── approve_mint.rs # Multi-sig approvals
│   ├── mint_rewards.rs # Mints PLY, CARB, EWASTE
│   └── mint_nft.rs     # Mints ESG NFTs, emits Wormhole messages
/tests
├── integration.rs      # Anchor tests
/api
├── rewards
│   └── deposit.js      # Telemetry submission endpoint with TF.js fraud detection
/frontend
├── src/
│   ├── App.jsx         # Main React app
│   ├── components/
│   │   ├── TelemetryForm.jsx # Telemetry input form
│   │   ├── FraudViz.jsx      # TF.js fraud visualization
│   │   └── NftTracker.jsx    # NFT mint/bridge status
│   ├── models/
│   │   └── autoencoder.js    # TF.js fraud detection model
├── public/
├── package.json
/relayer
├── relayer.ts          # Wormhole relayer for VAA automation
├── test.ts             # Expanded test suite
├── test/
│   ├── helpers.ts      # Test utilities
│   ├── data/
│   │   ├── valid.json  # Valid test inputs
│   │   └── invalid.json # Invalid test inputs
/Anchor.toml
/Cargo.toml
/.env
/README.md
```

---

## Features

- **AI Compliance Scoring**: Validates telemetry and computes scores efficiently (~3,000 CUs).
- **Fraud Detection**: TensorFlow.js autoencoder flags anomalies (e.g., fake weights) in backend API and frontend dashboard.
- **Token Minting**: Mints PLY, CARB, EWASTE based on compliance scores.
- **ESG NFT Bridging**: Mints NFTs on Solana (Metaplex) and automates Ethereum bridging via Wormhole (~8,000 CUs).
- **Multi-Sig Governance**: Optimized Squads-based approvals with batch processing.
- **Frontend Dashboard**: Real-time telemetry input, fraud visualization, and NFT status tracking.
- **Backend API**: Handles telemetry validation, fraud detection, and Solana/Ethereum interactions.
- **Analytics**: Supabase logs for Grafana visualization and Sentry/Slack alerts.
- **Relayer Toolkit**: Automates telemetry submission, NFT minting, VAA retrieval, and Ethereum minting.
- **Optimizations**: Fixed-point arithmetic, bitwise validation, reduced accounts, and batched CPIs.

---

## Prerequisites

- **Rust**: ≥1.68
- **Solana CLI**: ≥1.18
- **Anchor CLI**: ≥0.31.1
- **Node.js**: ≥20
- **Hardhat**: For Ethereum deployment
- **Wormhole SDK**: For relayer and bridging
- **Supabase CLI**: For analytics
- **Mocha/Chai**: For relayer tests
- **TensorFlow.js**: For fraud detection
- **Next.js / React**: For frontend dashboard

Install:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
solana-install init 1.18.0
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
npm install -g @supabase/supabase-js hardhat yarn
yarn add @wormhole-foundation/sdk ethers axios typescript ts-node mocha chai @tensorflow/tfjs-node react react-dom @supabase/supabase-js axios recharts
```

---

## Environment Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/PolymersNetwork/polymers-rewards.git
   cd polymers-rewards
   yarn install
   ```

2. **Configure `.env`**:
   ```bash
   SOLANA_WALLET='[wallet_keypair]'
   PROGRAM_ID='YourSolanaProgramIdHere'
   WORMHOLE_PROGRAM='worm2ZoG2kUd4vFXhvjh5UUAA9nV4fV3nq3b3U8f8'
   PLY_MINT='PLYKdaCUgxTUw6rSjWbgSN97Qtecb6Fy6SazWf1tvAC'
   CARB_MINT='[carb_mint_address]'
   EWASTE_MINT='[ewaste_mint_address]'
   NFT_MINT='[nft_mint_address]'
   ETHEREUM_WORMHOLE='0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B'
   ETHEREUM_RPC='https://sepolia.infura.io/v3/YOUR_INFURA_KEY'
   WALLET_PRIVATE_KEY='your_ethereum_wallet_private_key'
   GUARDIAN_RPC='https://guardian-mainnet.wormhole.com'
   SUPABASE_URL='[supabase_url]'
   SUPABASE_KEY='[supabase_key]'
   API_URL='http://localhost:3000/api/rewards/deposit'
   ```

3. **Preflight Checks**:
   ```bash
   solana config get
   solana balance
   anchor --version
   node -v
   npx hardhat --version
   yarn mocha --version
   node -e "require('@tensorflow/tfjs-node')"
   yarn react --version
   ```

---

## Solana Deployment

1. **Build Program**:
   ```bash
   anchor build
   ```

2. **Start Local Validator** (for testing):
   ```bash
   solana-test-validator &
   ```

3. **Deploy to Devnet**:
   ```bash
   anchor deploy --provider.cluster devnet
   anchor idl init --filepath target/idl/polymers_rewards.json $PROGRAM_ID --provider.cluster devnet
   ```

4. **Initialize Reward Vault**:
   ```bash
   anchor run initialize --args reward_amount:1000
   ```

---

## Ethereum Deployment (Wormhole)

Deploy `WrappedEsgNFT.sol`:
```javascript
// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const WrappedEsgNFT = await ethers.getContractFactory("WrappedEsgNFT");
  const contract = await WrappedEsgNFT.deploy(process.env.ETHEREUM_WORMHOLE);
  await contract.deployed();
  console.log("WrappedEsgNFT deployed to:", contract.address);
}

main();
```
Run:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Verify:
```bash
npx hardhat console --network sepolia
> const contract = await ethers.getContractAt("WrappedEsgNFT", "DEPLOYED_ADDRESS")
```

---

## Backend Documentation

### Overview
The backend is a Node.js API (`/api/rewards/deposit`) that:
- Validates IoT telemetry (e.g., amount, contamination).
- Performs TensorFlow.js-based fraud detection using an autoencoder.
- Submits valid telemetry to the Solana program (`mint_nft.rs`).
- Integrates with the relayer for Wormhole VAA retrieval and Ethereum bridging.
- Logs all actions to Supabase for analytics.

### Setup
1. **Install Dependencies**:
   ```bash
   cd api
   yarn add express @tensorflow/tfjs-node axios @supabase/supabase-js
   ```

2. **Run API**:
   ```bash
   node rewards/deposit.js
   ```

### API Endpoint
**`POST /api/rewards/deposit`**:
- **Input**: Telemetry JSON (e.g., `{ "amount": 1000, "contamination": 5, ... }`).
- **Processing**:
  - Runs TF.js autoencoder to detect fraud (e.g., `amount: 2000000` flagged).
  - Validates telemetry (e.g., `amount <= 1000000`).
  - Submits to Solana program via Anchor SDK.
- **Output**: `{ deposit_id: "xyz" }` or `{ error: "Fraud detected" }`.
- **Logs**: Stores telemetry, fraud scores, and errors in Supabase (`telemetry_logs`, `fraud_logs`).

**Example Code** (`api/rewards/deposit.js`):
```javascript
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
  const normalized = normalizeTelemetry(telemetry); // Custom fn
  const mse = computeMSE(autoencoder, normalized); // TF.js fraud check
  if (mse > threshold) {
    await supabase.from('fraud_logs').insert({ telemetry, mse, flagged: true });
    return res.status(400).json({ error: 'Fraud detected' });
  }
  try {
    const response = await axios.post('http://solana-program:8080/mint', telemetry); // Mock Solana endpoint
    await supabase.from('telemetry_logs').insert({ ...telemetry, deposit_id: response.data.deposit_id });
    res.json({ deposit_id: response.data.deposit_id });
  } catch (error) {
    await supabase.from('errors').insert({ error: 'Telemetry submission', details: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('API running on port 3000'));
```

### Security
- **Rate Limiting**: Cap requests (e.g., 100/day) to prevent abuse (`express-rate-limit`).
- **CORS**: Restrict to trusted origins (e.g., frontend domain).
- **Model Integrity**: Validate TF.js model weights to prevent poisoning.
- **Input Sanitization**: Check telemetry fields (e.g., `Number.isFinite(telemetry.amount)`).

---

## Frontend Documentation

### Overview
The frontend is a React-based dashboard that:
- Allows users to submit IoT telemetry via a form.
- Visualizes fraud detection results using TensorFlow.js and Recharts.
- Tracks NFT minting and bridging status (Solana → Ethereum).
- Queries Supabase for real-time analytics (e.g., compliance scores, fraud logs).

### Setup
1. **Install Dependencies**:
   ```bash
   cd frontend
   yarn add react react-dom @supabase/supabase-js @tensorflow/tfjs axios recharts
   yarn add -D vite
   ```

2. **Run Dashboard**:
   ```bash
   yarn dev
   ```

### Components
- **TelemetryForm.jsx**: Submits telemetry to `/api/rewards/deposit`.
- **FraudViz.jsx**: Runs TF.js autoencoder to visualize anomalies in real-time.
- **NftTracker.jsx**: Displays Solana NFT mints and Ethereum bridging status.

**Example Code** (`frontend/src/App.jsx`):
```jsx
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import { LineChart, Line, XAxis, YAxis } from 'recharts';
import TelemetryForm from './components/TelemetryForm';
import FraudViz from './components/FraudViz';
import NftTracker from './components/NftTracker';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

function App() {
  const [telemetry, setTelemetry] = useState(null);
  const [fraudScore, setFraudScore] = useState(null);

  const handleSubmit = async (data) => {
    const normalized = normalizeTelemetry(data); // Custom fn
    const autoencoder = await tf.loadLayersModel('/models/autoencoder.json');
    const mse = computeMSE(autoencoder, normalized);
    setFraudScore(mse);
    if (mse > 0.15) {
      await supabase.from('fraud_logs').insert({ telemetry: data, mse, flagged: true });
      return alert('Fraud detected!');
    }
    const response = await axios.post(import.meta.env.VITE_API_URL, data);
    setTelemetry(response.data);
  };

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
```

**`frontend/src/components/FraudViz.jsx`**:
```jsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';

function FraudViz({ score }) {
  const data = [{ name: 'Fraud Score', mse: score || 0 }];
  return (
    <div>
      <h2>Fraud Detection</h2>
      <LineChart width={400} height={200} data={data}>
        <Line type="monotone" dataKey="mse" stroke={score > 0.15 ? '#ff0000' : '#00ff00'} />
        <XAxis dataKey="name" />
        <YAxis />
      </LineChart>
    </div>
  );
}

export default FraudViz;
```

### Security
- **Input Validation**: Sanitize form inputs to prevent XSS.
- **Supabase Auth**: Use row-level security for user-specific data.
- **Model Loading**: Host TF.js models on secure CDN to avoid tampering.

---

## AI Compliance Scoring & Fraud Detection

### Telemetry Validation
Optimized with bitwise flags (~2,000 CUs):
```rust
fn validate_telemetry(deposit: &BatchDeposit) -> Result<(), CustomError> {
    let mut flags: u8 = 0;
    flags |= if deposit.amount > 0 && deposit.amount <= 1_000_000 { 0 } else { 1 << 0 };
    flags |= if deposit.contamination <= deposit.contamination_threshold { 0 } else { 1 << 1 };
    // ... other fields
    match flags {
        0 => Ok(()),
        1 => Err(CustomError::InvalidAmount),
        _ => Err(CustomError::InvalidTelemetry),
    }
}
```

### Compliance Score Calculation
Fixed-point arithmetic (~3,000 CUs):
```rust
fn calculate_compliance_score(deposit: &BatchDeposit) -> u64 {
    const SCALE: u64 = 1_000_000;
    const W_CONTAMINATION: u64 = 200_000;
    // ... other weights
    let c_score = if deposit.contamination <= deposit.contamination_threshold { SCALE } else { 0 };
    // ... other scores
    (W_CONTAMINATION * c_score + /* ... */) / SCALE
}
```

### Reward Calculation
Fixed-point math (~2,000 CUs):
```rust
fn calculate_rewards(deposit: &BatchDeposit, compliance_score: u64) -> (u64, u64, u64) {
    const SCALE: u64 = 1_000_000;
    let ply = (deposit.amount * 10 * SCALE * deposit.ply_multiplier * compliance_score) / (SCALE * SCALE);
    // ... carb, ewaste
    (ply, carb, ewaste)
}
```

### NFT Bridging
Optimized Wormhole payload (~8,000 CUs):
```rust
fn emit_wormhole_message<'info>(ctx: &Context<MintEsgNft>, nft_mint: Pubkey, target_chain: u16, recipient: [u8;32], esg_metrics: &EsgMetrics, compliance_score: u64) -> Result<(), CustomError> {
    let mut payload = [0u8; 82];
    payload[0..2].copy_from_slice(&[0u8, 1u8]);
    payload[2..34].copy_from_slice(&nft_mint.to_bytes());
    payload[34..66].copy_from_slice(&recipient);
    payload[66..74].copy_from_slice(&esg_metrics.carbon_offset.to_le_bytes());
    payload[74..82].copy_from_slice(&esg_metrics.recyclability.to_le_bytes());
    wormhole::cpi::publish_message(CpiContext::new(ctx.accounts.wormhole_program.to_account_info(), /* ... */), 1, payload)?;
    Ok(())
}
```

### TensorFlow.js Fraud Detection
Detects telemetry fraud (e.g., fake weights) in `/api/rewards/deposit` and frontend:
```javascript
// api/rewards/deposit.js or frontend/src/models/autoencoder.js
const tf = require('@tensorflow/tfjs-node');

const autoencoder = tf.model(/* Load trained model */);
const threshold = 0.15; // Mean + 3σ

async function detectFraud(telemetry) {
  const normalized = normalizeTelemetry(telemetry);
  const mse = computeMSE(autoencoder, normalized);
  if (mse > threshold) {
    await supabase.from('fraud_logs').insert({ telemetry, mse, flagged: true });
    throw new Error('Fraud detected');
  }
  return mse;
}
```
- **Training**: ~2min on 10k samples (Node.js).
- **Inference**: ~10ms with WebGL.
- **Integration**: Blocks fraudulent telemetry before Solana submission.

---

## Example Inputs

**Telemetry**:
```json
{
  "amount": 1000,
  "contamination": 5,
  "temperature": 25,
  "carbon_offset": 50,
  "recyclability": 80
}
```

**Fraudulent Telemetry**:
```json
{
  "amount": 2000000,
  "contamination": 50,
  "temperature": -10,
  "carbon_offset": 0,
  "recyclability": 20000
}
```

**NFT Minting**:
```json
{
  "target_chain": 2,
  "recipient": "0xAbc1234567890123456789012345678901234567",
  "metadata_uri": "https://example.com/nft_metadata.json"
}
```

---

## Testing

1. **Local Validator**:
   ```bash
   solana-test-validator &
   ```

2. **API Server**:
   ```bash
   cd api && node rewards/deposit.js
   ```

3. **Frontend Dashboard**:
   ```bash
   cd frontend && yarn dev
   ```

4. **Anchor Tests**:
   ```bash
   anchor test
   ```

5. **Relayer Tests**:
   ```bash
   cd relayer && yarn test
   ```

6. **Scenarios**:
   - **Valid Workflow**: Submits telemetry, mints NFT, retrieves VAA, mints wrapped NFT.
   - **Invalid Telemetry**: Fails on `amount: 2000000` (`InvalidAmount`).
   - **Fraudulent Telemetry**: Fails on TF.js detection (`Fraud detected`).
   - **Low Compliance Score**: Fails on high `contamination: 50` (`LowComplianceScore`).
   - **Invalid VAA**: Rejects malformed VAAs.
   - **CU Usage**: Verifies <1.4M CUs (`solana logs | grep "consumed"`).
   - **Network Delay**: Handles 5s VAA latency.

7. **Frontend Tests**:
   - Submit valid/fraudulent telemetry via `TelemetryForm`.
   - Visualize fraud scores in `FraudViz` (red for MSE > 0.15).
   - Track NFT status in `NftTracker`.

8. **Relayer Test Suite** (`relayer/test.ts`):
   ```typescript
   describe('Polymers Relayer Workflow', () => {
       it('should complete valid end-to-end workflow', async () => {
           const depositId = await submitTelemetry(validTelemetry);
           const mint = await triggerNftMint(depositId, validNft);
           const vaa = await mockVaa(mint, true);
           const txHash = await submitVaaToEthereum(vaa);
           expect(txHash).to.be.a('string');
       });
       it('should fail on fraudulent telemetry', async () => {
           try { await submitTelemetry(fraudulentTelemetry); expect.fail(); } catch (e) { expect(e.message).to.include('Fraud detected'); }
       });
       // ... other tests: low score, invalid VAA, CU usage, delay
   });
   ```

---

## Automated End-to-End Workflow

```bash
# Start API
cd api && node rewards/deposit.js

# Start frontend
cd frontend && yarn dev

# Submit telemetry
curl -X POST http://localhost:3000/api/rewards/deposit -H "Content-Type: application/json" -d '{"amount": 1000, "contamination": 5, "temperature": 25, "carbon_offset": 50, "recyclability": 80}'

# Mint NFT
anchor run mint_nft --args target_chain:2 recipient:0xAbc123 metadata_uri:https://example.com/nft_metadata.json

# Run relayer
cd relayer && yarn start

# Run tests
cd relayer && yarn test
```

---

## Workflow Diagram

```mermaid
flowchart TD
    A[IoT Telemetry] --> B[Frontend: Submit Telemetry]
    B --> C[Backend: TF.js Fraud Detection]
    C --> D{Fraud?}
    D -- Yes --> E[Reject]
    D -- No --> F[Validate Telemetry]
    F --> G{Valid?}
    G -- No --> H[Error]
    G -- Yes --> I[Calculate Compliance Score]
    I --> J[Compute Rewards]
    J --> K{Score >= 0.5?}
    K -- No --> L[No Rewards]
    K -- Yes --> M[Multi-Sig Approval]
    M --> N[Mint Tokens & NFT]
    N --> O[Emit Wormhole Message]
    O --> P[Relayer: Retrieve VAA]
    P --> Q[Ethereum: Mint Wrapped NFT]
    Q --> R[Supabase / Analytics]
```

---

## Wormhole Relayer Setup

Automates VAA delivery for ESG NFT bridging.

1. **Setup**:
   ```bash
   cd relayer
   yarn install
   ```

2. **Run Relayer**:
   ```bash
   yarn start
   ```

3. **Relayer Code** (`relayer.ts`):
   ```typescript
   import { Wormhole, ChainName } from '@wormhole-foundation/sdk';
   import { ethers } from 'ethers';
   import axios from 'axios';
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
   const wormhole = await Wormhole.connect({ /* ... */ });

   async function runEndToEndWorkflow(recipient: string) {
       const depositId = await axios.post(process.env.API_URL!, { amount: 1000, contamination: 5, /* ... */ });
       const mint = await triggerNftMint(depositId.data.deposit_id, recipient);
       const vaa = await retrieveVaa(mint);
       const txHash = await submitVaaToEthereum(vaa);
       await supabase.from('nft_bridges').insert({ tx_hash: txHash });
   }
   ```

4. **Test Scenarios**:
   - Valid workflow: Completes bridging.
   - Fraudulent telemetry: Rejects via TF.js.
   - Invalid telemetry: Fails validation.
   - Low score: Rejects minting.
   - Invalid VAA: Rejects Ethereum submission.
   - CU usage: Verifies <1.4M CUs.
   - Network delay: Handles 5s latency.

---

## Optimizations

- **Compute Units**: ~15,000–50,000 CUs saved using fixed-point math, bitwise validation, and batched CPIs.
- **Accounts**: PDAs and read-only accounts (~2,000 CUs saved).
- **Wormhole**: Fixed-size payloads (~2,000 CUs saved).
- **Off-Chain**: Precompute telemetry validation and fraud detection in `/api/rewards/deposit`.

---

## Security Considerations

- **Solana**: Audit fixed-point math for overflow; validate PDAs.
- **Wormhole**: Ensure payloads use `0x01` discriminator and `PROGRAM_ID`.
- **Backend**: Rate limit API (100/day); restrict CORS.
- **Frontend**: Sanitize inputs to prevent XSS; use Supabase row-level security.
- **TF.js**: Validate model weights to avoid poisoning.
- **General**: Monitor Wormhole Guardian risks (e.g., $320M exploit, 2022).<grok:render type="render_inline_citation"><argument name="citation_id">15</argument></grok:render>
- Log errors to Supabase/Sentry for alerts.

---

## Future Enhancements

- **TensorFlow.js**: Add LSTM for time-series telemetry fraud or Isolation Forests for batch scoring.
- **Wormhole SDK**: Batch VAA submissions.
- **Grafana**: Visualize fraud metrics, compliance scores, and bridging latency.
- **Versioned Transactions**: Optimize Solana fees.
- **Spy Daemon**: Real-time VAA subscription.
- **Audits**: Engage Trail of Bits for mainnet readiness.

---

## Contributing

1. Fork and clone.
2. Create branch: `git checkout -b feature/your-feature`.
3. Commit and push.
4. Open pull request.

Contact: `support@polymersprotocol.org`.

---

## License

MIT License (demo only). Do not deploy without testing and audits.
