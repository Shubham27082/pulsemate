# Requirements Document

## Introduction

This feature replaces and expands the existing basic admin and clinic owner pages in the PulseMate healthcare appointment and live queue platform. It delivers a production-quality **Super Admin Panel** and **Clinic Owner Panel** that match the Visily UI designs provided.

The Super Admin Panel gives platform administrators full control: approving/rejecting clinic onboarding, managing all users (clinic owners, doctors, receptionists, patients), monitoring appointments platform-wide, and viewing analytics. The Clinic Owner Panel gives clinic owners complete management of their clinic: doctors, receptionists, appointments, live queue, walk-in patients, revenue, and settings.

The implementation targets the existing stack: Node.js + Express + PostgreSQL + Prisma on the backend, and React + Vite + Tailwind CSS on the frontend. Existing pages (`AdminDashboard`, `ClinicApprovals`, `UsersManagement`, `OwnerDashboard`, `ClinicProfile`, `ManageStaff`, `OwnerAppointments`, `QueueOverview`) are replaced with full production versions. New pages are added for doctors, patients, appointments monitoring (admin), and walk-in, revenue, and settings (owner).

---

## Glossary

- **Super_Admin_Panel**: The set of frontend pages and backend API endpoints accessible only to users with role `SUPER_ADMIN`.
- **Clinic_Owner_Panel**: The set of frontend pages and backend API endpoints accessible only to users with role `CLINIC_OWNER`.
- **Admin_API**: The backend REST API mounted at `/api/admin` (existing) and `/api/super-admin` (new routes added alongside).
- **Owner_API**: The backend REST API mounted at `/api/clinic-owner` (new) and `/api/clinics` (existing, extended).
- **Dashboard_Layout**: The shared React layout component (`DashboardLayout.jsx`) providing sidebar navigation and top bar.
- **Clinic**: A healthcare facility record in the `clinics` table, owned by a `CLINIC_OWNER` user.
- **Clinic_Status**: The approval state of a clinic — `PENDING` (not yet verified), `APPROVED` (isVerified=true, isActive=true), `REJECTED` (isActive=false), `DISABLED` (isActive=false after approval).
- **Staff**: A `ClinicStaff` record linking a `User` to a `Clinic` with a `StaffRole` of `DOCTOR`, `RECEPTIONIST`, or `OWNER`.
- **Queue**: A `Queue` record representing a doctor's patient queue for a specific date at a clinic.
- **Queue_Item**: A `QueueItem` record representing one patient's position in a `Queue`.
- **Walk_In**: An offline appointment created at the reception desk without prior booking.
- **Audit_Log**: An `AuditLog` record capturing user actions for security and compliance.
- **Status_Badge**: A colored pill UI element indicating entity status (Pending=yellow, Approved/Active=green, Rejected/Disabled=red, Reviewing=orange).
- **Stats_Card**: A white card UI element displaying a metric with a title, value, and icon.
- **Pagination**: Server-side pagination returning `page`, `limit`, `total`, and `data` fields.

---

## Requirements

---

### Requirement 1: Super Admin Dashboard

**User Story:** As a Super Admin, I want a dashboard overview of the entire platform, so that I can monitor key metrics and quickly access critical actions.

#### Acceptance Criteria

