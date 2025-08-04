const AuditLogger = require('../services/auditLogger');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

// Helper function to validate and parse dates
function parseDate(dateString, defaultValue = new Date()) {
    if (!dateString) return defaultValue;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? defaultValue : date;
}

async function generateSalesReport(startDate, endDate, userFilter = {}) {
    const filter = {
        action_type: 'sale',
        date: { 
            $gte: parseDate(startDate, new Date(0)),
            $lte: parseDate(endDate, new Date())
        },
        status: 'success',
        ...userFilter
    };
    
    // Only fetch necessary fields to reduce data transfer
    return AuditLogger.getLogs(filter, {
        date: 1,
        'user_id.username': 1,
        'product_id.name': 1,
        'product_id.price': 1,
        quantity: 1,
        status: 1
    });
}

async function vendorSalesReport(req, res) {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
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

async function adminSalesReport(req, res) {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const sales = await generateSalesReport(startDate, endDate);
        await sendReportResponse(res, sales, format, 'all_sales');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function sendReportResponse(res, data, format, filenamePrefix) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${filenamePrefix}_${timestamp}`;

        switch (format) {
            case 'csv':
                return await sendAsCSV(res, data, filename);
            case 'pdf':
                return await sendAsPDF(res, data, filename);
            default:
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
                res.send(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error sending report response:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate report' });
        }
    }
}

async function sendAsCSV(res, data, filename) {
    try {
        const fields = [
            'date',
            'user_id.username',
            'product_id.name',
            'quantity',
            'product_id.price',
            { label: 'total', value: row => row.quantity * row.product_id.price }
        ];
        
        const json2csv = new Parser({ fields });
        
        // Use streams for large datasets
        if (data.length > 1000) {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            
            // Convert array to readable stream
            const { Readable } = require('stream');
            const dataStream = Readable.from(data);
            
            // Create transform stream for CSV conversion
            const csvStream = json2csv.parse(data);
            
            await pipelineAsync(
                dataStream,
                csvStream,
                res
            );
        } else {
            // For smaller datasets, use the simpler approach
            const csv = json2csv.parse(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csv);
        }
    } catch (error) {
        console.error('Error generating CSV:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate CSV report' });
        }
    }
}

async function sendAsPDF(res, data, filename) {
    try {
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            bufferPages: true // Enable buffering for better performance
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        
        // Optimized table rendering
        const renderTable = (doc, data) => {
            const startX = 50;
            let currentY = 100;
            const columnWidth = 120;
            const rowHeight = 30;
            const cellPadding = 10;
            
            // Table header
            doc.font('Helvetica-Bold');
            doc.rect(startX, currentY, doc.page.width - 100, rowHeight).stroke();
            
            let currentX = startX;
            ['Date', 'Product', 'Qty', 'Price', 'Total'].forEach((header, i) => {
                doc.text(header, currentX + cellPadding, currentY + cellPadding, {
                    width: columnWidth,
                    align: i > 1 ? 'right' : 'left'
                });
                if (i < 4) {
                    doc.moveTo(currentX + columnWidth, currentY)
                       .lineTo(currentX + columnWidth, currentY + rowHeight)
                       .stroke();
                }
                currentX += columnWidth;
            });
            
            // Table rows
            doc.font('Helvetica');
            currentY += rowHeight;
            let totalRevenue = 0;
            
            // Process data in chunks to prevent memory issues
            const chunkSize = 100;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                
                for (const item of chunk) {
                    const rowTotal = item.quantity * item.product_id.price;
                    totalRevenue += rowTotal;
                    
                    // Draw row border
                    doc.rect(startX, currentY, doc.page.width - 100, rowHeight).stroke();
                    
                    // Draw cells
                    currentX = startX;
                    const rowData = [
                        item.date.toLocaleDateString(),
                        item.product_id.name,
                        item.quantity.toString(),
                        `$${item.product_id.price.toFixed(2)}`,
                        `$${rowTotal.toFixed(2)}`
                    ];
                    
                    rowData.forEach((cell, i) => {
                        doc.text(cell, currentX + cellPadding, currentY + cellPadding, {
                            width: columnWidth,
                            align: i > 1 ? 'right' : 'left'
                        });
                        if (i < 4) {
                            doc.moveTo(currentX + columnWidth, currentY)
                               .lineTo(currentX + columnWidth, currentY + rowHeight)
                               .stroke();
                        }
                        currentX += columnWidth;
                    });
                    
                    currentY += rowHeight;
                    
                    // Add new page if we're running out of space
                    if (currentY > doc.page.height - 100) {
                        doc.addPage({ size: 'A4', layout: 'landscape' });
                        currentY = 50;
                    }
                }
            }
            
            // Summary
            doc.moveDown();
            doc.font('Helvetica-Bold');
            doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, { align: 'right' });
        };
        
        // Pipe the PDF to response
        doc.pipe(res);
        
        // Render the document
        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
        doc.text(`Total records: ${data.length}`);
        doc.moveDown();
        
        renderTable(doc, data);
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF report' });
        }
    }
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
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate report' });
        }
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