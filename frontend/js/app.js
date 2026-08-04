/**
 * ScholarChain — Main Application Logic
 * Handles wallet connection, contract interaction, and UI updates
 */

const ABI=[{"inputs":[{"internalType":"address[3]","name":"_verifiers","type":"address[3]"},{"internalType":"uint256","name":"_minCGPA","type":"uint256"},{"internalType":"uint256","name":"_scholarshipAmount","type":"uint256"},{"internalType":"uint256","name":"_durationSeconds","type":"uint256"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"student","type":"address"},{"indexed":false,"internalType":"uint256","name":"cgpa","type":"uint256"}],"name":"Applied","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"student","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"ScholarshipPaid","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address[]","name":"selected","type":"address[]"}],"name":"SelectionDone","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"verifier","type":"address"},{"indexed":true,"internalType":"address","name":"student","type":"address"},{"indexed":false,"internalType":"bool","name":"confirmed","type":"bool"}],"name":"Verified","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"admin","type":"address"}],"name":"WindowClosed","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"applicantList","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"applicationDeadline","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"applications","outputs":[{"internalType":"address","name":"student","type":"address"},{"internalType":"uint256","name":"cgpa","type":"uint256"},{"internalType":"bool","name":"exists","type":"bool"},{"internalType":"uint8","name":"confirmations","type":"uint8"},{"internalType":"uint8","name":"rejections","type":"uint8"},{"internalType":"bool","name":"verified","type":"bool"},{"internalType":"bool","name":"selected","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"closeWindow","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"contractBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getApplicantCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getApplicants","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_student","type":"address"}],"name":"getApplicationDetails","outputs":[{"internalType":"uint256","name":"cgpa","type":"uint256"},{"internalType":"bool","name":"verified","type":"bool"},{"internalType":"bool","name":"selected","type":"bool"},{"internalType":"uint8","name":"confirmations","type":"uint8"},{"internalType":"uint8","name":"rejections","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minCGPA","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"runSelection","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"scholarshipAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"selectionDone","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_cgpa","type":"uint256"}],"name":"submitApplication","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"verifiers","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_student","type":"address"},{"internalType":"bool","name":"_confirm","type":"bool"}],"name":"verifyStudent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"windowClosed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"stateMutability":"payable","type":"receive"}];

let web3, contract, account;

// ───────────────────── Theme ─────────────────────

function toggleTheme() {
  const r = document.documentElement;
  const d = r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  r.setAttribute('data-theme', d);
  document.getElementById('themeIcon').innerHTML = d === 'dark'
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
}

// ───────────────────── Toast Notifications ─────────────────────

function toast(msg, type = 'info') {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ───────────────────── Navigation ─────────────────────

function showPage(n) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  document.getElementById('page-' + n).classList.add('active');
  document.getElementById('nav-' + n).classList.add('active');
  if (n === 'verifier') loadVerifier();
  if (n === 'results') loadResults();
  if (n === 'dashboard') refreshDashboard();
  if (n === 'admin') refreshDashboard();
}

// ───────────────────── Wallet Connection ─────────────────────

async function connectWallet() {
  if (!window.ethereum) { toast('Install MetaMask first!', 'error'); return; }
  try {
    web3 = new Web3(window.ethereum);
    const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
    account = accs[0];
    document.getElementById('wdot').classList.add('on');
    document.getElementById('waddr').textContent = account.slice(0, 6) + '...' + account.slice(-4);
    document.getElementById('btnConn').textContent = '✅ Connected';
    document.getElementById('btnConn').style.background = 'var(--green)';
    toast('Connected: ' + account.slice(0, 8) + '...', 'success');
    if (document.getElementById('caInput').value) loadContract();
    window.ethereum.on('accountsChanged', a => {
      account = a[0];
      document.getElementById('waddr').textContent = account.slice(0, 6) + '...' + account.slice(-4);
      toast('Switched to ' + account.slice(0, 8) + '...', 'info');
    });
  } catch (e) { toast('Connection rejected', 'error'); }
}

// ───────────────────── Contract Loading ─────────────────────

async function loadContract() {
  const addr = document.getElementById('caInput').value.trim();
  if (!addr) { toast('Enter contract address', 'error'); return; }
  if (!web3) {
    if (!window.ethereum) { toast('Install MetaMask', 'error'); return; }
    web3 = new Web3(window.ethereum);
    try { const a = await window.ethereum.request({ method: 'eth_requestAccounts' }); account = a[0]; } catch (e) {}
  }
  try {
    contract = new web3.eth.Contract(ABI, addr);
    await contract.methods.admin().call();
    document.getElementById('cStatus').textContent = '✅ Loaded!';
    document.getElementById('cStatus').className = 'cs ok';
    toast('Contract connected!', 'success');
    refreshDashboard();
  } catch (e) {
    document.getElementById('cStatus').textContent = '❌ Invalid';
    document.getElementById('cStatus').className = 'cs err';
    toast('Failed: ' + e.message, 'error');
  }
}

