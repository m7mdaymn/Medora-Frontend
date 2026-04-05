# PHASE4 Smoke Evidence - 2026-04-04

| Method | URL | Status | Response Snippet |
|---|---|---:|---|
| GET | /api/health | 200 | {"success":true,"message":"Operation completed successfully","data":{"status":"Healthy","database":"Connected","version":"0.0.1","timestamp":"2026-04-04T21:16:43.163099Z"},"errors"... |
| POST | /api/auth/login | 200 | {"success":true,"message":"Login successful","data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1la... |
| GET | /api/clinic/partners?pageNumber=1&pageSize=5 | 200 | {"success":true,"message":"Retrieved 0 partner(s)","data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":5,"totalPages":0,"hasPreviousPage":false,"hasNextPage":false},"errors... |
| GET | /api/clinic/partners/contracts | 200 | {"success":true,"message":"Retrieved 0 contract(s)","data":[],"errors":[],"meta":{"timestamp":"2026-04-04T21:16:45.4281793Z","requestId":"5345a4b8-bf04-475e-8458-242a24438b49"}} |
| GET | /api/clinic/partner-orders?pageNumber=1&pageSize=5 | 200 | {"success":true,"message":"Retrieved 0 partner order(s)","data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":5,"totalPages":0,"hasPreviousPage":false,"hasNextPage":false},"... |
| GET | /api/clinic/notifications/in-app?pageNumber=1&pageSize=5 | 200 | {"success":true,"message":"Retrieved 0 in-app notification(s)","data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":5,"totalPages":0,"hasPreviousPage":false,"hasNextPage":fa... |
| POST | /api/clinic/notifications/in-app/mark-all-read | 200 | {"success":true,"message":"No unread notifications","data":0,"errors":[],"meta":{"timestamp":"2026-04-04T21:16:48.1471419Z","requestId":"657663d3-5018-453d-9deb-52fd38dddb3b"}} |
