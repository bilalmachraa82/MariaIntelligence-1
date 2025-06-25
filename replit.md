# Maria Faz - Property Management System

## Overview

Maria Faz is an intelligent property management system designed for Portuguese hospitality property management companies. The platform combines React frontend with Node.js backend, featuring AI-powered document processing using Google Gemini 2.5 Flash and comprehensive business management tools.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: i18next (Portuguese/English)
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Processing**: Multer for uploads, pdf-parse for extraction
- **Session Management**: Express sessions
- **API Design**: RESTful endpoints with comprehensive error handling

### AI Services Integration
- **Primary AI**: Google Gemini 2.5 Flash API
- **Fallback AI**: OpenRouter (Mistral OCR)
- **Additional**: HuggingFace for handwriting detection
- **Capabilities**: Document OCR, natural language processing, reservation data extraction

## Key Components

### Property Management
- 31 properties with detailed configurations
- Owner management (32 owners)
- Property-specific pricing and team assignments
- Maintenance task scheduling and tracking

### Reservation System
- Complete booking lifecycle management
- Multi-platform support (Booking.com, Airbnb, direct bookings)
- Automated status updates (confirmed → checked-in → completed)
- Financial calculations with commissions and fees

### Financial Management
- Revenue and expense tracking
- Automated PDF report generation
- Owner-specific financial statements
- Quotation system with pricing engine

### AI-Powered Document Processing
- Multi-format PDF support (digital, scanned, handwritten)
- Intelligent reservation data extraction
- Control file processing for bulk reservations
- RAG (Retrieval-Augmented Generation) system for knowledge base

### Cleaning Operations
- Team management and scheduling
- Automated cleaning task creation based on reservations
- Cost calculations and payment tracking

## Data Flow

### Document Processing Pipeline
1. **Upload**: PDF files uploaded via multipart form data
2. **Format Detection**: Automatic detection of document type and structure
3. **AI Processing**: Gemini/OpenRouter extracts structured data
4. **Validation**: Data validation and normalization
5. **Database Storage**: Automatic creation of reservations and related records

### Reservation Lifecycle
1. **Creation**: Manual entry or AI extraction from documents
2. **Confirmation**: Status management with automated transitions
3. **Cleaning Scheduling**: Automatic cleaning task generation
4. **Financial Processing**: Cost calculations and commission handling
5. **Reporting**: Automated PDF generation for owners

### Business Intelligence
- Real-time dashboard with KPIs
- Revenue analytics and forecasting
- Occupancy rate calculations
- Property performance metrics

## External Dependencies

### AI Services
- **Google Gemini API**: Primary AI service for document processing
- **OpenRouter API**: Fallback AI service using Mistral models
- **HuggingFace**: Handwriting detection service

### Infrastructure Services
- **PostgreSQL**: Primary database (currently on Replit)
- **Replit**: Current hosting platform
- **Capacitor**: Mobile app generation (Android/iOS)

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production build optimization
- **Nodemailer**: Email service integration

## Deployment Strategy

### Current Infrastructure
- **Platform**: Replit with PostgreSQL module
- **Build Process**: Vite for frontend, ESBuild for backend
- **Environment**: Development and production configurations
- **Port Configuration**: Frontend (3000), Backend (5000), External (80)

### Recommended Migration Path
- **Target Platform**: Lovable + Supabase
- **Benefits**: Better scalability, modern architecture, integrated auth
- **Migration Strategy**: Complete rebuild using existing requirements as blueprint
- **Timeline**: 6-8 weeks following phased approach

### Current Limitations
- **Database**: PostgreSQL on Replit has scalability constraints
- **Authentication**: No user authentication system implemented
- **OCR Complexity**: Multiple AI providers create unnecessary complexity
- **Deployment**: Limited deployment options on current platform

## Changelog

- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.