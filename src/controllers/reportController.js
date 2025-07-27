// controllers/reportController.js
const AuditLogger = require('../services/auditLogger');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');

class ReportController {
    // Common sales report generation
    static async generateSalesReport(startDate, endDate, userFilter = {}) {
        const filter = {
            action_type: 'sale',
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: 'success',
            ...userFilter
        };
        
        return AuditLogger.getLogs(filter);
    }
    
    // Vendor sales report (only shows their own sales)
    static async vendorSalesReport(req, res) {
        try {
            const { startDate, endDate, format = 'json' } = req.query;
            const sales = await this.generateSalesReport(
                startDate, 
                endDate,
                { user_id: req.user._id } // Only show vendor's own sales
            );
            
            await this._sendReportResponse(res, sales, format, 'vendor_sales');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // Admin sales report (shows all sales)
    static async adminSalesReport(req, res) {
        try {
            const { startDate, endDate, format = 'json' } = req.query;
            const sales = await this.generateSalesReport(startDate, endDate);
            
            await this._sendReportResponse(res, sales, format, 'all_sales');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // Helper method to handle different response formats
    static async _sendReportResponse(res, data, format, filenamePrefix) {
        switch (format) {
            case 'csv':
                return this._sendAsCSV(res, data, filenamePrefix);
            case 'pdf':
                return this._sendAsPDF(res, data, filenamePrefix);
            default:
                res.json(data);
        }
    }
    
    static _sendAsCSV(res, data, filenamePrefix) {
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
    
    static _sendAsPDF(res, data, filenamePrefix) {
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
}

module.exports = ReportController;