# API modules

Base URL: `/api`  
Auth: `Authorization: Bearer <accessToken>`  
Errors:

```json
{ "success": false, "error": { "code": "PATIENT_NOT_FOUND", "message": "Patient was not found." } }
```

| Module | Routes |
| --- | --- |
| auth | POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me |
| patients | GET /patients?q=, POST /patients, GET /patients/:id, PATCH /patients/:id, GET /patients/:id/history |
| tokens | POST /tokens, GET /tokens/today, GET /tokens/preview, GET /tokens/stats, PATCH /tokens/:id/status |
| queue | GET /queue |
| visits | GET /visits/doctor-today, GET /visits/:id, POST /visits/:id/start, PATCH /visits/:id |
| prescriptions | POST /prescriptions/visits/:visitId/send, GET /prescriptions/:id, GET /prescriptions/latest |
| medicines | GET /medicines, GET /medicines/all, POST /medicines, PATCH /medicines/:id, favorites CRUD |
| dispensing | GET /dispensing/ready, GET /dispensing/:id, POST /dispensing/:id/complete, POST /dispensing/repeat, repeat-requests |
| payments | GET /payments, POST /payments, POST /payments/:id/refund |
| reports | GET /reports/daily, GET /reports/monthly, GET /reports/medicines |
| settings | GET /settings, PATCH /settings |
| users / doctors | staff and doctor lists |

Swagger UI: `/api/docs`

WebSocket namespace: `/realtime` (JWT in `auth.token`)
