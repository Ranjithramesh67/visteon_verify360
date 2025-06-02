const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// routing: /api/invoice/
router.post('/create', invoiceController.createInvoice);
router.put('/scan/:id', invoiceController.addScannedBin);
router.get('/get/:id', invoiceController.getInvoiceById);
router.get('/get-all', invoiceController.getAllInvoices);

module.exports = router;
