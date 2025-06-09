import SQLite from 'react-native-sqlite-storage';
import Config from './config';
import { autoBackupDB } from './BackupService';

const db = SQLite.openDatabase(
  { name: Config.DB_NAME, location: 'default' },
  () => console.log('✅ DB connected'),
  error => console.log('❌ DB error:', error)
);

export const createPartMasterTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS PartMaster (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partNo TEXT,
        partName TEXT,
        binQty INTEGER
      );`
    );
  });
};

export const insertPart = async (part) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO PartMaster (partNo, partName, binQty) VALUES (?, ?, ?);`,
      [part.partNo, part.partName, part.binQty],
      async () => {
        console.log('✅ Inserted:', part);
        await autoBackupDB(); // Backup on each insert
      },
      (_, error) => {
        console.log('❌ Insert error:', error.message);
      }
    );
  });
};

export const getAllParts = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM PartMaster`,
      [],
      (_, results) => {
        const rows = [];
        for (let i = 0; i < results.rows.length; i++) {
          rows.push(results.rows.item(i));
        }
        callback(rows);
      }
    );
  });
};
