# 🎓 ScholarChain — Decentralized Scholarship Selection System

> A blockchain-based scholarship platform that combines **automatic merit-based selection** with **human verification** to eliminate opacity and manipulation from university scholarship processes.

***

## 📌 Problem Statement

Traditional scholarship selection suffers from:
- **Opaque decision-making** — students cannot verify if their data was reviewed honestly
- **Single point of manipulation** — one administrator controls all decisions with no accountability
- **False data risk** — purely automatic CGPA-based selection is vulnerable to forged records

ScholarChain solves this by combining **on-chain transparency**, **multi-verifier consensus**, and **automatic ETH distribution** — removing human bias from final selection entirely.

***

## ✅ Features Implemented

### 🔐 Smart Contract (`ScholarshipSelection.sol`)
- **Admin-controlled setup** — sets minimum CGPA threshold, scholarship ETH amount per student, and application window duration using block timestamp
- **On-chain student applications** — students submit their wallet address and CGPA directly to the blockchain
- **CGPA threshold enforcement** — applications below the minimum CGPA are immediately and automatically rejected
- **Application window enforcement** — late applications after the deadline are rejected at the contract level
- **3-verifier registration** — admin registers exactly 3 verifier wallets at deployment
- **2-of-3 verification consensus** — a student's application enters the eligible pool only when at least 2 out of 3 registered verifiers confirm their CGPA
- **Duplicate verification prevention** — each verifier can act on each student exactly once; duplicate calls are rejected
- **Automatic top-10% selection** — after window closes, contract ranks all verified eligible applicants by CGPA and selects the top 10% (minimum 1 if pool is small)
- **Direct ETH distribution** — selected students receive the fixed scholarship amount directly to their wallets via `call{value}` — no manual admin step
- **Fully public results** — all CGPA values, verification history, confirmation counts, and selection status are publicly readable after finalization
- **Contract pre-funding** — contract is funded with enough ETH at deployment to cover all potential payouts

### 🖥️ Frontend DApp (`scholarship-dapp.html`)
- **Single-file DApp** — entire frontend in one portable HTML file, no build tools or server required
- **MetaMask integration** — connects via Web3.js to any injected provider
- **Contract loader** — paste any deployed contract address to instantly connect
- **Dashboard** — live KPIs: total applicants, verified count, selected count, contract ETH balance
- **Admin Panel** — close window button + run selection & distribute ETH button with status indicators
- **Student Apply page** — CGPA submission form with live status checker for any address
- **Verifier Panel** — table of all applicants with per-student Confirm ✅ / Reject ❌ buttons
- **Results page** — winner cards with CGPA ranking + ETH sent confirmation, full report table
- **Dark/Light mode toggle** — persists per session
- **Toast notifications** — real-time feedback for all transactions
- **Account switching detection** — auto-detects MetaMask account changes

***

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity `^0.8.19` |
| Blockchain Network | Ethereum (Ganache local testnet) |
| Web3 Library | Web3.js `1.10.0` (CDN) |
| Wallet | MetaMask browser extension |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript |
| IDE | Remix IDE (online) |
| Fonts | Google Fonts — Inter, JetBrains Mono |

***

## ⛓️ Blockchain Details

| Property | Value |
|---|---|
| **Type** | Private permissioned Ethereum blockchain |
| **Network** | Ganache local testnet |
| **RPC URL** | `http://127.0.0.1:7545` |
| **Chain ID** | `1337` |
| **Consensus** | Proof of Work (Ganache) |
| **Language** | Solidity 0.8.19 |

***

## 📄 Smart Contract Functions

| Function | Access | Description |
|---|---|---|
| `constructor(verifiers, minCGPA, amount, duration)` | Deploy-time | Sets up contract, registers verifiers, starts window, accepts ETH funding |
| `submitApplication(uint256 cgpa)` | Student | Submits CGPA; rejects if below threshold or window closed |
| `verifyStudent(address student, bool confirm)` | Verifier only | Confirms or rejects a student's CGPA; prevents duplicates |
| `closeWindow()` | Admin only | Closes the application window permanently |
| `runSelection()` | Admin only | Sorts verified pool by CGPA, selects top 10%, sends ETH to each winner |
| `getApplicants()` | Public | Returns array of all applicant addresses |
| `getApplicationDetails(address)` | Public | Returns CGPA, verified status, selected status, confirmation count |
| `contractBalance()` | Public | Returns current ETH balance of the contract |

