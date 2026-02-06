const { ethers } = require("ethers");

const provider = new ethers.WebSocketProvider("ws://127.0.0.1:8545");

const wallet = new ethers.Wallet(
  process.env.ADMIN_PRIVATE_KEY,
  provider
);

module.exports = {
  provider,
  wallet
};
