# Polymers Protocol Rewards System

**⚠️ Disclaimer: Sample / Untested Implementation**  
This is a demo implementation of an AI-driven rewards platform on Solana. The code, including AI compliance scoring, token/NFT minting, and Wormhole cross-chain bridging, is illustrative and **has not been tested or audited**. Do not deploy on mainnet without thorough testing, validation, and professional security audits. Use at your own risk.

## Overview

The Polymers Protocol Rewards System is a multi-tenant, AI-driven platform on Solana for minting **PLY**, **CARB**, **EWASTE** tokens, and **ESG NFTs** based on IoT telemetry and ESG metrics. It features:

- **AI-Driven Compliance Scoring**: Evaluates telemetry and ESG metrics to determine reward eligibility and amounts.
- **Multi-Tenant Support**: Partner-specific multipliers and thresholds for customized rewards.
- **Multi-Sig Governance**: Requires ≥2 admin approvals for token/NFT minting (via Squads).
- **Cross-Chain Bridging**: Emits events for ESG NFT bridging to Ethereum via Wormhole, with planned SDK integration.
- **Real-Time Analytics**: Integrates with Supabase for telemetry storage and Grafana dashboards.
- **Future Enhancements**: AI anomaly detection (TensorFlow.js), full Wormhole SDK, and OpenAPI specs.

⚠️ **Important**: All logic, weights, thresholds, and cross-chain functionality are illustrative. Test thoroughly on devnet/testnet before considering mainnet.

---

## Directory Structure

```
/programs/src
├── lib.rs              # Program entry point, routes instructions
├── errors.rs           # Custom errors (InvalidTelemetry, InvalidEsgMetrics, etc.)
├── state.rs            # Account structs (RewardVault, BatchDeposit, EsgMetrics)
├── instructions/
│   ├── mod.rs          # Instruction module declaration
│   ├── initialize.rs   # Initialize reward vault
│   ├── approve_mint.rs # Multi-sig approval logic
│   ├── mint_rewards.rs # Batch minting for PLY, CARB, EWASTE tokens
│   └── mint_nft.rs     # ESG NFT minting with Wormhole event emission
├── README.md           # This file
├── Cargo.toml          # Dependencies and program config
/tests
├── integration.rs      # Anchor test suite
/api
├── rewards
│   └── deposit.js      # API endpoint for telemetry submission
├── package.json        # Node.js dependencies
/Anchor.toml            # Anchor configuration
```

---

## Features

- **AI Compliance Scoring**: Calculates scores based on IoT telemetry (e.g., weight, contamination) and ESG metrics (e.g., carbon offset, recyclability). See `calculate_compliance_score` in `mint_rewards.rs`.
- **Token Minting**: Mints PLY, CARB, EWASTE tokens based on compliance scores and partner multipliers.
- **ESG NFT Minting**: Mints NFTs on Solana with Metaplex, emitting Wormhole events for Ethereum bridging.
- **Multi-Sig Governance**: Uses Squads for ≥2 admin approvals before minting.
- **Cross-Chain Support**: Emits Wormhole messages for ESG NFT bridging to Ethereum (future: full Wormhole SDK).
- **Analytics**: Logs telemetry, rewards, and NFT events to Supabase for Grafana dashboards.
- **Alerts**: Integrates with Sentry/Slack for error tracking.

---

## Prerequisites

- **Rust**: `rustc` and `cargo` (v1.68+).
- **Solana CLI**: `solana-cli` (v1.18+).
- **Anchor CLI**: `anchor` (v0.30+).
- **Node.js**: v16+ for API and Supabase integration.
- **Supabase CLI**: For analytics database setup.
- **Hardhat** (optional): For Ethereum-side contract deployment (Wormhole bridging).
- **Wormhole SDK**: For cross-chain NFT bridging.

Install dependencies:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
solana-install init 1.18.0
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
npm install -g @supabase/supabase-js
npm install -g hardhat
```

---

## Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-repo/polymers-rewards.git
   cd polymers-rewards
   npm install
   ```

2. **Configure Environment**:
   Create a `.env` file:
   ```bash
   SOLANA_WALLET='[your_wallet_keypair]'
   PROGRAM_ID='YourProgramIdHere'
   WORMHOLE_PROGRAM='worm2ZoG2kUd4vFXhvjh5UUAA9nV4fV3nq3b3U8f8'
   PLY_MINT='[ply_mint_address]'
   CARB_MINT='[carb_mint_address]'
   EWASTE_MINT='[ewaste_mint_address]'
   NFT_MINT='[nft_mint_address]'
   ETHEREUM_WORMHOLE='0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B'
   SUPABASE_URL='[your_supabase_url]'
   SUPABASE_KEY='[your_supabase_key]'
   ```

