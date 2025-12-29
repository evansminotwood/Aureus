# 🪙 Aureus - Coin Portfolio Manager

![Aureus Logo](frontend/public/Aureus.png)

A full-stack application for managing coin collections with AI-powered image analysis. Aureus helps collectors track their portfolios, identify coins using machine learning, and monitor values over time.

## Features

- 🤖 **AI-Powered Identification**: ML-based coin identification using OpenAI's CLIP model
- 📸 **Multi-Coin Detection**: Automatically detect and analyze multiple coins in a single image
- 📝 **OCR Text Extraction**: Advanced OCR for extracting years, denominations, and mint marks
- 💼 **Portfolio Management**: Organize coins into multiple portfolios
- 💰 **Value Tracking**: Monitor current values and historical price trends
- 🥇 **PCGS Integration**: Real-time pricing data from Professional Coin Grading Service
- 🔬 **Metal Composition**: Calculate melt values based on metal content and spot prices
- 🔐 **User Authentication**: Secure JWT-based authentication
- 📊 **Analytics**: Portfolio statistics and performance insights

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Forms**: React Hook Form
- **State**: React Context API

### Backend ([README](backend/README.md))
- **Language**: Go 1.21+
- **Framework**: Gin (HTTP web framework)
- **Database**: PostgreSQL with GORM ORM
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **External APIs**: PCGS API for coin pricing

### Image Analysis Service ([README](image-service/README.md))
- **Language**: Python 3.11
- **Framework**: FastAPI
- **ML Model**: OpenAI CLIP (ViT-B/32)
- **Computer Vision**: OpenCV
- **OCR**: Tesseract
- **Deep Learning**: PyTorch

### Infrastructure
- **Container**: Docker & Docker Compose
- **Storage**: MinIO (S3-compatible object storage)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7

## Quick Start

### Prerequisites