1. WHEN a `SUPER_ADMIN` user navigates to `/admin`, THE Super_Admin_Panel SHALL display Stats_Cards for: Total Clinics, Pending Clinics, Approved Clinics, Rejected Clinics, Total Doctors, Total Patients, Total Appointments, Today's Appointments, Active Queues.
2. WHEN the dashboard loads, THE Admin_API SHALL return all dashboard stats from `GET /api/admin/dashboard` within a single response.
3. WHEN the dashboard loads, THE Super_Admin_Panel SHALL display a Recent Clinic Registrations table showing the 10 most recently created clinics with columns: Clinic Name, Owner Name, Location (city), Submitted Date, Status badge, and an Actions column with a "View" link.
4. WHEN the dashboard loads, THE Super_Admin_Panel SHALL display an Approval Center widget showing the count of pending clinics and a "Process Now" button that navigates to `/admin/approvals`.
5. WHEN the dashboard loads, THE Super_Admin_Panel SHALL display a Recent User Activity feed showing the 10 most recent `AuditLog` entries with action, entity type, and timestamp.
6. THE Dashboard_Layout SHALL include sidebar navigation items for: Dashboard, Clinic Approvals, All Clinics, Users, Doctors, Patients, Appointments for the `SUPER_ADMIN` role.
7. IF the `GET /api/admin/dashboard` request fails, THEN THE Super_Admin_Panel SHALL display an error message and a retry button.

---

### Requirement 2: Clinic Approvals Page

**User Story:** As a Super Admin, I want to review and act on clinic registration requests, so that I can control which clinics operate on the platform.

#### Acceptance Criteria

1. WHEN a `SUPER_ADMIN` navigates to `/admin/approvals`, THE Super_Admin_Panel SHALL display a Registration Queue with filter tabs: All Requests, Pending, Under Review, Rejected.
2. WHEN a tab is selected, THE Admin_API SHALL return filtered clinics from `GET /api/admin/clinics/pending` (or `GET /api/admin/clinics` with status filter) and THE Super_Admin_Panel SHALL update the table without full page reload.
3. THE Super_Admin_Panel SHALL display a table with columns: Clinic Name, Owner/Contact, Location, Submitted Date, Status badge, Actions (View Details, Approve, Reject, Request Changes, Disable).
4. WHEN the "Approve" action is triggered for a clinic, THE Admin_API SHALL call `PATCH /api/super-admin/clinics/:id/approve` and set `isVerified=true`, and THE Super_Admin_Panel SHALL update the clinic's Status_Badge to "Approved" without full page reload.
5. WHEN the "Reject" action is triggered for a clinic, THE Admin_API SHALL call `PATCH /api/super-admin/clinics/:id/reject` and set `isVerified=false, isActive=false`, and THE Super_Admin_Panel SHALL update the clinic's Status_Badge to "Rejected".
6. WHEN the "Request Changes" action is triggered, THE Super_Admin_Panel SHALL open a modal for the admin to enter a reason, and THE Admin_API SHALL call `PATCH /api/super-admin/clinics/:id/request-changes` storing the reason in the clinic's metadata.
7. WHEN the "Disable" action is triggered for an approved clinic, THE Admin_API SHALL call `PATCH /api/super-admin/clinics/:id/disable` and set `isActive=false`.
8. THE Super_Admin_Panel SHALL display stats at the top: Pending Requests count and Today's Submissions count.
9. THE Super_Admin_Panel SHALL display informational cards at the bottom: Approval Guidelines, SLA Deadline, and Rejection Protocol.
10. IF an approval/rejection action fails, THEN THE Super_Admin_Panel SHALL display a toast error message and leave the clinic status unchanged.

---

### Requirement 3: All Clinics Directory Page

**User Story:** As a Super Admin, I want to browse and search all clinics on the platform, so that I can find and manage any clinic quickly.

#### Acceptance Criteria

1. WHEN a `SUPER_ADMIN` navigates to `/admin/clinics`, THE Super_Admin_Panel SHALL display a Clinic Directory with a search input, city filter dropdown, and status filter dropdown.
2. WHEN search or filter values change, THE Admin_API SHALL be called with updated query parameters and THE Super_Admin_Panel SHALL update the table results.
3. THE Super_Admin_Panel SHALL display a table with columns: Clinic Name (with ID), Owner Details (name + mobile), Location (city, address), Capacity (doctor count / staff count), Status badge, Created date, Actions (View Details link).
4. THE Admin_API SHALL support `GET /api/admin/clinics` with query parameters: `search`, `city`, `status` (pending/approved/rejected), `page`, `limit`.
5. THE Super_Admin_Panel SHALL display Pagination controls when total results exceed the page limit.
6. THE Super_Admin_Panel SHALL display bottom stats: Active Facilities count, Pending Approvals count, Total Staff Network count.
7. WHEN the "View Details" action is clicked, THE Super_Admin_Panel SHALL navigate to `/admin/clinics/:id`.

