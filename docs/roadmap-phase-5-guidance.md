# Phase 5: Design Studio & Customization - Implementation Roadmap Guidance

## 1. Overview

This document provides professional guidance for implementing Phase 5 of the MeriDesignHouse project - the Design Studio feature. The goal is to create a Canva-like design experience that allows users to create personalized product designs which can be integrated into the ordering system.

Phase 5 delivers a Canva-like design studio for personalized products. Users can compose designs with text, shapes, and images; transform elements (drag/resize/rotate), align and snap, manage layers, undo/redo, autosave, preview, and then attach the design to cart/order via `designData`.

## 2. Project Context

According to the roadmap, Phase 5 is currently 20% complete with only the database model for design templates implemented. The main components that need to be developed include:
- Canvas-based design editor
- Customizable elements (name, date, font, color)
- Ready-made design elements library
- Design save and load functionality
- Design preview system
- Design data integration with orders
- Responsive design editor
- Mobile design experience optimization

## 3. Implementation Approach

### 3.1 Role Definition

You are an expert full-stack developer tasked with implementing the Design Studio feature. Your responsibilities include:

1. **Backend Development**:
   - Creating the DesignsModule in NestJS
   - Implementing DesignTemplate CRUD operations
   - Developing user design management APIs
   - Ensuring proper validation and security measures

2. **Frontend Development**:
   - Building the design studio interface using Next.js
   - Implementing the canvas editor with Fabric.js
   - Creating UI components for design tools and elements
   - Managing state with Zustand

3. **Integration**:
   - Connecting design data with cart and order systems
   - Implementing design preview functionality
   - Ensuring seamless user experience across devices

### 3.2 Constraints and Rules

You must strictly adhere to the following rules from RULES.md:

1. **Technology Stack Limitations**:
   - Frontend: Only Next.js, TypeScript, Tailwind CSS
   - Backend: Only NestJS, TypeScript
   - Database: Only Supabase PostgreSQL, Prisma ORM
   - Authentication: Only Clerk
   - Media Management: Only ImageKit
   - State Management: Only Zustand
   - Testing: Only Jest, Playwright
   - Deployment: Only Vercel
   - Analytics: Only Microsoft Clarity
   - Animation: Only Framer Motion

2. **Feature Limitations**:
   - Only implement features defined in Project.md
   - Do not add extra features without explicit approval
   - Do not modify existing features without user consent

3. **Design Constraints**:
   - Use only specified color palette
   - Apply only specified typography rules
   - Use only specified animation techniques
   - Ensure WCAG 2.1 AA compliance

4. **Development Process**:
   - Create checklist for each task
   - Provide progress reports at each step
   - Only implement approved changes
   - Keep project documentation updated

## 4. Detailed Implementation Plan

### Week 1-2: Backend Foundations

#### Task 1: Create DesignsModule Structure
- Create the module directory structure:
  ```
  backend/src/designs/
  ├── designs.module.ts
  ├── designs.controller.ts
  ├── designs.service.ts
  ├── dto/
  │   ├── create-design.dto.ts
  │   ├── update-design.dto.ts
  │   └── index.ts
  └── interfaces/
      └── design.interface.ts
  ```

#### Task 2: Implement DesignTemplate CRUD Operations
- GET `/api/designs/templates` - Retrieve all active design templates
- POST `/api/designs/templates` - Create new template (admin only)
- PUT `/api/designs/templates/:id` - Update template (admin only)
- DELETE `/api/designs/templates/:id` - Delete template (admin only)

#### Task 3: Implement User Design Management
- POST `/api/designs` - Save a new user design
- GET `/api/designs/:id` - Load a saved user design
- PUT `/api/designs/:id` - Update a saved user design
- DELETE `/api/designs/:id` - Delete a saved user design

#### Task 4: Add Security and Validation
- Implement ClerkGuard for user designs
- Implement AdminGuard for templates
- Add DTO validation with class-validator
- Implement JSON schema validation for designData
- Add rate limiting for save/autosave operations
- Implement input sanitization to prevent XSS

### Week 3-4: Frontend Foundation

