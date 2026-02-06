require("dotenv").config();
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(
  process.env.ADMIN_PRIVATE_KEY,
  provider
);

module.exports = { provider, wallet };
