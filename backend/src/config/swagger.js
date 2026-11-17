const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TruthLens REST API Specification',
    version: '1.0.0',
    description: "Official API Documentation for TruthLens: AI-Powered Evidence-Based Verification Platform.\nTagline: \"Don't Just Believe It. Verify It.\"",
    contact: {
      name: 'TruthLens Engineering Team'
    }
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api`,
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token to access protected endpoints'
      }
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Detailed error message' },
              statusCode: { type: 'integer', example: 400 },
              details: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66fa38048f12a9bc41234567' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane.doe@example.com' },
          role: { type: 'string', enum: ['user', 'analyst', 'admin'], example: 'user' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      InvestigationInput: {
        type: 'object',
        required: ['originalInput', 'inputType'],
        properties: {
          originalInput: {
            type: 'string',
            example: 'The central bank raised interest rates to 5.5% last Thursday.'
          },
          inputType: {
            type: 'string',
            enum: ['text', 'headline', 'url', 'image'],
            example: 'text'
          }
        }
      },
      Investigation: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66fa38048f12a9bc41234568' },
          userId: { type: 'string', example: '66fa38048f12a9bc41234567' },
          originalInput: { type: 'string', example: 'The central bank raised interest rates to 5.5% last Thursday.' },
          inputType: { type: 'string', example: 'text' },
          extractedClaims: {
            type: 'array',
            items: { type: 'string' },
            example: ['The central bank raised interest rates to 5.5% last Thursday.']
          },
          status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'], example: 'completed' },
          errorMessage: { type: 'string', nullable: true, example: null },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      EvidenceSnippet: {
        type: 'object',
        properties: {
          quote: { type: 'string', example: 'The Monetary Policy Committee voted to hold rates at 5.25%.' },
          sourceName: { type: 'string', example: 'Bank of England Official Bulletin' },
          sourceUrl: { type: 'string', example: 'https://bankofengland.co.uk' },
          publishDate: { type: 'string', example: '2026-11-12' },
          stance: { type: 'string', enum: ['SUPPORTS', 'CONTRADICTS', 'NEUTRAL'], example: 'CONTRADICTS' },
          relevanceScore: { type: 'number', example: 0.95 }
        }
      },
      VerificationReport: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66fa38048f12a9bc41234569' },
          investigationId: { type: 'string', example: '66fa38048f12a9bc41234568' },
          userId: { type: 'string', example: '66fa38048f12a9bc41234567' },
          claim: { type: 'string', example: 'The central bank raised interest rates to 5.5% last Thursday.' },
          verdict: {
            type: 'string',
            enum: ['TRUE', 'MOSTLY_TRUE', 'MIXED', 'MOSTLY_FALSE', 'FALSE', 'UNVERIFIED'],
            example: 'FALSE'
          },
          confidence: { type: 'number', example: 92 },
          evidenceSufficiency: { type: 'string', enum: ['INSUFFICIENT', 'PARTIAL', 'SUFFICIENT'], example: 'SUFFICIENT' },
          explanation: { type: 'string', example: 'Official central bank release confirms interest rates remained unchanged.' },
          supportingEvidence: { type: 'array', items: { $ref: '#/components/schemas/EvidenceSnippet' } },
          contradictingEvidence: { type: 'array', items: { $ref: '#/components/schemas/EvidenceSnippet' } },
          neutralEvidence: { type: 'array', items: { $ref: '#/components/schemas/EvidenceSnippet' } },
          limitations: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', example: 'jane.doe@example.com' },
                  password: { type: 'string', example: 'Password123' },
                  role: { type: 'string', enum: ['user', 'analyst'], example: 'user' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardResponse' } } }
          },
          400: { description: 'Validation error or duplicate email' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user and return JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'jane.doe@example.com' },
                  password: { type: 'string', example: 'Password123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful with token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardResponse' } } }
          },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/auth/profile': {
      patch: {
        summary: 'Update current user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Jane Smith' },
                  email: { type: 'string', example: 'jane.smith@example.com' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Profile updated' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/investigations': {
      post: {
        summary: 'Create and run a new verification investigation',
        tags: ['Investigations'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InvestigationInput' }
            }
          }
        },
        responses: {
          201: { description: 'Investigation created' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' }
        }
      },
      get: {
        summary: 'List user investigations (paginated)',
        tags: ['Investigations'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Investigations list' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/investigations/{id}': {
      get: {
        summary: 'Get single investigation by ID with reports',
        tags: ['Investigations'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Investigation details' },
          403: { description: 'Forbidden (Not the owner)' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        summary: 'Delete investigation by ID',
        tags: ['Investigations'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Investigation deleted' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' }
        }
      }
    },
    '/reports/{id}': {
      get: {
        summary: 'Get verification report details',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Report details' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' }
        }
      }
    },
    '/reports/{id}/save': {
      post: {
        summary: 'Save/Bookmark report',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          201: { description: 'Report saved' },
          200: { description: 'Report already saved' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        summary: 'Remove report from bookmarks',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Report removed' },
          404: { description: 'Not in saved list' }
        }
      }
    },
    '/reports/saved': {
      get: {
        summary: 'List user saved reports',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Saved reports list' }
        }
      }
    },
    '/dashboard/stats': {
      get: {
        summary: 'Get verification analytics and breakdown for user',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User statistics retrieved' }
        }
      }
    },
    '/dashboard/recent': {
      get: {
        summary: 'Get recent user investigations and reports',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Recent activity retrieved' }
        }
      }
    }
  }
};

const swaggerSpec = swaggerDefinition;

module.exports = swaggerSpec;

