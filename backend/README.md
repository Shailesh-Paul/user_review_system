# Roxiler Store Rating Platform - Backend Phase 1

This is the backend foundation for the Roxiler Store Rating Platform. It sets up an Express server with MySQL connection pooling, graceful shutdown, and centralized error handling.

## Requirements

- Node.js (Current LTS)
- Railway MySQL Database (You must use the provided Railway MySQL connection details)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your MySQL database credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `PORT`: The port on which the server will run
   - `DB_HOST`: Database host (e.g., localhost)
   - `DB_PORT`: Database port (e.g., 3306)
   - `DB_NAME`: Name of the MySQL database
   - `DB_USER`: Database username
   - `DB_PASSWORD`: Database password

## Running the Server

Start the server:
```bash
npm start
```

For development (with automatic restarts):
```bash
npm run dev
```

## Endpoints

### Health Check

`GET /api/health`

Verifies that the API is running and checks the status of the database connection.

**Response (Success):**
```json
{
  "success": true,
  "message": "API is running successfully",
  "database": "connected"
}
```

**Response (Database Unavailable):**
```json
{
  "success": false,
  "message": "API is running, but the database is unavailable",
  "database": "disconnected"
}
```
