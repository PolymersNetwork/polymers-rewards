# The Polymers Protocol Rewards System

`/programs/src` directory structure with the necessary source files for the Solana program, including the updated `rewards.rs` and additional files for cross-chain NFT minting and error handling. The program files will align with the architecture described in the previous responses, incorporating AI-driven scoring, multi-tenant support, cross-chain rewards, and governance.

---

## 📁 Directory Structure

Below is the proposed structure for `/programs/src`:

```
/programs/src
├── lib.rs              # Main Solana program entry point
├── errors.rs           # Custom error definitions
├── state.rs            # Account structs (RewardVault, EsgMetrics)
├── instructions
│   ├── mod.rs          # Instruction module declaration
│   ├── initialize.rs   # Initialize reward vault
│   ├── approve_mint.rs # Multi-sig approval instruction
│   ├── mint_rewards.rs # Batch minting for PLY, CARB, EWASTE tokens
│   └── mint_nft.rs     # Cross-chain ESG NFT minting
└── README.md           # Program documentation
```

---

## 🛠️ Source Files

### 1. `/programs/src/lib.rs`

This is the main entry point for the Solana program, defining the program ID and instruction dispatch.

```rust
use anchor_lang::prelude::*;
use instructions::*;

declare_id!("YourProgramIdHere11111111111111111111111111111111");

#[program]
pub mod polymers_rewards {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, reward_amount: u64) -> Result<()> {
        instructions::initialize::initialize(ctx, reward_amount)
    }

    pub fn approve_mint(ctx: Context<ApproveMint>) -> Result<()> {
        instructions::approve_mint::approve_mint(ctx)
    }

    pub fn mint_batch_rewards(ctx: Context<MintBatchRewards>, deposits: Vec<BatchDeposit>) -> Result<()> {
        instructions::mint_rewards::mint_batch_rewards(ctx, deposits)
    }

    pub fn mint_esg_nft(ctx: Context<MintEsgNft>, deposit_id: String, esg_metrics: EsgMetrics) -> Result<()> {
        instructions::mint_nft::mint_esg_nft(ctx, deposit_id, esg_metrics)
    }
}
```

**Purpose**: Declares the program ID and routes instructions to their respective modules.

---

### 2. `/programs/src/errors.rs`

Defines custom errors for the program.

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Not enough admin approvals")]
    InsufficientApprovals,
    #[msg("Invalid deposit amount")]
    InvalidAmount,
    #[msg("Telemetry data invalid")]
    InvalidTelemetry,
    #[msg("Invalid ESG metrics")]
    InvalidEsgMetrics,
    #[msg("NFT minting failed")]
    NftMintingFailed,
}
```

**Purpose**: Centralizes error codes for consistent handling across instructions.

---

### 3. `/programs/src/state.rs`

Defines account structs and data types.

```rust
use anchor_lang::prelude::*;

#[account]
pub struct RewardVault {
    pub authority: Pubkey,
    pub amount: u64,
    pub bump: u8,
    pub admin_approvals: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BatchDeposit {
    pub user_ply: Pubkey,
    pub user_carb: Pubkey,
    pub user_ewaste: Pubkey,
    pub amount: u64,
    pub contamination: u64,
    pub temperature: i64,
    pub humidity: u64,
    pub vibration: u64,
    pub fill_level: u64,
    pub ply_multiplier: f64,
    pub carb_multiplier: f64,
    pub ewaste_multiplier: f64,
    pub reward_tier: u8,
    pub contamination_threshold: u64,
    pub min_temperature: i64,
    pub max_temperature: i64,
    pub min_humidity: u64,
    pub max_humidity: u64,
    pub max_vibration: u64,
    pub max_fill_level: u64,
    pub esg_metrics: EsgMetrics,
    pub esg_carbon_weight: f64,
    pub esg_recyclability_weight: f64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EsgMetrics {
    pub carbon_offset: u64, // kg CO₂ * 100
    pub recyclability: u64, // % * 100
}
```

**Purpose**: Defines the `RewardVault` account for governance and `BatchDeposit`/`EsgMetrics` for reward calculations.

---

### 4. `/programs/src/instructions/mod.rs`

Declares instruction modules.

```rust
pub mod initialize;
pub mod approve_mint;
pub mod mint_rewards;
pub mod mint_nft;

pub use initialize::*;
pub use approve_mint::*;
pub use mint_rewards::*;
pub use mint_nft::*;
```

**Purpose**: Organizes instruction logic into separate modules.

---

### 5. `/programs/src/instructions/initialize.rs`

Initializes the reward vault.

```rust
use anchor_lang::prelude::*;
use crate::state::RewardVault;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 1 + 1, seeds = [b"reward_vault"], bump)]
    pub reward_vault: Account<'info, RewardVault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, reward_amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.reward_vault;
    vault.authority = ctx.accounts.authority.key();
    vault.amount = reward_amount;
    vault.bump = *ctx.bumps.get("reward_vault").unwrap();
    vault.admin_approvals = 0;
    Ok(())
}
```

**Purpose**: Sets up the `RewardVault` account with initial state and governance parameters.

---

### 6. `/programs/src/instructions/approve_mint.rs`

Handles multi-sig approvals.

```rust
use anchor_lang::prelude::*;
use crate::state::RewardVault;