3. **Build Program**:
   ```bash
   anchor build
   ```

---

## Deployment

⚠️ **Warning**: Do not deploy to mainnet without testing and auditing. Use devnet or `solana-test-validator`.

1. **Start Local Validator** (for testing):
   ```bash
   solana-test-validator &
   ```

2. **Deploy to Devnet**:
   ```bash
   anchor deploy --provider.cluster devnet
   anchor idl init --filepath target/idl/polymers_rewards.json $PROGRAM_ID --provider.cluster devnet
   ```

3. **Initialize Reward Vault**:
   ```bash
   anchor run initialize --args reward_amount:1000
   ```

4. **Deploy Ethereum Contract** (for Wormhole bridging):
   Using Hardhat:
   ```javascript
   const { ethers } = require("hardhat");
   async function main() {
     const WrappedEsgNFT = await ethers.getContractFactory("WrappedEsgNFT");
     const contract = await WrappedEsgNFT.deploy(process.env.ETHEREUM_WORMHOLE);
     await contract.deployed();
     console.log("WrappedEsgNFT deployed to:", contract.address);
   }
   main();
   ```

---

## AI-Driven Compliance Scoring

The system evaluates IoT telemetry and ESG metrics to calculate a compliance score, determining reward eligibility and amounts.

### Key Functions (in `mint_rewards.rs` and `mint_nft.rs`)

1. **Telemetry Validation**:
   ```rust
   fn validate_telemetry(deposit: &BatchDeposit) -> Result<(), CustomError> {
       if deposit.amount == 0 || deposit.amount > 1_000_000 { return Err(CustomError::InvalidAmount); }
       if deposit.contamination > deposit.contamination_threshold
           || deposit.temperature < deposit.min_temperature
           || deposit.temperature > deposit.max_temperature
           || deposit.humidity < deposit.min_humidity
           || deposit.humidity > deposit.max_humidity
           || deposit.vibration > deposit.max_vibration
           || deposit.fill_level > deposit.max_fill_level
       { return Err(CustomError::InvalidTelemetry); }
       if deposit.esg_metrics.carbon_offset == 0 || deposit.esg_metrics.recyclability > 10_000 {
           return Err(CustomError::InvalidEsgMetrics);
       }
       Ok(())
   }
   ```

2. **Compliance Scoring**:
   ```rust
   fn calculate_compliance_score(deposit: &BatchDeposit) -> f64 {
       let w_contamination = 0.2; let w_temperature = 0.2; let w_humidity = 0.1;
       let w_vibration = 0.1; let w_fill_level = 0.1; let w_esg = 0.3;
       let c_score = if deposit.contamination <= deposit.contamination_threshold { 1.0 } else { 0.0 };
       let t_score = if deposit.temperature >= deposit.min_temperature && deposit.temperature <= deposit.max_temperature { 1.0 } else { 0.0 };
       let h_score = if deposit.humidity >= deposit.min_humidity && deposit.humidity <= deposit.max_humidity { 1.0 } else { 0.0 };
       let v_score = if deposit.vibration <= deposit.max_vibration { 1.0 } else { 0.0 };
       let f_score = if deposit.fill_level <= deposit.max_fill_level { 1.0 } else { 0.0 };
       let esg_score = ((deposit.esg_metrics.carbon_offset as f64) * 0.5 + (deposit.esg_metrics.recyclability as f64) * 0.5) / 10_000.0;
       w_contamination * c_score + w_temperature * t_score + w_humidity * h_score +
       w_vibration * v_score + w_fill_level * f_score + w_esg * esg_score
   }
   ```

3. **Reward Calculation**:
   ```rust
   fn calculate_rewards(deposit: &BatchDeposit, compliance_score: f64) -> (u64, u64, u64) {
       let ply = ((deposit.amount as f64 * 10.0 * deposit.ply_multiplier * compliance_score) * 1_000_000.0) as u64;
       let carb = ((deposit.amount as f64 * 5.0 * deposit.carb_multiplier * compliance_score) * 1_000_000.0) as u64;
       let ewaste = ((deposit.amount as f64 * 2.0 * deposit.ewaste_multiplier * compliance_score) * 1_000_000.0) as u64;
       (ply, carb, ewaste)
   }
   ```

4. **Wormhole NFT Bridging**:
   ```rust
   fn emit_wormhole_message<'info>(
       ctx: &Context<MintEsgNft>,
       nft_mint: Pubkey,
       target_chain: u16,
       recipient: [u8; 32],
       esg_metrics: &EsgMetrics,
       compliance_score: f64,
   ) -> Result<(), CustomError> {
       let payload = vec![
           vec![0u8, 1u8], // Discriminator
           nft_mint.to_bytes().to_vec(),
           recipient.to_vec(),
           esg_metrics.carbon_offset.to_le_bytes().to_vec(),
           esg_metrics.recyclability.to_le_bytes().to_vec(),
           (compliance_score * 1_000_000.0).to_le_bytes().to_vec(),
       ].concat();
       let cpi_accounts = wormhole::cpi::accounts::PublishMessage { /* ... */ };
       wormhole::cpi::publish_message(CpiContext::new(ctx.accounts.wormhole_program.to_account_info(), cpi_accounts), 1, payload)?;
       Ok(())
   }
   ```