// ───────────────────── Dashboard ─────────────────────

async function refreshDashboard() {
  if (!contract) return;
  try {
    const [admin, mc, sa, wc, sd, bal, apps] = await Promise.all([
      contract.methods.admin().call(),
      contract.methods.minCGPA().call(),
      contract.methods.scholarshipAmount().call(),
      contract.methods.windowClosed().call(),
      contract.methods.selectionDone().call(),
      contract.methods.contractBalance().call(),
      contract.methods.getApplicants().call()
    ]);
    const ae = web3.utils.fromWei(sa, 'ether');
    const be = web3.utils.fromWei(bal, 'ether');
    document.getElementById('dAdmin').textContent = admin.slice(0, 10) + '...' + admin.slice(-6);
    document.getElementById('dMCGPA').textContent = (mc / 100).toFixed(2) + ' CGPA';
    document.getElementById('dAmt').textContent = ae + ' ETH';
    document.getElementById('dWin').innerHTML = wc ? '<span class="badge br">Closed</span>' : '<span class="badge bg">Open</span>';
    document.getElementById('dSel').innerHTML = sd ? '<span class="badge bp">✅ Done</span>' : '<span class="badge by">Pending</span>';
    document.getElementById('kT').textContent = apps.length;
    document.getElementById('kB').textContent = parseFloat(be).toFixed(4) + ' ETH';
    document.getElementById('sMCGPA').textContent = (mc / 100).toFixed(2);
    document.getElementById('sAmt').textContent = ae + ' ETH';
    document.getElementById('sWin').textContent = wc ? 'Closed' : 'Open';
    document.getElementById('sSel').textContent = sd ? 'Done' : 'Pending';
    document.getElementById('minHint').textContent = mc;
    document.getElementById('winBadge').innerHTML = wc ? '<span class="badge br">Window CLOSED</span>' : '<span class="badge bg">Window OPEN</span>';
    document.getElementById('selBadge').innerHTML = sd ? '<span class="badge bp">Already done</span>' : '<span class="badge by">Not yet run</span>';
    let v = 0, s = 0, rows = '';
    for (const a of apps) {
      const d = await contract.methods.getApplicationDetails(a).call();
      if (d.verified) v++;
      if (d.selected) s++;
      rows += `<tr><td class="mono">${a.slice(0, 8)}...${a.slice(-6)}</td><td><strong>${(d.cgpa / 100).toFixed(2)}</strong></td><td>${d.selected ? '<span class="badge bp">🏆 Selected</span>' : d.verified ? '<span class="badge bg">✅ Verified</span>' : '<span class="badge by">⏳ Pending</span>'}</td></tr>`;
    }
    document.getElementById('kV').textContent = v;
    document.getElementById('kS').textContent = s;
    document.getElementById('dAppList').innerHTML = apps.length
      ? `<div class="tw"><table><thead><tr><th>Address</th><th>CGPA</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`
      : '<div class="empty"><div class="empty-icon">📋</div><h3>No applicants yet</h3></div>';
    let vr = '';
    for (let i = 0; i < 3; i++) {
      try {
        const v = await contract.methods.verifiers(i).call();
        vr += `<tr><td>${i + 1}</td><td class="mono">${v}</td><td><span class="badge bb">Verifier ${i + 1}</span></td></tr>`;
      } catch (e) {}
    }
    document.getElementById('vTable').innerHTML = vr || '<tr><td colspan="3" style="text-align:center;color:var(--faint);padding:1rem">No verifiers found</td></tr>';
    if (account && admin.toLowerCase() !== account.toLowerCase())
      document.getElementById('adminAlert').style.display = 'flex';
    else document.getElementById('adminAlert').style.display = 'none';
  } catch (e) { toast('Dashboard error: ' + e.message, 'error'); }
}

// ───────────────────── Admin Functions ─────────────────────

