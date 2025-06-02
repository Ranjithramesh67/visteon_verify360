const db = require('../config/db');

exports.getAllCustomerVepl = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customer_vepl ORDER BY "createdAt" DESC');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customer vepl' });
  }
};

exports.createCustomerVepl = async (req, res) => {
  try {
    const { invoice_number, part_number, part_name, total_qty, bin_number, scanned } = req.body;

    const invoiceCheck = await db.query('SELECT * FROM invoice WHERE invoice_number = $1', [invoice_number]);
    if (invoiceCheck.length === 0) {
      return res.status(400).json({ message: 'Invoice number not found.' });
    }

    const result = await db.query(
      `INSERT INTO customer_vepl (invoice_number, part_number, part_name, total_qty, bin_number, scanned)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [invoice_number, part_number, part_name, total_qty, bin_number, scanned]
    );
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateScannedData = async (req, res) => {
  try {
    const { id } = req.params;
    const { serial_number, quantity } = req.body;

    const update = await db.query(
      `UPDATE customer_vepl
       SET scanned = scanned || $1::jsonb,
           status = CASE
             WHEN total_qty <= (SELECT SUM((value->>'quantity')::int)
                                FROM jsonb_array_elements(scanned || $1::jsonb) AS value) THEN true
             ELSE false
           END,
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [JSON.stringify([{ serial_number, quantity }]), id]
    );

    res.json(update.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
