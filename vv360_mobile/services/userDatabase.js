import SQLite from 'react-native-sqlite-storage';
import Config from './config';
import { autoBackupDB } from './BackupService';
import { Alert } from 'react-native';

const db = SQLite.openDatabase(
  { name: Config.DB_NAME, location: 'default' },
  () => console.log('✅ DB connected'),
  error => console.log('❌ DB error:', error)
);


export const createUserTable = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        );`,
        [],
        () => {
          console.log('✅ User table created.');
          resolve(); // Resolve when table creation succeeds
        },
        (txObj, error) => {
          console.error('❌ Failed to create Users table:', error.message);
          reject(error);
          return true;
        }
      );
    });
  });
};


export const insertUser = (username, password, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM Users WHERE username = ?;`,
      [username],
      (_, result) => {
        if (result.rows.length > 0) {
          console.log('⚠️ User already exists');
          callback && callback(false, 'User already exists');
        } else {
          tx.executeSql(
            `INSERT INTO Users (username, password) VALUES (?, ?);`,
            [username, password],
            async () => {
              console.log('✅ User inserted');
              await autoBackupDB();
              callback && callback(true, 'User added successfully');
            },
            (_, error) => {
              console.error('❌ Insert user error:', error);
              callback && callback(false, 'Insert user failed');
              return true;
            }
          );
        }
      },
      (_, error) => {
        console.error('❌ Check user existence error:', error);
        callback && callback(false, 'Check user error');
        return true;
      }
    );
  }, transactionError => {
    console.log('❌ Transaction failed:', transactionError.message);
    callback && callback(false, 'Transaction failed');
  });
};



export const deleteUserByUsername = (username, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `DELETE FROM Users WHERE username = ?;`,
      [username],
      async (_, result) => {
        if (result.rowsAffected > 0) {
          console.log(`✅ User '${username}' deleted`);
          await autoBackupDB();
          callback && callback(true, `User '${username}' deleted successfully`);
        } else {
          console.log(`⚠️ No user found with username '${username}'`);
          callback && callback(false, `No user found with username '${username}'`);
        }
      },
      (_, error) => {
        console.error('❌ Delete user error:', error);
        callback && callback(false, 'Failed to delete user');
        return true;
      }
    );
  }, transactionError => {
    console.log('❌ Transaction failed in deleteUser:', transactionError.message);
    callback && callback(false, 'Transaction failed while deleting user');
  });
};


export const loginUser = (username, password, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM Users WHERE username = ? AND password = ?;`,
      [username, password],
      (_, { rows }) => {
        if (rows.length > 0) {
          callback(true);
        } else {
          callback(false);
        }
      },
      (_, error) => {
        console.error('Login error:', error.message);
        callback(false);
      }
    );
  });
};

export const getAllUsers = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM Users;`,
      [],
      (_, result) => {
        const rows = [];
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows.item(i));
        }
        callback(rows);
      },
      (_, error) => {
        console.error('❌ Error fetching users:', error);
        callback([]);
        return true;
      }
    );
  });
};