async function closeWindow() {
  if (!contract || !account) { toast('Connect wallet first', 'error'); return; }
  const b = document.getElementById('btnCW');
  b.innerHTML = '<span class="spin"></span> Closing...';
  b.disabled = true;
  try {
    await contract.methods.closeWindow().send({ from: account, gas: 100000 });
    toast('Window closed!', 'success');
    refreshDashboard();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  b.innerHTML = '🔒 Close Application Window';
  b.disabled = false;
}

async function runSelection() {
  if (!contract || !account) { toast('Connect wallet first', 'error'); return; }
  const b = document.getElementById('btnRS');
  b.innerHTML = '<span class="spin"></span> Running...';
  b.disabled = true;
  try {
    await contract.methods.runSelection().send({ from: account, gas: 3000000 });
    toast('🎉 Selection done! ETH distributed!', 'success');
    refreshDashboard();
    setTimeout(() => showPage('results'), 1500);
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  b.innerHTML = '🚀 Run Selection & Distribute ETH';
  b.disabled = false;
}

// ───────────────────── Student Functions ─────────────────────

async function submitApplication() {
  if (!contract || !account) { toast('Connect MetaMask first', 'error'); return; }
  const c = document.getElementById('sCGPA').value;
  if (!c || c < 100 || c > 1000) { toast('Enter valid CGPA (100-1000)', 'error'); return; }
  const s = document.getElementById('appStatus');
  s.innerHTML = '<div class="alert al-i"><span class="spin"></span> Submitting...</div>';
  try {
    await contract.methods.submitApplication(parseInt(c)).send({ from: account, gas: 300000 });
    s.innerHTML = '<div class="alert al-s">✅ Application submitted! Awaiting verifier confirmation.</div>';
    toast('Application submitted!', 'success');
  } catch (e) {
    s.innerHTML = '<div class="alert al-e">❌ ' + e.message + '</div>';
    toast('Error: ' + e.message, 'error');
  }
}

async function checkApplication() {
  if (!contract) return;
  const addr = document.getElementById('checkAddr').value.trim() || account;
  if (!addr) { toast('Connect wallet or enter address', 'error'); return; }
  const r = document.getElementById('checkResult');
  r.innerHTML = '<span class="spin"></span>';
  try {
    const d = await contract.methods.getApplicationDetails(addr).call();
    if (!d.cgpa || d.cgpa == '0') {
      r.innerHTML = '<div class="alert al-w">No application found.</div>';
      return;
    }
    r.innerHTML = `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-lg);padding:1rem"><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
      <div><div style="font-size:.72rem;color:var(--muted)">CGPA</div><div style="font-size:1.5rem;font-weight:700;font-family:var(--mono)">${(d.cgpa / 100).toFixed(2)}</div></div>
      <div><div style="font-size:.72rem;color:var(--muted)">Confirmations</div><div style="font-size:1.5rem;font-weight:700;font-family:var(--mono)">${d.confirmations}/3</div></div>
      <div><div style="font-size:.72rem;color:var(--muted)">Verified</div>${d.verified ? '<span class="badge bg">✅ Yes</span>' : '<span class="badge by">⏳ No</span>'}</div>
      <div><div style="font-size:.72rem;color:var(--muted)">Selected</div>${d.selected ? '<span class="badge bp">🏆 Yes</span>' : '<span class="badge bgr">Not yet</span>'}</div>
    </div></div>`;
  } catch (e) { r.innerHTML = '<div class="alert al-e">Error: ' + e.message + '</div>'; }
}

// ───────────────────── Verifier Functions ─────────────────────

async function loadVerifier() {
  if (!contract) return;
  const tb = document.getElementById('verTable');
  tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:1.5rem"><span class="spin"></span></td></tr>';
  try {
    const apps = await contract.methods.getApplicants().call();
    if (!apps.length) {
      tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--faint);padding:2rem">No applicants yet</td></tr>';
      return;
    }
    let rows = '';
    for (let i = 0; i < apps.length; i++) {
      const a = apps[i];
      const d = await contract.methods.getApplicationDetails(a).call();
      const st = d.selected ? '<span class="badge bp">🏆 Selected</span>' : d.verified ? '<span class="badge bg">✅ Verified</span>' : `<span class="badge by">⏳ ${d.confirmations}/2</span>`;
      rows += `<tr><td>${i + 1}</td><td><div class="mono">${a.slice(0, 12)}...${a.slice(-6)}</div><div class="mono" style="color:var(--faint);font-size:.65rem">${a}</div></td><td><strong>${(d.cgpa / 100).toFixed(2)}</strong></td><td><span class="badge bb">${d.confirmations}/3</span></td><td>${st}</td><td><div style="display:flex;gap:6px"><button class="btn btn-p" style="padding:4px 10px;font-size:.75rem" onclick="verifyS('${a}',true)">✅ Confirm</button><button class="btn btn-d" style="padding:4px 10px;font-size:.75rem" onclick="verifyS('${a}',false)">❌ Reject</button></div></td></tr>`;
    }
    tb.innerHTML = rows;
    if (account) {
      let iv = false;
      for (let i = 0; i < 3; i++) {
        try {
          const v = await contract.methods.verifiers(i).call();
          if (v.toLowerCase() === account.toLowerCase()) iv = true;
        } catch (e) {}
      }
      document.getElementById('verAlert').style.display = iv ? 'none' : 'flex';
    }
  } catch (e) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--err);padding:1rem">' + e.message + '</td></tr>';
  }
}

