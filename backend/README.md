# Backend API - Go Service

The Aureus backend is a RESTful API server built with Go, Gin framework, and PostgreSQL. It handles user authentication, portfolio management, coin tracking, and integrates with external services for pricing data.

## Tech Stack

- **Language**: Go 1.21+
- **Framework**: Gin (HTTP web framework)
- **Database**: PostgreSQL (with GORM ORM)
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **External APIs**: PCGS API for coin pricing

## Project Structure

```
backend/
├── cmd/
│   └── api/
│       └── main.go           # Application entry point
├── internal/
│   ├── auth/                 # JWT authentication logic
│   ├── database/             # Database connection & migrations
│   ├── handlers/             # HTTP request handlers
│   │   ├── auth.go          # User registration & login
│   │   ├── portfolio.go     # Portfolio CRUD operations
│   │   ├── coin.go          # Coin management
│   │   ├── pcgs.go          # PCGS API integration
│   │   ├── metals.go        # Metal composition & melt value
│   │   └── price_history.go # Historical price tracking
│   ├── middleware/           # HTTP middleware (auth, etc.)
│   ├── models/              # Data models & database schemas
│   ├── pcgs/                # PCGS API client
│   └── metals/              # Metal composition data & calculations
├── .env                     # Environment variables (not in git)
├── go.mod                   # Go module dependencies
└── go.sum                   # Dependency checksums
```

## Features

### Authentication
- User registration with email and password
- Secure JWT-based authentication
- Password hashing with bcrypt
- Protected routes with middleware

### Portfolio Management
- Create, read, update, and delete portfolios
- Get portfolio statistics (total value, coin count, etc.)
- List all coins in a portfolio

### Coin Management
- Add coins to portfolios
- Track coin details (type, year, grade, quantity)
- Update coin information
- Delete coins from portfolio
- Calculate melt value based on metal composition

### Price Tracking
- Integration with PCGS API for current coin values
- Historical price tracking with snapshots
- Automatic price synchronization
- Price history visualization data

### Metal Composition
- Metal composition data for US coins by year
- Spot price tracking for precious metals (gold, silver)
- Melt value calculations
- Support for year-based composition changes

## API Endpoints

### Health Check
```
GET /health - Service health status
```

### Authentication
```
POST /api/auth/register - Create new user account
POST /api/auth/login    - Login and receive JWT token
GET  /api/auth/me       - Get current user info (protected)
```

### Portfolios
```
GET    /api/portfolios           - List all user portfolios
POST   /api/portfolios           - Create a new portfolio
GET    /api/portfolios/:id       - Get portfolio details
PUT    /api/portfolios/:id       - Update portfolio
DELETE /api/portfolios/:id       - Delete portfolio
GET    /api/portfolios/:id/stats - Get portfolio statistics
GET    /api/portfolios/:id/coins - List coins in portfolio
```

### Coins
```
POST   /api/coins                    - Add coin to portfolio
GET    /api/coins/:id                - Get coin details
PUT    /api/coins/:id                - Update coin information
DELETE /api/coins/:id                - Delete coin
GET    /api/coins/:id/price-history  - Get coin's price history
POST   /api/coins/:id/price-snapshot - Record current price
POST   /api/coins/sync-pcgs-values   - Sync all coins with PCGS
```

### PCGS Integration
```
GET /api/pcgs/price  - Get PCGS price for a coin
GET /api/pcgs/images - Get PCGS coin images
```

### Metal Prices
```
GET  /api/metals/spot-prices          - Current spot prices for metals
GET  /api/metals/compositions         - All coin compositions
GET  /api/metals/composition          - Get composition for specific coin
POST /api/metals/melt-value           - Calculate melt value
POST /api/metals/backfill-composition - Backfill composition data
```

### Price History
```
POST /api/price-history/backfill - Backfill historical prices
```

## Getting Started

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 15+
- Redis 7+
- PCGS API key (optional, for pricing features)

