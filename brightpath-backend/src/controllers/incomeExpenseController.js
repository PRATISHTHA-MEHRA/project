const IE = require("../models/incomeExpenseModel");

// GET /income-expense/dashboard?month=YYYY-MM
exports.getDashboard = async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7);

        const [kpiTotals, trend, pl, income, expense] = await Promise.all([
            IE.getMonthlyKPIs(month),
            IE.getSixMonthTrend(),
            IE.getPLBreakdown(month),
            IE.getIncomeList(),
            IE.getExpenseList()
        ]);

        const netProfit = kpiTotals.totalIncome - kpiTotals.totalExpense;
        const profitMargin = kpiTotals.totalIncome > 0
            ? Math.round((netProfit / kpiTotals.totalIncome) * 100)
            : 0;

        res.status(200).json({
            success: true,
            month,
            kpis: {
                totalIncome: kpiTotals.totalIncome,
                totalExpense: kpiTotals.totalExpense,
                netProfit,
                profitMargin
            },
            trend,
            pl: {
                ...pl,
                netProfit: (pl.feeCollection + pl.otherIncome) - (pl.teacherPayments + pl.staffSalary + pl.rent + pl.otherExpenses)
            },
            income,
            expense
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /income-expense/income
exports.addIncome = async (req, res) => {
    try {
        const { date, category, description, mode, amount } = req.body;
        if (!date || !category || amount === undefined) {
            return res.status(400).json({ success: false, message: "Date, category and amount are required." });
        }
        const created = await IE.createIncome({ date, category, description, mode, amount });
        res.status(201).json({ success: true, message: "Income added successfully", data: created });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /income-expense/expense
exports.addExpense = async (req, res) => {
    try {
        const { date, category, description, vendor, mode, amount } = req.body;
        if (!date || !category || amount === undefined) {
            return res.status(400).json({ success: false, message: "Date, category and amount are required." });
        }
        const created = await IE.createExpense({ date, category, description, vendor, mode, amount });
        res.status(201).json({ success: true, message: "Expense added successfully", data: created });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /income-expense/expense/:id
exports.editExpense = async (req, res) => {
    try {
        const { date, category, description, vendor, mode, amount } = req.body;
        const updated = await IE.updateExpense(req.params.id, { date, category, description, vendor, mode, amount });
        if (!updated) {
            return res.status(404).json({ success: false, message: "Expense entry not found" });
        }
        res.status(200).json({ success: true, message: "Expense updated successfully", data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /income-expense/income/:id
exports.removeIncome = async (req, res) => {
    try {
        const deleted = await IE.deleteIncome(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Income entry not found" });
        }
        res.status(200).json({ success: true, message: "Income entry deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /income-expense/expense/:id
exports.removeExpense = async (req, res) => {
    try {
        const deleted = await IE.deleteExpense(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Expense entry not found" });
        }
        res.status(200).json({ success: true, message: "Expense entry deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};