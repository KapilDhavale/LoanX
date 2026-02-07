require("dotenv").config();
const { ethers } = require("ethers");

// ✅ Use ethers v5 style provider
const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL
);

const wallet = new ethers.Wallet(
  process.env.ADMIN_PRIVATE_KEY,
  provider
);

module.exports = { provider, wallet };
