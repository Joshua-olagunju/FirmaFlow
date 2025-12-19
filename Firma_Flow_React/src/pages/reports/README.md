# Financial Reports Module

## Overview

A comprehensive financial reporting system with interactive UI, animations, and export capabilities.

## Features

### Report Types

1. **Profit & Loss Statement** - Revenue vs expenses analysis
2. **Balance Sheet** - Assets, liabilities, and equity snapshot
3. **Trial Balance** - Account verification and balancing
4. **Cash Flow Statement** - Cash movements tracking
5. **Sales Summary** - Sales performance metrics
6. **Inventory Summary** - Stock valuation and alerts

### Key Features

- ✨ **Animated UI** - Smooth transitions with Framer Motion
- 📊 **Interactive Cards** - Click-to-select report types
- 📅 **Date Range Selection** - Custom period reporting
- 💾 **Export Options** - Excel and CSV downloads
- 🎨 **Theme Support** - Light/dark mode compatible
- 💰 **Currency Formatting** - Multi-currency support
- 📱 **Responsive Design** - Mobile-friendly layouts

## Installation

### Required Dependencies

```bash
cd Firma_Flow_React
npm install xlsx
```

The `xlsx` library is required for Excel/CSV export functionality.

## Usage

### Navigation

Access reports via the sidebar navigation:

```jsx
<Route path="/reports" element={<FinancialReports />} />
```

### Component Structure

```
reports/
├── FinancialReports.jsx          # Main page component
├── components/
│   ├── ReportTypeCard.jsx        # Animated report type selector
│   ├── ExportDropdown.jsx        # Export to Excel/CSV
│   ├── ProfitLossReport.jsx      # P&L display component
│   ├── BalanceSheetReport.jsx    # Balance sheet display
│   ├── TrialBalanceReport.jsx    # Trial balance display
│   ├── CashFlowReport.jsx        # Cash flow display
│   ├── SalesSummaryReport.jsx    # Sales metrics display
│   └── InventorySummaryReport.jsx # Inventory display
└── index.js                       # Module exports
```

## API Integration

### Endpoints Used

- `GET /api/reports.php?type={reportType}&start_date={date}&end_date={date}`

### Report Types

- `profit_loss`
- `balance_sheet`
- `trial_balance`
- `cash_flow`
- `sales_summary`
- `inventory_summary`

### Expected API Response Format

#### Profit & Loss

```json
{
  "total_income": 50000,
  "total_expenses": 30000,
  "income_accounts": [...],
  "expense_accounts": [...]
}
```

#### Balance Sheet

```json
{
  "total_assets": 100000,
  "total_liabilities": 40000,
  "total_equity": 60000,
  "assets": [...],
  "liabilities": [...],
  "equity": [...]
}
```

## Customization

### Adding New Report Types

1. Create new report component in `components/`
2. Add report type configuration in `FinancialReports.jsx`:

```jsx
{
  id: "new_report",
  title: "New Report",
  subtitle: "Report Subtitle",
  description: "Report description",
  icon: IconComponent,
  gradient: "from-color-500 to-color-600",
  color: "color",
}
```

3. Add case in `renderReportComponent()` function

### Styling

All components use theme context for consistent styling:

- `theme.bgCard` - Card backgrounds
- `theme.textPrimary` - Primary text
- `theme.textSecondary` - Secondary text
- `theme.borderSecondary` - Borders

## AI Enhancement Ideas

### Recommended AI Features

1. **Predictive Analytics** - Forecast future financial trends
2. **Anomaly Detection** - Flag unusual transactions
3. **Smart Insights** - AI-generated financial recommendations
4. **Natural Language Queries** - "Show me Q4 profits"
5. **Automated Categorization** - ML-based expense classification
6. **Risk Assessment** - Financial health scoring
7. **Comparative Analysis** - Period-over-period insights
8. **Executive Summary** - AI-generated report summaries

### Implementation Suggestions

Consider integrating:

- OpenAI GPT for natural language insights
- Custom ML models for predictions
- Pattern recognition for anomaly detection
- Sentiment analysis for business health

## Performance

### Optimizations

- Lazy loading of report components
- Memoized calculations
- Animated presence for smooth transitions
- Efficient data transformations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- React 19+
- Framer Motion 12+
- Lucide React (icons)
- XLSX (export functionality)
- React Router Dom

## Future Enhancements

- [ ] PDF export
- [ ] Scheduled reports
- [ ] Email delivery
- [ ] Report templates
- [ ] Custom report builder
- [ ] Advanced filtering
- [ ] Chart visualizations
- [ ] Comparison mode
- [ ] Report sharing
- [ ] Bookmarking favorites

## Support

For issues or questions, refer to the main project documentation.
