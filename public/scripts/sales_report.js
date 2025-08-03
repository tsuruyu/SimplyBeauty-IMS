// public/js/sales.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const timeRangeSelect = document.getElementById('timeRange');
    const generateReportBtn = document.getElementById('generateReport');
    const reportModal = document.getElementById('reportModal');
    const closeModalBtn = document.getElementById('closeModal');
    const generateReportBtnModal = document.getElementById('generateReportBtn');
    const salesTableBody = document.getElementById('salesTableBody');
    const searchSalesInput = document.getElementById('searchSales');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const tableInfo = document.getElementById('tableInfo');
    const totalSalesElement = document.getElementById('totalSales');
    const totalUnitsElement = document.getElementById('totalUnits');
    const topProductElement = document.getElementById('topProduct');

    // Chart instances
    let salesChart;
    let productsChart;

    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredSalesData = [];
    let allSalesData = [];
    
    // Get user's brand_name from the session
    const userBrand = document.body.getAttribute('data-brand-name') || '';

    // Initialize the page
    init();

    function init() {
        // Set default dates for the modal
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        document.getElementById('startDate').valueAsDate = oneMonthAgo;
        document.getElementById('endDate').valueAsDate = today;

        // Event listeners
        timeRangeSelect.addEventListener('change', fetchSalesData);
        generateReportBtn.addEventListener('click', () => reportModal.classList.remove('hidden'));
        closeModalBtn.addEventListener('click', () => reportModal.classList.add('hidden'));
        generateReportBtnModal.addEventListener('click', generateReport);
        searchSalesInput.addEventListener('input', filterSalesData);
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderSalesTable();
            }
        });
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < Math.ceil(filteredSalesData.length / itemsPerPage)) {
                currentPage++;
                renderSalesTable();
            }
        });

        // Initial data fetch
        fetchSalesData();
    }

    async function fetchSalesData() {
        try {
            const range = timeRangeSelect.value;
            const response = await fetch(`/api/sales?range=${range}`);
            const data = await response.json();

            // Filter data by user's brand_name if it exists
            allSalesData = userBrand 
                ? data.filter(sale => sale.product_id.brand_name === userBrand)
                : data;
                
            filteredSalesData = [...allSalesData];

            console.log(allSalesData);
            
            updateSummary(allSalesData);
            renderSalesTable();
            renderCharts(allSalesData);
        } catch (error) {
            console.error('Error fetching sales data:', error);
        }
    }

    function updateSummary(data) {
        // Calculate total sales
        const totalSales = data.reduce((sum, sale) => sum + (sale.quantity * sale.product_id.price), 0);
        totalSalesElement.textContent = `$${totalSales.toFixed(2)}`;
        
        // Calculate total units sold
        const totalUnits = data.reduce((sum, sale) => sum + sale.quantity, 0);
        totalUnitsElement.textContent = totalUnits;
        
        // Find top product
        const productSales = {};
        data.forEach(sale => {
            const productName = sale.product_id.name;
            productSales[productName] = (productSales[productName] || 0) + sale.quantity;
        });
        
        const topProduct = Object.entries(productSales).reduce((a, b) => a[1] > b[1] ? a : b, ['-', 0]);
        topProductElement.textContent = topProduct[0];
    }

    function filterSalesData() {
        const searchTerm = searchSalesInput.value.toLowerCase();
        filteredSalesData = allSalesData.filter(sale => 
            sale.product_id.name.toLowerCase().includes(searchTerm) ||
            sale.date.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;
        renderSalesTable();
    }

    function renderSalesTable() {
        // Clear existing rows
        salesTableBody.innerHTML = '';
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredSalesData.length);
        const paginatedData = filteredSalesData.slice(startIndex, endIndex);
        
        // Populate table
        paginatedData.forEach(sale => {
            const row = document.createElement('tr');
            const total = sale.quantity * sale.product_id.price;
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(sale.date).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    ${sale.product_id.name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${sale.quantity}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    $${sale.product_id.price.toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    $${total.toFixed(2)}
                </td>
            `;
            
            salesTableBody.appendChild(row);
        });
        
        // Update pagination info
        tableInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${filteredSalesData.length} entries`;
        
        // Update button states
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === Math.ceil(filteredSalesData.length / itemsPerPage);
    }

    function renderCharts(data) {
        // Destroy existing charts if they exist
        if (salesChart) salesChart.destroy();
        if (productsChart) productsChart.destroy();
        
        // Prepare data for sales chart (bar chart)
        const salesByDate = {};
        data.forEach(sale => {
            const date = new Date(sale.date).toLocaleDateString();
            salesByDate[date] = (salesByDate[date] || 0) + (sale.quantity * sale.product_id.price);
        });
        
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        salesChart = new Chart(salesCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(salesByDate),
                datasets: [{
                    label: 'Sales ($)',
                    data: Object.values(salesByDate),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
        
        // Prepare data for products chart (pie chart)
        const productsData = {};
        data.forEach(sale => {
            productsData[sale.product_id.name] = (productsData[sale.product_id.name] || 0) + sale.quantity;
        });
        
        const productsCtx = document.getElementById('productsChart').getContext('2d');
        productsChart = new Chart(productsCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(productsData),
                datasets: [{
                    data: Object.values(productsData),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} units (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    async function generateReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const format = document.querySelector('input[name="format"]:checked').value;
        
        try {
            const response = await fetch(`/api/sales/report?startDate=${startDate}&endDate=${endDate}&format=${format}&brand=${userBrand}`);
            
            if (format === 'json') {
                const data = await response.json();
                console.log('Report data:', data);
                alert('JSON report generated. Check console for data.');
            } else {
                // For CSV and PDF, we'll handle the download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sales_report_${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
            
            reportModal.classList.add('hidden');
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
        }
    }
});