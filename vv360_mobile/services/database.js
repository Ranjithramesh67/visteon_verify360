import SQLite from 'react-native-sqlite-storage';
import Config from './config';
import { autoBackupDB } from './BackupService';
import { Alert } from 'react-native';

const db = SQLite.openDatabase(
  { name: Config.DB_NAME, location: 'default' },
  () => console.log('✅ DB connected'),
  error => console.log('❌ DB error:', error)
);

// Part Master
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
        console.log('Inserted:', part);
        await autoBackupDB(); // Backup on each insert
      },
      (_, error) => {
        console.log('Insert error:', error.message);
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

export const getPartNameByPartNo = (partNo, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM PartMaster WHERE partNo = ?`,
      [partNo?.toString()?.slice(0,5)+'-'+partNo?.toString()?.slice(5,)],
      (_, result) => {
        if (result.rows.length > 0) {
          callback(result.rows.item(0));
        } else {
          callback(null);
        }
      },
      (_, error) => {
        console.log('Fetch part name error:', error.message);
        callback(null);
      }
    );
  });
};


export const clearPartTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `DELETE FROM PartMaster;`,
      [],
      () => {
        console.log('All data cleared from PartMaster table');
        Alert.alert('Success', 'PartMaster table cleared');
      },
      (_, error) => {
        console.log('Failed to clear PartMaster table:', error.message);
        Alert.alert('Error', error.message);
      }
    );
  });
};




// Invoice Bin Verfification
export const createInvoiceTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Invoice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoiceNo TEXT,
        partNo TEXT,
        partName TEXT,
        totalQty INTEGER
      );`
    );
  });
};

export const insertInvoice = (invoice, callback) => {
  db.transaction(
    tx => {
      tx.executeSql(
        `INSERT INTO Invoice (invoiceNo, partNo, partName, totalQty) VALUES (?, ?, ?, ?);`,
        [invoice.invoiceNo, invoice.partNo, invoice.partName, invoice.totalQty],
        async (_, result) => {
          console.log('Invoice inserted:', invoice);
          await autoBackupDB();
          callback && callback(true);
        },
        (_, error) => {
          console.log('Insert Invoice error:', error.message);
          callback && callback(false);
        }
      );
    },
    transactionError => {
      console.log('Transaction failed in insertInvoice:', transactionError.message);
    }
  );
};


export const getInvoiceByInvoiceNoAndPartNo = (invoiceNo, partNo, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM Invoice WHERE invoiceNo = ? AND partNo = ?`,
      [invoiceNo, partNo],
      (_, result) => {
        if (result.rows.length > 0) {
          callback(result.rows.item(0));
        } else {
          callback(null);
        }
      },
      (_, error) => {
        console.log('Fetch invoice error:', error.message);
        callback(null);
      }
    );
  });
};

export const clearInvoiceTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `DELETE FROM Invoice;`,
      [],
      async () => {
        console.log('All data cleared from Invoice table');
        await autoBackupDB();
        Alert.alert('Success', 'Invoice table cleared');
      },
      (_, error) => {
        console.log('Failed to clear Invoice table:', error.message);
        Alert.alert('Error', error.message);
      }
    );
  });
};




// Binlabel
export const createBinLabelTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS BinLabel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoiceNo TEXT,
        partNo TEXT,
        binLabel TEXT,
        scannedQty INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending'
      );`,
      [],
      () => {
        console.log('BinLabel table created or already exists.');
      },
      (_, error) => {
        console.error('Error creating BinLabel table:', error.message);
        return false;
      }
    );
  });
};


export const getAllBinLabels = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM BinLabel;',
      [],
      (_, result) => {
        const rows = [];
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows.item(i));
        }
        console.log('Fetched BinLabel data:', rows);
        callback(rows);
      },
      (tx, error) => {
        console.error('Error fetching BinLabels:', error);
        return false;
      }
    );
  },
    transactionError => {
      console.log('Transaction error:', transactionError.message);
    });
};




