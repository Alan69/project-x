# Performance Review System

A comprehensive performance review system built with React, Material-UI, and RTK Query, designed to streamline the employee performance review process.

## Features

### 🔐 Authentication & Authorization

- Role-based access control (Employee, Manager, HR, Admin, Committee Member)
- Secure login system with JWT tokens
- Protected routes based on user roles

### 📊 Self Assessment

- Multi-step assessment form with validation
- Achievement documentation and self-evaluation
- Grade level selection (L1-L5)
- Peer reviewer selection
- Draft saving and final submission

### 👥 Peer Review Process

- Automatic notification system for peer reviewers
- Grade confirmation and feedback submission
- Two-peer review requirement
- Status tracking and progress monitoring

### 👨‍💼 Manager Review

- Manager approval/rejection workflow
- Grade confirmation and feedback
- Team member assessment oversight
- Performance evaluation tools

### 🏛️ Committee Review

- Manual committee initiation
- Final grade determination
- Decision documentation
- Employee notification system

### 📧 Email Notifications

- Automated peer review requests
- Manager review notifications
- Committee decision announcements
- Review completion notifications

### 👥 Employee Management

- Comprehensive employee directory
- Role and department filtering
- Review status tracking
- Performance history

### 📈 Dashboard & Analytics

- Role-based dashboard views
- Review completion statistics
- Performance metrics
- Quick action buttons

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router v6
- **Backend**: NocoDB (running in Docker)
- **Database**: PostgreSQL
- **Authentication**: JWT-based auth system

## Prerequisites

- Node.js 16+ and npm
- Docker and Docker Compose
- PostgreSQL database
- NocoDB instance

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd performance-review-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up NocoDB Backend

```bash
# Run NocoDB in Docker
docker run -d --name nocodb \
  -v "$(pwd)"/nocodb:/usr/app/data/ \
  -p 8080:8080 \
  nocodb/nocodb:latest
```

### 4. Configure Database

- Access NocoDB at `http://localhost:8080`
- Create a new project
- Import the database schema (see Database Schema section)

### 5. Environment Configuration

Create a `.env` file in the root directory:

```env
REACT_APP_API_BASE_URL=http://localhost:8080/api/v1
REACT_APP_NOCODB_URL=http://localhost:8080
```

### 6. Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Database Schema

The system uses the following main tables:

### Core Tables

- **employees**: User information and roles
- **grade_expectations**: Grade level definitions and requirements
- **review_cycles**: Performance review periods
- **self_assessments**: Employee self-assessment forms
- **peer_reviewers**: Peer review assignments and feedback
- **manager_reviews**: Manager approval workflow
- **review_committees**: Committee information and members
- **committee_decisions**: Final review decisions
- **review_notifications**: System notifications

### Key Relationships

- Employees can have multiple assessments
- Each assessment requires 2 peer reviewers
- Manager reviews follow peer reviews
- Committee decisions are final
- All actions generate notifications

## Usage Guide

### For Employees

1. **Login** with your credentials
2. **Complete Self Assessment** in the dedicated section
3. **Select Peer Reviewers** from your colleagues
4. **Submit Assessment** to start the review process
5. **Monitor Progress** through the dashboard

### For Managers

1. **Review Team Assessments** in the reviews section
2. **Approve/Reject** peer review confirmations
3. **Provide Feedback** and grade confirmation
4. **Monitor Team Progress** through the dashboard

### For HR/Admin

1. **Manage Users** and roles
2. **Oversee Review Cycles** and committees
3. **Generate Reports** and analytics
4. **System Configuration** and maintenance

### For Committee Members

1. **Review Assessments** that reach committee stage
2. **Make Final Decisions** on grade levels
3. **Document Decisions** with reasoning
4. **Ensure Fairness** in the review process

## API Endpoints

The system provides RESTful API endpoints for all operations:

### Authentication

- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Users

- `GET /users` - List users with filtering
- `GET /users/:id` - Get user details

### Self Assessments

- `GET /self-assessments` - List assessments
- `POST /self-assessments` - Create assessment
- `PUT /self-assessments/:id` - Update assessment
- `POST /self-assessments/:id/submit` - Submit assessment

### Peer Reviews

- `GET /self-assessments/:id/peer-reviews` - Get peer reviews
- `PUT /peer-reviews/:id` - Submit peer review

### Manager Reviews

- `GET /self-assessments/:id/manager-review` - Get manager review
- `PUT /manager-reviews/:id` - Submit manager review

### Committee Decisions

- `POST /self-assessments/:id/committee-decision` - Submit committee decision

### Notifications

- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark notification as read

## Mock Data

The system includes sample data for testing:

### Demo Users

- **Employee**: employee@company.com / password123
- **Manager**: manager@company.com / password123
- **HR**: hr@company.com / password123
- **Admin**: admin@company.com / password123

### Sample Data

- 25+ sample employees across different departments
- Multiple review cycles and assessments
- Various review statuses and feedback examples

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard and analytics
│   ├── Layout/         # Main layout and navigation
│   ├── SelfAssessment/ # Self-assessment forms
│   ├── EmployeeList/   # Employee directory
│   └── ...            # Other feature components
├── hooks/              # Custom React hooks
├── services/           # API services and RTK Query
├── store/              # Redux store configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- TypeScript for type safety
- Material-UI components for consistency
- RTK Query for API management
- Functional components with hooks
- Proper error handling and loading states

## Deployment

### Production Build

```bash
npm run build
```

### Docker Deployment

```bash
# Build Docker image
docker build -t performance-review-system .

# Run container
docker run -p 80:80 performance-review-system
```

### Environment Variables

Set the following environment variables for production:

- `REACT_APP_API_BASE_URL` - Backend API URL
- `REACT_APP_NOCODB_URL` - NocoDB instance URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

### Future Features

- Advanced analytics and reporting
- Mobile application
- Integration with HR systems
- Performance goal tracking
- 360-degree feedback
- Automated review scheduling
- Multi-language support

---

**Note**: This is a comprehensive performance review system designed for enterprise use. Ensure proper testing and security review before deploying to production environments.