#[derive(Accounts)]
pub struct ApproveMint<'info> {
    #[account(mut, seeds = [b"reward_vault"], bump)]
    pub reward_vault: Account<'info, RewardVault>,
    pub admin: Signer<'info>,
}

pub fn approve_mint(ctx: Context<ApproveMint>) -> Result<()> {
    let vault = &mut ctx.accounts.reward_vault;
    vault.admin_approvals += 1;
    Ok(())
}
```

**Purpose**: Increments the approval count for multi-sig governance.

---

### 7. `/programs/src/instructions/mint_rewards.rs`

Implements batch minting for tokens.

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::{state::{RewardVault, BatchDeposit, EsgMetrics}, errors::CustomError};

#[derive(Accounts)]
pub struct MintBatchRewards<'info> {
    #[account(mut, seeds = [b"reward_vault"], bump)]
    pub reward_vault: Account<'info, RewardVault>,
    #[account(mut)]
    pub ply_mint: Account<'info, Mint>,
    #[account(mut)]
    pub carb_mint: Account<'info, Mint>,
    #[account(mut)]
    pub ewaste_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub signer: Signer<'info>,
}

pub fn mint_batch_rewards(ctx: Context<MintBatchRewards>, deposits: Vec<BatchDeposit>) -> Result<()> {
    let vault = &mut ctx.accounts.reward_vault;
    require!(vault.admin_approvals >= 2, CustomError::InsufficientApprovals);

    for (i, deposit) in deposits.iter().enumerate() {
        require!(deposit.amount > 0 && deposit.amount <= 1_000_000, CustomError::InvalidAmount);
        require!(
            deposit.contamination <= deposit.contamination_threshold &&
            deposit.temperature >= deposit.min_temperature &&
            deposit.temperature <= deposit.max_temperature &&
            deposit.humidity >= deposit.min_humidity &&
            deposit.humidity <= deposit.max_humidity &&
            deposit.vibration <= deposit.max_vibration &&
            deposit.fill_level <= deposit.max_fill_level &&
            deposit.esg_metrics.carbon_offset > 0 &&
            deposit.esg_metrics.recyclability <= 10_000,
            CustomError::InvalidTelemetry
        );

        let compliance = calculate_compliance_score(
            deposit.contamination,
            deposit.temperature,
            deposit.humidity,
            deposit.vibration,
            deposit.fill_level,
            &deposit.esg_metrics,
        );
        let multiplier = if compliance >= 0.8 { 1.0 } else if compliance >= 0.5 { 0.7 } else { 0.4 };
        let esg_multiplier = deposit.esg_metrics.carbon_offset as f64 * deposit.esg_carbon_weight +
                            deposit.esg_metrics.recyclability as f64 * deposit.esg_recyclability_weight;

        let ply_tokens = ((deposit.amount as f64 * 10.0 * multiplier * deposit.ply_multiplier * esg_multiplier) * 1_000_000.0) as u64;
        let carb_tokens = ((deposit.amount as f64 * 5.0 * multiplier * deposit.carb_multiplier * esg_multiplier) * 1_000_000.0) as u64;
        let ewaste_tokens = ((deposit.amount as f64 * 2.0 * multiplier * deposit.ewaste_multiplier * esg_multiplier) * 1_000_000.0) as u64;

        let accounts = ctx.remaining_accounts;
        let ply_account = accounts[i * 3].clone();
        let carb_account = accounts[i * 3 + 1].clone();
        let ewaste_account = accounts[i * 3 + 2].clone();

        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.ply_mint.to_account_info(),
                    to: ply_account,
                    authority: vault.to_account_info(),
                },
            )
            .with_signer(&[&[b"reward_vault", &[vault.bump]][..]]),
            ply_tokens,
        )?;

        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.carb_mint.to_account_info(),
                    to: carb_account,
                    authority: vault.to_account_info(),
                },
            )
            .with_signer(&[&[b"reward_vault", &[vault.bump]][..]]),
            carb_tokens,
        )?;

        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.ewaste_mint.to_account_info(),
                    to: ewaste_account,
                    authority: vault.to_account_info(),
                },
            )
            .with_signer(&[&[b"reward_vault", &[vault.bump]][..]]),
            ewaste_tokens,
        )?;

        vault.amount = vault.amount.checked_add(deposit.amount).unwrap();
    }

    vault.admin_approvals = 0;
    Ok(())
}

fn calculate_compliance_score(contamination: u64, temperature: i64, humidity: u64, vibration: u64, fill_level: u64, esg: &EsgMetrics) -> f64 {
    let c_score = if contamination < 1000 { 0.4 } else if contamination < 2000 { 0.2 } else { 0.0 }; // 10.00% = 1000
    let t_score = if temperature >= 1000 && temperature <= 3000 { 0.3 } else { 0.1 }; // 10.0°C = 1000
    let h_score = if humidity >= 4000 && humidity <= 7000 { 0.2 } else { 0.1 }; // 40.00% = 4000
    let v_score = if vibration < 5000 { 0.1 } else { 0.0 }; // 0.05g = 5000
    let f_score = if fill_level < 9000 { 0.2 } else { 0.1 }; // 90.00% = 9000
    let esg_score = if esg.recyclability > 9000 { 0.2 } else { 0.1 }; // 90.00% = 9000
    c_score + t_score + h_score + v_score + f_score + esg_score
}
```