---

### Requirement 4: Clinic Details Page

**User Story:** As a Super Admin, I want to view full details of a specific clinic, so that I can make informed approval decisions and monitor clinic activity.

#### Acceptance Criteria

1. WHEN a `SUPER_ADMIN` navigates to `/admin/clinics/:id`, THE Admin_API SHALL return full clinic data from `GET /api/super-admin/clinics/:id` including: clinic info, owner details, staff list (doctors and receptionists), and today's appointment count.
2. THE Super_Admin_Panel SHALL display clinic basic info: name, type, registration number, phone, email, address, city, opening/closing times, description.
3. THE Super_Admin_Panel SHALL display owner details: name, mobile, email.
4. THE Super_Admin_Panel SHALL display a Doctors list and a Receptionists list for the clinic.
5. THE Super_Admin_Panel SHALL display Stats_Cards: Today's Appointments, Active Staff count, Clinic Status.
6. WHEN the clinic status is `PENDING`, THE Super_Admin_Panel SHALL display Approve and Reject action buttons.
7. WHEN the clinic status is `APPROVED`, THE Super_Admin_Panel SHALL display a Disable button.
8. IF the clinic is not found, THEN THE Super_Admin_Panel SHALL display a "Clinic not found" message and a back button.

---

### Requirement 5: Users Management Page

**User Story:** As a Super Admin, I want to view and manage all platform users, so that I can disable suspicious accounts and monitor user activity.

#### Acceptance Criteria

1. WHEN a `SUPER_ADMIN` navigates to `/admin/users`, THE Super_Admin_Panel SHALL display Stats_Cards: Total Users, Active Users, Disabled Users, Pending (unverified) Users.
2. THE Super_Admin_Panel SHALL display a table with columns: User (name + ID), Contact Info (mobile + email), Role badge, Assigned Clinic (if applicable), Status badge, Created date, Actions (View Profile, Disable/Enable).
3. THE Super_Admin_Panel SHALL display role filter tabs: All, Admin, Receptionist, Patient, Doctor, Clinic Owner.
4. WHEN a role tab is selected or search is submitted, THE Admin_API SHALL be called with updated filters and THE Super_Admin_Panel SHALL update the table.
5. WHEN the "Disable" action is triggered, THE Admin_API SHALL call `PATCH /api/super-admin/users/:id/disable` setting `isActive=false`, and THE Super_Admin_Panel SHALL update the user's Status_Badge.
6. WHEN the "Enable" action is triggered, THE Admin_API SHALL call `PATCH /api/super-admin/users/:id/reactivate` setting `isActive=true`, and THE Super_Admin_Panel SHALL update the user's Status_Badge.
7. THE Super_Admin_Panel SHALL display a User Activity Feed at the bottom showing recent audit log entries.
8. THE Super_Admin_Panel SHALL support Pagination for the users table.

---

### Requirement 6: User Profile Page

**User Story:** As a Super Admin, I want to view a detailed profile of any user, so that I can review their activity and take account management actions.

#### Acceptance Criteria

1. WHEN a `SUPER_ADMIN` navigates to `/admin/users/:id`, THE Admin_API SHALL return user data from `GET /api/super-admin/users/:id` including: user info, assigned clinic, recent appointments, and recent audit log entries.
2. THE Super_Admin_Panel SHALL display: avatar (initials), name, role badge, status badge.
3. THE Super_Admin_Panel SHALL display a Security & Access section: Account Role, Last Activity timestamp.
4. THE Super_Admin_Panel SHALL display the user's Assigned Clinic name (if applicable).
5. THE Super_Admin_Panel SHALL display a Recent Appointments table with columns: Date, Doctor, Clinic, Type, Status.
6. THE Super_Admin_Panel SHALL display a Platform Audit Log timeline showing the user's recent actions.
7. WHEN the "Disable User Account" button is clicked, THE Super_Admin_Panel SHALL show a confirmation dialog, and upon confirmation THE Admin_API SHALL call `PATCH /api/super-admin/users/:id/disable`.
8. IF the user is not found, THEN THE Super_Admin_Panel SHALL display a "User not found" message and a back button.

