# Fastify Playground

A personal playground for learning and experimenting with [Fastify](https://fastify.dev/).  
This repo is mainly for my hobby projects and testing out features.

---

## What’s inside
- simple project with static **item model** to retrieve, add, update and delete.
- Organized using **model, controller and route** structure.
- **Swagger + Swagger UI** configured for API documentation.
- **JWT authentication using Google OAuth** 

---
## Getting Started

### prepare env file
- copy .env.example and rename to .env
- set PORT and JWS_SECRET

### Set up Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:5001/auth/google/callback`
6. Update `.env` with your credentials:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### installation
`npm install`

### run production
`npm run start`

### run development with hot reload
`npm run dev`

### Swagger Documentation
Visit `http://localhost:5001/docs` for interactive API documentation with authentication support.

## Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/google` | Initiate Google OAuth login |
| `GET` | `/auth/google/callback` | Handle OAuth callback & issue JWT |
| `GET` | `/auth/me` | Get current user info (protected) |
| `POST` | `/auth/logout` | Logout endpoint |

## Item API Endpoints

| Method | Endpoint | Protected | Description |
|--------|----------|-------------|-------------|
| `GET` | `/items` | No | Get all the items (no authentication needed) |
| `GET` | `/items/{id}` | No | Get item by Id (no authentication needed) |
| `POST` | `items` | Yes | Create new item (protected) |
| `PUT` | `items/{id}` | Yes | Modified item by Id (protected) |
| `DELETE` | `items/{id}` | Yes | Delete item by Id (protected) |



## Note
This is work in progress learning repo. Expect experiments, feature branches, and frequent updates.
