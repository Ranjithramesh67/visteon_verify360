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
        visteonPart TEXT
      );`
    );
  },
    transactionError => {
      console.log('Transaction failed in create part:', transactionError.message);
    });
};

export const insertPart = async (part) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO PartMaster (partNo, visteonPart) VALUES (?, ?);`,
      [part.partNo, part.visteonPart],
      async () => {
        console.log('Inserted:', part);
        await autoBackupDB(); // Backup on each insert
      },
      (_, error) => {
        console.log('Insert error:', error.message);
      }
    );
  }, transactionError => {
    console.log('Transaction failed in insert part:', transactionError.message);
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
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};

export const getPartNameByPartNo = (partNo, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM PartMaster WHERE partNo = ?`,
      // [partNo?.toString()?.slice(0, 5) + '-' + partNo?.toString()?.slice(5,)],
      [partNo],
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
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
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
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
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
        totalQty INTEGER,
        orgQty INTEGER,
        invDate TEXT
      );`
    );
  }, transactionError => {
    console.log('Transaction errro:', transactionError.message);
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};

export const insertInvoice = (invoice, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM Invoice WHERE invoiceNo = ? AND partNo = ?;`,
      [invoice.invoiceNo, invoice.partNo],
      (_, selectResult) => {
        if (selectResult.rows.length > 0) {
          const existingInvoice = selectResult.rows.item(0);
          console.log('Duplicate invoice found, returning existing:', existingInvoice);
          callback && callback({ status: 'duplicate', data: existingInvoice });
        } else {
          tx.executeSql(
            `INSERT INTO Invoice (invoiceNo, partNo, totalQty, orgQty, invDate) VALUES (?, ?, ?, ?, ?);`,
            [invoice.invoiceNo, invoice.partNo, invoice.totalQty, invoice.totalQty, invoice.invDate],
            async (_, result) => {
              console.log('Invoice inserted:', invoice);
              await autoBackupDB();
              callback && callback({ status: 'inserted', data: invoice });
            },
            (_, error) => {
              console.log('Insert Invoice error:', error.message);
              callback && callback({ status: 'error', error: insertError.message });
            }
          );
        }
      },
      (_, selectError) => {
        console.log('Error checking for duplicate invoice:', selectError.message);
        callback && callback({ status: 'error', error: selectError.message });
      }
    );
  },
    transactionError => {
      console.log('Transaction failed in insertInvoice:', transactionError.message);
    });
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
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
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
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};




// CustomerBinLabel
export const createCustomerBinLabelTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS CustomerBinLabel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoiceNo TEXT,
        partNo TEXT,
        binLabel TEXT,
        serialNo TEXT,
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
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};


export const getAllCustomerBinLabels = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM CustomerBinLabel;',
      [],
      (_, result) => {
        const rows = [];
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows.item(i));
        }
        console.log('Fetched CustomerBinLabel data:', rows);
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



export const checkDup = async ({ invoiceNo, binLabel, partNo, serialNo, scannedQty })=>{
  db.transaction (tx=>{
     tx.executeSql(
          `SELECT * FROM CustomerBinLabel WHERE invoiceNo = ? AND partNo = ? AND serialNo = ?`,
          [invoiceNo, partNo, serialNo],
          (serialCheckResult) => {
            if (serialCheckResult.rows.length > 0) {
              Alert.alert('Duplicate Entry', `Serial number ${serialNo} already scanned for this part.`);
              if (callback) callback(false);
              return;
            }
          });
  })
}


export const insertCustomerBinLabel = async ({ invoiceNo, binLabel, partNo, serialNo, scannedQty }, callback) => {
  db.transaction(tx => {
console.log(invoiceNo, partNo, serialNo)
    // ✅ Step 1: Check if the serial number is already scanned
    tx.executeSql(
      `SELECT * FROM CustomerBinLabel WHERE invoiceNo = ? AND partNo = ? AND serialNo = ?`,
      [invoiceNo, partNo, serialNo],
      (_,serialCheckResult) => {
        console.log(serialCheckResult)
        if (serialCheckResult.rows.length > 0) {
          Alert.alert('Duplicate Entry', `Serial number ${serialNo} already scanned for this part.`);
          if (callback) callback(false);
          return;
        }

        // ✅ Step 2: Proceed to fetch invoice data
        tx.executeSql(
          `SELECT totalQty FROM Invoice WHERE invoiceNo = ? AND partNo = ?`,
          [invoiceNo, partNo],
          (_, invoiceResult) => {
            if (invoiceResult.rows.length === 0) {
              Alert.alert('Invoice Not Found', `No matching invoice found for ${invoiceNo}, ${partNo}`);
              if (callback) callback(false);
              return;
            }

            const totalQty = invoiceResult.rows.item(0).totalQty;

            // ✅ Step 3: Get total scanned qty
            tx.executeSql(
              `SELECT SUM(scannedQty) as totalScanned FROM CustomerBinLabel WHERE invoiceNo = ? AND partNo = ?`,
              [invoiceNo, partNo],
              (_, scanResult) => {
                const remainingQty = totalQty - scannedQty;

                console.log('TotalQty:', totalQty, 'Scanned:', scannedQty, 'Remain:', remainingQty);

                // ✅ Step 4: Insert new scanned data
                tx.executeSql(
                  `INSERT INTO CustomerBinLabel (invoiceNo, partNo, binLabel, scannedQty, serialNo, status) VALUES (?, ?, ?, ?, ?, ?);`,
                  [invoiceNo, partNo, binLabel, Number(scannedQty), serialNo, 'pending'],
                  () => {
                    console.log('✅ CustomerBinLabel inserted successfully');

                    // ✅ Step 5: Update the remaining qty in Invoice
                    tx.executeSql(
                      `UPDATE Invoice SET totalQty = ? WHERE invoiceNo = ? AND partNo = ?`,
                      [remainingQty, invoiceNo, partNo],
                      async () => {
                        await autoBackupDB();
                        if (callback) callback(true);
                      },
                      (_, error) => {
                        console.log('❌ Failed to update Invoice:', error.message);
                        if (callback) callback(false);
                      }
                    );
                  },
                  (_, error) => {
                    console.log('❌ Insert CustomerBinLabel error:', error.message);
                    if (callback) callback(false);
                  }
                );
              },
              (_, error) => {
                console.log('❌ Error summing scannedQty:', error.message);
                if (callback) callback(false);
              }
            );
          },
          (_, error) => {
            console.log('❌ Failed to fetch Invoice:', error.message);
            if (callback) callback(false);
          }
        );
      },
      (_, error) => {
        console.log('❌ Error checking serial number:', error.message);
        if (callback) callback(false);
      }
    );
  }, transactionError => {
    console.log('❌ Transaction error:', transactionError.message);
    if (callback) callback(false);
  });
};


// Customer / VEPl

export const createCustomerTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Customer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoiceNo TEXT,
        partNo TEXT,
        binlabel TEXT,
        visteonPart TEXT,
        totalQty INTEGER
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
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
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
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};

export const insertCustomer = (customer, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM Customer WHERE invoiceNo = ? AND partNo = ?;`,
      [customer.invoiceNo, customer.partNo],
      (_, selectResult) => {
        if (selectResult.rows.length > 0) {
          const existingCustomer = selectResult.rows.item(0);
          console.log('Duplicate customer found:', existingCustomer);
          callback && callback({ status: 'duplicate', data: existingCustomer });
        } else {
          tx.executeSql(
            `INSERT INTO Customer (invoiceNo, partNo, visteonPart, totalQty, binlabel) VALUES (?, ?, ?, ?, ?);`,
            [customer.invoiceNo, customer.partNo, customer.visteonPart, customer.totalQty, customer.binlabel],
            async (_, insertResult) => {
              console.log('Customer inserted:', customer);
              await autoBackupDB();
              callback && callback({ status: 'inserted', data: customer });
            },
            (_, insertError) => {
              console.log('Insert customer error:', insertError.message);
              callback && callback({ status: 'error', error: insertError.message });
            }
          );
        }
      },
      (_, selectError) => {
        console.log('Error checking for duplicate customer:', selectError.message);
        callback && callback({ status: 'error', error: selectError.message });
      }
    );
  },
    transactionError => {
      console.log('Transaction failed in insertCustomer:', transactionError.message);
      callback && callback({ status: 'error', error: transactionError.message });
    });
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
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};

