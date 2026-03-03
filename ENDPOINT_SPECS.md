# BDMS API Endpoint Specs (Draft)

Follow this structure for the remaining modules. All controllers must use `@UseGuards(JwtAuthGuard, PermissionsGuard)`.

## 🩸 Donations (Mow Wai Yan)
- `POST /donations` -> `@Permissions('donation.create')` (Donor creates entry)
- `GET /donations` -> `@Permissions('donation.view')` (Admin/Staff view all, User view own)
- `GET /donations/:id` -> `@Permissions('donation.view')`
- `PATCH /donations/:id/approve` -> `@Permissions('donation.approve')` (Staff finalizes)
- `DELETE /donations/:id` -> `@Permissions('donation.delete')` (Admin only)

## 🩺 Blood Requests (Heing Naing Aung)
- `POST /requests` -> `@Permissions('request.create')`
- `GET /requests` -> `@Permissions('request.view')`
- `PATCH /requests/:id/approve` -> `@Permissions('request.approve')`
- `DELETE /requests/:id` -> `@Permissions('request.delete')`

## 📅 Appointments (Show Wai Yan)
- `POST /appointments` -> `@Permissions('appointment.create')`
- `GET /appointments` -> `@Permissions('appointment.view', 'appointment.manage')`
- `PATCH /appointments/:id` -> `@Permissions('appointment.manage')`

## 🔬 Medical Records (Sai Zayer Hein)
- `POST /medical-records` -> `@Permissions('medical.create')`
- `GET /medical-records` -> `@Permissions('medical.view', 'medical.manage')`
- `PATCH /medical-records/:id` -> `@Permissions('medical.manage')`

## 📢 Announcements (Psst)
- `POST /announcements` -> `@Permissions('announcement.create')`
- `PATCH /announcements/:id` -> `@Permissions('announcement.manage')`

## 📦 Inventory & 📜 Certs (Tsukusomi)
- `GET /inventory` -> `@Permissions('inventory.view')`
- `PATCH /inventory/:id` -> `@Permissions('inventory.manage')`
- `POST /certificates` -> `@Permissions('certificate.issue')`
