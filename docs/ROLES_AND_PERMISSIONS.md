ROLES & PERMISSIONS — Project Reference

Buod
---
Ito ang extracted at analyzed na roles at permissions mula sa repository (/database/seeders at routes). Gamitin itong reference para sa susunod na mga project work, seeders, at policy decisions.

Pinanggalingan
---
- Primary permissions list: database/seeders/RoleSeeder.php
- Adjustment permissions: database/seeders/AdjustmentTypePermissionSeeder.php, database/seeders/AssignAdjustmentPermissionsSeeder.php
- Routes guard: routes/web.php (permission middleware used across routes)

Listahan ng Permissions (ayon sa RoleSeeder)
---
- employees.view
- employees.create
- employees.edit
- employees.delete
- employees.manage
- salaries.view
- salaries.create
- salaries.edit
- salaries.delete
- peras.view
- peras.create
- peras.edit
- peras.delete
- ratas.view
- ratas.create
- ratas.edit
- ratas.delete
- hazard_pays.view
- hazard_pays.create
- hazard_pays.edit
- hazard_pays.delete
- clothing_allowances.view
- clothing_allowances.create
- clothing_allowances.edit
- clothing_allowances.delete
- payroll.view
- payroll.export
- payroll.manage
- suppliers.view
- suppliers.manage
- claims.view
- claims.create
- claims.edit
- claims.delete
- claims.manage
- deductions.view
- deductions.create
- deductions.edit
- deductions.delete
- deductions.manage
- settings.view
- settings.manage
- offices.view
- offices.create
- offices.edit
- offices.delete
- offices.manage
- employment_statuses.view
- employment_statuses.create
- employment_statuses.edit
- employment_statuses.delete
- employment_statuses.manage
- deduction_types.view
- deduction_types.create
- deduction_types.edit
- deduction_types.delete
- deduction_types.manage
- document_types.view
- document_types.create
- document_types.edit
- document_types.delete
- document_types.manage
- claim_types.view
- claim_types.create
- claim_types.edit
- claim_types.delete
- claim_types.manage
- accounts.view
- accounts.manage
- roles.view
- roles.manage
- permissions.view
- permissions.manage
- general_funds.view
- general_funds.store
- general_funds.edit
- general_funds.delete
- general_funds.manage
- source_of_fund_codes.view
- source_of_fund_codes.store
- source_of_fund_codes.edit
- source_of_fund_codes.delete
- source_of_fund_codes.manage
- employees.source_of_fund.view
- database.backup
- database.restore
- audit_logs.view
- audit_logs.export

Roles observed (seeders & usage)
---
- Created in RoleSeeder: "super admin" (space). This role is seeded and is given all permissions.
- Referenced in other seeders/routes: "super admin" (with space) and sometimes "super_admin" (underscore) — inconsistency detected.
- Referenced but not created in RoleSeeder: "hr" and "finance" (used by AssignAdjustmentPermissionsSeeder to receive adjustment permissions). Verify these roles exist in your environment or add them to RoleSeeder.
- Other roles may exist in your runtime DB but are not seeded here; check users table and roles table in your environment.

In-code enforcement points
---
- Routes use middleware(['permission:...']) extensively in routes/web.php. This is good — centralizes permission checks at route level.
- Controllers also use $this->authorize(...) and policies (e.g., AdjustmentTypePolicy registered in AppServiceProvider). Good separation of concerns.
- Some seeders/controllers reference roles/permissions with slightly different strings (e.g., 'super_admin' vs 'super admin') — this will cause assignment failures silently when role not found.

Findings, Issues & Risks
---
1) Role name inconsistency
   - database/seeders/RoleSeeder.php creates 'super admin' (space) but AdjustmentTypePermissionSeeder.php looks up 'super_admin' (underscore). This is a bug: the super_admin lookup will return null and permissions won't be assigned.
   - AssignAdjustmentPermissionsSeeder uses ['hr','finance','super admin'] — relies on hr/finance existing.

2) Missing role creation for HR/Finance
   - RoleSeeder does not seed 'hr' or 'finance'. If you expect AssignAdjustmentPermissionsSeeder to attach permissions to them, seed those roles explicitly or adapt the seeder to create-if-missing.

3) restricted_roles metadata design
   - adjustment_types.restricted_roles stores comma-separated role names. Consider storing as JSON array (safer) or better: enforce via Spatie role checks in policies rather than string-parsing.

4) Permission naming is consistent and granular (resource.action) — good for RBAC clarity.

5) UI forms (AdjustmentType create/edit) do not yet expose the new flags (taxable/include_in_payroll/requires_approval/restricted_roles). This is OK if defaults suffice, but admin UX would benefit from fields to manage these flags.

Recommendations (short-term)
---
1) Standardize role names across codebase
   - Pick a canonical format (e.g., human-readable with spaces: "super admin"), and replace lookups to use that consistently. Or prefer slug-style names (super_admin) but be consistent everywhere.
   - Update AdjustmentTypePermissionSeeder to use the exact seeded role string.

2) Seed commonly referenced roles
   - Add 'hr' and 'finance' to RoleSeeder (firstOrCreate) so AssignAdjustmentPermissionsSeeder reliably finds them.

3) Make seeders idempotent & defensive
   - Keep Schema::hasColumn checks (already implemented for AdjustmentTypeSeeder) so seeders don't fail in different DB states.

4) Improve restricted_roles design
   - Prefer JSON column and cast to array in AdjustmentType model:
     - migration: change string -> json nullable
     - model: protected $casts = ['restricted_roles' => 'array']
   - Update policy checks to query Role models rather than parse CSV strings.

5) Expose flags in admin UI
   - Update resources/js/pages/settings/AdjustmentType/create.tsx and edit.tsx to include checkboxes for taxable/include_in_payroll/requires_approval and a role multi-select for restricted_roles (fetch roles via API endpoint).

6) Tests & CI
   - Add tests for permission seeder idempotency and role-permission mapping.
   - Add a CI check that runs php artisan permission:show or queries roles/permissions to catch mismatches early.

7) Documentation & Onboarding
   - Keep this file (docs/ROLES_AND_PERMISSIONS.md) under source control as the canonical reference.

Suggested quick fixes (I can apply them if you want)
---
- Fix inconsistency: replace 'super_admin' with 'super admin' in database/seeders/AdjustmentTypePermissionSeeder.php (or vice-versa). I can patch and commit.
- Add creation of 'hr' and 'finance' roles to RoleSeeder (firstOrCreate). I can patch and commit.
- Add a small script or seeder to migrate restricted_roles from CSV to JSON if you decide to change design.

Next steps
---
Tell me which of these to do next and I'll apply the changes:
- 1) Normalize role name bug (auto-fix 'super_admin' -> 'super admin') and commit.
- 2) Add HR and Finance roles to RoleSeeder.
- 3) Extend AdjustmentType create/edit UI to manage flags and restricted_roles (front + controller validation).
- 4) Convert restricted_roles to JSON (migration + model cast + seeder to migrate existing values).
- 5) Generate a summary mapping (CSV/JSON) of permission -> files/routes where used.

I already created this reference file at docs/ROLES_AND_PERMISSIONS.md in the repository. Maaari mo ring sabihin kung gusto mo Tagalog o English na version — in Tagalog ito. Kung okay, susunod na hakbang: alin sa 1-5 ang gusto mong unahin?