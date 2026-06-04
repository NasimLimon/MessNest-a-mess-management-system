# MessNest - Smart Mess Management System

A complete full-stack web application for managing dining mess operations including meal tracking, billing, payments, menu management, announcements, and complaint handling.

## Features

- **👥 Member Management** - Add, update, and manage mess members
- **🍴 Meal Tracking** - Record and track daily meal consumption with history
- **💰 Automatic Billing** - Generate monthly bills based on meal count, fixed costs, and extra charges
- **💳 Payment Management** - Track member payments with multiple payment methods
- **📋 Menu Management** - Create and manage daily/weekly menus
- **📢 Announcements** - Post important notices with priority levels
- **⚠️ Complaint System** - Members can submit complaints, admins can respond and track resolution
- **🔐 Role-Based Access** - Secure authentication with admin and member roles

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite3
- **Frontend**: HTML5, CSS3, JavaScript
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Project Structure

```
MessNest/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/              # Business logic
│   │   ├── authController.js
│   │   ├── memberController.js
│   │   ├── mealController.js
│   │   ├── billingController.js
│   │   ├── paymentController.js
│   │   ├── menuController.js
│   │   ├── noticeController.js
│   │   └── complaintController.js
│   ├── middleware/               # Express middleware
│   │   ├── auth.js               # Authentication & authorization
│   │   ├── errorHandler.js       # Global error handling
│   │   └── validation.js         # Request validation
│   ├── routes/                   # API route definitions
│   ├── utils/                    # Utility functions
│   │   ├── constants.js
│   │   ├── responses.js
│   │   └── validators.js
│   ├── scripts/                  # Database scripts
│   │   ├── init-db.js
│   │   └── seed.js
│   └── server.js                 # Main server file
├── database/
│   └── schema.sql               # Database schema
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── api.js               # API client
│   │   └── auth.js              # Auth helpers
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── admin-dashboard.html
│   │   └── member-dashboard.html
│   └── index.html               # Landing page
├── .env                         # Environment variables (not committed)
├── .env.example                 # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 14+ and npm
- SQLite3 (included with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MessNest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if needed (defaults are fine for development)

4. **Initialize database and seed default data**
   ```bash
   npm run setup
   ```
   This will:
   - Create the SQLite database
   - Initialize the schema
   - Create default admin user
   - Create sample member for testing

5. **Start the server**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:3000`

## Default Credentials

After setup, use these credentials to log in:

- **Admin Account**
  - Username: `admin`
  - Password: `admin123`

- **Member Account**
  - Username: `member1`
  - Password: `member123`

## Available Commands

```bash
npm start        # Start production server
npm run dev      # Start with hot reload (nodemon)
npm run init-db  # Initialize database schema
npm run seed     # Seed default data
npm run setup    # Full setup (install + init + seed)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Members (Admin only)
- `GET /api/members` - List all members
- `GET /api/members/:id` - Get member details
- `POST /api/members` - Add new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Meals (Admin to record, all to view)
- `POST /api/meals` - Record meal (admin)
- `GET /api/meals` - Get meal history
- `GET /api/meals/summary/monthly` - Monthly summary
- `GET /api/meals/member/:memberId` - Member meals

### Billing (Admin to generate, all to view)
- `POST /api/billing/generate` - Generate monthly bills (admin)
- `GET /api/billing` - Get all bills
- `GET /api/billing/details/:billId` - Bill details
- `PUT /api/billing/:billId/charges` - Update charges (admin)
- `GET /api/billing/stats/mess` - Mess statistics

### Payments (Admin to record, all to view)
- `POST /api/payments` - Record payment (admin)
- `GET /api/payments` - Get all payments
- `GET /api/payments/history/:memberId` - Member payment history
- `GET /api/payments/status/:memberId` - Member bill status

### Menu (Admin to manage, all to view)
- `POST /api/menu` - Add menu item (admin)
- `GET /api/menu` - Get menu items
- `GET /api/menu/today` - Today's menu

### Notices (Admin to post, all to view)
- `POST /api/notices` - Post notice (admin)
- `GET /api/notices` - Get all notices
- `GET /api/notices/:id` - Get specific notice
- `DELETE /api/notices/:id` - Delete notice (admin)

### Complaints (Members to submit, admin to manage)
- `POST /api/complaints` - Submit complaint
- `GET /api/complaints` - Get all complaints (admin) or own (member)
- `GET /api/complaints/:id` - Get complaint details
- `PUT /api/complaints/:id` - Update complaint status (admin)
- `GET /api/complaints/member/:memberId` - Member's complaints

## Frontend Pages

### Public Pages
- **Home** (`/`) - Landing page with features overview
- **Login** (`/pages/login.html`) - User login
- **Register** (`/pages/register.html`) - New user registration

### Admin Dashboard (`/pages/admin-dashboard.html`)
- Overview with statistics
- Member management (add, remove, view)
- Meal recording
- Billing management (generate bills, view, update charges)
- Menu management
- Notices/announcements
- Complaint management and responses

### Member Dashboard (`/pages/member-dashboard.html`)
- Personal overview (meals, bills, payments)
- Bill history and payment recording
- Meal history
- Menu view
- Announcements
- Complaint submission and tracking

## Environment Variables

Edit `.env` to customize (defaults are fine for development):

```
PORT=3000                                    # Server port
NODE_ENV=development                         # Environment
DB_PATH=./database/mestnest.db              # Database location
JWT_SECRET=mestnest-super-secret-key         # JWT signing key
CORS_ORIGIN=http://localhost:3000           # CORS allowed origin
```

## Database Schema

The system uses SQLite3 with the following tables:

- **users** - Authentication and roles
- **members** - Mess member profiles
- **meals** - Daily meal records
- **menu** - Daily/weekly menus
- **bills** - Monthly billing information
- **payments** - Payment records
- **notices** - Announcements
- **complaints** - Complaint tracking
- **settings** - System configuration

All tables have proper relationships, constraints, and indexes defined in `database/schema.sql`.

## Error Handling

The API returns standardized JSON responses:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": { /* error details */ }
}
```

HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Role-based access control (RBAC)
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Database constraints and foreign keys

## Development

### Starting in Development Mode

```bash
npm run dev
```

Uses `nodemon` for automatic server restart on file changes.

### Testing the API

Use tools like:
- Postman
- Thunder Client
- cURL
- REST Client extension

### Database Inspection

To inspect the SQLite database:

```bash
# Using sqlite3 CLI
sqlite3 database/mestnest.db

# Common commands:
.tables                    # List all tables
.schema                    # Show all schemas
SELECT * FROM users;       # Query users
```

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify Node.js is installed: `node --version`
- Check `.env` file exists

### Database errors
- Run `npm run setup` to reinitialize database
- Check database file path in `.env`

### Authentication issues
- Clear browser cookies/localStorage
- Verify JWT_SECRET in `.env` hasn't changed
- Check token expiration in auth.js middleware

### API not responding
- Check server is running: `npm run dev`
- Verify API endpoint URL in frontend js files
- Check browser console for errors (F12)
- Check server console for error messages

## Future Enhancements

- [ ] Email notifications for bills and announcements
- [ ] SMS notifications for urgent complaints
- [ ] Monthly reports PDF generation
- [ ] Dashboard charts and analytics
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] Multi-mess support
- [ ] Mobile app
- [ ] Payment gateway integration

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server console logs
3. Check browser developer console (F12)
4. Verify `.env` configuration
5. Try reinitializing database: `npm run setup`

## Contributors

MealNest Team

---

**Happy Mess Managing! 🍽️**
