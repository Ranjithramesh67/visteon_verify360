const db = require('../config/db');

// Create new invoice
exports.createInvoice = async (req, res) => {
  try {
    const { invoice_number, part_number, part_name, total_qty } = req.body;
    const result = await db.query(
      `INSERT INTO invoice (invoice_number, part_number, part_name, total_qty)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [invoice_number, part_number, part_name, total_qty]
    );
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

// Append scanned bin label
exports.addScannedBin = async (req, res) => {
  const { id } = req.params;
  const { binLabel, remQty } = req.body;
console.log(remQty);
  try {
    const existing = await db.query('SELECT * FROM invoice WHERE id = $1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = existing[0];
    const updatedScanned = [...invoice.scanned, binLabel];
    const isComplete = remQty <= 0;
console.log(isComplete)
    const result = await db.query(
      `UPDATE invoice SET scanned = $1, status = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING *`,
      [updatedScanned, isComplete, id]
    );

    res.json(result);
  } catch (err) {
    console.error('Error updating invoice:', err);
    res.status(500).json({ error: 'Failed to update scanned bins' });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM invoice WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve invoice' });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM invoice ORDER BY "createdAt" DESC');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve invoices' });
  }
};
