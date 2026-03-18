# 🧛 BDMS Team Assignments & RBAC Specs

This is the **Single Source of Truth** for the Blood Donation Management System (NestJS).

---

## 👥 Team & Module Assignments

| Module                | Member            | Key Permissions (`dot.notation`)                                                                                |
| :-------------------- | :---------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Auth + User**       | **Min Htet Thar** | `user.*`, `role.*`, `permission.*`                                                                              |
| **Donors**            | Moe Wai Yan       | `donor.create`, `donor.view`, `donor.update`, `donor.delete`                                                    |
| **Donations**         | Moe Wai Yan       | `donation.create`, `donation.view`, `donation.access`, `donation.update`, `donation.delete`                     |
| **Blood Requests**    | Heing Naing Aung  | `request.create`, `request.view`, `request.access`, `request.update`, `request.delete`                          |
| **Appointments**      | Show Wai Yan      | `appointment.create`, `appointment.view`, `appointment.access`, `appointment.update`, `appointment.delete`      |
| **Medical Records**   | Sai Zayer Hein    | `medical.create`, `medical.view`, `medical.access`, `medical.update`, `medical.delete`                          |
| **Announcements**     | Psst              | `announcement.create`, `announcement.view`, `announcement.access`, `announcement.update`, `announcement.delete` |
| **Inventory + Certs** | Tsukusomi         | `inventory.view`, `inventory.manage`, `certificate.*`                                                           |

---

## 🛠️ Implementation Guide (How to use RBAC)

### 1. Protect Your Routes

Every controller **must** use these two guards. Use the `@Permissions()` decorator for granular control.

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('your-module')
export class YourController {

  @Post()
  @Permissions('module.create')
  create(@Body() dto: CreateDto) { ... }

  @Get()
  @Permissions('module.access')
  findAll() { ... }

  @Patch(':id')
  @Permissions('module.update')
  update(@Param('id') id: string, @Body() dto: UpdateDto) { ... }

