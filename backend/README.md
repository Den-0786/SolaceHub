# SolaceHub Backend

Django REST API for SolaceHub application.

## Setup

1. Copy `.env.example` to `.env` and fill in your Neon PostgreSQL credentials
2. Install dependencies: `pip install -r requirements.txt`
3. Run migrations: `python manage.py migrate`
4. Create superuser: `python manage.py createsuperuser`
5. Run server: `python manage.py runserver`

## API Endpoints

### Authentication
- POST `/api/auth/login/` - Login
- POST `/api/auth/logout/` - Logout
- POST `/api/auth/change-password/` - Change password

### Donors
- GET `/api/donors/` - List donors
- POST `/api/donors/` - Create donor
- GET `/api/donors/<id>/` - Get donor
- PUT `/api/donors/<id>/` - Update donor
- DELETE `/api/donors/<id>/` - Delete donor

### Chits
- GET `/api/chits/` - List chits
- POST `/api/chits/` - Create chit
- GET `/api/chits/<id>/` - Get chit
- PUT `/api/chits/<id>/` - Update chit
- DELETE `/api/chits/<id>/` - Delete chit

### Deployments
- GET `/api/deployments/` - List deployments
- POST `/api/deployments/` - Create deployment
- GET `/api/deployments/<id>/` - Get deployment
- PUT `/api/deployments/<id>/` - Update deployment
- DELETE `/api/deployments/<id>/` - Delete deployment
- GET `/api/deployments/hardware/` - List hardware
- POST `/api/deployments/hardware/` - Create hardware
- GET `/api/deployments/hardware/<id>/` - Get hardware
- PUT `/api/deployments/hardware/<id>/` - Update hardware
- DELETE `/api/deployments/hardware/<id>/` - Delete hardware

### Reports
- GET `/api/reports/` - List reports
- POST `/api/reports/` - Create report
- GET `/api/reports/<id>/` - Get report
- PUT `/api/reports/<id>/` - Update report
- DELETE `/api/reports/<id>/` - Delete report

All endpoints require authentication via Token header: `Authorization: Token <your-token>`
