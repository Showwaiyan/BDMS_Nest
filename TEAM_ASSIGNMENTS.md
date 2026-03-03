# 🧛 BDMS Team Assignments & RBAC Specs

This is the **Single Source of Truth** for the Blood Donation Management System (NestJS).

---

## 👥 Team & Module Assignments

| Module | Member | Key Permissions (`dot.notation`) |
| :--- | :--- | :--- |
| **Auth + User** | **Min Htet Thar (Lead)** | `user.*`, `role.*`, `permission.*` |
| **Donors** | Mow Wai Yan | `donor.create`, `donor.view`, `donor.update` |
| **Donations** | Mow Wai Yan | `donation.create`, `donation.view`, `donation.access` |
| **Blood Requests** | Heing Naing Aung | `request.create`, `request.view`, `request.update` |
| **Appointments** | Show Wai Yan | `appointment.create`, `appointment.view`, `appointment.update` |
| **Medical Records** | Sai Zayer Hein | `medical.create`, `medical.view`, `medical.update` |
| **Announcements** | Psst | `announcement.create`, `announcement.view`, `announcement.manage` |
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
  @Permissions('module.access', 'module.view')
  findAll() { ... }
}
```

### 2. Access vs. View (The Difference)
- **`.view`**: Permission to see **one** specific record (e.g., viewing a profile).
- **`.access`**: Permission to see the **full list/dashboard** (Admin/Staff only).

---

## 📡 API Endpoint Specs (Permissions Map)

### 🩸 Donors & Donations (Mow Wai Yan)
- `POST /donors` -> `@Permissions('donor.create')`
- `PATCH /donors/:id` -> `@Permissions('donor.update')` (Approval)
- `POST /donations` -> `@Permissions('donation.create')`
- `GET /donations` -> `@Permissions('donation.access')`

### 🩺 Blood Requests (Heing Naing Aung)
- `POST /requests` -> `@Permissions('request.create')`
- `GET /requests` -> `@Permissions('request.access')`
- `PATCH /requests/:id` -> `@Permissions('request.update')`

### 📅 Appointments (Show Wai Yan)
- `POST /appointments` -> `@Permissions('appointment.create')`
- `GET /appointments` -> `@Permissions('appointment.access')`

### 🔬 Medical Records (Sai Zayer Hein)
- `POST /medical-records` -> `@Permissions('medical.create')`
- `GET /medical-records` -> `@Permissions('medical.access')`

---

## 🚀 Getting Started
1. **Pull the latest from `dev` branch.**
2. **Run `npx prisma generate`** to sync the 38 permissions.
3. **Run `npm run db:seed`** to update your local database with roles/permissions.
