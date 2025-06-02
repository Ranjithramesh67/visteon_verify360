const express = require('express');
const router = express.Router();
const {
    getAllCustomerVepl,
    createCustomerVepl,
    updateScannedData
} = require('../controllers/customerVeplController');

router.get('/get-all', getAllCustomerVepl);
router.post('/create', createCustomerVepl);
router.put('/update/:id', updateScannedData);

module.exports = router;
