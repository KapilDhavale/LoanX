// frontend/js/config.js

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
// ⚠️ Must match deployed address

// 🔥 ADD getUser HERE
const abi = [

  {
    "inputs": [],
    "name": "loanCounter",
    "outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  },

  {
    "inputs":[{"internalType":"uint256","name":"_loanId","type":"uint256"}],
    "name":"getLoan",
    "outputs":[
      {
        "components":[
          {"internalType":"uint256","name":"id","type":"uint256"},
          {"internalType":"address","name":"borrower","type":"address"},
          {"internalType":"uint256","name":"amount","type":"uint256"},
          {"internalType":"uint256","name":"createdAt","type":"uint256"},
          {"internalType":"uint256","name":"dueDate","type":"uint256"},
          {"internalType":"bool","name":"repaid","type":"bool"},
          {"internalType":"bool","name":"defaulted","type":"bool"}
        ],
        "internalType":"struct LoanManager.Loan",
        "name":"",
        "type":"tuple"
      }
    ],
    "stateMutability":"view",
    "type":"function"
  },

  // ✅ ADD THIS BLOCK
  {
    "inputs":[{"internalType":"address","name":"_user","type":"address"}],
    "name":"getUser",
    "outputs":[
      {
        "components":[
          {"internalType":"bool","name":"registered","type":"bool"},
          {"internalType":"uint256","name":"cbiScore","type":"uint256"},
          {"internalType":"uint256","name":"totalLoans","type":"uint256"},
          {"internalType":"bool","name":"blacklisted","type":"bool"}
        ],
        "internalType":"struct LoanManager.User",
        "name":"",
        "type":"tuple"
      }
    ],
    "stateMutability":"view",
    "type":"function"
  },

  {
    "inputs":[
      {"internalType":"uint256","name":"_amount","type":"uint256"},
      {"internalType":"uint256","name":"_duration","type":"uint256"}
    ],
    "name":"requestLoan",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },

  {
    "inputs":[{"internalType":"uint256","name":"_loanId","type":"uint256"}],
    "name":"repayLoan",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  }
];

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

const contract = new ethers.Contract(contractAddress, abi, provider);

// Hardhat account #1
const userPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const wallet = new ethers.Wallet(userPrivateKey, provider);

const contractWithSigner = contract.connect(wallet);

const userAddress = wallet.address;