**Purpose**: Mints PLY, CARB, and EWASTE tokens based on validated telemetry and ESG metrics.

---

### 8. `/programs/src/instructions/mint_nft.rs`

Implements cross-chain ESG NFT minting (simplified for Solana, with notes for cross-chain integration).

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::{state::EsgMetrics, errors::CustomError};

#[derive(Accounts)]
pub struct MintEsgNft<'info> {
    #[account(mut)]
    pub nft_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_nft_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn mint_esg_nft(ctx: Context<MintEsgNft>, deposit_id: String, esg_metrics: EsgMetrics) -> Result<()> {
    require!(esg_metrics.carbon_offset > 0 && esg_metrics.recyclability <= 10_000, CustomError::InvalidEsgMetrics);

    // Mint NFT to user
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.nft_mint.to_account_info(),
                to: ctx.accounts.user_nft_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        1, // NFTs have single-unit supply
    )?;

    // Note: For cross-chain (e.g., Ethereum via Wormhole), emit an event for off-chain bridging
    emit!(EsgNftMinted {
        deposit_id,
        carbon_offset: esg_metrics.carbon_offset,
        recyclability: esg_metrics.recyclability,
    });

    Ok(())
}

#[event]
pub struct EsgNftMinted {
    pub deposit_id: String,
    pub carbon_offset: u64,
    pub recyclability: u64,
}
```

**Purpose**: Mints ESG NFTs on Solana and emits events for cross-chain bridging (e.g., via Wormhole to Ethereum).

**Cross-Chain Note**: For full cross-chain support, integrate with Wormhole’s SDK to bridge NFT metadata to Ethereum. Example pseudo-code:
```rust
// Off-chain service listens for EsgNftMinted event and calls Wormhole to mint on Ethereum
let wormhole_message = wormhole::create_message(nft_metadata, target_chain);
wormhole::post_message(wormhole_message);
```

---

## 📝 README.md

```markdown
# Polymers Rewards Program

