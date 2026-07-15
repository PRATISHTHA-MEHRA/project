const express = require("express");
const router = express.Router();
const incomeExpenseController = require("../controllers/incomeExpenseController");
const auth = require("../middleware/authMiddleware");

router.get("/dashboard", auth, incomeExpenseController.getDashboard);

router.post("/income", auth, incomeExpenseController.addIncome);
router.post("/expense", auth, incomeExpenseController.addExpense);

router.put("/expense/:id", auth, incomeExpenseController.editExpense);

router.delete("/income/:id", auth, incomeExpenseController.removeIncome);
router.delete("/expense/:id", auth, incomeExpenseController.removeExpense);

module.exports = router;