# Satral Dairy ERP System

A modern, enterprise-grade ERP system for Satral Dairy with smart tank release management, milk quality tracking, and approval workflows.

## 🚀 Features

- **Modern UI/UX**: Built with React, TypeScript, and Tailwind CSS with a premium 2026 SaaS design
- **Authentication**: JWT-based authentication with refresh tokens and role-based access control
- **Dashboard**: Real-time analytics with KPI cards and interactive charts
- **Tank Management**: Complete tank record management with approval workflow
- **Quality Control**: Lab incharge verification and admin approval system
- **Reports**: Daily, weekly, monthly, and custom reports with PDF export
- **User Management**: Role-based user management (Admin, Lab Incharge, Operator)
- **Activity Logs**: Comprehensive activity tracking and audit trails
- **Responsive Design**: Fully responsive for desktop, tablet, and mobile

## 📋 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Query** - Data fetching
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Validation
- **Recharts** - Charts
- **Lucide Icons** - Icons
- **Sonner** - Toast notifications

### Backend
- **Node.js** - Runtime
- **Express.js** - Framework
- **MySQL2** - Database driver
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Winston** - Logging
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting

### Database
- **MySQL** - Relational database

## 🗄️ Database Schema

The system uses the following tables:
- `users` - User accounts and roles
- `tank_records` - Milk tank release records
- `approvals` - Approval workflow history
- `activity_logs` - System activity tracking
- `reports` - Generated reports
- `notifications` - User notifications
- `settings` - System configuration

## 👥 User Roles

### Admin
- Full system access
- Manage users
- Final approval authority
- Generate reports
- View activity logs
- Manage settings

### Lab Incharge
- Verify milk quality data
- Verify FAT/SNF values
- Approve quality parameters
- View reports
- Add remarks

### Operator
- Create tank records
- Edit own records
- View own records
- Print reports

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Admin@123 |
| Lab Incharge | lab | 123456 |
| Operator | operator | 123456 |

## 📦 Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Edit `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=system
DB_NAME=satral_dairy_erp
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

4. Create the database:
```bash
mysql -u root -p < ../database/schema.sql
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🏗️ Project Structure

### Backend
```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── database/        # Database connection
│   ├── middlewares/     # Custom middleware
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validators/      # Request validation
│   ├── logs/            # Log files
│   └── app.js           # Application entry point
├── package.json
└── .env
```

### Frontend
```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── layouts/         # Layout components
│   ├── features/        # Feature modules
│   ├── hooks/           # Custom hooks
│   ├── services/        # API services
│   ├── store/           # State management
│   ├── routes/          # Route configuration
│   ├── lib/             # Library utilities
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript types
│   ├── styles/          # Global styles
│   ├── App.tsx          # Root component
│   └── main.tsx         # Entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Tank Records
- `GET /api/tank-records` - Get all tank records
- `GET /api/tank-records/:id` - Get single record
- `POST /api/tank-records` - Create new record
- `PUT /api/tank-records/:id` - Update record
- `DELETE /api/tank-records/:id` - Delete record
- `POST /api/tank-records/:id/approve-lab` - Lab approval
- `POST /api/tank-records/:id/reject-lab` - Lab rejection
- `POST /api/tank-records/:id/approve-admin` - Admin approval
- `POST /api/tank-records/:id/reject-admin` - Admin rejection
- `GET /api/tank-records/statistics` - Get statistics
- `GET /api/tank-records/daily-trend` - Get daily trend

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/statistics` - Get user statistics (Admin only)

### Reports
- `GET /api/reports/daily` - Daily report
- `GET /api/reports/weekly` - Weekly report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/custom` - Custom range report
- `GET /api/reports/approval-statistics` - Approval statistics
- `GET /api/reports/user-activity` - User activity report

### Activity Logs
- `GET /api/activities` - Get all activities (Admin only)
- `GET /api/activities/count` - Get activity count (Admin only)

## 🎨 Design System

### Color Palette
- **Primary**: #2563EB (Blue)
- **Secondary**: #0F172A (Dark Slate)
- **Accent**: #14B8A6 (Teal)
- **Success**: #22C55E (Green)
- **Warning**: #F59E0B (Amber)
- **Danger**: #EF4444 (Red)
- **Background**: #F8FAFC (Light Gray)
- **Card**: #FFFFFF (White)

### Typography
- **Font Family**: Inter, Manrope
- **Headings**: Bold, large sizes
- **Body**: Regular, medium weights
- **Line Height**: Generous for readability

## 🔒 Security Features

- JWT authentication with access and refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- SQL injection prevention with prepared statements
- CORS configuration
- Helmet security headers
- Input validation with express-validator
- Role-based access control

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Build the application (if needed)
3. Start with `npm start`
4. Use a process manager like PM2 for production

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure your hosting to serve static files

### Database
- Use connection pooling
- Enable SSL for production
- Regular backups
- Index optimization

## 📝 Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful commit messages
- Add comments for complex logic

### Testing
- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary software for Satral Dairy.

## 👨‍💻 Support

For support and queries, contact the development team.

---

**Built with ❤️ for Satral Dairy**