---

### Requirement 7: Doctors Directory Page (Admin)

**User Story:** As a Super Admin, I want to view and manage all doctors on the platform, so that I can verify credentials and monitor doctor activity.

#### Acceptance Criteria

1. WHEN a `SUPER_ADMIN` navigates to `/admin/doctors`, THE Admin_API SHALL return doctor data from `GET /api/super-admin/doctors` with filters: search (name/mobile), specialty, clinic, status, page, limit.
2. THE Super_Admin_Panel SHALL display a table with columns: Doctor Name + mobile, Specialization, Clinic, Consultation Fee, Online/Offline availability, Status badge, Actions (Verify, Disable).
3. WHEN the "Verify" action is triggered, THE Admin_API SHALL call `PATCH /api/super-admin/doctors/:id/verify`.
4. WHEN the "Disable" action is triggered, THE Admin_API SHALL call `PATCH /api/super-admin/doctors/:id/disable` setting the doctor's user `isActive=false`.
5. THE Super_Admin_Panel SHALL display bottom stats: Telemedicine Adoption percentage, Average Consultation Time, Top Performing Clinic.
6. THE Super_Admin_Panel SHALL support search, specialty filter, clinic filter, status filter, and Pagination.

---

### Requirement 8: Patients Directory Page (Admin)

**User Story:** As a Super Admin, I want to view and manage all patients on the platform, so that I can monitor engagement and disable abusive accounts.

#### Acceptance Criteria

1. WHEN a `SUPER_ADMIN` navigates to `/admin/patients`, THE Admin_API SHALL return patient data from `GET /api/super-admin/patients` with filters: search (name/mobile), status, page, limit.
2. THE Super_Admin_Panel SHALL display Stats_Cards: Total Patients, Active Now (patients with appointments today), Monthly Registrations, Average Engagement (avg appointments per patient).
3. THE Super_Admin_Panel SHALL display a table with columns: Patient Identity (name + ID), Age/Gender, Contact Details, Total Bookings count, Status badge, Registered date, Actions (View Profile, Disable).
4. WHEN the "Disable" action is triggered, THE Admin_API SHALL call `PATCH /api/super-admin/patients/:id/disable` setting `isActive=false`.
5. THE Super_Admin_Panel SHALL support search, status filter, and Pagination.

---

### Requirement 9: Appointments Monitoring Page (Admin)

**User Story:** As a Super Admin, I want to monitor all appointments across the platform in real time, so that I can detect issues and ensure service quality.

#### Acceptance Criteria

1. WHEN a `SUPER_ADMIN` navigates to `/admin/appointments`, THE Admin_API SHALL return appointment data from `GET /api/super-admin/appointments` with filters: search (patient/doctor name), clinic, specialty, status, page, limit.
2. THE Super_Admin_Panel SHALL display a Live Feed with tabs: All Appointments, Live Queue (with count badge of currently active queue items).
3. THE Super_Admin_Panel SHALL display a table with columns: Patient Details (name + mobile), Doctor & Specialty, Clinic, Type (Online/Offline), Date & Time, Queue Number, Status badge, Actions (View).
4. THE Super_Admin_Panel SHALL display a "Refreshed every 30 seconds" indicator and automatically refresh the data every 30 seconds.
5. THE Super_Admin_Panel SHALL support search, clinic filter, specialty filter, status filter, and Pagination.

---

### Requirement 10: Clinic Owner Dashboard

