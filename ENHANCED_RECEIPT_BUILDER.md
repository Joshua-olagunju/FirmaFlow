# Enhanced Receipt Builder - Complete Documentation

## Overview

The Enhanced Receipt Builder provides a professional, flexible system for creating custom thermal receipt templates with click-to-edit functionality, template presets, and complete theme support.

## Key Features

### 1. **Template Presets**

Five professionally designed starting templates optimized for thermal receipts (80mm width):

- **Modern Style**: Clean, centered design with dashed dividers
- **Classic Style**: Traditional receipt layout with double-line dividers
- **Minimal Style**: Compact design with minimal spacing
- **Professional Style**: Elegant with color accents
- **Elegant Style**: Premium styling with decorative elements

### 2. **Click-to-Edit Functionality**

- Click any section in the preview to select it
- Visual feedback with blue ring around selected section
- Edit properties in the left sidebar
- Each element is independently customizable

### 3. **Individual Element Customization**

Every section supports:

- **Font Size**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- **Font Weight**: normal, medium, semibold, bold
- **Alignment**: left, center, right
- **Background Color**: Any hex color or transparent
- **Padding**: 0-8 (0.25rem increments)

### 4. **Section-Specific Properties**

#### Receipt Details

- Show/hide receipt number
- Show/hide date
- Show/hide time

#### Items Table

- Custom header colors
- Show/hide table borders
- Zebra striping option
- Font size customization

#### Totals

- Show/hide subtotal
- Show/hide tax
- Show/hide discount
- Automatic change calculation display

#### Payment Info

- Shows payment method
- Shows amount paid
- Shows change (if applicable)

### 5. **Layout & UX Features**

- **Settings Sidebar**: Left side for all controls
- **Live Preview**: Right side with thermal receipt width (302px max)
- **Deleted Items Tracking**: Restore deleted sections anytime
- **Confirmation Dialogs**: Warns before loading new presets or discarding changes
- **Theme Support**: Full dark/light mode integration
- **Drag & Drop**: Reorder sections by dragging

### 6. **Sample Data**

Template includes realistic Nigerian business data:

```javascript
{
  receiptNumber: "RCP-2024-001",
  date: "2024-01-15",
  time: "14:30:25",
  items: [
    { name: "Premium Rice (50kg)", quantity: 2, price: 45000, total: 90000 },
    { name: "Palm Oil (25L)", quantity: 1, price: 35000, total: 35000 },
    { name: "Beans (10kg)", quantity: 3, price: 12000, total: 36000 }
  ],
  subtotal: 161000,
  tax: 12075,
  discount: 5000,
  total: 168075,
  paymentMethod: "Cash",
  amountPaid: 170000,
  change: 1925
}
```

## Usage Guide

### Creating a New Receipt Template

1. **Start with a Preset**

   - Click "Load Template Preset"
   - Choose from 5 professional styles
   - Confirm to load (warns if you have unsaved changes)

2. **Customize Sections**

   - Click any section in the preview
   - Adjust properties in the left sidebar:
     - Font size, weight, alignment
     - Background color, padding
     - Section-specific toggles
   - Changes apply instantly

3. **Reorder Sections**

   - Drag sections by the grip handle (⋮⋮)
   - Drop in desired position
   - Preview updates immediately

4. **Delete/Restore Sections**

   - Click trash icon to delete a section
   - Find deleted sections in "Deleted Sections" panel
   - Click "Restore" to add back

5. **Save Template**
   - Enter template name at top
   - Click "Save Template"
   - Template saved to database for future use

### Editing Existing Templates

1. Click "Edit" on any custom template
2. Builder loads with existing settings
3. Make changes
4. Save to update (keeps same name) or rename to create new

## Technical Details

### Component Structure

```
EnhancedReceiptBuilder.jsx
├── Template Presets (5 styles)
├── Sample Data (Nigerian business context)
├── DraggableSection Component
├── Section Rendering (switch/case)
├── Property Controls
└── Save/Load Logic
```

### API Integration

- **Endpoint**: `api/settings.php`
- **Type**: `receipt`
- **Action**: `save_template`
- **Data Format**:
  ```json
  {
    "name": "My Receipt Template",
    "type": "custom",
    "color": "#667eea",
    "sections": [...]
  }
  ```

### Theme Integration

Uses ThemeContext for all UI elements:

