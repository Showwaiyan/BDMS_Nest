# Team Assignments & RBAC Permissions

| Module | Member | Recommended Permissions |
| :--- | :--- | :--- |
| **Auth + User** | Min Htet Thar (Leader) | `user.manage`, `role.manage` |
| **Donations** | Mow Wai Yan | `donation.create`, `donation.approve`, `donation.view` |
| **Requests** | Heing Naing Aung | `request.create`, `request.approve`, `request.view` |
| **Appointments** | Show Wai Yan | `appointment.create`, `appointment.manage`, `appointment.view` |
| **Medical Records** | Sai Zayer Hein | `medical.create`, `medical.view`, `medical.manage` |
| **Announcements** | Psst | `announcement.create`, `announcement.manage` |
| **Inventory + Certificates** | Tsokusomi | `inventory.manage`, `certificate.issue` |

---

### 🚀 Getting Started for the Team

1. **Pull the latest changes from `dev` branch:**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Sync Database:**
   ```bash
   npx prisma generate
   ```

3. **Protect Your Routes:**
   Import the `Permissions` decorator and `PermissionsGuard` in your controller:
   ```typescript
   @UseGuards(JwtAuthGuard, PermissionsGuard)
   @Permissions('your.permission')
   ```
