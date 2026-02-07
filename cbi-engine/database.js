const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./bank.db");

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS pool (
      id INTEGER PRIMARY KEY,
      balance INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      amount INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO pool (id, balance)
    VALUES (1, 0)
  `);

});

module.exports = db;