#### Task 1: Create Design Studio Route
- Implement `/design-studio` route with Next.js
- Add authentication protection using Clerk
- Create loading states for better UX

#### Task 2: Implement Basic Canvas Component
- Use Fabric.js for canvas implementation
- Implement basic element rendering (text, shapes, images)
- Add zoom and pan functionality
- Implement grid and snapping features

#### Task 3: Create Design Store with Zustand
- Define state structure for design data
- Implement actions for state manipulation
- Add persistence to localStorage
- Implement undo/redo functionality

#### Task 4: Implement Design Service
- Create service methods for all API endpoints
- Add proper error handling
- Implement request/response interceptors

### Week 5-7: Core Editor Features

#### Task 1: Implement Drag-and-Drop Functionality
- Add element dragging from library to canvas
- Implement element repositioning
- Add snapping to grid functionality

#### Task 2: Create Toolbar Components
- Implement text formatting toolbar
- Add color pickers
- Implement alignment tools
- Add layer management controls

#### Task 3: Add Text Editing Capabilities
- Implement inline text editing
- Add font selection
- Implement text styling options

#### Task 4: Implement Element Property Controls
- Add position and size controls
- Implement rotation and transformation
- Add advanced styling options

### Week 8-9: Advanced Features

#### Task 1: Create Design Elements Library
- Categorize elements (text, shapes, images)
- Implement search and filtering
- Add preview functionality

#### Task 2: Implement Design Template Selection
- Create gallery view of templates
- Implement template preview modal
- Add apply template to canvas functionality

#### Task 3: Add Design Preview Functionality
- Implement real-time preview updates
- Add export to image functionality
- Implement print preview mode

#### Task 4: Implement Save/Load Functionality
- Save designs to user account
- Load previously saved designs
- Implement auto-save drafts

### Week 10: Integration and Testing

#### Task 1: Integrate with Cart System
- Pass design data when adding to cart
- Display design previews in cart items
- Handle design data when merging guest and user carts

#### Task 2: Ensure Order System Integration
- Transfer design data during checkout
- Display designs in order confirmation
- Include designs in order notifications

#### Task 3: Implement Testing
- Conduct unit testing for backend services
- Perform integration testing for API endpoints
- Execute end-to-end testing for user flows
- Conduct accessibility testing
- Perform performance optimization

## 5. Technical Requirements

### Backend Requirements
1. Follow existing NestJS module patterns
2. Use existing PrismaService for database operations
3. Implement proper data validation with class-validator
4. Ensure design data integrity with JSON schema validation
5. Set size limits for design data (max 1MB per design)
6. Implement proper authentication and authorization
7. Add rate limiting for design operations
8. Sanitize all user inputs to prevent XSS

### Frontend Requirements
1. Use TypeScript with strict typing
2. Follow existing component patterns and naming conventions
3. Implement proper error boundaries and fallback UI
4. Use Fabric.js for canvas manipulation
5. Support touch interactions on mobile devices
6. Ensure WCAG 2.1 AA accessibility compliance
7. Implement responsive design for all screen sizes
8. Add keyboard navigation support

## 6. Success Criteria

### Functional Requirements
- Users can create custom designs using a canvas-based editor
- Designs can be saved and loaded
- Design templates are available for quick start
- Design data integrates seamlessly with cart and order systems
- Users can customize text, colors, and positioning
- Ready-made design elements library is available
- Design previews are generated and displayed

### Performance Requirements
- Design editor loads within 2 seconds
- Canvas operations maintain 60 FPS
- Design save/load operations complete within 1 second
- Design data size limited to 1MB per design
- Template gallery loads within 1.5 seconds

### Quality Requirements
- WCAG 2.1 AA accessibility compliance
- 90% test coverage for critical functionality
- Mobile-first responsive design
- Cross-browser compatibility
- 99.5% uptime for design APIs
- Error rate below 0.1% for design operations

## 7. Risk Mitigation

1. **Canvas Performance**: Implement efficient rendering and virtualization
2. **Cross-browser Compatibility**: Extensive testing on all supported browsers
3. **Mobile Experience**: Focus on mobile-first design and testing
4. **Data Size Limitations**: Implement size limits and compression
5. **Scope Creep**: Strict adherence to documented requirements
6. **Integration Complexity**: Use existing designData fields and patterns