---

## Testing

⚠️ **Warning**: Tests are illustrative and untested. Run on `solana-test-validator` or devnet.

1. **Start Local Validator**:
   ```bash
   solana-test-validator &
   ```

2. **Run Anchor Tests**:
   ```bash
   anchor test
   ```

3. **Test Scenarios**:
   - **Vault Initialization**: Verify `initialize.rs` sets up `RewardVault`.
   - **Telemetry Validation**: Test valid/invalid inputs (e.g., `contamination > threshold`).
   - **Compliance Scoring**: Ensure scores align with weights (e.g., `0.85` for valid telemetry).
   - **Token Minting**: Validate PLY, CARB, EWASTE minting with `mint_rewards.rs`.
   - **NFT Bridging**: Test `mint_nft.rs` for NFT minting and Wormhole message emission.
   - **Cross-Chain**: Simulate VAA submission to Ethereum (Hardhat) for wrapped NFT minting.
   - **Multi-Sig**: Test approval failures (<2 approvals).

4. **Cross-Chain Testing**:
   - Use Wormhole Explorer (wormhole.com/explorer) to verify VAA emission.
   - Deploy `WrappedEsgNFT.sol` on Ethereum testnet and submit VAA.

---

## Integration Points

- **API**: `/api/rewards/deposit` (Node.js) validates telemetry and queues `BatchDeposit` structs for minting.
- **Supabase**: Stores telemetry, ESG metrics, reward logs, and cross-chain events.
- **Dashboard**: Grafana (planned) visualizes compliance scores, token/NFT minting, and bridging.
- **Wormhole**: Emits messages for ESG NFT bridging to Ethereum; future SDK for automation.
- **Alerts**: Sentry/Slack for error tracking (e.g., `InvalidTelemetry`).

---

## Cross-Chain Bridging with Wormhole

The system emits Wormhole messages in `mint_nft.rs` for ESG NFT bridging to Ethereum. Future enhancements include full Wormhole SDK integration.

### Solana-Side Setup
- Add to `Anchor.toml`:
  ```toml
  [programs.devnet]
  polymers_rewards = "YourProgramIdHere"
  wormhole = "worm2ZoG2kUd4vFXhvjh5UUAA9nV4fV3nq3b3U8f8"
  ```
- Payload includes NFT mint, ESG metrics, and compliance score.

### Ethereum-Side Setup
- Deploy `WrappedEsgNFT.sol`:
  ```solidity
  contract WrappedEsgNFT is ERC721, Wormhole {
      function completeTransfer(bytes memory encodedVaa) external {
          (Wormhole.VM memory vm, bool valid, string memory reason) = verifyVAA(encodedVaa);
          require(valid, reason);
          // Parse payload and mint ERC-721
      }
  }
  ```

### Manual Bridging
- Use [portalbridge.com](https://portalbridge.com) for user-facing NFT transfers.
- Select Solana → Ethereum, approve, and claim wrapped NFT.

---

## Future Enhancements

- **AI Anomaly Detection**: Integrate TensorFlow.js for predictive fraud detection in telemetry.
- **Full Wormhole SDK**: Automate VAA submission with relayers.
- **Grafana Dashboards**: Visualize compliance scores, ESG metrics, and cross-chain transfers.
- **OpenAPI Specs**: Extend `/api/rewards/deposit` for NFT bridging endpoints.
- **Security Audits**: Engage firms like Trail of Bits for mainnet readiness.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m "Add feature"`.
4. Push branch: `git push origin feature/your-feature`.
5. Open a pull request.

Report issues or contact: `support@polymersprotocol.com`.

---

## License

MIT License (sample implementation).

⚠️ **Reminder**: This is a demo. Do not deploy without testing, validation, and audits.

---

### Notes for Developers
- **Testing**: Start with `solana-test-validator` and devnet. Verify all functions (`validate_telemetry`, `calculate_compliance_score`, `mint_rewards`, `mint_nft`) locally.
- **Security**: Audit for reentrancy, overflow, and unauthorized access. Wormhole’s past exploits (e.g., $320M in 2022) highlight the need for caution.
- **Analytics**: Set up Supabase and Grafana for real-time insights.
- **Cross-Chain**: Test Wormhole integration end-to-end using devnet and Ethereum testnet.
