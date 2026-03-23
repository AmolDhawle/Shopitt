# 🛒 Shopitt – Distributed Microservices E-commerce Platform

Shopitt is a **production-grade, scalable, multi-vendor e-commerce platform** built using a **microservices architecture within an Nx monorepo**.

The system is designed to handle **real-world commerce workflows**, including **product management, orders, payments, real-time notifications, and event-driven communication**, while maintaining modularity and scalability.

---

# 🧠 System Architecture Overview

Shopitt follows a **hybrid architecture** combining:

- **Synchronous communication (REST APIs)**
- **Asynchronous event-driven processing (Kafka / WebSockets)**

---

## 🔷 High-Level Architecture

```text
Clients (User UI / Seller UI / Admin UI)
                │
                ▼
         API Gateway (Entry Point)
                │
 ┌──────────────┼──────────────────────────────┐
 ▼              ▼                              ▼
Auth        Product Service              Seller Service
Service           │                              │
 ▼                ▼                              ▼
User Service   Order Service               Chatting Service
                     │
                     ▼
             Kafka / Redpanda
                     │
                     ▼
              Logger Service
                     │
                     ▼
            WebSocket Notification Layer
```

---

# 🏗️ Monorepo Architecture (Nx)

Shopitt uses **Nx Monorepo** to manage all services and shared libraries.

### Benefits

- Shared code via `libs/`
- Faster builds using dependency graph
- Centralized codebase
- Scalable team collaboration

---

# 📁 Applications (apps/)

---

## 🌐 API Gateway

### Purpose

- Acts as the **single entry point** for all client applications

### Responsibilities

- Routes requests to appropriate services
- Handles cross-service communication
- Simplifies frontend integration

---

## 🔐 Auth Service

### Purpose

Handles authentication and authorization.

### Features

- JWT-based authentication
- Role-based access control (`user`, `seller`, `admin`)
- Secure middleware integration

---

## 🛍️ Product Service

### Purpose

Manages the **complete product lifecycle**

### Features

- Product CRUD operations
- Image upload via ImageKit
- Discount code system (percentage / fixed)
- Event-based pricing system
- Advanced filtering & search
- Soft delete with delayed cleanup
- Cron jobs for automation

### Background Jobs

```text
Every Hour → Delete soft-deleted products
Every Minute → Expire product events
```

---

## 🏪 Seller Service

### Purpose

Handles all **seller and shop-related operations**

### Features

- Shop profile management
- Seller products & events
- Follow / unfollow system
- Seller notifications
- Redis caching (shop + products)
- Rate limiting (security)

---

## 👤 User Service

### Purpose

Manages user-specific data.

### Features

- Address management (with default address logic)
- User notifications

---

## 📦 Order Service

### Purpose

Handles the **complete order lifecycle including payments and notifications**

### Features

- Order creation & validation
- Stripe payment integration
- Webhook-based payment confirmation
- Email notifications
- Real-time notification triggers

### Responsibilities

1. Validate product data
2. Create order (pending state)
3. Initiate Stripe payment
4. Handle webhook events
5. Update order status
6. Trigger notifications

---

## 💬 Chatting Service

### Purpose

Enables real-time communication.

### Features

- Buyer ↔ Seller messaging
- WebSocket-based communication

---

## 📡 Kafka Service (Event Streaming)

### Purpose

Handles **asynchronous communication between services**

### Built With

- Redpanda (Kafka-compatible)

### Responsibilities

- Event publishing & consumption
- Decoupling services

### Example Events

- `ORDER_CREATED`
- `PAYMENT_SUCCESS`
- `PRODUCT_UPDATED`
- `NOTIFICATION_TRIGGERED`

---

## 🧾 Logger Service

### Purpose

Centralized logging system.

### Features

- Collect logs from all services
- Error tracking
- System monitoring

---

## 🛠️ Admin Service

### Purpose

Handles platform-level control.

### Features

- Manage users, sellers, products
- Monitor system activity

---

## 🎨 Frontend Applications

| App       | Description         |
| --------- | ------------------- |
| user-ui   | Customer storefront |
| seller-ui | Seller dashboard    |
| admin-ui  | Admin dashboard     |

---

# 📚 Shared Libraries (libs/)

---

## 🧩 prisma-client

- Shared database client across services
- Ensures consistent schema usage

---

## 🛡️ middleware

- `requireAuth`
- `authorizeRole`

Used for authentication and authorization across services.

---

## ❌ error-handler

- Custom error classes
- Centralized error middleware

---

## ⚡ redis

- Caching layer
- Used in seller service

---

## 🖼️ imagekit

- Handles image uploads and CDN delivery

---

## 📡 redpanda-node

- Kafka client abstraction

---

## 🎨 ui / components

- Shared frontend components

---

# 🔄 Core Workflows

---

## 🛒 Product Creation Flow

```text
Seller → API Gateway
       → Auth Service
       → Product Service
       → ImageKit (upload)
       → Database
```

---

## 📦 Order & Payment Flow (Real Implementation)

```text
User → API Gateway
     → Auth Service
     → Order Service

Order Service:
     → Validate products (Product Service)
     → Create Order (Pending)
     → Create Stripe Payment Intent

User completes payment
     ↓
Stripe Webhook triggers
     ↓
Order Service updates order → "Paid"
     ↓
Kafka Event published
     ↓
Notification System:
     → Email sent to user
     → WebSocket event emitted
     → Seller notified
     → Admin notified
```

---

## ❤️ Follow Shop Flow

```text
User → Seller Service
     → Check existing follow
     → Add follower
     → Update shop followers
```

---

# 🔔 Real-Time Notification System (WebSockets)

Shopitt implements a **real-time notification system** using WebSockets.

### Supported Roles

- Users
- Sellers
- Admins

### Features

- Instant order updates
- Real-time seller notifications
- Admin alerts

### Flow

```text
Event Triggered
      ↓
Kafka / Service Event
      ↓
WebSocket Server
      ↓
Connected Clients
```

---

# 📧 Notification System (Multi-Channel)

### Channels

- Database notifications
- WebSocket notifications
- Email notifications

### Trigger Points

- Order creation
- Payment success
- Seller activities

---

# 🧠 Caching Strategy

| Data            | Layer | TTL   |
| --------------- | ----- | ----- |
| Seller details  | Redis | 5 min |
| Seller products | Redis | 5 min |

---

# 🔒 Security Architecture

### Authentication

- JWT-based authentication

### Authorization

- Role-based access control

### Rate Limiting

- Applied on:
  - Product APIs
  - Follow/unfollow APIs

### Validation

- Strict input validation across services

---

# ⚡ Background Jobs (Cron)

Located in:

```
product-service/jobs/
```

### Tasks

- Delete soft-deleted products after 24 hours
- Expire product events automatically

---

# 📊 Scalability Strategy

### Horizontal Scaling

- Each service scales independently

### Stateless Design

- No session storage

### Event-Driven Processing

- Kafka handles async workflows

---

# 🧩 Design Patterns Used

- Microservices Architecture
- Event-Driven Architecture
- Repository Pattern (Prisma)
- Middleware Pattern
- Soft Delete Pattern
- Caching Pattern

---

# 🚀 System Capabilities

- Multi-vendor marketplace
- Real-time notifications (WebSockets)
- Secure payments (Stripe)
- Event-driven processing (Kafka)
- Scalable microservices architecture
- Centralized logging & caching

---

# 👨‍💻 Author

**Amol Dhawle**
Full Stack Developer (MERN + Microservices + Web3)
