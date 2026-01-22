---
name: Technical Specification
description: Create comprehensive technical specifications for features, APIs, and system designs
---

# Technical Specification Skill

## Purpose
Guide creation of detailed technical specifications for features, APIs, and system designs.

## When to Use
- Planning new features
- Designing APIs
- Architecting systems
- Documenting requirements

## Feature Specification Template

```markdown
# Feature Name

## Overview
Brief description and purpose

## Requirements
### Functional
- System shall...
- User must be able to...

### Non-Functional
- Performance: <200ms
- Scalability: 10K users
- Security: Encryption

## UI/UX
- Wireframes
- User flows
- Interactions

## Technical Design
- Architecture diagram
- Data models
- API endpoints
- Business logic

## Testing
- Unit tests
- Integration tests
- E2E tests

## Timeline
Estimated effort
```

## API Specification Template

```markdown
# API Endpoint

## POST /api/resource

**Request**
```json
{
  "field": "type (required)"
}
```

**Response 201**
```json
{
  "id": "uuid",
  "field": "value"
}
```

**Errors**
- 400: Validation error
- 401: Unauthorized
- 500: Server error
```

## Best Practices
- Be specific with examples
- Cover all scenarios
- Use clear language
- Include diagrams
- Get team review