  @Delete(':id')
  @Permissions('module.delete')
  remove(@Param('id') id: string) { ... }
}
```

### 2. Access vs. View (The Difference)

- **`.view`**: Permission to see **one** specific record (e.g., viewing a profile).
- **`.access`**: Permission to see the **full list/dashboard** (Admin/Staff only).

---

## 📡 API Endpoint Specs (Permissions Map)

## This is SAMPLE, you man need to update/delete them and add other ENTPOINTS.

### 🩸 Donors & Donations (Moe Wai Yan)

- `POST /donors` -> `@Permissions('donor.create')`
- `PATCH /donors/:id` -> `@Permissions('donor.update')`
- `GET /donors` -> `@Permissions('donor.access')`
- `DELETE /donors/:id` -> `@Permissions('donor.delete')`
- `POST /donations` -> `@Permissions('donation.create')`
- `GET /donations` -> `@Permissions('donation.access')` (Admin/Staff only - all donations, supports `?status=`, `?bloodGroup=`, `?limit=`, etc.)
- `GET /donations/my-donations` -> `@Permissions('donation.view')` (Allow USER/Donor to see own donations)
- `GET /donations/:id` -> `@Permissions('donation.view')`
- `PATCH /donations/:id/approve` -> `@Permissions('donation.update')`
- `PATCH /donations/:id/reject` -> `@Permissions('donation.update')`
- `PATCH /donations/:id` -> `@Permissions('donation.update')`
- `DELETE /donations/:id` -> `@Permissions('donation.delete')`

### 🩺 Blood Requests (Heing Naing Aung)

- `POST /requests` -> `@Permissions('request.create')`
- `GET /requests` -> `@Permissions('request.access')` (Admin/Staff only - all requests, supports `?status=`, `?urgency=`, `?limit=`, etc.)
- `GET /requests/my-requests` -> `@Permissions('request.view')` (Allow USER to see own requests)
- `GET /requests/:id` -> `@Permissions('request.view')`
- `PATCH /requests/:id/approve` -> `@Permissions('request.update')`
- `PATCH /requests/:id/fulfill` -> `@Permissions('request.update')`
- `PATCH /requests/:id/cancel` -> `@Permissions('request.update')`
- `PATCH /requests/:id` -> `@Permissions('request.update')`
- `DELETE /requests/:id` -> `@Permissions('request.delete')`

### 📅 Appointments (Show Wai Yan)

- `POST /appointments` -> `@Permissions('appointment.create')`
- `GET /appointments` -> `@Permissions('appointment.access')` (supports `?status=`, `?limit=`, etc.)
- `GET /appointments/:id` -> `@Permissions('appointment.view')`
- `GET /appointments/upcoming` -> `@Permissions('appointment.view')`
- `PATCH /appointments/:id/confirm` -> `@Permissions('appointment.update')`
- `PATCH /appointments/:id/cancel` -> `@Permissions('appointment.update')`
- `PATCH /appointments/:id` -> `@Permissions('appointment.update')`
- `DELETE /appointments/:id` -> `@Permissions('appointment.delete')`

### 🔬 Medical Records (Sai Zayer Hein)

- `POST /medical-records` -> `@Permissions('medical.create')`
- `GET /medical-records` -> `@Permissions('medical.access')` (supports `?status=`, `?limit=`, etc.)
- `GET /medical-records/:id` -> `@Permissions('medical.view')`
- `PATCH /medical-records/:id/approve` -> `@Permissions('medical.update')`
- `PATCH /medical-records/:id/reject` -> `@Permissions('medical.update')`
- `PATCH /medical-records/:id` -> `@Permissions('medical.update')`
- `DELETE /medical-records/:id` -> `@Permissions('medical.delete')`

### 🩸 Blood Inventory (Tsukusomi)

- `POST /blood-inventory` -> `@Permissions('inventory.manage')`
- `GET /blood-inventory` -> `@Permissions('inventory.access')` (supports `?bloodGroup=`, `?status=`, `?limit=`, etc.)
- `GET /blood-inventory/:id` -> `@Permissions('inventory.view')`
- `GET /blood-inventory/low-stock` -> `@Permissions('inventory.access')`
- `PATCH /blood-inventory/:id/allocate` -> `@Permissions('inventory.manage')`
- `PATCH /blood-inventory/:id` -> `@Permissions('inventory.manage')`
- `DELETE /blood-inventory/:id` -> `@Permissions('inventory.manage')`

### �📜 Certificates (Tsukusomi)

- `POST /certificates` -> `@Permissions('certificate.create')` (Admin/Staff only)
- `GET /certificates` -> `@Permissions('certificate.access')` (Admin/Staff only - all certificates)
- `GET /certificates/my-certificates` -> `@Permissions('certificate.view')` (Allow USER to see own certificates)
- `GET /certificates/:id` -> `@Permissions('certificate.view')` (Admin/Staff OR own certificate)
- `PATCH /certificates/:id` -> `@Permissions('certificate.update')` (Admin/Staff only)
- `DELETE /certificates/:id` -> `@Permissions('certificate.delete')` (Admin/Staff only)

### � Announcements (Psst)

- `POST /announcements` -> `@Permissions('announcement.create')`
- `GET /announcements` -> `@Permissions('announcement.view')`
- `GET /announcements/:id` -> `@Permissions('announcement.view')`
- `PATCH /announcements/:id/toggle-active` -> `@Permissions('announcement.update')` (Toggle is_active status)
- `PATCH /announcements/:id/update-expiry` -> `@Permissions('announcement.update')` (Change expired date)
- `PATCH /announcements/:id` -> `@Permissions('announcement.update')`
- `DELETE /announcements/:id` -> `@Permissions('announcement.delete')`

---

## 🚀 Getting Started

1. **Pull the latest from `dev` branch.**
2. **Run `npx prisma generate`** to sync the 38 permissions.
3. **Run `npm run db:seed`** to update your local database with roles/permissions.
