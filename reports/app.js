const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Configure MySQL connection
const db = mysql.createConnection({
    host: 'your-database-host',
    user: 'your-database-user',
    password: 'your-database-password',
    database: 'your-database-name'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Define route to get the table data
app.get('/api/sales-data', (req, res) => {
    const sqlQuery = `
        SELECT 
            pm_custom_order_number.meta_value AS 'Order',
            p.post_date AS 'Created At',
            pm_total.meta_value AS 'Grand Total',
            (pm_total.meta_value - COALESCE(pm_tax.meta_value, 0)) AS 'Profit Total',
            COALESCE(pm_tip.meta_value, 0) AS 'Tip Total',
            u.display_name AS 'Cashier'
        FROM 
            wp_posts p
            LEFT JOIN wp_postmeta pm_total ON p.ID = pm_total.post_id AND pm_total.meta_key = '_order_total'
            LEFT JOIN wp_postmeta pm_tax ON p.ID = pm_tax.post_id AND pm_tax.meta_key = '_order_tax'
            LEFT JOIN wp_postmeta pm_tip ON p.ID = pm_tip.post_id AND pm_tip.meta_key = '_order_tip_total'
            LEFT JOIN wp_postmeta pm_cashier ON p.ID = pm_cashier.post_id AND pm_cashier.meta_key LIKE '%cashier%'
            LEFT JOIN wp_postmeta pm_custom_order_number ON p.ID = pm_custom_order_number.post_id AND pm_custom_order_number.meta_key = '_op_wc_custom_order_number'
            LEFT JOIN wp_users u ON u.ID = CAST(pm_cashier.meta_value AS UNSIGNED)
        WHERE 
            p.post_type = 'shop_order'
            AND p.post_status = 'wc-completed'
            AND p.post_date BETWEEN '2024-10-20 00:00:00' AND '2024-10-27 23:59:59'
        ORDER BY 
            p.post_date DESC
        LIMIT 1000;
    `;

    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Server error');
            return;
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
