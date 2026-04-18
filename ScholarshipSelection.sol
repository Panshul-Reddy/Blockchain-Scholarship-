// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ScholarshipSelection {

    address public admin;
    address[3] public verifiers;
    uint256 public minCGPA;
    uint256 public scholarshipAmount;
    uint256 public applicationDeadline;
    bool public windowClosed;
    bool public selectionDone;

    struct Application {
        address student;
        uint256 cgpa;
        bool exists;
        uint8 confirmations;
        uint8 rejections;
        bool verified;
        bool selected;
    }

    mapping(address => Application) public applications;
    mapping(address => mapping(address => bool)) public hasVerified;
    address[] public applicantList;

    event Applied(address indexed student, uint256 cgpa);
    event Verified(address indexed verifier, address indexed student, bool confirmed);
    event SelectionDone(address[] selected);
    event ScholarshipPaid(address indexed student, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyVerifier() {
        bool isV = false;
        for (uint i = 0; i < 3; i++) {
            if (verifiers[i] == msg.sender) { isV = true; break; }
        }
        require(isV, "Not a verifier");
        _;
    }

    constructor(
        address[3] memory _verifiers,
        uint256 _minCGPA,
        uint256 _scholarshipAmount,
        uint256 _durationSeconds
    ) payable {
        admin = msg.sender;
        verifiers = _verifiers;
        minCGPA = _minCGPA;
        scholarshipAmount = _scholarshipAmount;
        applicationDeadline = block.timestamp + _durationSeconds;
    }

    function submitApplication(uint256 _cgpa) external {
        require(!windowClosed, "Application window closed");
        require(block.timestamp <= applicationDeadline, "Deadline passed");
        require(!applications[msg.sender].exists, "Already applied");
        require(_cgpa >= minCGPA, "CGPA below minimum threshold");

        applications[msg.sender] = Application({
            student: msg.sender,
            cgpa: _cgpa,
            exists: true,
            confirmations: 0,
            rejections: 0,
            verified: false,
            selected: false
        });
        applicantList.push(msg.sender);
        emit Applied(msg.sender, _cgpa);
    }

    function verifyStudent(address _student, bool _confirm) external onlyVerifier {
        require(applications[_student].exists, "Student not found");
        require(!hasVerified[msg.sender][_student], "Already verified this student");
        require(!applications[_student].verified, "Already verified");

        hasVerified[msg.sender][_student] = true;

        if (_confirm) {
            applications[_student].confirmations++;
            if (applications[_student].confirmations >= 2) {
                applications[_student].verified = true;
            }
        } else {
            applications[_student].rejections++;
        }

        emit Verified(msg.sender, _student, _confirm);
    }

    function closeWindow() external onlyAdmin {
        require(!windowClosed, "Already closed");
        windowClosed = true;
    }

    function runSelection() external onlyAdmin {
        require(windowClosed, "Close window first");
        require(!selectionDone, "Already done");

        // Collect verified eligible applicants
        address[] memory eligible = new address[](applicantList.length);
        uint256 count = 0;
        for (uint i = 0; i < applicantList.length; i++) {
            if (applications[applicantList[i]].verified) {
                eligible[count] = applicantList[i];
                count++;
            }
        }

        // Sort by CGPA descending (bubble sort for small arrays)
        for (uint i = 0; i < count; i++) {
            for (uint j = 0; j < count - i - 1; j++) {
                if (applications[eligible[j]].cgpa < applications[eligible[j+1]].cgpa) {
                    address tmp = eligible[j];
                    eligible[j] = eligible[j+1];
                    eligible[j+1] = tmp;
                }
            }
        }

        // Top 10% — minimum 1
        uint256 topCount = (count * 10) / 100;
        if (topCount == 0 && count > 0) topCount = 1;

        address[] memory selected = new address[](topCount);
        for (uint i = 0; i < topCount; i++) {
            applications[eligible[i]].selected = true;
            selected[i] = eligible[i];
            // Transfer ETH directly
            (bool ok,) = payable(eligible[i]).call{value: scholarshipAmount}("");
            require(ok, "ETH transfer failed");
            emit ScholarshipPaid(eligible[i], scholarshipAmount);
        }

        selectionDone = true;
        emit SelectionDone(selected);
    }

    function getApplicants() external view returns (address[] memory) {
        return applicantList;
    }

    function getApplicationDetails(address _student) external view returns (
        uint256 cgpa, bool verified, bool selected, uint8 confirmations, uint8 rejections
    ) {
        Application memory a = applications[_student];
        return (a.cgpa, a.verified, a.selected, a.confirmations, a.rejections);
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}