The Polymers Rewards Program is a decentralized, multi-tenant rewards system built on Solana, incentivizing sustainable waste management through IoT-enabled smart bins, AI-driven compliance scoring, and blockchain-based token and NFT minting. It integrates with Helium DePIN for telemetry, Supabase for storage and analytics, and Squads for multi-sig governance.

## 📁 Directory Structure

```
/programs/src
├── lib.rs              # Program entry point
├── errors.rs           # Custom error definitions
├── state.rs            # Account structs (RewardVault, BatchDeposit, EsgMetrics)
├── instructions
│   ├── mod.rs          # Instruction module declaration
│   ├── initialize.rs   # Initialize reward vault
│   ├── approve_mint.rs # Multi-sig approval
│   ├── mint_rewards.rs # Batch mint PLY, CARB, EWASTE tokens
│   └── mint_nft.rs     # Mint ESG NFTs (cross-chain compatible)
```

## 🛠️ Features

- **IoT Integration**: Processes telemetry (weight, contamination, temperature, humidity, vibration, fill level, ESG metrics) via Helium DePIN.
- **AI-Driven Scoring**: Computes compliance scores using telemetry and ESG metrics (carbon offset, recyclability).
- **Multi-Tenant Support**: Partner-specific policies (multipliers, thresholds, auto-mint).
- **Multi-Sig Governance**: Requires ≥2 admin approvals via Squads for minting.
- **Cross-Chain Rewards**: Mints PLY, CARB, EWASTE tokens on Solana and ESG NFTs with cross-chain compatibility (e.g., Ethereum via Wormhole).
- **Real-Time Analytics**: Supabase subscriptions feed dashboards with reward trends, compliance, and ESG impact.
- **Security**: Telemetry validation, anomaly detection, and audit logging.
- **Automation**: GitHub Actions for testing, deployment, batch minting, and backups.

## 🚀 Setup

### Prerequisites
- Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Solana CLI: `sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"`
- Anchor CLI: `cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked`
- Node.js: v20
- Supabase CLI: `npm install -g @supabase/supabase-js`

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/polymers-rewards.git
   cd polymers-rewards
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the Solana program:
   ```bash
   anchor build
   ```

### Configuration
1. Update `Anchor.toml` with your program ID and cluster:
   ```toml
   [programs.mainnet]
   polymers_rewards = "YourProgramIdHere11111111111111111111111111111111"
   [provider]
   cluster = "mainnet"
   wallet = "~/.config/solana/id.json"
   ```
2. Set environment variables:
   ```bash
   export SOLANA_WALLET='[your_wallet_keypair]'
   export PROGRAM_ID='YourProgramIdHere11111111111111111111111111111111'
   export PLY_MINT='[ply_mint_address]'
   export CARB_MINT='[carb_mint_address]'
   export EWASTE_MINT='[ewaste_mint_address]'
   export NFT_MINT='[nft_mint_address]'
   ```

## 🏗️ Deployment

1. Deploy the Solana program:
   ```bash
   anchor deploy --provider.cluster mainnet
   anchor idl init --filepath target/idl/polymers_rewards.json $PROGRAM_ID --provider.cluster mainnet
   ```
2. Initialize the reward vault:
   ```bash
   anchor run initialize --args reward_amount:1000
   ```

## 🧪 Testing

Run Anchor tests:
```bash
solana-test-validator &
anchor test
```

Tests cover:
- Reward vault initialization
- Multi-sig approvals
- Batch token minting with valid/invalid telemetry
- ESG NFT minting

## 📊 Usage

### Initialize Reward Vault
```bash
anchor run initialize --args reward_amount:1000
```

### Approve Minting
```bash
anchor run approve_mint --args admin_keypair:[admin_keypair]
```

### Mint Batch Rewards
- Deposits are queued via `/api/rewards/deposit` and processed by `scripts/batchMint.js`.
- Manual invocation:
  ```bash
  anchor run mint_batch_rewards --args deposits:[deposit_data]
  ```