export const insertBinLabel = async ({ invoiceNo, partNo, binLabel, scannedQty }, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT totalQty FROM Invoice WHERE invoiceNo = ? AND partNo = ?`,
      [invoiceNo, partNo],
      (_, invoiceResult) => {
        if (invoiceResult.rows.length === 0) {
          return;
        }

        const totalQty = invoiceResult.rows.item(0).totalQty;

        tx.executeSql(
          `SELECT SUM(scannedQty) as totalScanned FROM BinLabel WHERE invoiceNo = ? AND partNo = ?`,
          [invoiceNo, partNo],
          (_, scanResult) => {
            const totalScanned = scanResult.rows.item(0).totalScanned || 0;
            const nextTotal = totalScanned + scannedQty;

            // if (nextTotal > totalQty) {
            //   return;
            // }

            const remainingQty = totalQty - nextTotal;

            tx.executeSql(
              `INSERT INTO BinLabel (invoiceNo, partNo, binLabel, scannedQty) VALUES (?, ?, ?, ?);`,
              [invoiceNo, partNo, binLabel, scannedQty],
              () => {
                tx.executeSql(
                  `UPDATE Invoice SET totalQty = ? WHERE invoiceNo = ? AND partNo = ?`,
                  [remainingQty, invoiceNo, partNo],
                  async () => {
                    await autoBackupDB();
                    if (callback) callback();
                  },
                  (_, error) => {
                    console.log('Failed to update Invoice:', error.message);
                  }
                );
              },
              (_, error) => {
                console.log('Insert BinLabel error:', error.message);
              }
            );
          },
          (_, error) => {
            console.log('Error summing scannedQty:', error.message);
          }
        );
      },
      (_, error) => {
        console.log('Failed to fetch Invoice:', error.message);
      }
    );
  },
    transactionError => {
      console.log('Transaction error:', transactionError.message);
    });
};


// Customer / VEPl

export const createCustomerTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Customer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        binlabel TEXT,
        invoiceNo TEXT,
        partNo TEXT,
        partName TEXT,
        totalQty INTEGER,
        binNo INTEGER
      );`,
      [],
      () => {
        console.log('Customer table created or already exists.');
      },
      (_, error) => {
        console.error('Error creating Customer table:', error.message);
        return false;
      }
    );
  });
};

export const createVeplTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Vepl (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serialNo TEXT,
        partNo TEXT,
        qty INTEGER
      );`
    );
  });
};

export const insertCustomer = (customer, callback) => {
  db.transaction(
    tx => {
      tx.executeSql(
        `INSERT INTO Customer (invoiceNo, partNo, partName, totalQty, binNo, binlabel) VALUES (?, ?, ?, ?, ?, ?);`,
        [customer.invoiceNo, customer.partNo, customer.partName, customer.totalQty, customer.binNo, customer.binlabel],
        async (_, result) => {
          console.log('customer inserted:', customer);
          await autoBackupDB();

          callback && callback(true);
        },
        (_, error) => {
          console.log('Insert customer error:', error.message);
          callback && callback(false);
        }
      );
    },
    transactionError => {
      console.log('Transaction failed in insertcustomer:', transactionError.message);
    }
  );
};


export const getCustomerByPartNo = (invoiceNo, partNo, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM Customer WHERE invoiceNo = ? AND partNo = ?`,
      [invoiceNo, partNo],
      (_, result) => {
        if (result.rows.length > 0) {
          callback(result.rows.item(0));
        } else {
          callback(null);
        }
      },
      (_, error) => {
        console.log('Fetch Customer error:', error.message);
        callback(null);
      }
    );
  });
};

export const insertVepl = (veplData, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM BinLabel WHERE partNo = ? AND binLabel = ?;`,
      [veplData.partNo, veplData.binLabel],
      (_, selectResult) => {
        if (selectResult.rows.length > 0) {
          tx.executeSql(
            `INSERT INTO Vepl (serialNo, partNo, qty) VALUES (?, ?, ?);`,
            [veplData.serialNo, veplData.partNo, veplData.qty],
            (_, insertResult) => {
              tx.executeSql(
                `UPDATE BinLabel SET status = 'complete' WHERE partNo = ? AND binLabel = ?;`,
                [veplData.partNo, veplData.binLabel],
                async (_, updateResult) => {
                  console.log('BinLabel status updated to complete');
                  await autoBackupDB();

                  callback && callback(true);
                },
                (_, updateError) => {
                  console.log('Update BinLabel status error:', updateError.message);
                  callback && callback(false);
                }
              );
            },
            (_, insertError) => {
              console.log('Insert VEPL error:', insertError.message);
              callback && callback(false);
            }
          );
        } else {
          // Not found in BinLabel table
          console.log('BinLabel with given partNo and binLabel NOT found.');
          callback && callback(false, 'BinLabel not found');
        }
      },
      (_, selectError) => {
        console.log('Error querying BinLabel:', selectError.message);
        callback && callback(false, selectError.message);
      }
    );
  },
    transactionError => {
      console.log('Transaction failed in insertVepl:', transactionError.message);
      callback && callback(false, transactionError.message);
    });
};