**User Story:** As a Clinic Owner, I want a dashboard showing today's key metrics and quick actions, so that I can manage my clinic efficiently.

#### Acceptance Criteria

1. WHEN a `CLINIC_OWNER` navigates to `/owner`, THE Clinic_Owner_Panel SHALL display Stats_Cards: Today's Appointments, Waiting Patients, Completed Consultations, Doctors Available Today, Total Doctors, Total Receptionists, Monthly Revenue, Pending Queue count.
2. THE Clinic_Owner_Panel SHALL display Quick Action buttons: Add Doctor (→ `/owner/doctors`), Add Receptionist (→ `/owner/receptionists`), View Queue (→ `/owner/queue`), Add Walk-in Patient (→ `/owner/walk-in`), Update Clinic Timing (→ `/owner/clinic`).
3. THE Owner_API SHALL return dashboard stats from `GET /api/clinic-owner/dashboard` for the owner's primary clinic.
4. IF the owner has no clinic yet, THEN THE Clinic_Owner_Panel SHALL display a "Create Your Clinic" prompt with a button navigating to `/owner/clinic`.

---

### Requirement 11: Clinic Profile Management

**User Story:** As a Clinic Owner, I want to create and update my clinic's full profile, so that patients and the Super Admin can see accurate clinic information.

#### Acceptance Criteria

1. WHEN a `CLINIC_OWNER` navigates to `/owner/clinic`, THE Clinic_Owner_Panel SHALL display a form with fields: Name, Clinic Type (Single Doctor, Multi-speciality, Dental, Eye, Skin, Physiotherapy, Diagnostic Center), Registration Number, Phone, Email, Address, City, State, Pincode, Latitude, Longitude, Opening Time, Closing Time, Description, Facilities (multi-select tags), and a Documents upload section.
2. WHEN the form is submitted for a new clinic, THE Owner_API SHALL call `POST /api/clinic-owner/clinic` and create the clinic with `isVerified=false` (PENDING status).
3. WHEN the form is submitted for an existing clinic, THE Owner_API SHALL call `PATCH /api/clinic-owner/clinic` and update the clinic record.
4. THE Clinic_Owner_Panel SHALL display the current clinic status (PENDING/APPROVED/REJECTED) as a Status_Badge.
5. WHEN the clinic status is `PENDING`, THE Clinic_Owner_Panel SHALL display an informational message: "Your clinic is under review by the Super Admin."
6. THE Owner_API SHALL return the owner's clinic from `GET /api/clinic-owner/clinic`.
7. IF required fields (Name, Phone, Address, City) are missing on submit, THEN THE Clinic_Owner_Panel SHALL display inline validation errors and prevent submission.

---

### Requirement 12: Doctor Management (Owner)

**User Story:** As a Clinic Owner, I want to add, edit, and manage doctors in my clinic, so that patients can book appointments with them.

#### Acceptance Criteria

1. WHEN a `CLINIC_OWNER` navigates to `/owner/doctors`, THE Clinic_Owner_Panel SHALL display a list of doctors with their name, specialization, availability status, and active/inactive status.
2. THE Owner_API SHALL return the clinic's doctors from `GET /api/clinic-owner/doctors`.
3. WHEN the "Add Doctor" button is clicked, THE Clinic_Owner_Panel SHALL open a multi-step form with 4 steps:
   - Step 1: Basic Details (Name, Mobile, Email, Gender, Photo URL)
   - Step 2: Professional Details (Specialization, Experience Years, Education, Medical Registration Number, Bio)
   - Step 3: Clinic Settings (Consultation Fee, Avg Consultation Time in minutes, Online/Offline availability, Available Days, Start/End Time)
   - Step 4: Create Login (option to send OTP invite or set a temporary password)
