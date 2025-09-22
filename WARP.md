# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

UAE Work Hub is a GCC-compliant, culturally intelligent hybrid work collaboration platform built for multinational workforces in the UAE. The project implements a three-service architecture targeting compliance with UAE data protection laws and integration with government APIs like Dubai 2040 Plan.

## Architecture

### Multi-Service Stack
- **Frontend** (`frontend/`): React 18 + TypeScript + Vite web client
- **Backend** (`backend/`): Node.js + Express REST API with TypeScript (ESNext modules)  
- **AI Services** (`ai/`): FastAPI + TensorFlow for Arabic NLP and transcription
- **Root**: npm workspaces configuration managing frontend/backend

### Key Architectural Patterns
- Monorepo with npm workspaces for Node.js services
- Separate Python service for AI/ML workloads  
- ES modules throughout (type: "module" in package.json)
- Express app factory pattern in backend (`createApp()`)
- Security-first design with helmet, CORS, and planned UAE Pass integration

## Development Commands

### Setup
```bash
# Install all dependencies (frontend + backend)
npm install

# Setup AI service
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r ai/requirements.txt
```

### Development
```bash
# Frontend development server (port 5173)
npm run dev:frontend

# Backend development server (port 4000) 
npm run dev:backend

# AI service (manual start needed)
cd ai && uvicorn src.main:app --reload --port 8000
```

### Build & Production
```bash
# Frontend build
npm --workspace frontend run build

# Backend build
npm --workspace backend run build
npm --workspace backend run start
```

## Business Context & Compliance

### UAE-Specific Requirements
- **Compliance Target**: UAE Data Protection Law 2021
- **Government Integration**: Dubai Municipality APIs, Ministry of HR APIs  
- **Cultural Intelligence**: Ramadan workflows, UAE prayer time API integration
- **Authentication**: UAE Pass OAuth integration (planned)
- **Data Residency**: UAE cloud deployment requirement

### Core Feature Modules (Planned)
1. **GCC Video Conferencing**: End-to-end encrypted, Arabic transcription
2. **Dubai 2040 Project Integration**: Government project timeline sync
3. **Cultural Calendar Engine**: Prayer time conflicts, holiday automation
4. **Arabic NLP**: Emirati dialect support, 10k+ transcript training target

## Current State

This is foundational scaffolding with minimal implementations:
- Backend: Basic Express app with health endpoint
- Frontend: Minimal React + Vite setup  
- AI: FastAPI stub with placeholder transcription endpoint
- No database connection, authentication, or business logic yet

## Development Priorities

Based on `docs/next-steps.md` and project planning:

1. **Tooling Setup**: ESLint/Prettier, Jest/Vitest testing, Docker Compose
2. **Core Infrastructure**: MongoDB integration, auth middleware, routing
3. **Security Baseline**: Dependency scanning, environment variable management
4. **Feature Implementation**: Start with cultural intelligence engine (lowest dependency)

## Technical Constraints

- **TypeScript Configuration**: Strict mode enabled, ES2020 target
- **Module System**: ESNext modules (not CommonJS)
- **Python Version**: Requires Python >=3.10 for AI services
- **Port Allocation**: Frontend (5173), Backend (4000), AI (8000), MongoDB (27017)
- **Security**: Helmet and CORS configured, credentials support enabled

## File Organization

- Source code in `src/` directories for each service
- TypeScript configs at service level (`tsconfig.json`, `tsconfig.build.json`)  
- Environment variables: `.env.example` in backend (MongoDB URI, PORT)
- Build output: `dist/` (backend), `dist/` (frontend via Vite)
