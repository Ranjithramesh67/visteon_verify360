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
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT
        );`,
        [],
        () => console.log('✅ User table created'),
        (_, error) => console.error('User table error:', error)
      );
    });
  };
  
  export const insertUser = (username, password) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO Users (username, password) VALUES (?, ?);`,
        [username, password],
        () => console.log('✅ User inserted'),
        (_, error) => console.error('Insert user error:', error)
      );
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
          console.log('✅ getAllUsers result:', result); // DEBUG LINE
          console.log('✅ getAllUsers result:', result.rows.item(0)); // DEBUG LINE
          console.log('✅ getAllUsers result:', rows); // DEBUG LINE
          callback(rows); // This should be an array of user objects
        },
        (_, error) => {
          console.error('❌ Error fetching users:', error);
          callback([]); // Return empty array on failure
          return true;
        }
      );
    });
  };
  