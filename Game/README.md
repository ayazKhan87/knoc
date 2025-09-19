# QR Game Management Dashboard

A comprehensive Python dashboard for managing your QR-based water bottle game system. This dashboard allows you to manage customers, generate QR codes, track analytics, and handle claims.

## Features

### 🏪 Customer Management
- Add new restaurant/cafe customers
- View customer details and balances
- Generate QR codes in bulk
- Manage customer information

### 📊 Analytics Dashboard
- Real-time performance metrics
- Play rate and claim rate tracking
- Customer performance analysis
- Financial summaries
- Export data functionality

### 💰 Claims Management
- View and manage reward claims
- Track claim history
- Balance management
- Bulk operations

### ⚙️ Game Configuration
- Adjust difficulty settings
- Configure business parameters
- Import/export configurations
- Real-time configuration updates

### 📁 QR Code Storage
- Save QR codes as PNG files to your PC
- Customizable storage path
- Bulk QR code generation with file saving
- Storage management and statistics

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd qr-game-dashboard
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GAME_DOMAIN=your_game_domain.com

# QR Code Storage Configuration
QR_STORAGE_PATH=C:/Users/YourName/Desktop/QR_Codes
QR_IMAGE_FORMAT=PNG
QR_IMAGE_SIZE=300
```

### 4. Run the Application
```bash
streamlit run main.py
```

## Configuration

### Database Setup
1. Run the `database_schema.sql` in your Supabase project
2. Ensure all tables and functions are created
3. Set up Row Level Security policies

### Game Configuration
The dashboard allows you to configure:
- **Difficulty Progression**: 5 phases with increasing difficulty
- **Business Settings**: Bottle MRP, costs, margins
- **Reward Structure**: Dynamic reward calculation

## Usage

### Adding Customers
1. Navigate to "Customers" tab
2. Click "Add New Customer"
3. Fill in restaurant details
4. Generate QR codes for the customer

### Generating QR Codes
1. Select a customer
2. Choose number of QR codes
3. Select QR type (Game or Claim)
4. Download generated QR codes

### Managing Claims
1. View pending claims
2. Approve or reject claims
3. Track claim history
4. Manage customer balances

### Analytics
1. View key performance indicators
2. Analyze customer performance
3. Track financial metrics
4. Export data for reporting

## File Structure

```
qr-game-dashboard/
├── main.py                 # Main application entry point
├── config.py              # Configuration settings
├── database.py            # Database operations
├── qr_generator.py        # QR code generation
├── requirements.txt       # Python dependencies
├── pages/
│   ├── customers.py       # Customer management
│   ├── analytics.py       # Analytics dashboard
│   ├── claims.py          # Claims management
│   ├── game_config.py     # Game configuration
│   └── settings.py        # QR storage settings
└── README.md              # This file
```

## API Endpoints

The dashboard integrates with these Supabase Edge Functions:
- `/functions/v1/validate-qr/{uid}` - Validate QR codes
- `/functions/v1/game-complete` - Save game results
- `/functions/v1/claim-reward` - Process reward claims

## Security

- Row Level Security (RLS) enabled on all tables
- Service role key for admin operations
- Input validation and sanitization
- Secure QR code generation

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check Supabase URL and service key
   - Verify database schema is installed
   - Ensure RLS policies are configured

2. **QR Code Generation Fails**
   - Check game domain configuration
   - Verify customer exists in database
   - Ensure sufficient permissions

3. **Analytics Not Loading**
   - Check database connectivity
   - Verify data exists in tables
   - Check for any database errors

### Support

For issues or questions:
1. Check the logs in Streamlit
2. Verify database connections
3. Review configuration settings
4. Check Supabase function logs

## License

This project is proprietary software for QR game management.