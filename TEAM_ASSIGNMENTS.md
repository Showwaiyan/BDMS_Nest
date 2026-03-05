# 🧛 BDMS Team Assignments & RBAC Specs

This is the **Single Source of Truth** for the Blood Donation Management System (NestJS).

---

## 👥 Team & Module Assignments

| Module | Member | Key Permissions (`dot.notation`) |
| :--- | :--- | :--- |
| **Auth + User** | **Min Htet Thar** | `user.*`, `role.*`, `permission.*` |
| **Donors** | Moe Wai Yan | `donor.create`, `donor.view`, `donor.update`, `donor.delete` |
| **Donations** | Moe Wai Yan | `donation.create`, `donation.view`, `donation.access`, `donation.update`, `donation.delete` |
| **Blood Requests** | Heing Naing Aung | `request.create`, `request.view`, `request.access`, `request.update`, `request.delete` |
| **Appointments** | Show Wai Yan | `appointment.create`, `appointment.view`, `appointment.access`, `appointment.update`, `appointment.delete` |
| **Medical Records** | Sai Zayer Hein | `medical.create`, `medical.view`, `medical.access`, `medical.update`, `medical.delete` |
| **Announcements** | Psst | `announcement.create`, `announcement.view`, `announcement.manage`, `announcement.update`, `announcement.delete` |
| **Inventory + Certs** | Tsukusomi | `inventory.view`, `inventory.manage`, `certificate.*` |

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

### 🩸 Donors & Donations (Moe Wai Yan)
- `POST /donors` -> `@Permissions('donor.create')`
- `PATCH /donors/:id` -> `@Permissions('donor.update')` (Approval)
- `GET /donors` -> `@Permissions('donor.access')`
- `DELETE /donors/:id` -> `@Permissions('donor.delete')`
- `POST /donations` -> `@Permissions('donation.create')`
- `GET /donations` -> `@Permissions('donation.access')`
- `PATCH /donations/:id` -> `@Permissions('donation.update')`
- `DELETE /donations/:id` -> `@Permissions('donation.delete')`

### 🩺 Blood Requests (Heing Naing Aung)
- `POST /requests` -> `@Permissions('request.create')`
- `GET /requests` -> `@Permissions('request.access')`
- `PATCH /requests/:id` -> `@Permissions('request.update')`
- `DELETE /requests/:id` -> `@Permissions('request.delete')`

### 📅 Appointments (Show Wai Yan)
- `POST /appointments` -> `@Permissions('appointment.create')`
- `GET /appointments` -> `@Permissions('appointment.access')`
- `PATCH /appointments/:id` -> `@Permissions('appointment.update')`
- `DELETE /appointments/:id` -> `@Permissions('appointment.delete')`

### 🔬 Medical Records (Sai Zayer Hein)
- `POST /medical-records` -> `@Permissions('medical.create')`
- `GET /medical-records` -> `@Permissions('medical.access')`
- `PATCH /medical-records/:id` -> `@Permissions('medical.update')`
- `DELETE /medical-records/:id` -> `@Permissions('medical.delete')`

---

## 🚀 Getting Started
1. **Pull the latest from `dev` branch.**
2. **Run `npx prisma generate`** to sync the 38 permissions.
3. **Run `npm run db:seed`** to update your local database with roles/permissions.
