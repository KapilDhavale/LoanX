// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title LoanManager
 * @notice Trust-First, No-Collateral Micro-Lending (CBI-Compatible MVP)
 * @dev Behavioral signals emitted on-chain, trust calculated off-chain
 */
contract LoanManager {

    struct User {
        bool registered;
        uint256 cbiScore;
        uint256 totalLoans;
        bool blacklisted;
    }

    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 createdAt;
        uint256 dueDate;       // repayment deadline for CBI
        bool repaid;
        bool defaulted;
    }

    address public admin;
    uint256 public loanCounter;

    mapping(address => User) private users;
    mapping(uint256 => Loan) private loans;

    event UserRegistered(address indexed user);

    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 dueDate
    );

    event RepaymentMade(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 dueDate,
        uint256 paidAt
    );

    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 dueDate,
        uint256 defaultedAt
    );

    event CBIScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore
    );

    event UserBlacklisted(address indexed user, bool status);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyRegisteredUser() {
        require(users[msg.sender].registered, "User not registered");
        _;
    }

    modifier loanExists(uint256 _loanId) {
        require(_loanId < loanCounter, "Loan does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /* -----------------------------
       User functions
       ----------------------------- */

    function registerUser() external {
        require(!users[msg.sender].registered, "Already registered");

        users[msg.sender] = User({
            registered: true,
            cbiScore: 50,
            totalLoans: 0,
            blacklisted: false
        });

        emit UserRegistered(msg.sender);
    }

    /**
     * @notice Request a loan (no collateral). Duration is a parameter (seconds).
     * @param _amount Loan amount (units are contextual/off-chain)
     * @param _duration Requested duration in seconds (capped to 30 days)
     */
    function requestLoan(uint256 _amount, uint256 _duration)
        external
        onlyRegisteredUser
    {
        require(!users[msg.sender].blacklisted, "User blacklisted");
        require(_amount > 0, "Invalid loan amount");
        require(_duration > 0, "Invalid duration");
        require(_duration <= 30 days, "Duration too long"); // safety cap for MVP

        uint256 loanId = loanCounter;
        uint256 dueDate = block.timestamp + _duration;

        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            amount: _amount,
            createdAt: block.timestamp,
            dueDate: dueDate,
            repaid: false,
            defaulted: false
        });

        users[msg.sender].totalLoans += 1;
        loanCounter += 1;

        emit LoanRequested(loanId, msg.sender, _amount, dueDate);
    }

    /**
     * @notice Repay a loan (payable handling is off-chain / out-of-scope for MVP).
     * Emits repayment timing data for the CBI engine to consume.
     */
    function repayLoan(uint256 _loanId)
        external
        loanExists(_loanId)
    {
        Loan storage loan = loans[_loanId];

        require(loan.borrower == msg.sender, "Not loan owner");
        require(!loan.repaid, "Loan already repaid");
        require(!loan.defaulted, "Loan defaulted");

        loan.repaid = true;

        emit RepaymentMade(
            _loanId,
            msg.sender,
            loan.amount,
            loan.dueDate,
            block.timestamp
        );
    }

    /* -----------------------------
       Admin / risk functions
       ----------------------------- */

    /**
     * @notice Mark a loan as defaulted. Only allowed after due date and if not repaid.
     */
    function markLoanDefault(uint256 _loanId)
        external
        onlyAdmin
        loanExists(_loanId)
    {
        Loan storage loan = loans[_loanId];

        require(!loan.repaid, "Loan already repaid");
        require(!loan.defaulted, "Already defaulted");
        require(block.timestamp > loan.dueDate, "Loan not overdue"); // prevents early defaults

        loan.defaulted = true;

        emit LoanDefaulted(
            _loanId,
            loan.borrower,
            loan.dueDate,
            block.timestamp
        );
    }

    /**
     * @notice Update CBI score on-chain after off-chain computation.
     */
    function updateCBIScore(address _user, uint256 _newScore)
        external
        onlyAdmin
    {
        require(users[_user].registered, "User not registered");
        require(_newScore <= 100, "Score must be <= 100");

        uint256 oldScore = users[_user].cbiScore;
        users[_user].cbiScore = _newScore;

        emit CBIScoreUpdated(_user, oldScore, _newScore);
    }

    /**
     * @notice Blacklist or un-blacklist a user (admin action).
     */
    function blacklistUser(address _user, bool _status)
        external
        onlyAdmin
    {
        require(users[_user].registered, "User not registered");
        users[_user].blacklisted = _status;

        emit UserBlacklisted(_user, _status);
    }

    /* -----------------------------
       Views
       ----------------------------- */

    function getUser(address _user)
        external
        view
        returns (User memory)
    {
        return users[_user];
    }

    function getLoan(uint256 _loanId)
        external
        view
        loanExists(_loanId)
        returns (Loan memory)
    {
        return loans[_loanId];
    }
}
