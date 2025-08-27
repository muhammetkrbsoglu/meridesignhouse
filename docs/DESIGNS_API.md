# Designs API

## Templates (Public Read, Admin Write)
- GET `/api/designs/templates`
  - Query: `q?` string (optional)
  - 200: Array of templates
- POST `/api/designs/templates` (Admin)
  - Body: `{ name, description?, thumbnail?, elements: object, isActive? }`
  - 201: Created template
- PUT `/api/designs/templates/:id` (Admin)
  - Body: Partial of POST body
  - 200: Updated template
- DELETE `/api/designs/templates/:id` (Admin)
  - 200: `{ message: '...' }` or deleted entity

## User Designs (Auth + Ownership)
- POST `/api/designs`
  - Body: `{ name, description?, designData: object, templateId?, isPublic? }`
  - 201: Created design
- GET `/api/designs/:id`
  - 200: Design (owner or admin)
- PUT `/api/designs/:id`
  - Body: Partial of POST body
  - 200: Updated design
- DELETE `/api/designs/:id`
  - 200: `{ message: 'Design deleted' }`

## Validation & Limits
- designData size ≤ 1MB (target ≤ 800KB)
- elements length ≤ 300
- Rate limit: create ≤ 6 ops / 10s; update ≤ 10 ops / 10s per user

## Auth
- Clerk Bearer token required for user designs
- Admin endpoints require `publicMetadata.role === 'admin'`