## 8. Next Steps

1. Begin backend module implementation
2. Create DesignsModule structure
3. Implement DesignTemplate CRUD operations
4. Add validation and error handling

## 9. Implementation Prompts for Agent Guidance

### Prompt 1: Role and Context Setting

You are an expert full-stack developer working on the MeriDesignHouse e-commerce platform. Your task is to implement Phase 5: Design Studio & Customization feature, which will allow users to create personalized product designs using a Canva-like interface.

**Context:**
- The project already has a database model for design templates implemented
- You must follow the technology stack restrictions in RULES.md
- You must not add features beyond what's defined in Project.md without explicit approval
- You must create checklists for tasks and provide progress reports

**Your Role:**
- Backend Developer: Create NestJS DesignsModule with proper APIs and validation
- Frontend Developer: Build Next.js design studio with Fabric.js canvas
- Integration Specialist: Connect design data with cart/order systems

**Constraints:**
- Frontend: Next.js, TypeScript, Tailwind CSS only
- Backend: NestJS, TypeScript only
- Database: Supabase PostgreSQL, Prisma ORM only
- Authentication: Clerk only
- State Management: Zustand only

### Prompt 2: Backend Implementation (Weeks 1-2)

Your first task is to implement the backend foundation for the Design Studio feature.

**Objective:** Create the DesignsModule in NestJS with proper CRUD operations for design templates and user designs.

**Steps:**
1. Create the module directory structure:
   ```
   backend/src/designs/
   ├── designs.module.ts
   ├── designs.controller.ts
   ├── designs.service.ts
   ├── dto/
   │   ├── create-design.dto.ts
   │   ├── update-design.dto.ts
   │   └── index.ts
   └── interfaces/
       └── design.interface.ts
   ```

2. Implement DesignTemplate CRUD operations:
   - GET `/api/designs/templates` - Retrieve all active design templates
   - POST `/api/designs/templates` - Create new template (admin only)
   - PUT `/api/designs/templates/:id` - Update template (admin only)
   - DELETE `/api/designs/templates/:id` - Delete template (admin only)

3. Implement User Design Management:
   - POST `/api/designs` - Save a new user design
   - GET `/api/designs/:id` - Load a saved user design
   - PUT `/api/designs/:id` - Update a saved user design
   - DELETE `/api/designs/:id` - Delete a saved user design

4. Add Security and Validation:
   - Implement ClerkGuard for user designs
   - Implement AdminGuard for templates
   - Add DTO validation with class-validator
   - Implement JSON schema validation for designData
   - Add rate limiting for save/autosave operations
   - Implement input sanitization to prevent XSS

**Deliverables:**
- Working DesignsModule with all endpoints
- Proper validation and security measures
- Unit tests for all functionality

### Prompt 3: Frontend Foundation (Weeks 3-4)

Your next task is to implement the frontend foundation for the Design Studio.

**Objective:** Create the design studio interface using Next.js with a basic canvas editor.

**Steps:**
1. Create Design Studio Route:
   - Implement `/design-studio` route with Next.js
   - Add authentication protection using Clerk
   - Create loading states for better UX

2. Implement Basic Canvas Component:
   - Use Fabric.js for canvas implementation
   - Implement basic element rendering (text, shapes, images)
   - Add zoom and pan functionality
   - Implement grid and snapping features

3. Create Design Store with Zustand:
   - Define state structure for design data
   - Implement actions for state manipulation
   - Add persistence to localStorage
   - Implement undo/redo functionality

4. Implement Design Service:
   - Create service methods for all API endpoints
   - Add proper error handling
   - Implement request/response interceptors

**Deliverables:**
- Working design studio route with authentication
- Basic canvas editor with zoom/pan
- Zustand store with persistence
- Design service for API communication

### Prompt 4: Core Editor Features (Weeks 5-7)

Now implement the core editing features for the design studio.

**Objective:** Create the full editing capabilities for the design studio.

