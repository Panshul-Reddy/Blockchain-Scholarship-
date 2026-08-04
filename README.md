# 🎓 ScholarChain — Decentralized Scholarship Selection System

> A blockchain-based scholarship platform that combines **automatic merit-based selection** with **human verification** to eliminate opacity and manipulation from university scholarship processes.

---

## 📌 Problem Statement

Traditional scholarship selection suffers from:
- **Opaque decision-making** — students cannot verify if their data was reviewed honestly
- **Single point of manipulation** — one administrator controls all decisions with no accountability
- **False data risk** — purely automatic CGPA-based selection is vulnerable to forged records

ScholarChain solves this by combining **on-chain transparency**, **multi-verifier consensus**, and **automatic ETH distribution** — removing human bias from final selection entirely.

---

## ⚙️ Architecture

```
┌─────────────┐     ┌─────────────────────────────────────────────────┐
│   Frontend   │     │         Smart Contract (Solidity)               │
│   (DApp)     │     │                                                 │
│              │     │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  MetaMask ◄──┼─────┼──┤  Student  │  │ Verifier │  │    Admin     │  │
│  Web3.js     │     │  │  Apply    │  │ Confirm/ │  │ Close Window │  │
│              │     │  │  (CGPA)   │  │ Reject   │  │ Run Selection│  │
│  Dashboard   │     │  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│  Admin Panel │     │       │             │                │          │
│  Verifier UI │     │       ▼             ▼                ▼          │
│  Results     │     │  ┌─────────────────────────────────────────┐    │
└─────────────┘     │  │  Scholarship Selection Engine            │    │
                    │  │  • Sort verified students by CGPA        │    │
                    │  │  • Select top 10% (min 1)                │    │
                    │  │  • Send ETH directly to wallets          │    │
                    │  └─────────────────────────────────────────┘    │
                    │                                                 │
                    │  Events: Applied, Verified, SelectionDone,      │
                    │          ScholarshipPaid, WindowClosed           │
                    └─────────────────────────────────────────────────┘
```

---

## ✅ Features

### 🔐 Smart Contract (`ScholarshipSelection.sol`)
- **Admin-controlled setup** — sets minimum CGPA threshold, scholarship ETH amount per student, and application window duration
- **On-chain student applications** — students submit CGPA (×100) directly to the blockchain
- **CGPA threshold + max enforcement** — applications below min or above 10.00 are automatically rejected
- **Application window enforcement** — late applications after the deadline are rejected at the contract level
- **3-verifier registration** — admin registers exactly 3 verifier wallets at deployment
- **2-of-3 verification consensus** — a student is verified only when at least 2 of 3 verifiers confirm
- **Duplicate verification prevention** — each verifier can act on each student exactly once
- **Automatic top-10% selection** — ranks verified applicants by CGPA, selects top 10% (minimum 1)
- **Direct ETH distribution** — selected students receive ETH directly via `call{value}`
- **Reentrancy protection** — custom `nonReentrant` modifier on `runSelection()`
- **Contract pre-funding** — funded with ETH at deployment to cover payouts
- **Event emissions** — `Applied`, `Verified`, `SelectionDone`, `ScholarshipPaid`, `WindowClosed`

### 🖥️ Frontend DApp (`frontend/`)
- **Separated concerns** — HTML, CSS, and JavaScript in separate files
- **MetaMask integration** — connects via Web3.js to any injected Ethereum provider
- **Contract loader** — paste any deployed contract address to instantly connect
- **Dashboard** — live KPIs: total applicants, verified count, selected count, contract ETH balance
- **Admin Panel** — close window + run selection buttons with status indicators
- **Student Apply page** — CGPA submission form with live status checker
- **Verifier Panel** — table of all applicants with per-student Confirm/Reject buttons
- **Results page** — winner cards with CGPA ranking + ETH sent confirmation
- **Dark/Light mode toggle**
- **Toast notifications** — real-time feedback for all transactions
- **Auto-detects MetaMask account changes**

