# Maria Faz - Intelligent Property Management System

A complete system for property management, reservations and finances for the vacation rental business, with artificial intelligence integration for document processing and assistance.

## Overview

Maria Faz is an advanced property management platform with integrated artificial intelligence, designed to manage vacation rental properties, reservations, and financial operations. The platform offers a responsive multi-language interface with intelligent data analysis and automated report generation.

### Who Is This System For?

- **Property Managers**: Companies and professionals who manage multiple properties
- **Property Owners**: People with real estate who seek efficient management
- **Cleaning Teams**: Management of cleaning schedules and tasks
- **Accountants**: Access to detailed financial reports

## Main Features

- **Property Management**: Complete registration and management of properties with details, photos and settings
- **Owner Management**: Registration and management of owners with customized reports and financial analysis
- **Reservation Management**: Control of reservations, check-ins and check-outs with automatic confirmations
- **Quotations**: System for creating and managing quotations for clients with PDF generation
- **Financial Reports**: Detailed reports for owners, including revenues, expenses and projections
- **Statistics**: Performance analysis, occupancy and financial projections with graphical visualizations
- **PDF Processing**: Automatic extraction of reservation data from PDFs using AI
- **Maintenance**: Management of maintenance tasks for properties with alerts and notifications
- **Maria Assistant (AI)**: Assistant with artificial intelligence for contextual help and insights

## Technologies Used

### Frontend
- **Main Framework**: React with TypeScript
- **Styling**: TailwindCSS and Shadcn UI
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Data Visualization**: Recharts and Tremor
- **Internationalization**: i18next with support for Portuguese (PT) and English (EN)
- **Mobile Apps**: Capacitor for generating native Android/iOS apps

### Backend
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with sessions
- **File Upload**: Multer
- **PDF Generation**: jsPDF
- **Email Sending**: Nodemailer

### Artificial Intelligence  
- **Document Processing**: Google Gemini Pro for OCR and data extraction
- **Text Analysis**: Natural language processing to extract information from documents
- **Virtual Assistant**: Conversational interface for user support

### DevOps
- **Version Control**: Git
- **Database**: Neon PostgreSQL (serverless)
- **Deployment**: Replit

## Project Structure

- `/client`: React frontend code (components, pages, hooks, utilities)
- `/server`: Express backend API (routes, controllers, services)
- `/shared`: Schemas shared between frontend and backend (type definitions, validations)
- `/uploads`: Directory for temporary uploads of PDFs and documents
- `/docs`: Technical documentation and user guides
- `/android`: Capacitor configuration for Android mobile version
- `/scripts`: Utility scripts for maintenance and testing

## Main Workflows

### Document Processing
1. Upload reservation or report PDFs
2. Automatic processing via AI for data extraction
3. Validation and confirmation of extracted data
4. Integration with the reservation or financial system

### Reservation Management
1. Manual creation or automatic import via PDF
2. Scheduling of check-ins, check-outs and cleanings
3. Notifications for teams and owners
4. Occupancy reports and statistics

### Financial Reports
1. Recording of revenues and expenses by property
2. Generation of customized reports for owners
3. Profitability analysis and financial projections
4. PDF export and automatic email delivery

## Installation and Configuration

### Requirements
- Node.js 18+ (recommended 20+)
- PostgreSQL 15+
- Google Gemini API Key (for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/maria-faz.git
   cd maria-faz
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file based on `.env.example`
   - Add your database credentials
   - Configure the Google Gemini API key

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Configuration

### Connection Details

- **Host Name**: ep-tiny-dream-a58ddhin.us-east-2.aws.neon.tech
- **Database Name**: neondb
- **User**: neondb_owner
- **Password**: npg_5HAIWZB9tncz
- **Complete Connection URL**: 
  ```
  postgresql://neondb_owner:npg_5HAIWZB9tncz@ep-tiny-dream-a58ddhin.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```

### Database Access

The database is hosted on the Neon PostgreSQL service, which offers a serverless PostgreSQL in the cloud. To connect:

1. Use the connection URL directly in your applications
2. Or connect using a SQL client such as:
   - psql: `psql "postgresql://neondb_owner:npg_5HAIWZB9tncz@ep-tiny-dream-a58ddhin.us-east-2.aws.neon.tech/neondb?sslmode=require"`
   - Graphical tools like DBeaver, pgAdmin or TablePlus using the details above

**Note**: This connection requires SSL (sslmode=require).

## Demo Data Management

The system has a mechanism to manage demo data, useful for testing and presentations:

- **Data Generation**: Scripts to populate the system with demo data
- **Data Cleaning**: Functions to remove demo data without affecting real data
- **Clean Mode**: Option to completely disable demo data

To clean all demo data, use the script:
```bash
node reset-all-demo-data.js
```

## AI Service Migration

Recently, the system was migrated from Mistral AI to Google Gemini. Complete details about this migration are available in the [migration documentation](./AI-SERVICE-MIGRATION-EN.md).

## Additional Documentation

- [AI Migration (PT)](./AI-SERVICE-MIGRATION.md): Detailed documentation about migrating from Mistral to Google Gemini
- [AI Migration (EN)](./AI-SERVICE-MIGRATION-EN.md): English version of the migration documentation

## License

© 2025 Maria Faz. All rights reserved.