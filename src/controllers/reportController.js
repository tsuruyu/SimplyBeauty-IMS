const AuditLogger = require('../services/auditLogger');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

async function generateSalesReport(startDate, endDate, userFilter = {}) {
    const filter = {
        action_type: 'sale',
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: 'success',
        ...userFilter
    };
    
    return AuditLogger.getLogs(filter);
}

// Vendor sales report (only shows their own sales)
async function vendorSalesReport(req, res) {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        const sales = await generateSalesReport(
            startDate, 
            endDate,
            { user_id: req.session.user._id }
        );
        
        await sendReportResponse(res, sales, format, 'vendor_sales');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Admin sales report (shows all sales)
async function adminSalesReport(req, res) {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        const sales = await generateSalesReport(startDate, endDate);
        
        await sendReportResponse(res, sales, format, 'all_sales');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function sendReportResponse(res, data, format, filenamePrefix) {
    switch (format) {
        case 'csv':
            return sendAsCSV(res, data, filenamePrefix);
        case 'pdf':
            return sendAsPDF(res, data, filenamePrefix);
        default:
            res.json(data);
    }
}

function sendAsCSV(res, data, filenamePrefix) {
    const fields = [
        'date',
        'user_id.username',
        'product_id.name',
        'quantity',
        'product_id.price',
        { label: 'total', value: row => row.quantity * row.product_id.price }
    ];
    
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(data);
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`${filenamePrefix}_${new Date().toISOString()}.csv`);
    res.send(csv);
}

function sendAsPDF(res, data, filenamePrefix) {
    const doc = new PDFDocument();
    const filename = `${filenamePrefix}_${new Date().toISOString()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // PDF Header
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();
    
    // Report details
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
    doc.text(`Total records: ${data.length}`);
    doc.moveDown();
    
    // Table header
    doc.font('Helvetica-Bold');
    doc.text('Date', 50, doc.y);
    doc.text('Product', 150, doc.y);
    doc.text('Qty', 300, doc.y);
    doc.text('Price', 350, doc.y);
    doc.text('Total', 400, doc.y);
    doc.moveDown();
    
    // Table rows
    doc.font('Helvetica');
    let totalRevenue = 0;
    
    data.forEach(item => {
        const rowTotal = item.quantity * item.product_id.price;
        totalRevenue += rowTotal;
        
        doc.text(item.date.toLocaleDateString(), 50, doc.y);
        doc.text(item.product_id.name, 150, doc.y);
        doc.text(item.quantity.toString(), 300, doc.y);
        doc.text(`$${item.product_id.price.toFixed(2)}`, 350, doc.y);
        doc.text(`$${rowTotal.toFixed(2)}`, 400, doc.y);
        doc.moveDown();
    });
    
    // Summary
    doc.moveDown();
    doc.font('Helvetica-Bold');
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, { align: 'right' });
    
    doc.end();
}

// API endpoint for getting sales data
async function getSalesData(req, res) {
    try {
        const { range } = req.query;
        const user = req.session.user;
        let startDate, endDate = new Date();
        
        switch (range) {
            case 'day':
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            default:
                return res.status(400).json({ error: 'Invalid range parameter' });
        }
        
        let sales;
        if (user.role === 'vendor') {
            sales = await generateSalesReport(
                startDate,
                endDate,
                { user_id: user._id }
            );
        } else {
            sales = await generateSalesReport(startDate, endDate);
        }
        
        // Format data for frontend
        const formattedSales = sales.map(sale => ({
            ...sale.toObject(),
            date: sale.date.toISOString(),
            product_id: {
                name: sale.product_id?.name || 'Unknown',
                price: sale.product_id?.price || 0,
                brand_name: sale.product_id?.brand_name || 'NOBRAND'
            },
            user_id: {
                username: sale.user_id?.username || 'Unknown'
            }
        }));
        
        res.json(formattedSales);
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
}

// API endpoint for generating reports
async function generateReport(req, res) {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        const user = req.session.user;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        if (user.role === 'vendor') {
            await vendorSalesReport(
                { ...req, query: { ...req.query, format }, user },
                res
            );
        } else {
            await adminSalesReport(
                { ...req, query: { ...req.query, format }, user },
                res
            );
        }
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
}

module.exports = {
    generateSalesReport,
    vendorSalesReport,
    adminSalesReport,
    sendReportResponse,
    sendAsCSV,
    sendAsPDF,
    getSalesData,
    generateReport
};