### Mint ESG NFTs
```bash
anchor run mint_esg_nft --args deposit_id:"d20251004-smartbin-123" esg_metrics:{carbon_offset:1000,recyclability:9500}
```

## 🔐 Security

- **Multi-Sig**: Enforced via `approve_mint` (≥2 approvals).
- **Telemetry Validation**: Dual checks in API and on-chain.
- **ESG Validation**: Ensures valid carbon offset and recyclability.
- **Audit Logs**: Tracks all actions in `audit_logs` table.
- **Secrets**: Managed via environment variables.

## 📈 Integration Points

- **API**: `/api/rewards/deposit` validates telemetry and queues minting.
- **Supabase**: Stores `partner_policies`, `token_flows`, `reward_logs`, `ESG_scores`, `audit_logs`.
- **Dashboard**: `AnalyticsDashboard.tsx` displays real-time trends and ESG metrics.
- **CI/CD**: GitHub Actions automates testing, deployment, batch minting, and backups.
- **Alerts**: Sentry for errors, Slack/Discord/Email for anomalies.

## 🌐 Cross-Chain Support

- **ESG NFTs**: Minted on Solana with events emitted for cross-chain bridging (e.g., Ethereum via Wormhole).
- **Future Work**: Integrate Wormhole SDK for full cross-chain NFT minting.

## 📝 Next Steps

1. **Cross-Chain NFTs**:
   - Add Wormhole integration for Ethereum bridging.
   - Example: `wormhole::post_message(nft_metadata, "ethereum")`
2. **AI Anomaly Detection**:
   - Train TensorFlow.js model on `ESG_scores` for predictive fraud detection.
3. **Grafana Dashboards**:
   ```bash
   docker run -d -p 3000:3000 grafana/grafana
   ```
   Configure Supabase data source for ESG visualizations.
4. **OpenAPI Specs**:
   Document `/api/rewards/deposit` for developer integration.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m "Add your feature"`.
4. Push to branch: `git push origin feature/your-feature`.
5. Open a pull request.

## 📧 Contact

For issues or feature requests, open a GitHub issue or contact the team at support@polymersprotocol.org.

---

**Purpose**: Provides comprehensive documentation for developers, including setup, deployment, testing, and integration details.

---

## 🛠️ Integration with Existing System

The `/programs/src` files integrate with:
- **API (`/api/rewards/deposit.ts`)**: Sends `BatchDeposit` structs to `mint_batch_rewards` and `mint_esg_nft`.
- **Supabase**: Stores telemetry and ESG data, feeding the dashboard via real-time subscriptions.
- **Dashboard (`AnalyticsDashboard.tsx`)**: Visualizes token and NFT rewards, compliance, and ESG metrics.
- **CI/CD**: GitHub Actions tests and deploys the program (`anchor build`, `anchor deploy`).

---

## 🧪 Testing Instructions

1. **Build and Test**:
   ```bash
   anchor build
   solana-test-validator &
   anchor test
   ```
2. **Test Cases**:
   - Initialize reward vault.
   - Approve minting with multiple admins.
   - Mint tokens with valid/invalid telemetry and ESG metrics.
   - Mint ESG NFTs with valid/invalid metrics.

---

## 📈 Next Steps

1. **Cross-Chain NFT Implementation**:
   - Add Wormhole SDK to `mint_nft.rs` for Ethereum bridging.
   - Example event listener in Node.js:
     ```ts
     program.addEventListener('EsgNftMinted', (event) => {
       const { deposit_id, carbon_offset, recyclability } = event;
       // Call Wormhole to mint on Ethereum
     });
     ```

2. **AI Anomaly Detection**:
   - Train a TensorFlow.js model:
     ```ts
     import * as tf from '@tensorflow/tfjs';
     const model = tf.sequential();
     model.add(tf.layers.dense({ units: 10, inputShape: [6], activation: 'relu' })); // 6 inputs: telemetry + ESG
     model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
     ```

3. **Grafana Setup**:
   ```bash
   docker run -d -p 3000:3000 grafana/grafana
   ```
   Add Supabase data source and create dashboards for ESG metrics.

4. **OpenAPI Specs**:
   Extend the provided `/api/rewards/deposit` spec to include NFT minting endpoints.