4. WHEN the multi-step form is completed and submitted, THE Owner_API SHALL call `POST /api/clinic-owner/doctors` creating the user, doctor profile, clinic staff record, and doctor-clinic link in a single transaction.
5. WHEN the "Edit" action is triggered for a doctor, THE Clinic_Owner_Panel SHALL open a pre-filled edit form and on submit THE Owner_API SHALL call `PATCH /api/clinic-owner/doctors/:id`.
6. WHEN the "Deactivate" action is triggered, THE Owner_API SHALL call `PATCH /api/clinic-owner/doctors/:id/status` setting `isActive=false` on the `ClinicStaff` record.
7. WHEN the "Activate" action is triggered, THE Owner_API SHALL call `PATCH /api/clinic-owner/doctors/:id/status` setting `isActive=true` on the `ClinicStaff` record.

---

### Requirement 13: Receptionist Management (Owner)

**User Story:** As a Clinic Owner, I want to add and manage receptionists with specific permissions, so that I can control what each receptionist can do.

#### Acceptance Criteria

1. WHEN a `CLINIC_OWNER` navigates to `/owner/receptionists`, THE Clinic_Owner_Panel SHALL display a list of receptionists with their name, mobile, and active status.
2. THE Owner_API SHALL return the clinic's receptionists from `GET /api/clinic-owner/receptionists`.
3. WHEN the "Add Receptionist" button is clicked, THE Clinic_Owner_Panel SHALL display a form with fields: Name, Mobile, Email, Password, and permission toggles: Can Manage Queue, Can Add Walk-in, Can Cancel Appointment, Can View Revenue, Can Manage Check-in.
4. WHEN the form is submitted, THE Owner_API SHALL call `POST /api/clinic-owner/receptionists` creating the user and clinic staff record.
5. WHEN the "Edit" action is triggered, THE Clinic_Owner_Panel SHALL open a pre-filled edit form and on submit THE Owner_API SHALL call `PATCH /api/clinic-owner/receptionists/:id`.
6. WHEN the "Remove" action is triggered, THE Clinic_Owner_Panel SHALL show a confirmation dialog, and upon confirmation THE Owner_API SHALL deactivate the staff record.

---

### Requirement 14: Appointment Management (Owner)

**User Story:** As a Clinic Owner, I want to view and manage all appointments for my clinic, so that I can track patient flow and handle cancellations.

#### Acceptance Criteria

1. WHEN a `CLINIC_OWNER` navigates to `/owner/appointments`, THE Clinic_Owner_Panel SHALL display filter controls: Date (Today/Tomorrow/Date Range picker), Doctor selector, Status selector, Type selector (Online/Offline).
2. THE Owner_API SHALL return appointments from `GET /api/clinic-owner/appointments` with filters: date, doctorId, status, type, page, limit.
3. THE Clinic_Owner_Panel SHALL display a table with columns: Patient (name + mobile), Doctor, Type badge, Date, Time (slotTime), Queue Number, Status badge, Payment Status, Actions (View, Cancel, Reschedule, Mark No-show).
4. WHEN the "Cancel" action is triggered, THE Owner_API SHALL call `PATCH /api/clinic-owner/appointments/:id/cancel` setting status to `CANCELLED`.
5. WHEN the "Mark No-show" action is triggered, THE Owner_API SHALL call `PATCH /api/clinic-owner/appointments/:id/no-show` setting status to `NO_SHOW`.
6. THE Clinic_Owner_Panel SHALL support Pagination for the appointments table.
7. IF an action fails, THEN THE Clinic_Owner_Panel SHALL display a toast error message.

---

### Requirement 15: Queue Management (Owner)

**User Story:** As a Clinic Owner, I want to view and control the live queue for each doctor, so that I can manage patient flow in real time.

#### Acceptance Criteria