- `theme.bgCard` - Card backgrounds
- `theme.bgAccent` - Accent areas
- `theme.textPrimary` - Primary text
- `theme.textSecondary` - Secondary text
- `theme.borderSecondary` - Borders
- `theme.shadow` - Drop shadows

### Thermal Receipt Format

- **Width**: 80mm (302px max-width)
- **Optimizations**: Compact spacing, smaller fonts, centered alignment
- **Print-ready**: Designed for POS thermal printers

## Files Modified

### Created

- `Firma_Flow_React/src/pages/Settings/ReceiptTemplates/EnhancedReceiptBuilder.jsx` (552 lines)

### Updated

- `ReceiptTemplates.jsx` - Import and use EnhancedReceiptBuilder
- `CustomReceiptPreview.jsx` - Support new properties (showReceiptNumber, showDate, showTime, headerBgColor, zebraStripes, showSubtotal, showTax, showDiscount, change display)

## Property Reference

### Common Properties (All Sections)

| Property        | Type   | Values                              | Default     |
| --------------- | ------ | ----------------------------------- | ----------- |
| alignment       | string | left, center, right                 | center      |
| fontSize        | string | xs, sm, base, lg, xl, 2xl, 3xl, 4xl | sm          |
| fontWeight      | string | normal, medium, semibold, bold      | normal      |
| backgroundColor | string | hex color or transparent            | transparent |
| padding         | string | 0-8                                 | 2           |

### Section-Specific Properties

**Receipt Details**

- `showReceiptNumber` - boolean (default: true)
- `showDate` - boolean (default: true)
- `showTime` - boolean (default: true)

**Items Table**

- `showBorders` - boolean (default: true)
- `headerBgColor` - string (default: template color)
- `headerTextColor` - string (default: #ffffff)
- `zebraStripes` - boolean (default: false)

**Totals**

- `showSubtotal` - boolean (default: true)
- `showTax` - boolean (default: true)
- `showDiscount` - boolean (default: false)

**Divider**

- `thickness` - string (1-4, default: 1)
- `style` - string (solid, dashed, dotted, double)
- `color` - string (hex color, default: #e5e7eb)
- `marginTop` - string (0-8, default: 2)
- `marginBottom` - string (0-8, default: 2)

**Custom Text**

- `text` - string (custom content)

## User Benefits

1. **Flexibility**: Every element customizable independently
2. **Professional Templates**: 5 ready-to-use designs
3. **Easy Editing**: Click-to-select, visual feedback
4. **No Lost Work**: Confirmation dialogs prevent accidental data loss
5. **Theme Aware**: Respects user's dark/light mode preference
6. **Deleted Items Recovery**: Never permanently lose sections
7. **Nigerian Context**: Sample data and formatting for local businesses
8. **Thermal Optimized**: Perfect for 80mm receipt printers

## Comparison: Old vs New Builder

| Feature                    | Old Builder     | Enhanced Builder       |
| -------------------------- | --------------- | ---------------------- |
| Template Presets           | ❌ None         | ✅ 5 Styles            |
| Click-to-Edit              | ❌ No           | ✅ Yes                 |
| Individual Element Control | ❌ Linked       | ✅ Independent         |
| Deleted Items              | ❌ Lost Forever | ✅ Restorable          |
| Confirmation Dialogs       | ❌ No           | ✅ Yes                 |
| Theme Support              | ⚠️ Partial      | ✅ Complete            |
| Settings Position          | ❌ Right        | ✅ Left (User Request) |
| Font Size Range            | ⚠️ Limited      | ✅ xs to 4xl           |
| Visual Selection Feedback  | ❌ No           | ✅ Blue Ring           |

## Future Enhancements (Potential)

- [ ] Import/Export templates as JSON
- [ ] Template sharing between users
- [ ] Live receipt data preview (from real sales)
- [ ] Additional section types (QR code, barcode, images)
- [ ] Template version history
- [ ] Duplicate template function
- [ ] Batch template operations

## Support & Troubleshooting

**Templates not saving?**

- Check browser console for API errors
- Verify `api/settings.php` has write permissions
- Ensure template name is not empty

**Preview not updating?**

- Click section to select it first
- Check that changes are applied (should see instant update)
- Try refreshing the builder

**Deleted section won't restore?**

- Check "Deleted Sections" panel in left sidebar
- Click "Restore [Section Name]" button
- Section should reappear at bottom of preview

**Theme not applying?**

- Verify ThemeContext is properly initialized
- Check browser console for context errors
- Try toggling theme in app settings

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Component**: EnhancedReceiptBuilder.jsx