### Installation

1. **Install Go dependencies**
   ```bash
   cd backend
   go mod download
   ```

2. **Set up environment variables**

   Create a `.env` file in the **project root directory** (not in backend/):
   ```bash
   # Database
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aureus?sslmode=disable

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Server
   PORT=8080

   # PCGS API (optional)
   PCGS_API_KEY=your-pcgs-api-key-here

   # MinIO (Local S3)
   MINIO_ENDPOINT=localhost:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET=coin-images
   MINIO_USE_SSL=false

   # Redis (optional, for caching)
   REDIS_URL=redis://localhost:6379

   # Image Service
   IMAGE_SERVICE_URL=http://localhost:8001
   ```

   **Note:** The backend automatically loads the `.env` file from the project root. You can also reference `.env.example` in the root for a complete template.

3. **Start PostgreSQL and Redis** (using Docker Compose from project root)
   ```bash
   docker-compose up -d postgres redis
   ```

### Running the Server

```bash
cd backend
go run cmd/api/main.go
```

The server will start on `http://localhost:8080`

### Development

**Run with hot reload** (install air first):
```bash
go install github.com/cosmtrek/air@latest
air
```

**Run tests**:
```bash
go test ./...
```

**Format code**:
```bash
go fmt ./...
```

**Lint code**:
```bash
golangci-lint run
```

## Database

### Migrations

The application uses GORM's AutoMigrate feature for development. Database tables are automatically created/updated on startup based on the models defined in `internal/models/models.go`.

### Models

- **User**: User accounts with authentication
- **Portfolio**: User's coin portfolio containers
- **Coin**: Individual coins in portfolios
- **PriceHistory**: Historical price snapshots

### Direct Database Access

```bash
# Connect to PostgreSQL
docker exec -it aureus-db psql -U postgres -d aureus

# Common queries
SELECT * FROM users;
SELECT * FROM portfolios;
SELECT * FROM coins;
SELECT * FROM price_histories;
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Register or login to receive a JWT token
2. Include the token in the `Authorization` header for protected routes:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

Example using curl:
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Access protected endpoint
curl http://localhost:8080/api/portfolios \
  -H "Authorization: Bearer <token-from-login>"
```

## External Integrations

### PCGS API

The Professional Coin Grading Service (PCGS) API provides:
- Current coin values by grade
- Historical price data
- Coin images and details

To use PCGS features, add your API key to the `.env` file:
```
PCGS_API_KEY=your-api-key-here
```

### Metal Spot Prices

The service tracks current spot prices for precious metals to calculate melt values for coins containing gold, silver, copper, and nickel.

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server-side error

## Security

- Passwords are hashed using bcrypt before storage
- JWT tokens expire after a configured period
- CORS is configured to only allow requests from the frontend
- Input validation on all endpoints
- SQL injection protection via GORM parameterized queries

## Logging

The application logs to stdout with structured logging showing:
- Server startup information
- Request handling
- Database operations
- External API calls
- Errors and warnings

## Performance Considerations

- Redis caching for frequently accessed data (planned)
- Database connection pooling via GORM
- Efficient SQL queries with proper indexes
- Pagination support for large result sets (planned)

## Contributing

When contributing to the backend:

1. Follow Go best practices and idioms
2. Write tests for new features
3. Update API documentation for new endpoints
4. Run `go fmt` and `golangci-lint` before committing
5. Keep handlers thin - business logic goes in services

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep aureus-db

# View database logs
docker logs aureus-db

# Restart database
docker-compose restart postgres
```

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### JWT Token Issues
- Ensure JWT_SECRET is set in .env
- Check token expiration time
- Verify token format in Authorization header

## Related Services

- [Frontend](../frontend/README.md) - Next.js web interface
- [Image Service](../image-service/README.md) - Python ML service for coin identification

---

Built with Go, Gin, and PostgreSQL
