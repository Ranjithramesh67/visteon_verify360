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
        visteonPart TEXT,
        binQty INTEGER
      );`
    );
  },
    transactionError => {
      console.log('Transaction failed in create part:', transactionError.message);
    });
};

export const insertPart = (part, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO PartMaster (partNo, visteonPart, binQty) VALUES (?, ?, ?);`,
      [part.partNo, part.visteonPart, part.binQty],
      async () => {
        console.log('Inserted:', part);
        await autoBackupDB();
        callback(true);
      },
      (_, error) => {
        console.log('Insert error:', error.message);
        callback(false);
      }
    );
  }, transactionError => {
    console.log('Transaction failed in insert part:', transactionError.message);
    callback(false);
  });
};

export const deletePart = (partNo, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `DELETE FROM PartMaster WHERE partNo = ?;`,
      [partNo],
      async () => {
        console.log('Deleted partNo:', partNo);
        await autoBackupDB();
        callback(true);
      },
      (_, error) => {
        console.log('Delete error:', error.message);
        callback(false);
      }
    );
  }, transactionError => {
    console.log('Transaction failed in deletePart:', transactionError.message);
    callback(false);
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
        console.log(rows)
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
      async () => {
        console.log('All data cleared from PartMaster table');
        await autoBackupDB();
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
        invDate TEXT,
        invSerialNo TEXT,
        createdAt TEXT DEFAULT (datetime('now','localtime')),
        updatedAt TEXT DEFAULT (datetime('now','localtime'))
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
              const insertedId = result.insertId;
              const now = new Date();
              const day = String(now.getDate()).padStart(2, '0');
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const year = now.getFullYear();
              const invSerialNo = `${day}${month}${year}VV${insertedId}`;

              // Update the invSerialNo after insert
              tx.executeSql(
                `UPDATE Invoice SET invSerialNo = ? WHERE id = ?;`,
                [invSerialNo, insertedId],
                async () => {
                  console.log('invSerialNo updated:', invSerialNo);
                  await autoBackupDB();
                  callback && callback({ status: 'inserted', data: { ...invoice, id: insertedId, invSerialNo } });
                },
                (_, error) => {
                  console.log('Failed to update invSerialNo:', error.message);
                  callback && callback({ status: 'error', error: error.message });
                }
              );
            },
            (_, insertError) => {
              console.log('Insert Invoice error:', insertError.message);
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
        visteonPart TEXT,
        serialNo TEXT,
        vistSerialNo TEXT DEFAULT '-',
        scannedQty INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT (datetime('now','localtime')),
        updatedAt TEXT DEFAULT (datetime('now','localtime'))
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

export const getAllCustomerBinLabels = (partNo, invoiceNo, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT 
         CustomerBinLabel.*, 
         Invoice.invSerialNo,
         Invoice.createdAt 
       FROM CustomerBinLabel
       LEFT JOIN Invoice 
         ON CustomerBinLabel.partNo = Invoice.partNo 
         AND CustomerBinLabel.invoiceNo = Invoice.invoiceNo
       WHERE CustomerBinLabel.partNo = ? 
         AND CustomerBinLabel.invoiceNo = ?;`,
      [partNo, invoiceNo],
      (_, result) => {
        const rows = [];
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows.item(i));
        }
        console.log('Fetched CustomerBinLabel data with invSerialNo:', rows);
        callback(rows);
      },
      (_, error) => {
        console.error('Error fetching BinLabels with invSerialNo:', error.message);
        return false;
      }
    );
  },
    transactionError => {
      console.log('Transaction error:', transactionError.message);
    });
};

// export const getPendingCustomerBinLabels = (partNo, invoiceNo, callback) => {
//   db.transaction(tx => {
//     tx.executeSql(
//       `SELECT * FROM CustomerBinLabel 
//        WHERE partNo = ? AND invoiceNo = ? AND status = 'pending';`,
//       [partNo, invoiceNo],
//       (_, result) => {
//         const rows = [];
//         for (let i = 0; i < result.rows.length; i++) {
//           rows.push(result.rows.item(i));
//         }
//         callback(rows);
//       },
//       (_, error) => {
//         console.error('Error fetching pending CustomerBinLabel data:', error.message);
//         return false;
//       }
//     );
//   }, transactionError => {
//     console.log('Pirint Transaction error:', transactionError.message);
//   });
// };

export const getPendingCustomerBinLabels = (partNo, invoiceNo, callback) => {
  db.transaction(tx => {
    // Step 1: Check if table has any data
    tx.executeSql(
      `SELECT COUNT(*) as count FROM CustomerBinLabel  WHERE partNo = ? AND invoiceNo = ?;`,
      [partNo, invoiceNo],
      (_, countResult) => {
        const totalCount = countResult.rows.item(0).count;
        console.log("customer count: ", totalCount)

        // If table is empty, return true
        if (totalCount === 0) {
          callback(true);
        } else {
          // Step 2: Check for matching pending rows
          tx.executeSql(
            `SELECT * FROM CustomerBinLabel 
             WHERE partNo = ? AND invoiceNo = ? AND status = 'pending';`,
            [partNo, invoiceNo],
            (_, result) => {
              if (result.rows.length > 0) {
                callback(true); // Pending data found
              } else {
                callback(false); // No pending data for the given part/invoice
              }
            },
            (_, error) => {
              console.error('Error checking pending CustomerBinLabel:', error.message);
              return false;
            }
          );
        }
      },
      (_, error) => {
        console.error('Error checking table data count:', error.message);
        return false;
      }
    );
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};



export const checkDup = async ({ invoiceNo, binLabel, partNo, serialNo, scannedQty }) => {
  db.transaction(tx => {
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


export const insertCustomerBinLabel = async ({ invoiceNo, binLabel, partNo, serialNo, scannedQty, partName }, callback) => {
  db.transaction(tx => {
    console.log(invoiceNo, partNo, serialNo)
    // ✅ Step 1: Check if the serial number is already scanned
    tx.executeSql(
      `SELECT * FROM CustomerBinLabel WHERE invoiceNo = ? AND partNo = ? AND serialNo = ?`,
      [invoiceNo, partNo, serialNo],
      (_, serialCheckResult) => {
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
                  `INSERT INTO CustomerBinLabel (invoiceNo, partNo, binLabel, scannedQty, serialNo, visteonPart, status) VALUES (?, ?, ?, ?, ?, ?, ?);`,
                  [invoiceNo, partNo, binLabel, Number(scannedQty), serialNo, partName, 'pending'],
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
        serialNo TEXT,
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

// export const insertCustomer = (customer, callback) => {
//   db.transaction(tx => {
//     tx.executeSql(
//       `SELECT * FROM Customer WHERE invoiceNo = ? AND partNo = ? AND totalQty =? AND serialNo=?;`,
//       [customer.invoiceNo, customer.partNo, customer.totalQty, customer.serialNo],
//       (_, selectResult) => {
//         console.log(selectResult)
//         if (selectResult.rows.length > 0) {
//           const existingCustomer = selectResult.rows.item(0);
//           console.log('Duplicate customer found:', existingCustomer);
//           callback && callback({ status: 'duplicate', data: existingCustomer });

//         } else {
//           tx.executeSql(
//             `INSERT INTO Customer (invoiceNo, partNo, visteonPart, totalQty, binlabel, serialNo) VALUES (?, ?, ?, ?, ?, ?);`,
//             [customer.invoiceNo, customer.partNo, customer.visteonPart, customer.totalQty, customer.binlabel, customer.serialNo],
//             async (_, insertResult) => {
//               console.log('Customer inserted:', customer);
//               await autoBackupDB();
//               callback && callback({ status: 'inserted', data: customer });
//             },
//             (_, insertError) => {
//               console.log('Insert customer error:', insertError.message);
//               callback && callback({ status: 'error', error: insertError.message });
//             }
//           );
//         }
//       },
//       (_, selectError) => {
//         console.log('Error checking for duplicate customer:', selectError.message);
//         callback && callback({ status: 'error', error: selectError.message });
//       }
//     );
//   },
//     transactionError => {
//       console.log('Transaction failed in insertCustomer:', transactionError.message);
//       callback && callback({ status: 'error', error: transactionError.message });
//     });
// };

export const insertCustomer = (customer, callback) => {
  console.log("from db insert customer function: ", customer)
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM CustomerBinLabel WHERE partNo = ? AND serialNo = ? AND invoiceNo = ? AND status = 'complete'`,
      [customer.partNo, customer.serialNo, customer.invoiceNo],
      (_, { rows }) => {
        if (rows.length > 0) {
          console.log('Duplicate detected: partNo + serialNo with status = complete');
          callback && callback({ status: 'duplicate' });
        } else {
          tx.executeSql(
            `SELECT * FROM CustomerBinLabel WHERE partNo = ? AND serialNo = ? AND invoiceNo = ? AND status != 'complete'`,
            [customer.partNo, customer.serialNo, customer.invoiceNo],
            (_, { rows }) => {
              if (rows.length > 0) {
                const data = rows.item(0);
                console.log('Found record with status != complete:', data);
                callback && callback({ status: 'inserted', data });
              } else {
                callback && callback({ status: 'not_found' });
              }
            },
            (_, error) => {
              console.log('Error checking not complete record:', error.message);
              callback && callback({ status: 'error', error: error.message });
              return true;
            }
          );
        }
      },
      (_, error) => {
        console.log('Error during duplicate check:', error.message);
        callback && callback({ status: 'error', error: error.message });
        return true;
      }
    );
  });
};




export const getCustomerByPartNo = (invoiceNo, partNo, totalQty, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM Customer WHERE invoiceNo = ? AND partNo = ? AND totalQty = ?`,
      [invoiceNo, partNo, totalQty],
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

export const clearCustomerTable = () => {
  db.transaction(tx => {
    // Delete all rows
    tx.executeSql(
      `DELETE FROM Customer;`,
      [],
      async () => {
        console.log('Customer table cleared.')
        await autoBackupDB();
      },
      (_, error) => {
        console.log('Error deleting rows:', error.message);
        return false;
      }
    );

    // Reset AUTOINCREMENT (optional)
    tx.executeSql(
      `DELETE FROM sqlite_sequence WHERE name='Customer';`,
      [],
      async () => {
        console.log('Customer auto-increment reset.')
        await autoBackupDB();
      },
      (_, error) => {
        console.log('Error resetting auto-increment:', error.message);
        return false;
      }
    );
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};


export const insertVepl = (veplData, callback) => {
  db.transaction(tx => {

    // Step 1: Check if partNo and serialNo already exist in Vepl (to ensure uniqueness)
    tx.executeSql(
      `SELECT * FROM CustomerBinLabel WHERE vistSerialNo = ? AND partNo = ?;`,
      [veplData.vistSerialNo, veplData.partNo],
      (_, existingVeplResult) => {
        console.log("vepl screen: ", veplData.vistSerialNo, veplData.partNo, existingVeplResult)
        if (existingVeplResult.rows.length > 0) {
          console.log('❌ This serial number already exists in VEPL.');
          callback && callback(false, 'Duplicate serial number');
          return;
        }

        // Step 2: Check if the serialNo + partNo exists in CustomerBinLabel
        tx.executeSql(
          `SELECT * FROM CustomerBinLabel WHERE partNo = ? AND serialNo = ?;`,
          [veplData.partNo, veplData.serialNo],
          (_, customerBinLabelResult) => {
            if (customerBinLabelResult.rows.length === 0) {
              console.log('❌ CustomerBinLabel record not found for given partNo and serialNo.');
              callback && callback(false, 'CustomerBinLabel not found');
              return;
            }

            const id = customerBinLabelResult.rows.item(0).id;

            // Step 3: Insert into VEPL
            tx.executeSql(
              `INSERT INTO Vepl (serialNo, partNo, qty) VALUES (?, ?, ?);`,
              [veplData.vistSerialNo, veplData.partNo, veplData.qty],
              (_, insertResult) => {

                // Step 4: Update ONLY the matching CustomerBinLabel record
                tx.executeSql(
                  `UPDATE CustomerBinLabel SET status = 'complete', vistSerialNo = ? WHERE serialNo = ?`,
                  [veplData.vistSerialNo, veplData.serialNo],
                  async (_, updateResult) => {
                    console.log('✅ CustomerBinLabel status updated to complete', veplData.vistSerialNo, veplData.serialNo);
                    await autoBackupDB();
                    callback && callback(true);
                  },
                  (_, updateError) => {
                    console.log('❌ Error updating CustomerBinLabel status:', updateError.message);
                    callback && callback(false, updateError.message);
                  }
                );
              },
              (_, insertError) => {
                console.log('❌ Error inserting into VEPL:', insertError.message);
                callback && callback(false, insertError.message);
              }
            );
          },
          (_, customerError) => {
            console.log('❌ Error querying CustomerBinLabel:', customerError.message);
            callback && callback(false, customerError.message);
          }
        );
      },
      (_, veplError) => {
        console.log('❌ Error checking VEPL for duplicate serial:', veplError.message);
        callback && callback(false, veplError.message);
      }
    );
  },
    (transactionError) => {
      console.log('❌ Transaction failed in insertVepl:', transactionError.message);
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
      `SELECT * FROM CustomerBinLabel WHERE vistSerialNo = ?;`,
      [binData.serialNo],
      (_, customerResult) => {
        if (customerResult.rows.length === 0) {
          console.log('SerialNo not found in CustomerBinLabel');
          callback && callback({ status: 'notfound' });
          return;
        }

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
                `INSERT INTO BinLabel (partNo, totalQty, orgQty, serialNo, visteonPart) VALUES (?, ?, ?, ?, ?);`,
                [binData.partNo, binData.totalQty, binData.totalQty, binData.serialNo, binData.visteonPart],
                async (_, result) => {
                  console.log('Binlabel inserted:', binData);
                  await autoBackupDB();
                  callback && callback({ status: 'inserted', data: binData });
                },
                (_, insertError) => {
                  console.log('Insert Binlabel error:', insertError.message);
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
      (_, customerError) => {
        console.log('Error checking in CustomerBinLabel:', customerError.message);
        callback && callback({ status: 'error', error: customerError.message });
      }
    );
  },
    transactionError => {
      console.log('Transaction failed in insertBinLabel:', transactionError.message);
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
       LEFT JOIN PartMaster ON Invoice.partNo = PartMaster.partNo
       ORDER BY Invoice.createdAt DESC;`,
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

export const getLatestPrintQr = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT Invoice.*, PartMaster.visteonPart 
       FROM Invoice 
       LEFT JOIN PartMaster ON Invoice.partNo = PartMaster.partNo
       WHERE DATE(Invoice.createdAt) = (
         SELECT DATE(MAX(createdAt)) FROM Invoice
       )
       ORDER BY Invoice.createdAt DESC;`,
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
        console.log('Fetch latest Invoice date-wise error:', error.message);
        callback(null);
      }
    );
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
  });
};





// REPORT PAGE

export const deleteAllInvoiceData = (partNo, invNo, callback) => {
  let deletionSuccess = { invoice: false, customerBin: false, customer: false, vepl: false, Binlabel: false };

  db.transaction(tx => {
    const checkAndDelete = (tableName, query, params = [], key) => {
      tx.executeSql(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
        [tableName],
        (_, { rows }) => {
          if (rows.length > 0) {
            tx.executeSql(
              query,
              params,
              () => {
                console.log(`Deleted from ${tableName} table`);
                deletionSuccess[key] = true;
              },
              (_, error) => {
                console.log(`Failed to delete from ${tableName} table:`, error.message);
                Alert.alert('Error', `Failed to delete from ${tableName} table`);
                deletionSuccess[key] = false;
                return true;
              }
            );
          } else {
            console.log(`${tableName} table does not exist`);
          }
        }
      );
    };

    checkAndDelete('Invoice', `DELETE FROM Invoice WHERE invoiceNo = ? AND partNo = ?;`, [invNo, partNo], 'invoice');
    checkAndDelete('Customer', `DELETE FROM Customer;`, [], 'customer');
    checkAndDelete('Vepl', `DELETE FROM Vepl;`, [], 'vepl');
    checkAndDelete('BinLabel', `DELETE FROM BinLabel;`, [], 'Binlabel');

    // CustomerBinLabel with callback & backup
    tx.executeSql(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='CustomerBinLabel';`,
      [],
      (_, { rows }) => {
        if (rows.length > 0) {
          tx.executeSql(
            `DELETE FROM CustomerBinLabel WHERE invoiceNo = ? AND partNo = ?;`,
            [invNo, partNo],
            async () => {
              console.log('Deleted from CustomerBinLabel table');
              deletionSuccess.customerBin = true;

              await autoBackupDB();
              // Alert.alert('Success', 'Invoice and related bin labels cleared');
              callback?.(true);
            },
            (_, error) => {
              console.log('Failed to delete from CustomerBinLabel:', error.message);
              Alert.alert('Error', 'Failed to delete from CustomerBinLabel table');
              deletionSuccess.customerBin = false;
              callback?.(false);
              return true;
            }
          );
        } else {
          console.log('CustomerBinLabel table does not exist');
          callback?.(false);
        }
      }
    );
  }, transactionError => {
    console.log('Transaction error:', transactionError.message);
    callback?.(false);
  });
};

