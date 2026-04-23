const { Router } = require('express');
const { addTransaction, getAllTransactions, deleteTransaction } = require('../Controllers/ExpenseController');

const router = Router();

router.get('/', getAllTransactions);
router.post('/add', addTransaction);
router.delete('/:expenseId', deleteTransaction);

module.exports = router;
