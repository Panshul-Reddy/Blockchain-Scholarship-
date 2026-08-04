const hre = require("hardhat");

async function main() {
  const [deployer, verifier1, verifier2, verifier3] = await hre.ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ScholarChain — Deploying Smart Contract");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Admin (deployer):  ${deployer.address}`);
  console.log(`  Verifier 1:        ${verifier1.address}`);
  console.log(`  Verifier 2:        ${verifier2.address}`);
  console.log(`  Verifier 3:        ${verifier3.address}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Configuration
  const minCGPA = 700;                                               // 7.00 CGPA
  const scholarshipAmount = hre.ethers.parseEther("0.5");            // 0.5 ETH per student
  const durationSeconds = 3600;                                      // 1 hour window
  const fundingAmount = hre.ethers.parseEther("5");                  // Pre-fund 5 ETH

  console.log(`\n  Min CGPA:           ${minCGPA / 100} (${minCGPA})`);
  console.log(`  Scholarship/student: ${hre.ethers.formatEther(scholarshipAmount)} ETH`);
  console.log(`  Window duration:    ${durationSeconds}s`);
  console.log(`  Contract funding:   ${hre.ethers.formatEther(fundingAmount)} ETH\n`);

  // Deploy
  const ScholarshipSelection = await hre.ethers.getContractFactory("ScholarshipSelection");
  const contract = await ScholarshipSelection.deploy(
    [verifier1.address, verifier2.address, verifier3.address],
    minCGPA,
    scholarshipAmount,
    durationSeconds,
    { value: fundingAmount }
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  ✅ Contract deployed at: ${contractAddress}`);
  console.log(`  💰 Balance: ${hre.ethers.formatEther(await contract.contractBalance())} ETH`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("  Copy this address into the DApp's Contract Address field.");
  console.log("  Or update frontend/js/config.js with this address.\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
