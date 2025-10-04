# Polymers Protocol Rewards System

Status: Sample / Untested — Do not deploy to mainnet without testing and auditing.

A Solana-based rewards system that mints PLY, CARB, EWASTE tokens and ESG NFTs, calculates AI-driven compliance scores from IoT telemetry and ESG metrics, and bridges ESG NFTs to Ethereum via Wormhole.

⸻

Table of Contents
	1.	Features
	2.	Prerequisites
	3.	Environment Setup
	4.	Solana Program Deployment
	5.	Ethereum Contract Deployment
	6.	Usage / Example Inputs
	7.	Test Scripts
	8.	Workflow
	9.	Security Considerations
	10.	Disclaimer

⸻

Features
	•	AI-Driven Compliance Scoring: Validates IoT telemetry and ESG metrics to calculate a compliance score.
	•	Token Minting: Mint PLY, CARB, EWASTE tokens based on score.
	•	NFT Minting: Mint ESG NFTs on Solana if compliance score ≥ 0.5.
	•	Cross-Chain Bridging: Wormhole messages allow ESG NFTs to be minted on Ethereum as wrapped ERC-721.
	•	Multi-Sig Governance: Approvals via approve_mint.rs before minting.
	•	Analytics: Supabase integration for logging telemetry, mint events, and cross-chain activity.

⸻

Prerequisites
	•	Rust ≥ 1.70
	•	Solana CLI ≥ 1.18
	•	Anchor CLI ≥ 0.30
	•	Node.js ≥ 20 (for scripts)
	•	Hardhat ≥ 2.20 (for Ethereum deployment)

⸻

Environment Setup

Create a .env file:

# Solana
SOLANA_WALLET='[your_wallet_keypair]'
PROGRAM_ID='YourProgramIdHere'

# Wormhole
WORMHOLE_PROGRAM='worm2ZoG2kUd4vFXhvjh5UUAA9nV4fV3nq3b3U8f8'
ETHEREUM_WORMHOLE='0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B'

# Token Mints
PLY_MINT='[ply_mint_address]'
CARB_MINT='[carb_mint_address]'
EWASTE_MINT='[ewaste_mint_address]'
NFT_MINT='[nft_mint_address]'


⸻

Solana Program Deployment
	1.	Build the program:

anchor build

	2.	Deploy to devnet:

anchor deploy --provider.cluster devnet

	3.	Initialize IDL:

anchor idl init --filepath target/idl/polymers_rewards.json $PROGRAM_ID --provider.cluster devnet

	4.	Verify deployment:

solana program show $PROGRAM_ID


⸻

Ethereum Contract Deployment
	1.	Install Hardhat (if not installed):

npm install --save-dev hardhat

	2.	Deploy WrappedEsgNFT:

const { ethers } = require("hardhat");

async function main() {
  const WrappedEsgNFT = await ethers.getContractFactory("WrappedEsgNFT");
  const contract = await WrappedEsgNFT.deploy("0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B"); // Wormhole Core
  await contract.deployed();
  console.log("WrappedEsgNFT deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

	3.	Verify deployment:

npx hardhat console --network goerli
> const contract = await ethers.getContractAt("WrappedEsgNFT", "DEPLOYED_CONTRACT_ADDRESS")


⸻

Usage / Example Inputs

1. Solana: Mint ESG NFT

{
  "target_chain": 2, // Ethereum
  "recipient": "0xAbc123...EthereumAddress",
  "metadata_uri": "https://example.com/nft_metadata.json"
}

2. IoT Telemetry + ESG Metrics

{
  "amount": 1000,
  "contamination": 5,
  "temperature": 25,
  "carbon_offset": 50,
  "recyclability": 80
}

Example Workflow:
	1.	Submit telemetry via /api/rewards/deposit.
	2.	validate_telemetry() → checks ranges.
	3.	calculate_compliance_score() → returns score (0.85).
	4.	Multi-sig approval via approve_mint.rs.
	5.	Call mint_esg_nft() → emits Wormhole message.
	6.	Ethereum completeTransfer(encodedVaa) → mints wrapped ERC-721 NFT.

⸻

Test Scripts

1. Solana Local Test

solana-test-validator --reset
anchor test --skip-deploy

	•	Test validate_telemetry with valid and invalid inputs.
	•	Test mint_esg_nft with score ≥0.5 and <0.5.
	•	Verify emitted Wormhole message payload.

2. Ethereum Test

npx hardhat test

	•	Simulate submitting VAA.
	•	Verify completeTransfer mints NFT correctly.
	•	Confirm ESG metadata is stored correctly.

⸻

Workflow Diagram

flowchart TD
    A[IoT Telemetry + ESG Metrics] --> B[validate_telemetry]
    B --> C{Valid?}
    C -- No --> D[Error: InvalidTelemetry / InvalidEsgMetrics]
    C -- Yes --> E[calculate_compliance_score]
    E --> F[Compute Reward Amounts]
    F --> G{Score >= 0.5?}
    G -- No --> H[No Rewards]
    G -- Yes --> I[Multi-Sig Approval]
    I --> J[Mint Tokens: PLY, CARB, EWASTE]
    J --> K[mint_esg_nft]
    K --> L[emit_wormhole_message]
    L --> M[Guardians Sign VAA]
    M --> N[Ethereum: completeTransfer → Mint Wrapped NFT]
    N --> P[Supabase / Analytics]


⸻

Security Considerations
	•	Validate telemetry before minting.
	•	Verify compliance scoring thresholds.
	•	Enforce multi-sig approvals.
	•	Replay protection: ensure VAAs used only once.
	•	Audit mint_nft.rs and WrappedEsgNFT.sol.
	•	Monitor Wormhole Guardians network for centralization risks.

⸻

Disclaimer

⚠️ This is a sample/untested implementation.
	•	Do not deploy to mainnet without proper testing and audits.
	•	AI compliance scoring and cross-chain bridging are illustrative.
	•	Developer discretion required for production use.
