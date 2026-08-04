const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ScholarshipSelection", function () {
  async function deployContractFixture() {
    const [admin, verifier1, verifier2, verifier3, student1, student2, student3, nonVerifier] = await ethers.getSigners();
    const verifiers = [verifier1.address, verifier2.address, verifier3.address];
    
    const minCGPA = 800; // 8.00
    const scholarshipAmount = ethers.parseEther("1.0");
    const durationSeconds = 3600; // 1 hour

    const ScholarshipSelection = await ethers.getContractFactory("ScholarshipSelection");
    const contract = await ScholarshipSelection.deploy(verifiers, minCGPA, scholarshipAmount, durationSeconds, {
      value: ethers.parseEther("10.0") // Fund contract with 10 ETH
    });

    return { contract, admin, verifier1, verifier2, verifier3, student1, student2, student3, nonVerifier, verifiers, minCGPA, scholarshipAmount, durationSeconds };
  }

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const { contract, admin } = await loadFixture(deployContractFixture);
      expect(await contract.admin()).to.equal(admin.address);
    });

    it("Should set the verifiers correctly", async function () {
      const { contract, verifier1, verifier2, verifier3 } = await loadFixture(deployContractFixture);
      expect(await contract.verifiers(0)).to.equal(verifier1.address);
      expect(await contract.verifiers(1)).to.equal(verifier2.address);
      expect(await contract.verifiers(2)).to.equal(verifier3.address);
    });

    it("Should configure initial state correctly", async function () {
      const { contract, minCGPA, scholarshipAmount } = await loadFixture(deployContractFixture);
      expect(await contract.minCGPA()).to.equal(minCGPA);
      expect(await contract.scholarshipAmount()).to.equal(scholarshipAmount);
      expect(await contract.windowClosed()).to.be.false;
      expect(await contract.selectionDone()).to.be.false;
      
      const balance = await contract.contractBalance();
      expect(balance).to.equal(ethers.parseEther("10.0"));
    });

    it("Should revert if min CGPA is invalid", async function () {
      const [admin, verifier1, verifier2, verifier3] = await ethers.getSigners();
      const verifiers = [verifier1.address, verifier2.address, verifier3.address];
      const ScholarshipSelection = await ethers.getContractFactory("ScholarshipSelection");

      await expect(ScholarshipSelection.deploy(verifiers, 0, ethers.parseEther("1.0"), 3600))
        .to.be.revertedWith("Invalid CGPA range");

      await expect(ScholarshipSelection.deploy(verifiers, 1001, ethers.parseEther("1.0"), 3600))
        .to.be.revertedWith("Invalid CGPA range");
    });
  });

  describe("Student Applications", function () {
    it("Should allow a student to apply and emit Applied event", async function () {
      const { contract, student1 } = await loadFixture(deployContractFixture);
      await expect(contract.connect(student1).submitApplication(850))
        .to.emit(contract, "Applied")
        .withArgs(student1.address, 850);
      
      const count = await contract.getApplicantCount();
      expect(count).to.equal(1n);
    });

    it("Should revert if CGPA is below minimum threshold", async function () {
      const { contract, student1 } = await loadFixture(deployContractFixture);
      await expect(contract.connect(student1).submitApplication(799))
        .to.be.revertedWith("CGPA below minimum threshold");
    });

    it("Should revert if CGPA is above 1000", async function () {
      const { contract, student1 } = await loadFixture(deployContractFixture);
      await expect(contract.connect(student1).submitApplication(1001))
        .to.be.revertedWith("CGPA cannot exceed 10.00");
    });

    it("Should revert if student applies twice", async function () {
      const { contract, student1 } = await loadFixture(deployContractFixture);
      await contract.connect(student1).submitApplication(850);
      await expect(contract.connect(student1).submitApplication(900))
        .to.be.revertedWith("Already applied");
    });
    
    it("Should revert if application deadline has passed", async function () {
      const { contract, student1, durationSeconds } = await loadFixture(deployContractFixture);
      await time.increase(durationSeconds + 1);
      await expect(contract.connect(student1).submitApplication(850))
        .to.be.revertedWith("Deadline passed");
    });
  });

  describe("Verifier Actions", function () {
    async function submitAppFixture() {
      const context = await loadFixture(deployContractFixture);
      await context.contract.connect(context.student1).submitApplication(900);
      return context;
    }

    it("Should allow verifier to confirm an application", async function () {
      const { contract, verifier1, student1 } = await loadFixture(submitAppFixture);
      await expect(contract.connect(verifier1).verifyStudent(student1.address, true))
        .to.emit(contract, "Verified")
        .withArgs(verifier1.address, student1.address, true);

      const details = await contract.getApplicationDetails(student1.address);
      expect(details.confirmations).to.equal(1n);
      expect(details.verified).to.be.false;
    });

    it("Should mark student as verified after 2 confirmations", async function () {
      const { contract, verifier1, verifier2, student1 } = await loadFixture(submitAppFixture);
      await contract.connect(verifier1).verifyStudent(student1.address, true);
      await contract.connect(verifier2).verifyStudent(student1.address, true);

      const details = await contract.getApplicationDetails(student1.address);
      expect(details.confirmations).to.equal(2n);
      expect(details.verified).to.be.true;
    });

    it("Should allow verifier to reject an application", async function () {
      const { contract, verifier1, student1 } = await loadFixture(submitAppFixture);
      await contract.connect(verifier1).verifyStudent(student1.address, false);

      const details = await contract.getApplicationDetails(student1.address);
      expect(details.rejections).to.equal(1n);
      expect(details.verified).to.be.false;
    });

    it("Should revert if non-verifier tries to verify", async function () {
      const { contract, nonVerifier, student1 } = await loadFixture(submitAppFixture);
      await expect(contract.connect(nonVerifier).verifyStudent(student1.address, true))
        .to.be.revertedWith("Not a verifier");
    });

    it("Should revert if verifier tries to verify twice", async function () {
      const { contract, verifier1, student1 } = await loadFixture(submitAppFixture);
      await contract.connect(verifier1).verifyStudent(student1.address, true);
      await expect(contract.connect(verifier1).verifyStudent(student1.address, true))
        .to.be.revertedWith("Already verified this student");
    });

    it("Should revert if student does not exist", async function () {
      const { contract, verifier1, student2 } = await loadFixture(submitAppFixture);
      await expect(contract.connect(verifier1).verifyStudent(student2.address, true))
        .to.be.revertedWith("Student not found");
    });
  });

  describe("Admin — Close Window", function () {
    it("Should allow admin to close the application window", async function () {
      const { contract, admin } = await loadFixture(deployContractFixture);
      await expect(contract.connect(admin).closeWindow())
        .to.emit(contract, "WindowClosed")
        .withArgs(admin.address);
      
      expect(await contract.windowClosed()).to.be.true;
    });

    it("Should revert if non-admin tries to close window", async function () {
      const { contract, student1 } = await loadFixture(deployContractFixture);
      await expect(contract.connect(student1).closeWindow())
        .to.be.revertedWith("Not admin");
    });

    it("Should revert if window is already closed", async function () {
      const { contract, admin } = await loadFixture(deployContractFixture);
      await contract.connect(admin).closeWindow();
      await expect(contract.connect(admin).closeWindow())
        .to.be.revertedWith("Already closed");
    });

    it("Should prevent new applications if window is closed", async function () {
      const { contract, admin, student1 } = await loadFixture(deployContractFixture);
      await contract.connect(admin).closeWindow();
      await expect(contract.connect(student1).submitApplication(850))
        .to.be.revertedWith("Application window closed");
    });
  });

  describe("Admin — Run Selection", function () {
    async function setupVerifiedStudentsFixture() {
      const context = await loadFixture(deployContractFixture);
      const { contract, student1, student2, student3, verifier1, verifier2, admin } = context;

      // Students apply
      await contract.connect(student1).submitApplication(850);
      await contract.connect(student2).submitApplication(900);
      await contract.connect(student3).submitApplication(950);

      // Verifiers confirm all 3
      for (const student of [student1, student2, student3]) {
        await contract.connect(verifier1).verifyStudent(student.address, true);
        await contract.connect(verifier2).verifyStudent(student.address, true);
      }

      await contract.connect(admin).closeWindow();
      return context;
    }

    it("Should revert if window is not closed", async function () {
      const { contract, admin } = await loadFixture(deployContractFixture);
      await expect(contract.connect(admin).runSelection())
        .to.be.revertedWith("Close window first");
    });

    it("Should revert if non-admin tries to run selection", async function () {
      const { contract, student1 } = await loadFixture(deployContractFixture);
      await expect(contract.connect(student1).runSelection())
        .to.be.revertedWith("Not admin");
    });

    it("Should select top 10% (min 1) and send scholarship", async function () {
      const { contract, admin, student3, scholarshipAmount } = await loadFixture(setupVerifiedStudentsFixture);
      
      const initialBal = await ethers.provider.getBalance(student3.address);

      await expect(contract.connect(admin).runSelection())
        .to.emit(contract, "SelectionDone")
        .withArgs([student3.address])
        .and.to.emit(contract, "ScholarshipPaid")
        .withArgs(student3.address, scholarshipAmount);

      const finalBal = await ethers.provider.getBalance(student3.address);
      expect(finalBal - initialBal).to.equal(scholarshipAmount);

      expect(await contract.selectionDone()).to.be.true;
    });

    it("Should mark selected boolean in application details", async function () {
      const { contract, admin, student3 } = await loadFixture(setupVerifiedStudentsFixture);
      await contract.connect(admin).runSelection();
      
      const details = await contract.getApplicationDetails(student3.address);
      expect(details.selected).to.be.true;
    });
    
    it("Should revert if selection is already done", async function () {
      const { contract, admin } = await loadFixture(setupVerifiedStudentsFixture);
      await contract.connect(admin).runSelection();
      await expect(contract.connect(admin).runSelection())
        .to.be.revertedWith("Already done");
    });
  });

  describe("View Functions", function () {
    it("Should return correct applicant list", async function () {
      const { contract, student1, student2 } = await loadFixture(deployContractFixture);
      await contract.connect(student1).submitApplication(850);
      await contract.connect(student2).submitApplication(900);
      
      const applicants = await contract.getApplicants();
      expect(applicants.length).to.equal(2);
      expect(applicants[0]).to.equal(student1.address);
      expect(applicants[1]).to.equal(student2.address);
    });

    it("Should return correct applicant count", async function () {
      const { contract, student1 } = await loadFixture(deployContractFixture);
      await contract.connect(student1).submitApplication(850);
      expect(await contract.getApplicantCount()).to.equal(1n);
    });

    it("Should return accurate application details", async function () {
      const { contract, student1, verifier1 } = await loadFixture(deployContractFixture);
      await contract.connect(student1).submitApplication(850);
      await contract.connect(verifier1).verifyStudent(student1.address, false);

      const details = await contract.getApplicationDetails(student1.address);
      expect(details.cgpa).to.equal(850n);
      expect(details.verified).to.be.false;
      expect(details.selected).to.be.false;
      expect(details.confirmations).to.equal(0n);
      expect(details.rejections).to.equal(1n);
    });
  });

  describe("Edge Cases", function () {
    it("Should revert verification if student is already verified", async function () {
      const { contract, student1, verifier1, verifier2, verifier3 } = await loadFixture(deployContractFixture);
      await contract.connect(student1).submitApplication(850);
      
      await contract.connect(verifier1).verifyStudent(student1.address, true);
      await contract.connect(verifier2).verifyStudent(student1.address, true);
      
      await expect(contract.connect(verifier3).verifyStudent(student1.address, true))
        .to.be.revertedWith("Already verified");
    });

    it("Should run selection successfully even with 0 applicants", async function () {
      const { contract, admin } = await loadFixture(deployContractFixture);
      await contract.connect(admin).closeWindow();
      
      await expect(contract.connect(admin).runSelection())
        .to.emit(contract, "SelectionDone")
        .withArgs([]);
    });

    it("Should revert runSelection if contract lacks funds", async function () {
      const [admin, verifier1, verifier2, verifier3, student1] = await ethers.getSigners();
      const verifiers = [verifier1.address, verifier2.address, verifier3.address];
      
      const ScholarshipSelection = await ethers.getContractFactory("ScholarshipSelection");
      // Deploy WITHOUT funds
      const contract = await ScholarshipSelection.deploy(verifiers, 800, ethers.parseEther("1.0"), 3600);

      await contract.connect(student1).submitApplication(900);
      await contract.connect(verifier1).verifyStudent(student1.address, true);
      await contract.connect(verifier2).verifyStudent(student1.address, true);
      await contract.connect(admin).closeWindow();

      await expect(contract.connect(admin).runSelection())
        .to.be.revertedWith("ETH transfer failed");
    });
  });
});