**Steps:**
1. Implement Drag-and-Drop Functionality:
   - Add element dragging from library to canvas
   - Implement element repositioning
   - Add snapping to grid functionality

2. Create Toolbar Components:
   - Implement text formatting toolbar
   - Add color pickers
   - Implement alignment tools
   - Add layer management controls

3. Add Text Editing Capabilities:
   - Implement inline text editing
   - Add font selection
   - Implement text styling options

4. Implement Element Property Controls:
   - Add position and size controls
   - Implement rotation and transformation
   - Add advanced styling options

**Deliverables:**
- Full drag-and-drop functionality
- Complete toolbar with all tools
- Text editing capabilities
- Property controls for all elements

### Prompt 5: Advanced Features (Weeks 8-9)

Implement the advanced features for the design studio.

**Objective:** Add template selection, preview functionality, and save/load capabilities.

**Steps:**
1. Create Design Elements Library:
   - Categorize elements (text, shapes, images)
   - Implement search and filtering
   - Add preview functionality

2. Implement Design Template Selection:
   - Create gallery view of templates
   - Implement template preview modal
   - Add apply template to canvas functionality

3. Add Design Preview Functionality:
   - Implement real-time preview updates
   - Add export to image functionality
   - Implement print preview mode

4. Implement Save/Load Functionality:
   - Save designs to user account
   - Load previously saved designs
   - Implement auto-save drafts

**Deliverables:**
- Complete elements library with search
- Template selection and application
- Design preview and export
- Save/load functionality with auto-save

### Prompt 6: Integration and Testing (Week 10)

Finalize the implementation by integrating with existing systems and conducting thorough testing.

**Objective:** Ensure the design studio integrates properly with cart/order systems and meets all quality requirements.

**Steps:**
1. Integrate with Cart System:
   - Pass design data when adding to cart
   - Display design previews in cart items
   - Handle design data when merging guest and user carts

2. Ensure Order System Integration:
   - Transfer design data during checkout
   - Display designs in order confirmation
   - Include designs in order notifications

3. Implement Testing:
   - Conduct unit testing for backend services
   - Perform integration testing for API endpoints
   - Execute end-to-end testing for user flows
   - Conduct accessibility testing
   - Perform performance optimization

**Deliverables:**
- Fully integrated design studio with cart/order systems
- Comprehensive test coverage
- Performance optimized implementation
- Accessibility compliant interface

### Prompt 7: Quality Assurance and Success Criteria

Verify that your implementation meets all success criteria.

**Objective:** Ensure the implementation meets all functional, performance, and quality requirements.

**Functional Requirements to Verify:**
- Users can create custom designs using a canvas-based editor
- Designs can be saved and loaded
- Design templates are available for quick start
- Design data integrates seamlessly with cart and order systems
- Users can customize text, colors, and positioning
- Ready-made design elements library is available
- Design previews are generated and displayed

**Performance Requirements to Verify:**
- Design editor loads within 2 seconds
- Canvas operations maintain 60 FPS
- Design save/load operations complete within 1 second
- Design data size limited to 1MB per design
- Template gallery loads within 1.5 seconds

**Quality Requirements to Verify:**
- WCAG 2.1 AA accessibility compliance
- 90% test coverage for critical functionality
- Mobile-first responsive design
- Cross-browser compatibility
- 99.5% uptime for design APIs
- Error rate below 0.1% for design operations

**Deliverables:**
- Verified implementation meeting all success criteria
- Performance benchmark results
- Accessibility compliance report
- Test coverage report

## 10. Conclusion

This roadmap guidance document provides a comprehensive plan for implementing Phase 5 of the MeriDesignHouse project. By following the 10-week implementation plan and using the detailed prompts, developers can systematically build the Design Studio feature while adhering to project constraints and quality standards.

The key to success is:
1. Following the sequential approach outlined in the implementation plan
2. Adhering strictly to the technology stack and feature limitations
3. Using the implementation prompts as step-by-step guidance
4. Validating progress against the defined success criteria
5. Proactively mitigating identified risks

With proper execution of this roadmap, the Design Studio will provide users with a powerful yet intuitive tool for creating personalized product designs, enhancing the overall value proposition of the MeriDesignHouse platform.