***

## 🧪 Test Setup (Ganache)

Tested with **8 wallets** on Ganache:

| Wallet | Role | CGPA Submitted |
|---|---|---|
| Wallet 0 | Admin | — |
| Wallet 1 | Verifier 1 | — |
| Wallet 2 | Verifier 2 | — |
| Wallet 3 | Verifier 3 | — |
| Wallet 4 | Student 1 | 9.20 (920) |
| Wallet 5 | Student 2 | 8.75 (875) |
| Wallet 6 | Student 3 | 8.10 (810) |
| Wallet 7 | Student 4 | 7.50 (750) |

> CGPA is stored as integer × 100 to avoid floating point (e.g., 8.75 → 875)

***

## 🔒 Security Analysis

| Threat | Mitigation |
|---|---|
| False CGPA submission | Requires 2/3 verifier consensus before eligibility |
| Single verifier corruption | Needs majority (2 of 3) — one bad actor cannot approve alone |
| Admin manipulation of selection | Selection logic is fully on-chain and automatic after `runSelection()` is called |
| Duplicate verifier votes | `hasVerified[verifier][student]` mapping prevents re-verification |
| Late applications | `block.timestamp <= applicationDeadline` enforced in contract |
| Below-threshold applications | `require(_cgpa >= minCGPA)` rejects immediately |
| ETH not sent | Uses `require(ok, "ETH transfer failed")` to ensure every payment succeeds |
| Re-running selection | `require(!selectionDone)` prevents double selection/payment |

***

## 🏛️ Potential Use Cases

- 🏫 **University financial aid departments** — transparent merit-based selection
- 🏛️ **Government merit scholarship programs** (e.g., National Scholarship Portal)
- 🏢 **Corporate CSR scholarship initiatives** (TCS, Infosys, Wipro foundations)
- 🌐 **NGO-run scholarship funds** — removes trust dependency on single coordinator
- 📋 **State board rank-based scholarship programs**

***

## 🚀 How to Run Locally

### Prerequisites
- [Ganache](https://trufflesuite.com/ganache/) installed
- [MetaMask](https://metamask.io) browser extension
- Chrome/Brave browser

### Steps

**1. Start Ganache**
```
Open Ganache → File → Open Workspace (or Quickstart)
Note the RPC: http://127.0.0.1:7545  |  Chain ID: 1337
```

**2. Connect MetaMask to Ganache**
```
MetaMask → Add Network:
  RPC URL: http://127.0.0.1:7545
  Chain ID: 1337
  Symbol: ETH
Import 8 accounts using private keys from Ganache (key icon per wallet)
```

**3. Deploy Contract on Remix**
```
Go to https://remix.ethereum.org
Create ScholarshipSelection.sol → paste contract code
Compile with Solidity 0.8.19
Deploy & Run → Environment: Injected Provider - MetaMask
Constructor args:
  _verifiers: ["0xWallet1", "0xWallet2", "0xWallet3"]
  _minCGPA: 700
  _scholarshipAmount: 1000000000000000000  (1 ETH)
  _durationSeconds: 86400
  VALUE: 5 Ether (to fund contract)
Click Deploy → copy contract address
```

**4. Open the DApp**
```
Open scholarship-dapp.html in Chrome
Paste contract address in sidebar → click ⚡ Load Contract
Click Connect MetaMask
```

**5. Demo Flow**
```
Students (switch MetaMask account) → Student Apply → submit CGPA
Verifiers (switch x3) → Verifier Panel → Confirm each student
Admin → Admin Panel → Close Window → Run Selection & Distribute ETH
View → Results page → see winners + ETH sent
```

***

## 📁 Repository Structure

```
Blockchain-Scholarship/
├── ScholarshipSelection.sol   # Solidity smart contract
├── scholarship-dapp.html      # Complete frontend DApp (single file)
└── README.md                  # This file
```

***

## 👤 Author

**Panshul Reddy**
- GitHub: [@Panshul-Reddy](https://github.com/Panshul-Reddy)

***

> *Built as a mini project for Blockchain Technology coursework — demonstrating decentralized governance, smart contract automation, and Web3 frontend integration.*
