# BDMS API Endpoint Specs (Updated Granular RBAC)

Follow this structure. All controllers must use `@UseGuards(JwtAuthGuard, PermissionsGuard)`. Use `dot.notation` for permissions.

## 👥 Users & Roles
- `GET /users` -> `@Permissions('user.access', 'user.view')`
- `POST /users` -> `@Permissions('user.create')`
- `PATCH /users/:id` -> `@Permissions('user.update')`
- `DELETE /users/:id` -> `@Permissions('user.delete')`

## 🩸 Donors (Mow Wai Yan)
- `POST /donors` -> `@Permissions('donor.create')` (User applies to be donor)
- `GET /donors` -> `@Permissions('donor.access', 'donor.view')` (Staff view apps)
- `PATCH /donors/:id` -> `@Permissions('donor.update')` (Staff approves/updates profile)

## 💉 Donations (Actual blood units)
- `POST /donations` -> `@Permissions('donation.create')` (Approved Donor/Staff only)
- `GET /donations` -> `@Permissions('donation.access', 'donation.view')`

## 🩺 Blood Requests (Heing Naing Aung)
- `POST /requests` -> `@Permissions('request.create')`
- `GET /requests` -> `@Permissions('request.access', 'request.view')`
- `PATCH /requests/:id` -> `@Permissions('request.update')`

## 📅 Appointments (Show Wai Yan)
- `POST /appointments` -> `@Permissions('appointment.create')`
- `GET /appointments` -> `@Permissions('appointment.access', 'appointment.view')`
- `PATCH /appointments/:id` -> `@Permissions('appointment.update')`

## 🔬 Medical Records (Sai Zayer Hein)
- `POST /medical-records` -> `@Permissions('medical.create')`
- `GET /medical-records` -> `@Permissions('medical.access', 'medical.view')`
- `PATCH /medical-records/:id` -> `@Permissions('medical.update')`
