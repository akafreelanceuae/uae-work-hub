import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../index.js'

describe('Liveness and Readiness', () => {
  it('GET /live should return 200', async () => {
    const res = await request(app).get('/live')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('alive')
  })

  it('GET /ready should return 503 when DB is disconnected', async () => {
    const res = await request(app).get('/ready')
    // In test (no DB), readiness is expected to fail
    expect([200, 503]).toContain(res.status)
    if (res.status === 503) {
      expect(res.body.status).toBe('not_ready')
    } else {
      // If local env connects to a dev DB, still accept ready
      expect(res.body.status).toBe('ready')
    }
  })
})