1. WHEN a `CLINIC_OWNER` navigates to `/owner/queue`, THE Clinic_Owner_Panel SHALL display doctor-wise queue panels showing for each doctor: Total patients, Waiting count, Consulting count, Completed count, Skipped count, Queue Status badge.
2. THE Owner_API SHALL return queue data from `GET /api/clinic-owner/queues` for all doctors in the owner's clinic for today.
3. WHEN the "Start Queue" button is clicked for a doctor, THE Owner_API SHALL call `PATCH /api/clinic-owner/queues/:queueId/start` setting queue status to `ACTIVE`.
4. WHEN the "Pause Queue" button is clicked, THE Owner_API SHALL call `PATCH /api/clinic-owner/queues/:queueId/pause` setting queue status to `PAUSED`.
5. WHEN the "Resume Queue" button is clicked, THE Owner_API SHALL call `PATCH /api/clinic-owner/queues/:queueId/resume` setting queue status to `ACTIVE`.
6. WHEN the "Close Queue" button is clicked, THE Owner_API SHALL call `PATCH /api/clinic-owner/queues/:queueId/close` setting queue status to `CLOSED`.
7. WHEN the "Call Next" button is clicked, THE Owner_API SHALL call the existing `PATCH /api/reception/queue/:queueId/call-next` endpoint.
8. WHILE a queue is active, THE Clinic_Owner_Panel SHALL receive live Socket.io updates and refresh queue panel data without full page reload.

---

### Requirement 16: Walk-in Patient Registration (Owner)

**User Story:** As a Clinic Owner, I want to register walk-in patients directly, so that offline patients can be added to the queue without prior booking.

#### Acceptance Criteria