### 🧪 Test Suite (30 tests)
- **Deployment** — verifies admin, verifiers, initial state, input validation
- **Student Applications** — apply, reject below threshold, duplicates, deadline
- **Verifier Actions** — confirm, reject, 2-of-3 consensus, access control
- **Admin — Close Window** — access control, double-close prevention
- **Admin — Run Selection** — top 10% logic, ETH transfer, double-run prevention
- **View Functions** — applicant list, count, application details
- **Edge Cases** — already verified, 0 applicants, insufficient funds

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity `^0.8.19` |
| Development Framework | Hardhat `2.22.x` |
| Testing | Hardhat + Chai + Ethers.js v6 |
| Blockchain Network | Ethereum (Ganache / Hardhat local testnet) |
| Web3 Library | Web3.js `1.10.0` (CDN) |
| Wallet | MetaMask browser extension |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript |
| Fonts | Google Fonts — Inter, JetBrains Mono |

---

## 📁 Project Structure

```
ScholarChain/
├── contracts/
│   └── ScholarshipSelection.sol    # Solidity smart contract
├── test/
│   └── ScholarshipSelection.test.js  # 30 Hardhat test cases
├── scripts/
│   └── deploy.js                   # Automated deployment script
├── frontend/
│   ├── index.html                  # DApp entry point
│   ├── css/
│   │   └── styles.css              # All styles (dark/light theme)
│   └── js/
│       ├── app.js                  # Application logic
│       └── config.js               # Contract address config
├── hardhat.config.js               # Hardhat configuration
├── package.json                    # Dependencies & scripts
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension
- [Ganache](https://trufflesuite.com/ganache/) (optional, for local blockchain)

### 1. Clone & Install
```bash
git clone https://github.com/Panshul-Reddy/Blockchain-Scholarship-.git
cd Blockchain-Scholarship-
npm install
```

### 2. Compile the Smart Contract
```bash
npm run compile
```

### 3. Run Tests
```bash
npm test
```

### 4. Deploy (Hardhat local network)
```bash
npm run deploy
```
Copy the deployed contract address from the console output.

### 5. Deploy (Ganache)
1. Start Ganache on `http://127.0.0.1:7545`
2. Import Ganache accounts into MetaMask
3. Deploy using Remix IDE or configure `hardhat.config.js` with the Ganache network

### 6. Run the DApp
1. Open `frontend/index.html` in your browser
2. Connect MetaMask (switch to Ganache/Hardhat network)
3. Paste the deployed contract address → click **⚡ Load Contract**
4. Use the sidebar to navigate between Dashboard, Admin, Student, Verifier, and Results panels

---

## 🧪 Test Results

```
  ScholarshipSelection
    Deployment
      ✓ Should set the right admin
      ✓ Should set the verifiers correctly
      ✓ Should configure initial state correctly
      ✓ Should revert if min CGPA is invalid
    Student Applications
      ✓ Should allow a student to apply and emit Applied event
      ✓ Should revert if CGPA is below minimum threshold
      ✓ Should revert if CGPA is above 1000
      ✓ Should revert if student applies twice
      ✓ Should revert if application deadline has passed
    Verifier Actions
      ✓ Should allow verifier to confirm an application
      ✓ Should mark student as verified after 2 confirmations
      ✓ Should allow verifier to reject an application
      ✓ Should revert if non-verifier tries to verify
      ✓ Should revert if verifier tries to verify twice
      ✓ Should revert if student does not exist
    Admin — Close Window
      ✓ Should allow admin to close the application window
      ✓ Should revert if non-admin tries to close window
      ✓ Should revert if window is already closed
      ✓ Should prevent new applications if window is closed
    Admin — Run Selection
      ✓ Should revert if window is not closed
      ✓ Should revert if non-admin tries to run selection
      ✓ Should select top 10% (min 1) and send scholarship
      ✓ Should mark selected boolean in application details
      ✓ Should revert if selection is already done
    View Functions
      ✓ Should return correct applicant list
      ✓ Should return correct applicant count
      ✓ Should return accurate application details
    Edge Cases
      ✓ Should revert verification if student is already verified
      ✓ Should run selection successfully even with 0 applicants
      ✓ Should revert runSelection if contract lacks funds

  30 passing
```

---

## ⚠️ Known Limitations

- **Bubble sort on-chain** — O(n²) gas cost; suitable for small cohorts (<50 students). For larger pools, consider off-chain sorting with Merkle proof verification.
- **Self-reported CGPA** — Students submit their own CGPA. Verification relies on human verifiers, not an oracle.
- **Fixed 3 verifiers** — Verifier set is fixed at deployment; not upgradeable.
- **No admin withdrawal** — Remaining ETH after selection stays in the contract.
- **Local testnet only** — Not deployed to a public testnet (Sepolia/Holesky) yet.

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.