export const insertVepl = (veplData, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM CustomerBinLabel WHERE partNo = ? AND binLabel=?;`,
      [veplData.partNo, veplData.binLabel],
      (_, selectResult) => {
        if (selectResult.rows.length > 0) {
          tx.executeSql(
            `INSERT INTO Vepl (serialNo, partNo, qty) VALUES (?, ?, ?);`,
            [veplData.serialNo, veplData.partNo, veplData.qty],
            (_, insertResult) => {
              tx.executeSql(
                `UPDATE CustomerBinLabel SET status = 'complete' WHERE partNo = ? AND binLabel=?;`,
                [veplData.partNo, veplData.binLabel],
                async (_, updateResult) => {
                  console.log('CustomerBinLabel status updated to complete');
                  await autoBackupDB();

                  callback && callback(true);
                },
                (_, updateError) => {
                  console.log('Update CustomerBinLabel status error:', updateError.message);
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
          console.log('CustomerBinLabel with given partNo and CustomerBinLabel NOT found.');
          callback && callback(false, 'CustomerBinLabel not found');
        }
      },
      (_, selectError) => {
        console.log('Error querying CustomerBinLabel:', selectError.message);
        callback && callback(false, selectError.message);
      }
    );
  },
    transactionError => {
      console.log('Transaction failed in insertVepl:', transactionError.message);
      callback && callback(false, transactionError.message);
    });
};


// Bin /PART label VErifictaion

export const createBinTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS BinLabel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partNo TEXT,
        visteonPart TEXT,
        serialNo TEXT,
        totalQty INTEGER,
        orgQty INTEGER
      );`
    );
  }, transactionError => {
    console.log('Transaction errro:', transactionError.message);
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};