async function verifyS(addr, confirm) {
  if (!contract || !account) { toast('Connect wallet first', 'error'); return; }
  toast((confirm ? 'Confirming' : 'Rejecting') + '...', 'info');
  try {
    await contract.methods.verifyStudent(addr, confirm).send({ from: account, gas: 200000 });
    toast(confirm ? '✅ Confirmed!' : '❌ Rejected!', confirm ? 'success' : 'error');
    loadVerifier();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

// ───────────────────── Results ─────────────────────

async function loadResults() {
  if (!contract) return;
  try {
    const [sd, apps, sa] = await Promise.all([
      contract.methods.selectionDone().call(),
      contract.methods.getApplicants().call(),
      contract.methods.scholarshipAmount().call()
    ]);
    const ae = web3.utils.fromWei(sa, 'ether');
    const all = [];
    for (const a of apps) {
      const d = await contract.methods.getApplicationDetails(a).call();
      all.push({ a, cgpa: parseInt(d.cgpa), v: d.verified, s: d.selected, c: d.confirmations });
    }
    all.sort((x, y) => y.cgpa - x.cgpa);
    const winners = all.filter(x => x.s);
    const rt = document.getElementById('resultsTop');
    if (!sd || !winners.length) {
      rt.innerHTML = '<div class="empty"><div class="empty-icon">⏳</div><h3>Selection not yet run</h3><p>Admin must close window and run selection</p></div>';
    } else {
      rt.innerHTML = `<div class="alert al-s" style="margin-bottom:1.5rem">🎉 Selection complete! ${winners.length} student${winners.length > 1 ? 's' : ''} received ${ae} ETH each automatically!</div>` +
        winners.map((w, i) => `<div class="wcard"><div class="wtrophy">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div><div class="winfo"><div class="wname">Scholar #${i + 1}</div><div class="waddr">${w.a}</div></div><div style="text-align:right"><div class="wcgpa">${(w.cgpa / 100).toFixed(2)}</div><div class="weth">+${ae} ETH sent ✅</div></div></div>`).join('');
    }
    document.getElementById('fullTable').innerHTML = all.length
      ? all.map((x, i) => `<tr><td>${i + 1}</td><td class="mono">${x.a.slice(0, 10)}...${x.a.slice(-6)}</td><td><strong>${(x.cgpa / 100).toFixed(2)}</strong></td><td>${x.c}/3</td><td>${x.v ? '<span class="badge bg">✅</span>' : '<span class="badge bgr">No</span>'}</td><td>${x.s ? '<span class="badge bp">🏆 Yes</span>' : '<span class="badge bgr">No</span>'}</td><td>${x.s ? `<span style="color:var(--warn);font-family:var(--mono)">${ae} ETH</span>` : '<span style="color:var(--faint)">—</span>'}</td></tr>`).join('')
      : '<tr><td colspan="7" style="text-align:center;color:var(--faint);padding:2rem">No data</td></tr>';
  } catch (e) { toast('Results error: ' + e.message, 'error'); }
}

// ───────────────────── Auto-Connect on Load ─────────────────────

window.addEventListener('load', async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      const a = await window.ethereum.request({ method: 'eth_accounts' });
      if (a.length) {
        account = a[0];
        document.getElementById('wdot').classList.add('on');
        document.getElementById('waddr').textContent = account.slice(0, 6) + '...' + account.slice(-4);
        document.getElementById('btnConn').textContent = '✅ Connected';
        document.getElementById('btnConn').style.background = 'var(--green)';
        loadContract();
      }
    } catch (e) {}
    window.ethereum.on('accountsChanged', a => {
      if (a.length) {
        account = a[0];
        document.getElementById('waddr').textContent = account.slice(0, 6) + '...' + account.slice(-4);
        toast('Switched to ' + account.slice(0, 8) + '...', 'info');
      }
    });
  }
});