1. WHEN a `CLINIC_OWNER` navigates to `/owner/walk-in`, THE Clinic_Owner_Panel SHALL display a form with fields: Patient Name, Mobile Number, Age, Gender, Doctor selector (populated from clinic's active doctors), Symptoms (optional), and Type is fixed as `OFFLINE`.
2. WHEN the form is submitted, THE Owner_API SHALL call `POST /api/clinic-owner/walk-ins` which: finds or creates the patient user, creates an `OFFLINE` appointment, adds the patient to the doctor's queue, and returns the assigned queue number.
3. WHEN the walk-in is successfully registered, THE Clinic_Owner_Panel SHALL display the assigned queue number prominently and offer a "Register Another" button to reset the form.
4. IF the selected doctor's queue is `CLOSED`, THEN THE Owner_API SHALL return an error and THE Clinic_Owner_Panel SHALL display "Queue is closed for this doctor today."
5. IF the Mobile Number field is empty, THEN THE Clinic_Owner_Panel SHALL display a validation error and prevent form submission.

---

### Requirement 17: Revenue Reporting (Owner)

**User Story:** As a Clinic Owner, I want to view revenue reports for my clinic, so that I can track financial performance.

#### Acceptance Criteria

1. WHEN a `CLINIC_OWNER` navigates to `/owner/revenue`, THE Clinic_Owner_Panel SHALL display Stats_Cards: Today's Revenue, Monthly Revenue.
2. THE Owner_API SHALL return revenue data from `GET /api/clinic-owner/revenue` aggregated from completed appointments' consultation fees.
3. THE Owner_API SHALL return doctor-wise revenue breakdown from `GET /api/clinic-owner/revenue/doctor-wise`.
4. THE Clinic_Owner_Panel SHALL display a Doctor-wise Revenue section showing each doctor's name and their total revenue for the selected period.
5. THE Clinic_Owner_Panel SHALL display a Revenue table with columns: Date, Patient Name, Doctor Name, Type (Online/Offline), Amount, Payment Method, Status.
6. THE Clinic_Owner_Panel SHALL support date range filtering (default: current month).

---

### Requirement 18: Clinic Settings (Owner)

**User Story:** As a Clinic Owner, I want to configure clinic operational settings, so that the system behaves according to my clinic's policies.

#### Acceptance Criteria

1. WHEN a `CLINIC_OWNER` navigates to `/owner/settings`, THE Clinic_Owner_Panel SHALL display a settings form with fields: Slot Duration (minutes), Queue Average Time (minutes), Auto-cancel Rules (minutes before appointment), Booking Limit per day, Cancellation Policy (text), and Notification Preferences (email/SMS toggles).
2. THE Owner_API SHALL return current settings from `GET /api/clinic-owner/settings`.
3. WHEN the settings form is submitted, THE Owner_API SHALL call `PATCH /api/clinic-owner/settings` and persist the updated settings.
4. IF the settings save fails, THEN THE Clinic_Owner_Panel SHALL display a toast error message and retain the unsaved form values.

---

### Requirement 19: Design System Compliance

**User Story:** As a developer, I want all new pages to follow the established PulseMate design system, so that the UI is consistent and professional.

#### Acceptance Criteria

1. THE Super_Admin_Panel and Clinic_Owner_Panel SHALL use the existing Tailwind CSS design tokens: primary color `#2563EB`, secondary color `#22C55E`, and the existing CSS utility classes (`.btn-primary`, `.card`, `.badge-*`, `.input`, `.label`, `.page-container`).
2. THE Super_Admin_Panel and Clinic_Owner_Panel SHALL use the existing `Dashboard_Layout` component for all authenticated pages, with updated sidebar navigation items for each role.
3. THE Super_Admin_Panel and Clinic_Owner_Panel SHALL display Status_Badges using the existing badge classes: `badge-warning` (Pending/yellow), `badge-success` (Approved/Active/green), `badge-error` (Rejected/Disabled/red), and `badge-info` (Reviewing/orange-mapped to info).
4. THE Super_Admin_Panel and Clinic_Owner_Panel SHALL be mobile responsive, with tables scrolling horizontally on small screens and sidebar collapsing to a hamburger menu.
5. THE Super_Admin_Panel and Clinic_Owner_Panel SHALL use the existing `LoadingSpinner`, `EmptyState`, `Modal`, `StatsCard`, and `StatusBadge` UI components where applicable.

---

### Requirement 20: Backend API Extensions

**User Story:** As a developer, I want the backend to expose all required API endpoints for the new panel pages, so that the frontend can fetch and mutate data correctly.

#### Acceptance Criteria

1. THE Admin_API SHALL expose new routes under `/api/super-admin/` for: clinic approval actions (approve, reject, request-changes, disable), clinic details, user disable/reactivate, user profile, doctors directory, patients directory, and appointments monitoring.
2. THE Owner_API SHALL expose new routes under `/api/clinic-owner/` for: dashboard stats, clinic CRUD, doctors CRUD, receptionists CRUD, appointments list with cancel/no-show actions, queue management, walk-in registration, revenue reporting, and settings CRUD.
3. ALL new Admin_API routes SHALL require `authenticate` and `authorize('SUPER_ADMIN')` middleware.
4. ALL new Owner_API routes SHALL require `authenticate` and `authorize('CLINIC_OWNER')` middleware, and SHALL scope all data queries to the authenticated owner's clinic(s).
5. THE Admin_API and Owner_API SHALL return responses using the existing `sendSuccess`, `sendError`, and `sendPaginated` utility functions for consistency.
6. THE Admin_API SHALL record `AuditLog` entries for all state-changing actions (approve, reject, disable, enable).

---

### Requirement 21: Parser and Serializer — Clinic Settings

**User Story:** As a developer, I want clinic settings to be reliably serialized and deserialized, so that owner-configured values are stored and retrieved without data loss.

#### Acceptance Criteria

1. THE Owner_API SHALL serialize clinic settings (slot duration, queue avg time, auto-cancel rules, booking limit, cancellation policy, notification preferences) to a JSON structure stored in the database.
2. WHEN clinic settings are retrieved, THE Owner_API SHALL deserialize the stored JSON back into the same structured object that was saved.
3. FOR ALL valid clinic settings objects, saving then retrieving SHALL produce an equivalent object (round-trip property: `GET(PATCH(settings)) ≡ settings`).
4. IF the stored settings JSON is malformed or missing fields, THEN THE Owner_API SHALL return safe default values rather than an error.
