const db = require("../config/db");


const FEE_INCOME_CATEGORIES = ['Monthly Fees', 'Quarterly Fees', 'Semi-Annual Fees', 'Annual Fees'];

const genId = async (table, prefix, startAt) => {
    const res = await db.query(`SELECT COUNT(*) FROM ${table}`);
    return `${prefix}-${startAt + parseInt(res.rows[0].count)}`;
};

// ---------- KPI cards (current-month totals) ----------
const getMonthlyKPIs = async (month) => { // month = 'YYYY-MM'
    const incomeRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0)::FLOAT as total FROM income_entries WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1`,
        [month]
    );
    const expenseRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0)::FLOAT as total FROM expense_entries WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1`,
        [month]
    );
    return {
        totalIncome: incomeRes.rows[0].total,
        totalExpense: expenseRes.rows[0].total
    };
};

// ---------- 6-month Income vs Expense trend ----------
const getSixMonthTrend = async () => {
    const incomeRes = await db.query(`
        SELECT TO_CHAR(entry_date, 'YYYY-MM') as ym, TO_CHAR(entry_date, 'Mon') as label, SUM(amount)::FLOAT as total
        FROM income_entries
        WHERE entry_date >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY ym, label ORDER BY ym ASC;
    `);
    const expenseRes = await db.query(`
        SELECT TO_CHAR(entry_date, 'YYYY-MM') as ym, TO_CHAR(entry_date, 'Mon') as label, SUM(amount)::FLOAT as total
        FROM expense_entries
        WHERE entry_date >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY ym, label ORDER BY ym ASC;
    `);

    const map = {};
    incomeRes.rows.forEach(r => { map[r.ym] = { m: r.label, inc: r.total, exp: 0 }; });
    expenseRes.rows.forEach(r => {
        if (!map[r.ym]) map[r.ym] = { m: r.label, inc: 0, exp: 0 };
        map[r.ym].exp = r.total;
    });
    return Object.keys(map).sort().map(k => map[k]);
};

// ---------- Profit & Loss breakdown for a given month ----------
const getPLBreakdown = async (month) => {
    const feeRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0)::FLOAT as total FROM income_entries
         WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1 AND category = ANY($2::text[])`,
        [month, FEE_INCOME_CATEGORIES]
    );
    const otherIncRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0)::FLOAT as total FROM income_entries
         WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1 AND NOT (category = ANY($2::text[]))`,
        [month, FEE_INCOME_CATEGORIES]
    );
    const teacherRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0)::FLOAT as total FROM expense_entries WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1 AND category = 'Teacher Salary'`,
        [month]
    );
    const staffRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0)::FLOAT as total FROM expense_entries WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1 AND category = 'Staff Salary'`,
        [month]
    );
    const rentRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0)::FLOAT as total FROM expense_entries WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1 AND category = 'Rent'`,
        [month]
    );
    const otherExpRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0)::FLOAT as total FROM expense_entries
         WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1 AND category NOT IN ('Teacher Salary','Staff Salary','Rent')`,
        [month]
    );

    return {
        feeCollection: feeRes.rows[0].total,
        otherIncome: otherIncRes.rows[0].total,
        teacherPayments: teacherRes.rows[0].total,
        staffSalary: staffRes.rows[0].total,
        rent: rentRes.rows[0].total,
        otherExpenses: otherExpRes.rows[0].total
    };
};

// ---------- Lists ----------
const getIncomeList = async (month) => {
    const query = month
        ? `SELECT id, TO_CHAR(entry_date,'YYYY-MM-DD') as date, category, description as desc,
                  payment_mode as mode, amount::FLOAT as amount
           FROM income_entries WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1
           ORDER BY entry_date DESC, id DESC;`
        : `SELECT id, TO_CHAR(entry_date,'YYYY-MM-DD') as date, category, description as desc,
                  payment_mode as mode, amount::FLOAT as amount
           FROM income_entries ORDER BY entry_date DESC, id DESC;`;
    const result = month ? await db.query(query, [month]) : await db.query(query);
    return result.rows;
};

const getExpenseList = async (month) => {
    const query = month
        ? `SELECT id, TO_CHAR(entry_date,'YYYY-MM-DD') as date, category, description as desc,
                  vendor, payment_mode as mode, amount::FLOAT as amount
           FROM expense_entries WHERE TO_CHAR(entry_date, 'YYYY-MM') = $1
           ORDER BY entry_date DESC, id DESC;`
        : `SELECT id, TO_CHAR(entry_date,'YYYY-MM-DD') as date, category, description as desc,
                  vendor, payment_mode as mode, amount::FLOAT as amount
           FROM expense_entries ORDER BY entry_date DESC, id DESC;`;
    const result = month ? await db.query(query, [month]) : await db.query(query);
    return result.rows;
};

// ---------- Mutations ----------
const createIncome = async (data) => {
    const id = await genId('income_entries', 'INC', 1101);
    const result = await db.query(
        `INSERT INTO income_entries (id, entry_date, category, description, payment_mode, amount)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`,
        [id, data.date, data.category, data.description, data.mode, data.amount]
    );
    return result.rows[0];
};

const createExpense = async (data) => {
    const id = await genId('expense_entries', 'EXP', 1201);
    const result = await db.query(
        `INSERT INTO expense_entries (id, entry_date, category, description, vendor, payment_mode, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;`,
        [id, data.date, data.category, data.description, data.vendor, data.mode, data.amount]
    );
    return result.rows[0];
};

const updateExpense = async (id, data) => {
    const result = await db.query(
        `UPDATE expense_entries SET entry_date=$1, category=$2, description=$3, vendor=$4, payment_mode=$5, amount=$6
         WHERE id=$7 RETURNING *;`,
        [data.date, data.category, data.description, data.vendor, data.mode, data.amount, id]
    );
    return result.rows[0];
};

const deleteIncome = async (id) => {
    const result = await db.query("DELETE FROM income_entries WHERE id=$1 RETURNING id", [id]);
    return result.rows[0];
};

const deleteExpense = async (id) => {
    const result = await db.query("DELETE FROM expense_entries WHERE id=$1 RETURNING id", [id]);
    return result.rows[0];
};

module.exports = {
    getMonthlyKPIs, getSixMonthTrend, getPLBreakdown,
    getIncomeList, getExpenseList,
    createIncome, createExpense, updateExpense,
    deleteIncome, deleteExpense
};