Install the following tools before starting:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) - For running services
- [Go 1.21+](https://go.dev/dl/) - Backend development
- [Node.js 18+](https://nodejs.org/) - Frontend development
- [Python 3.10+](https://www.python.org/downloads/) - Image service (optional if using Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/evansminotwood/aureus.git
   cd aureus
   ```

2. **Set up environment variables**

   Create a `.env` file in the project root (see [Environment Variables](#environment-variables) section):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Docker services**

   This starts PostgreSQL, Redis, MinIO, and the Image Analysis service:
   ```bash
   docker-compose up -d
   ```

   Verify all services are running:
   ```bash
   docker-compose ps
   ```

4. **Set up the backend**
   ```bash
   cd backend
   go mod download
   # The backend will auto-create database tables on first run
   ```

5. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

Start each service in a separate terminal:

**Terminal 1 - Backend API:**
```bash
cd backend
go run cmd/api/main.go
```
Server runs on `http://localhost:8080`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:3000`

**Docker Services** (already running via docker-compose):
- PostgreSQL Database
- Redis Cache
- MinIO Object Storage
- Image Analysis Service (Python/FastAPI)

### Access Services

| Service | URL | Credentials | Documentation |
|---------|-----|-------------|---------------|
| Frontend Web App | http://localhost:3000 | Create account | - |
| Backend API | http://localhost:8080 | JWT token | [API Docs](backend/README.md#api-endpoints) |
| Image Service | http://localhost:8001 | - | http://localhost:8001/docs |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin | - |
| PostgreSQL | localhost:5432 | postgres / postgres | - |

**First Time Setup:**
1. Visit http://localhost:3000
2. Register a new account
3. Start adding portfolios and coins

## Project Structure

```
aureus/
├── backend/                     # Go API server
│   ├── cmd/api/                # Application entry point
│   │   └── main.go            # Server setup & routing
│   ├── internal/               # Internal packages
│   │   ├── auth/              # JWT authentication
│   │   ├── database/          # DB connection & migrations
│   │   ├── handlers/          # HTTP request handlers
│   │   ├── middleware/        # HTTP middleware
│   │   ├── models/            # Database models
│   │   ├── pcgs/              # PCGS API integration
│   │   └── metals/            # Metal composition data
│   ├── go.mod                 # Go dependencies
│   └── README.md              # Backend documentation
│
├── frontend/                   # Next.js web application
│   ├── src/
│   │   ├── app/               # Next.js 14 app router
│   │   ├── components/        # React components
│   │   └── lib/               # Utilities & helpers
│   ├── package.json           # Node dependencies
│   └── README.md              # Frontend documentation
│
├── image-service/              # Python image analysis service
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   └── coin_classifier.py # ML model & classification
│   ├── Dockerfile             # Container configuration
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Image service documentation
│
├── docker-compose.yml          # Infrastructure services
├── .env.example               # Example environment config
└── README.md                  # This file
```

## Service Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Frontend   │─────▶│   Backend    │─────▶│  PostgreSQL │
│  (Next.js)  │      │     (Go)     │      │             │
└─────────────┘      └──────┬───────┘      └─────────────┘
                            │
                            ├─────▶ Redis Cache
                            │
                            ├─────▶ MinIO Storage
                            │
                            └─────▶ Image Service
                                    (Python/ML)
```

## Key Features Overview

### 1. AI-Powered Coin Identification

The image analysis service uses state-of-the-art machine learning:
- **CLIP Model**: OpenAI's Vision Transformer for coin type classification
- **Multi-Method OCR**: Multiple preprocessing techniques for date/text extraction
- **Circle Detection**: Hough Transform algorithm for detecting multiple coins
- **Confidence Scoring**: Each identification includes a confidence percentage

### 2. Portfolio Management

Organize your collection:
- Create multiple portfolios (personal, investment, inheritance, etc.)
- Add coins with detailed information
- Track acquisition dates and costs
- View portfolio statistics and total values

### 3. Price Tracking & Metal Values

Stay informed about your collection's value:
- Real-time pricing from PCGS API
- Historical price tracking over time
- Metal composition data for all US coins
- Melt value calculations based on current spot prices

### 4. User Authentication

Secure access to your data:
- JWT-based authentication
- Bcrypt password hashing
- Protected API endpoints
- Session management

## API Overview

For detailed API documentation, see the [Backend README](backend/README.md#api-endpoints).

**Main endpoint categories:**
- `/api/auth/*` - User registration & authentication
- `/api/portfolios/*` - Portfolio management
- `/api/coins/*` - Coin CRUD operations
- `/api/pcgs/*` - PCGS pricing & images
- `/api/metals/*` - Metal composition & melt values
- `/api/price-history/*` - Historical price data

**Image Analysis endpoints:**
- `POST /identify` - Identify a single coin image
- `POST /analyze` - Detect and analyze multiple coins

## Development

### Service-Specific Development

Each service has its own development guide:
- **Backend**: See [backend/README.md](backend/README.md) for Go development
- **Image Service**: See [image-service/README.md](image-service/README.md) for Python/ML development
- **Frontend**: See [frontend/README.md](frontend/README.md) for Next.js development

### Docker Services Management

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f image-service
docker-compose logs -f redis
docker-compose logs -f minio
```

**Stop services:**
```bash
# Stop all
docker-compose down

# Stop and remove volumes (resets database and storage)
docker-compose down -v
```

**Restart a service:**
```bash
docker-compose restart image-service
```

**Rebuild a service:**
```bash
docker-compose up -d --build image-service
```

### Database Management

**Connect to PostgreSQL:**
```bash
docker exec -it aureus-db psql -U postgres -d aureus
```

**Common SQL queries:**
```sql
-- List all users
SELECT id, name, email, created_at FROM users;

-- Count coins by portfolio
SELECT p.name, COUNT(c.id) as coin_count
FROM portfolios p
LEFT JOIN coins c ON p.id = c.portfolio_id
GROUP BY p.id, p.name;

-- View recent price snapshots
SELECT * FROM price_histories ORDER BY recorded_at DESC LIMIT 10;
```

**Database migrations:**
The app uses GORM AutoMigrate - tables are created/updated automatically on backend startup.

## Environment Variables

Create a `.env` file in the project root (or copy from `.env.example`):

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aureus?sslmode=disable

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MinIO Object Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=coin-images
MINIO_USE_SSL=false

# Redis Cache
REDIS_URL=redis://localhost:6379

# Image Service
IMAGE_SERVICE_URL=http://localhost:8001

# PCGS API (optional - for coin pricing)
PCGS_API_KEY=your-pcgs-api-key-here

# Server Configuration
PORT=8080
```

**Important:**
- Change `JWT_SECRET` to a strong random string in production
- Never commit `.env` to version control (it's in `.gitignore`)
- PCGS API key is optional but recommended for pricing features

## Testing

### Health Checks

Test that all services are running:

```bash
# Backend API
curl http://localhost:8080/health

# Image Analysis Service
curl http://localhost:8001/health

# PostgreSQL (should return 'postgres')
docker exec aureus-db psql -U postgres -c "SELECT current_database();"

# Redis (should return 'PONG')
docker exec aureus-redis redis-cli ping

# MinIO (should return XML response)
curl http://localhost:9000/minio/health/live
```

### Test API Endpoints

```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Test image identification
curl -X POST http://localhost:8001/identify \
  -F "file=@/path/to/coin-image.jpg"
```

### Running Tests

```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm test

# Image service tests (if available)
cd image-service
pytest
```

## Roadmap

### Completed
- [x] JWT authentication with secure password hashing
- [x] Portfolio CRUD operations
- [x] Coin CRUD operations
- [x] ML model integration (CLIP) for coin identification
- [x] PCGS API integration for pricing
- [x] Price history tracking and snapshots
- [x] Metal composition and melt value calculations
- [x] Multi-coin detection in images

### In Progress
- [ ] Frontend UI for portfolio management
- [ ] Image upload and display in UI
- [ ] Portfolio analytics dashboard
- [ ] Mobile-responsive design improvements

### Planned Features
- [ ] YOLOv8 integration for improved coin detection
- [ ] Coin grade estimation from images
- [ ] Batch image uploads and processing
- [ ] Export functionality (CSV, PDF reports)
- [ ] Price alerts and notifications
- [ ] Collection statistics and trends
- [ ] Sharing collections publicly
- [ ] Mobile apps (React Native)
- [ ] World coin support (beyond US coins)
- [ ] Integration with auction platforms
- [ ] Social features (collections, trading)

## Troubleshooting

### Docker Issues

**Container won't start:**
```bash
# Check container status
docker-compose ps

# View logs for specific service
docker-compose logs image-service

# Rebuild containers
docker-compose up -d --build
```

**Port conflicts:**
```bash
# Check what's using a port
lsof -i :8080
lsof -i :5432

# Kill the process or change port in docker-compose.yml
```

### Backend Issues

**Database connection failed:**
- Ensure PostgreSQL container is running: `docker ps | grep aureus-db`
- Check DATABASE_URL in `.env` file
- Try restarting: `docker-compose restart postgres`

**JWT token errors:**
- Verify JWT_SECRET is set in `.env`
- Check token format in Authorization header: `Bearer <token>`

### Image Service Issues

**CLIP model download fails:**
- Check internet connection
- Model downloads on first use (~350MB)
- View logs: `docker-compose logs image-service`

**Tesseract not found (local development):**
```bash
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr
```

**Poor coin detection:**
- Use higher resolution images (minimum 1000px width)
- Ensure good lighting without harsh shadows
- Photograph coins on a contrasting background
- Avoid overlapping coins

### Frontend Issues

**Port 3000 already in use:**
```bash
# Kill process using port 3000
lsof -i :3000
kill -9 <PID>

# Or run on different port
npm run dev -- -p 3001
```

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed
4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- **Go**: Follow standard Go conventions, use `go fmt`
- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Use strict mode, follow Next.js best practices
- **Commits**: Write clear, descriptive commit messages
- **Documentation**: Update README files for new features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- **Bug Reports**: Create an issue with detailed reproduction steps
- **Feature Requests**: Open an issue describing the feature
- **Questions**: Check existing issues or create a new discussion
- **Documentation**: Refer to service-specific README files

## Acknowledgments

- OpenAI CLIP model for coin identification
- PCGS for coin pricing data
- Tesseract OCR for text extraction
- The open-source community

---

Built with Go, Next.js, Python, and machine learning

**Happy collecting!** 🪙