export const insertBinLabel = (binData, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM BinLabel WHERE serialNo = ? AND partNo = ?;`,
      [binData.serialNo, binData.partNo],
      (_, selectResult) => {
        if (selectResult.rows.length > 0) {
          const existingInvoice = selectResult.rows.item(0);
          console.log('Duplicate binlabel found, returning existing');
          callback && callback({ status: 'duplicate', data: existingInvoice });
        } else {
          tx.executeSql(
            `INSERT INTO BinLabel (partNo, totalQty, orgQty, serialNo,visteonPart) VALUES (?, ?, ?, ?, ?);`,
            [binData.partNo, binData.totalQty, binData.totalQty, binData.serialNo, binData.visteonPart],
            async (_, result) => {
              console.log('Binlabel inserted:', binData);
              await autoBackupDB();
              callback && callback({ status: 'inserted', data: binData });
            },
            (_, error) => {
              console.log('Insert Binlabel error:', error.message);
              callback && callback({ status: 'error', error: insertError.message });
            }
          );
        }
      },
      (_, selectError) => {
        console.log('Error checking for duplicate Binlabel:', selectError.message);
        callback && callback({ status: 'error', error: selectError.message });
      }
    );
  },
    transactionError => {
      console.log('Transaction failed in insertBinlabel:', transactionError.message);
    });
};

export const updateBinLabel = async ({ partNo, scannedQty, serialNo }, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT totalQty FROM BinLabel WHERE serialNo = ? AND partNo = ?`,
      [serialNo, partNo],
      (_, invoiceResult) => {
        if (invoiceResult.rows.length === 0) {
          // console.log('❌ Invoice not found');
          Alert.alert('Binlabel Not Found', `No matching partno found for ${serialNo, partNo}`);
          if (callback) callback(false);
          return;
        }

        const totalQty = invoiceResult.rows.item(0).totalQty;
        const remainingQty = totalQty - scannedQty;

        console.log(totalQty, remainingQty, scannedQty)

        tx.executeSql(
          `UPDATE BinLabel SET totalQty = ? WHERE serialNo = ? AND partNo = ?`,
          [remainingQty, serialNo, partNo],
          async () => {
            await autoBackupDB();
            if (callback) callback(true);
          },
          (_, error) => {
            console.log('❌ Failed to update BinLabel:', error.message);
            if (callback) callback(false);
          }
        );
      },
      (_, error) => {
        console.log('❌ Failed to fetch BinLabel:', error.message);
        if (callback) callback(false);
      }
    );
  }, transactionError => {
    console.log('❌ Transaction error:', transactionError.message);
    if (callback) callback(false);
  });
};

export const getBinDataByPartNo = (serialNo, partNo, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM BinLabel WHERE serialNo = ? AND partNo = ?`,
      [serialNo, partNo],
      (_, result) => {
        if (result.rows.length > 0) {
          callback(result.rows.item(0));
        } else {
          callback(null);
        }
      },
      (_, error) => {
        console.log('Fetch BinData error:', error.message);
        callback(null);
      }
    );
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};


export const getPrintQr = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT Invoice.*, PartMaster.visteonPart 
       FROM Invoice 
       LEFT JOIN PartMaster ON Invoice.partNo = PartMaster.partNo;`,
      [],
      (_, result) => {
        if (result.rows.length > 0) {
          const data = [];
          for (let i = 0; i < result.rows.length; i++) {
            data.push(result.rows.item(i));
          }
          callback(data);
        } else {
          callback(null);
        }
      },
      (_, error) => {
        console.log('Fetch Invoice with visteonPart error:', error.message);
        callback(null);
      }
    );
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};
