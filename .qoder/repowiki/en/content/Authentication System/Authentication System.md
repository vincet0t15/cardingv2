# Authentication System

<cite>
**Referenced Files in This Document**
- [routes/web.php](file://routes/web.php)
- [routes/auth.php](file://routes/auth.php)
- [config/auth.php](file://config/auth.php)
- [app/Http/Middleware/HandleInertiaRequests.php](file://app/Http/Middleware/HandleInertiaRequests.php)
- [app/Http/Middleware/EnsureAccountIsActive.php](file://app/Http/Middleware/EnsureAccountIsActive.php)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php)
- [app/Http/Controllers/Auth/RegisteredUserController.php](file://app/Http/Controllers/Auth/RegisteredUserController.php)
- [app/Http/Controllers/Auth/VerifyEmailController.php](file://app/Http/Controllers/Auth/VerifyEmailController.php)
- [app/Http/Controllers/Auth/PasswordResetLinkController.php](file://app/Http/Controllers/Auth/PasswordResetLinkController.php)
- [app/Http/Controllers/Auth/NewPasswordController.php](file://app/Http/Controllers/Auth/NewPasswordController.php)
- [app/Http/Controllers/Auth/EmailVerificationNotificationController.php](file://app/Http/Controllers/Auth/EmailVerificationNotificationController.php)
- [app/Http/Controllers/Auth/EmailVerificationPromptController.php](file://app/Http/Controllers/Auth/EmailVerificationPromptController.php)
- [app/Http/Controllers/Auth/ConfirmablePasswordController.php](file://app/Http/Controllers/Auth/ConfirmablePasswordController.php)
- [app/Http/Requests/Auth/LoginRequest.php](file://app/Http/Requests/Auth/LoginRequest.php)
- [app/Models/User.php](file://app/Models/User.php)
- [database/migrations/0001_01_01_000000_create_users_table.php](file://database/migrations/0001_01_01_000000_create_users_table.php)
- [database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php](file://database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php)
- [resources/js/pages/auth/login.tsx](file://resources/js/pages/auth/login.tsx)
- [resources/js/pages/auth/register.tsx](file://resources/js/pages/auth/register.tsx)
</cite>

## Update Summary
**Changes Made**
- Updated authentication flow to reflect username-based login instead of email-based login
- Added new middleware EnsureAccountIsActive for account status validation
- Enhanced User model with is_active and is_super_admin fields
- Modified LoginRequest validation rules to use 'username' field instead of 'email'
- Updated RegisteredUserController validation to use username instead of email
- Updated ConfirmablePasswordController to use email-based validation temporarily
- Updated frontend login and registration forms to use username fields
- Modified User model to work with username instead of email
- Updated database migration to replace email with username field and add account status fields
- Updated authentication middleware configuration to support username-based authentication

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the authentication system built with Laravel's native authentication scaffolding and Inertia.js. The system has been updated to use username-based authentication instead of email-based authentication, with enhanced security features including account activation status validation. It covers user registration, login/logout, email verification, password reset, and password confirmation flows. It also documents middleware protection, session management, rate limiting, and security measures. The system uses the session guard, Eloquent user provider, and database-backed sessions and password reset tokens.

## Project Structure
The authentication system spans routes, controllers, requests, models, configuration, middleware, and migrations:

- Routes define guest-only and authenticated-only groups, including registration, login, logout, email verification, password reset, and password confirmation endpoints.
- Controllers implement request handling for each flow.
- Requests encapsulate validation and throttling logic for login attempts using username instead of email.
- Configuration defines the session guard, user provider, and password reset broker.
- Middleware shares the authenticated user and flash messages with the frontend.
- Migrations define the users table with username field and password reset tokens.
- New middleware EnsureAccountIsActive validates user account activation status.

```mermaid
graph TB
subgraph "Routes"
RWEB["routes/web.php"]
RAUTH["routes/auth.php"]
end
subgraph "Controllers"
REG["RegisteredUserController.php"]
SES["AuthenticatedSessionController.php"]
VERNP["EmailVerificationPromptController.php"]
VERN["EmailVerificationNotificationController.php"]
VERF["VerifyEmailController.php"]
FORG["PasswordResetLinkController.php"]
NEWP["NewPasswordController.php"]
CONF["ConfirmablePasswordController.php"]
end
subgraph "Requests"
LREQ["LoginRequest.php"]
end
subgraph "Config"
AUTHCFG["config/auth.php"]
end
subgraph "Middleware"
INERT["HandleInertiaRequests.php"]
ACT["EnsureAccountIsActive.php"]
end
subgraph "Models"
USER["User.php"]
end
subgraph "Migrations"
USERS["create_users_table.php"]
USERNAME["update_users_table_add_username_remove_email.php"]
end
RWEB --> RAUTH
RAUTH --> REG
RAUTH --> SES
RAUTH --> VERNP
RAUTH --> VERN
RAUTH --> VERF
RAUTH --> FORG
RAUTH --> NEWP
RAUTH --> CONF
SES --> LREQ
AUTHCFG --> USER
INERT --> USER
ACT --> USER
USERS --> USER
USERNAME --> USER
```

**Diagram sources**
- [routes/web.php:1-99](file://routes/web.php#L1-L99)
- [routes/auth.php:1-57](file://routes/auth.php#L1-L57)
- [config/auth.php:1-116](file://config/auth.php#L1-L116)
- [app/Http/Controllers/Auth/RegisteredUserController.php:1-50](file://app/Http/Controllers/Auth/RegisteredUserController.php#L1-L50)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:1-52](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L1-L52)
- [app/Http/Controllers/Auth/EmailVerificationPromptController.php:1-23](file://app/Http/Controllers/Auth/EmailVerificationPromptController.php#L1-L23)
- [app/Http/Controllers/Auth/EmailVerificationNotificationController.php:1-25](file://app/Http/Controllers/Auth/EmailVerificationNotificationController.php#L1-L25)
- [app/Http/Controllers/Auth/VerifyEmailController.php:1-31](file://app/Http/Controllers/Auth/VerifyEmailController.php#L1-L31)
- [app/Http/Controllers/Auth/PasswordResetLinkController.php:1-42](file://app/Http/Controllers/Auth/PasswordResetLinkController.php#L1-L42)
- [app/Http/Controllers/Auth/NewPasswordController.php:1-70](file://app/Http/Controllers/Auth/NewPasswordController.php#L1-L70)
- [app/Http/Controllers/Auth/ConfirmablePasswordController.php:1-42](file://app/Http/Controllers/Auth/ConfirmablePasswordController.php#L1-L42)
- [app/Http/Requests/Auth/LoginRequest.php:1-86](file://app/Http/Requests/Auth/LoginRequest.php#L1-L86)
- [app/Models/User.php:1-52](file://app/Models/User.php#L1-L52)
- [database/migrations/0001_01_01_000000_create_users_table.php:1-50](file://database/migrations/0001_01_01_000000_create_users_table.php#L1-L50)
- [database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php:1-34](file://database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php#L1-L34)
- [app/Http/Middleware/HandleInertiaRequests.php:1-55](file://app/Http/Middleware/HandleInertiaRequests.php#L1-L55)
- [app/Http/Middleware/EnsureAccountIsActive.php:1-31](file://app/Http/Middleware/EnsureAccountIsActive.php#L1-L31)

**Section sources**
- [routes/web.php:1-99](file://routes/web.php#L1-L99)
- [routes/auth.php:1-57](file://routes/auth.php#L1-L57)
- [config/auth.php:1-116](file://config/auth.php#L1-L116)
- [app/Http/Middleware/HandleInertiaRequests.php:1-55](file://app/Http/Middleware/HandleInertiaRequests.php#L1-L55)
- [database/migrations/0001_01_01_000000_create_users_table.php:1-50](file://database/migrations/0001_01_01_000000_create_users_table.php#L1-L50)
- [database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php:1-34](file://database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php#L1-L34)

## Core Components
- Authentication guard and provider
  - Guard: session driver with provider users (Eloquent).
  - Provider: Eloquent model User with username field.
  - Password broker: users with token table and expiration/throttle settings.
- Session management
  - Sessions stored in the sessions table; CSRF and session regeneration on login.
- Request validation and rate limiting
  - LoginRequest validates username and password credentials and enforces throttling.
- Controllers
  - Registration, login/logout, email verification prompts and notifications, password reset link request, password reset form, and password confirmation.
- Frontend integration
  - Inertia shares auth.user and flash messages globally.
- Database schema
  - Users table with username field replacing email field, plus is_active and is_super_admin flags.
- Account status middleware
  - EnsureAccountIsActive middleware validates user account activation status and logs out inactive users.

**Section sources**
- [config/auth.php:16-116](file://config/auth.php#L16-L116)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:14-52](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L14-L52)
- [app/Http/Controllers/Auth/RegisteredUserController.php:16-50](file://app/Http/Controllers/Auth/RegisteredUserController.php#L16-L50)
- [app/Http/Controllers/Auth/EmailVerificationPromptController.php:11-23](file://app/Http/Controllers/Auth/EmailVerificationPromptController.php#L11-L23)
- [app/Http/Controllers/Auth/EmailVerificationNotificationController.php:9-25](file://app/Http/Controllers/Auth/EmailVerificationNotificationController.php#L9-L25)
- [app/Http/Controllers/Auth/VerifyEmailController.php:10-31](file://app/Http/Controllers/Auth/VerifyEmailController.php#L10-L31)
- [app/Http/Controllers/Auth/PasswordResetLinkController.php:12-42](file://app/Http/Controllers/Auth/PasswordResetLinkController.php#L12-L42)
- [app/Http/Controllers/Auth/NewPasswordController.php:17-70](file://app/Http/Controllers/Auth/NewPasswordController.php#L17-L70)
- [app/Http/Controllers/Auth/ConfirmablePasswordController.php:13-42](file://app/Http/Controllers/Auth/ConfirmablePasswordController.php#L13-L42)
- [app/Http/Requests/Auth/LoginRequest.php:12-86](file://app/Http/Requests/Auth/LoginRequest.php#L12-L86)
- [app/Models/User.php:10-52](file://app/Models/User.php#L10-L52)
- [app/Http/Middleware/HandleInertiaRequests.php:37-55](file://app/Http/Middleware/HandleInertiaRequests.php#L37-L55)
- [app/Http/Middleware/EnsureAccountIsActive.php:15-29](file://app/Http/Middleware/EnsureAccountIsActive.php#L15-L29)
- [database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php:14-19](file://database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php#L14-L19)

## Architecture Overview
The authentication architecture combines Laravel backend controllers and requests with Inertia-driven frontend pages. Routes group endpoints by guest/authenticated access. Controllers delegate validation and persistence to models and facades. Rate limiting protects login attempts. Sessions persist authenticated state. The system now uses username-based authentication throughout with enhanced account status validation.

```mermaid
graph TB
CLIENT["Browser"]
INERT["HandleInertiaRequests.php"]
WEBRT["routes/web.php"]
AUTHRT["routes/auth.php"]
LREQ["LoginRequest.php"]
SESS["AuthenticatedSessionController.php"]
REGC["RegisteredUserController.php"]
VERNP["EmailVerificationPromptController.php"]
VERN["EmailVerificationNotificationController.php"]
VERF["VerifyEmailController.php"]
FORG["PasswordResetLinkController.php"]
NEWP["NewPasswordController.php"]
CONF["ConfirmablePasswordController.php"]
ACT["EnsureAccountIsActive.php"]
AUTHCFG["config/auth.php"]
USER["User.php"]
SESSDB["sessions table"]
PASSDB["password_reset_tokens table"]
USERNAME["users table with username field"]
CLIENT --> INERT
INERT --> WEBRT
INERT --> AUTHRT
AUTHRT --> SESS
AUTHRT --> REGC
AUTHRT --> VERNP
AUTHRT --> VERN
AUTHRT --> VERF
AUTHRT --> FORG
AUTHRT --> NEWP
AUTHRT --> CONF
SESS --> LREQ
AUTHCFG --> USER
USER --> SESSDB
USER --> PASSDB
USER --> USERNAME
ACT --> USER
```

**Diagram sources**
- [routes/web.php:1-99](file://routes/web.php#L1-L99)
- [routes/auth.php:1-57](file://routes/auth.php#L1-L57)
- [app/Http/Middleware/HandleInertiaRequests.php:1-55](file://app/Http/Middleware/HandleInertiaRequests.php#L1-L55)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:14-52](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L14-L52)
- [app/Http/Controllers/Auth/RegisteredUserController.php:16-50](file://app/Http/Controllers/Auth/RegisteredUserController.php#L16-L50)
- [app/Http/Controllers/Auth/EmailVerificationPromptController.php:11-23](file://app/Http/Controllers/Auth/EmailVerificationPromptController.php#L11-L23)
- [app/Http/Controllers/Auth/EmailVerificationNotificationController.php:9-25](file://app/Http/Controllers/Auth/EmailVerificationNotificationController.php#L9-L25)
- [app/Http/Controllers/Auth/VerifyEmailController.php:10-31](file://app/Http/Controllers/Auth/VerifyEmailController.php#L10-L31)
- [app/Http/Controllers/Auth/PasswordResetLinkController.php:12-42](file://app/Http/Controllers/Auth/PasswordResetLinkController.php#L12-L42)
- [app/Http/Controllers/Auth/NewPasswordController.php:17-70](file://app/Http/Controllers/Auth/NewPasswordController.php#L17-L70)
- [app/Http/Controllers/Auth/ConfirmablePasswordController.php:13-42](file://app/Http/Controllers/Auth/ConfirmablePasswordController.php#L13-L42)
- [app/Http/Requests/Auth/LoginRequest.php:12-86](file://app/Http/Requests/Auth/LoginRequest.php#L12-L86)
- [config/auth.php:16-116](file://config/auth.php#L16-L116)
- [app/Models/User.php:10-52](file://app/Models/User.php#L10-L52)
- [database/migrations/0001_01_01_000000_create_users_table.php:30-37](file://database/migrations/0001_01_01_000000_create_users_table.php#L30-L37)
- [database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php:14-19](file://database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php#L14-L19)
- [app/Http/Middleware/EnsureAccountIsActive.php:15-29](file://app/Http/Middleware/EnsureAccountIsActive.php#L15-L29)

## Detailed Component Analysis

### Authentication Flow: Login (Username-Based)
- Endpoint: POST /login
- Controller: AuthenticatedSessionController@store
- Request validation and throttling: LoginRequest.authenticate validates username and password
- Session regeneration: session()->regenerate()
- Redirect: intended dashboard route

```mermaid
sequenceDiagram
participant C as "Client"
participant R as "routes/auth.php"
participant S as "AuthenticatedSessionController"
participant LR as "LoginRequest"
participant A as "Auth Facade"
participant RL as "RateLimiter"
C->>R : "POST /login"
R->>S : "store(LoginRequest)"
S->>LR : "authenticate()"
LR->>RL : "ensureIsNotRateLimited()"
LR->>A : "attempt(username,password,remember)"
A-->>LR : "bool"
LR-->>S : "void or throws"
S->>S : "session()->regenerate()"
S-->>C : "redirect()->intended(dashboard)"
```

**Diagram sources**
- [routes/auth.php:19-22](file://routes/auth.php#L19-L22)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:30-37](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L30-L37)
- [app/Http/Requests/Auth/LoginRequest.php:40-53](file://app/Http/Requests/Auth/LoginRequest.php#L40-L53)
- [app/Http/Requests/Auth/LoginRequest.php:60-76](file://app/Http/Requests/Auth/LoginRequest.php#L60-L76)

**Section sources**
- [routes/auth.php:19-22](file://routes/auth.php#L19-L22)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:30-37](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L30-L37)
- [app/Http/Requests/Auth/LoginRequest.php:40-53](file://app/Http/Requests/Auth/LoginRequest.php#L40-L53)
- [app/Http/Requests/Auth/LoginRequest.php:60-76](file://app/Http/Requests/Auth/LoginRequest.php#L60-L76)

### Authentication Flow: Logout
- Endpoint: POST /logout
- Controller: AuthenticatedSessionController@destroy
- Actions: guard('web')->logout, invalidate session, regenerate CSRF token, redirect home

```mermaid
sequenceDiagram
participant C as "Client"
participant R as "routes/auth.php"
participant S as "AuthenticatedSessionController"
participant G as "Auth Guard 'web'"
participant SS as "Session"
C->>R : "POST /logout"
R->>S : "destroy(Request)"
S->>G : "logout()"
S->>SS : "invalidate() + regenerateToken()"
S-->>C : "redirect('/')"
```

**Diagram sources**
- [routes/auth.php:54-55](file://routes/auth.php#L54-L55)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:42-50](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L42-L50)

**Section sources**
- [routes/auth.php:54-55](file://routes/auth.php#L54-L55)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:42-50](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L42-L50)

### Registration Flow (Username-Based)
- Endpoints: GET /register (form), POST /register (submit)
- Controller: RegisteredUserController
- Steps: validate input (including unique username), create user with hashed password and inactive status, fire Registered event, redirect to login with activation message

```mermaid
sequenceDiagram
participant C as "Client"
participant R as "routes/auth.php"
participant RC as "RegisteredUserController"
participant U as "User Model"
C->>R : "GET /register"
R-->>C : "Render auth/register"
C->>R : "POST /register"
R->>RC : "store(Request)"
RC->>RC : "validate(name,username,password)"
RC->>U : "create(name,username,password,is_active=false)"
RC->>RC : "event(Registered)"
RC-->>C : "to_route('login') with activation message"
```

**Diagram sources**
- [routes/auth.php:13-17](file://routes/auth.php#L13-L17)
- [app/Http/Controllers/Auth/RegisteredUserController.php:30-48](file://app/Http/Controllers/Auth/RegisteredUserController.php#L30-L48)
- [app/Models/User.php:10-52](file://app/Models/User.php#L10-L52)

**Section sources**
- [routes/auth.php:13-17](file://routes/auth.php#L13-L17)
- [app/Http/Controllers/Auth/RegisteredUserController.php:30-48](file://app/Http/Controllers/Auth/RegisteredUserController.php#L30-L48)
- [app/Models/User.php:10-52](file://app/Models/User.php#L10-L52)

### Account Activation Status Validation
- Middleware: EnsureAccountIsActive
- Functionality: Checks if authenticated user has is_active flag set to false, logs them out, invalidates session, regenerates token, and redirects to login with error message
- Trigger: Applied to routes that require active account status

```mermaid
sequenceDiagram
participant C as "Client"
participant M as "EnsureAccountIsActive"
participant A as "Auth Facade"
participant S as "Session"
C->>M : "Request"
M->>A : "check()"
M->>A : "user()->is_active"
alt User is inactive
M->>A : "logout()"
M->>S : "invalidate() + regenerateToken()"
M-->>C : "redirect(login) with error"
else User is active
M-->>C : "next(request)"
end
```

**Diagram sources**
- [app/Http/Middleware/EnsureAccountIsActive.php:15-29](file://app/Http/Middleware/EnsureAccountIsActive.php#L15-L29)

**Section sources**
- [app/Http/Middleware/EnsureAccountIsActive.php:15-29](file://app/Http/Middleware/EnsureAccountIsActive.php#L15-L29)

### Email Verification Workflow
- Prompt: GET /verify-email (shows prompt if unverified)
- Resend: POST /email/verification-notification (throttled)
- Verify: GET /verify-email/{id}/{hash} (signed, throttled)
- Behavior: mark as verified, fire Verified event, redirect to dashboard with verified flag

```mermaid
sequenceDiagram
participant C as "Client"
participant R as "routes/auth.php"
participant VP as "EmailVerificationPromptController"
participant VN as "EmailVerificationNotificationController"
participant VF as "VerifyEmailController"
participant U as "User Model"
C->>R : "GET /verify-email"
R->>VP : "__invoke(Request)"
VP-->>C : "Render verify-email or redirect dashboard"
C->>R : "POST /email/verification-notification"
R->>VN : "store(Request)"
VN->>U : "sendEmailVerificationNotification()"
VN-->>C : "back() with status"
C->>R : "GET /verify-email/{id}/{hash}"
R->>VF : "__invoke(EmailVerificationRequest)"
VF->>U : "markEmailAsVerified()"
VF-->>C : "redirect dashboard?verified=1"
```

**Diagram sources**
- [routes/auth.php:37-47](file://routes/auth.php#L37-L47)
- [app/Http/Controllers/Auth/EmailVerificationPromptController.php:16-21](file://app/Http/Controllers/Auth/EmailVerificationPromptController.php#L16-L21)
- [app/Http/Controllers/Auth/EmailVerificationNotificationController.php:14-23](file://app/Http/Controllers/Auth/EmailVerificationNotificationController.php#L14-L23)
- [app/Http/Controllers/Auth/VerifyEmailController.php:15-29](file://app/Http/Controllers/Auth/VerifyEmailController.php#L15-L29)

**Section sources**
- [routes/auth.php:37-47](file://routes/auth.php#L37-L47)
- [app/Http/Controllers/Auth/EmailVerificationPromptController.php:16-21](file://app/Http/Controllers/Auth/EmailVerificationPromptController.php#L16-L21)
- [app/Http/Controllers/Auth/EmailVerificationNotificationController.php:14-23](file://app/Http/Controllers/Auth/EmailVerificationNotificationController.php#L14-L23)
- [app/Http/Controllers/Auth/VerifyEmailController.php:15-29](file://app/Http/Controllers/Auth/VerifyEmailController.php#L15-L29)

### Password Reset Procedures
- Request reset link: GET /forgot-password, POST /forgot-password
- Reset password: GET /reset-password/{token}, POST /reset-password
- Controllers: PasswordResetLinkController, NewPasswordController
- Mechanism: Password facade manages tokens and delivery; reset updates password and fires PasswordReset event

```mermaid
sequenceDiagram
participant C as "Client"
participant R as "routes/auth.php"
participant FR as "PasswordResetLinkController"
participant PR as "NewPasswordController"
participant PF as "Password Facade"
participant U as "User Model"
C->>R : "GET /forgot-password"
R-->>C : "Render forgot-password"
C->>R : "POST /forgot-password"
R->>FR : "store(Request)"
FR->>PF : "sendResetLink({email})"
FR-->>C : "back() with status"
C->>R : "GET /reset-password/{token}"
R-->>C : "Render reset-password with email/token"
C->>R : "POST /reset-password"
R->>PR : "store(Request)"
PR->>PF : "reset({email,password,token}, callback)"
PF->>U : "forceFill + save"
PR-->>C : "to_route('login') with status"
```

**Diagram sources**
- [routes/auth.php:24-34](file://routes/auth.php#L24-L34)
- [app/Http/Controllers/Auth/PasswordResetLinkController.php:17-40](file://app/Http/Controllers/Auth/PasswordResetLinkController.php#L17-L40)
- [app/Http/Controllers/Auth/NewPasswordController.php:22-68](file://app/Http/Controllers/Auth/NewPasswordController.php#L22-L68)

**Section sources**
- [routes/auth.php:24-34](file://routes/auth.php#L24-L34)
- [app/Http/Controllers/Auth/PasswordResetLinkController.php:17-40](file://app/Http/Controllers/Auth/PasswordResetLinkController.php#L17-L40)
- [app/Http/Controllers/Auth/NewPasswordController.php:22-68](file://app/Http/Controllers/Auth/NewPasswordController.php#L22-L68)

### Password Confirmation (Re-authentication)
- Endpoint: GET /confirm-password (show), POST /confirm-password (submit)
- Controller: ConfirmablePasswordController
- Behavior: validate user password against guard using email-based validation, set confirmation timestamp in session, redirect to intended route

**Updated** Note: Currently uses email-based validation temporarily while transitioning to username-based system

```mermaid
sequenceDiagram
participant C as "Client"
participant R as "routes/auth.php"
participant CC as "ConfirmablePasswordController"
participant A as "Auth Facade"
participant SS as "Session"
C->>R : "GET /confirm-password"
R-->>C : "Render confirm-password"
C->>R : "POST /confirm-password"
R->>CC : "store(Request)"
CC->>A : "guard('web')->validate({email,password})"
A-->>CC : "bool"
CC->>SS : "put('auth.password_confirmed_at', time())"
CC-->>C : "redirect()->intended(dashboard)"
```

**Diagram sources**
- [routes/auth.php:49-52](file://routes/auth.php#L49-L52)
- [app/Http/Controllers/Auth/ConfirmablePasswordController.php:26-40](file://app/Http/Controllers/Auth/ConfirmablePasswordController.php#L26-L40)

**Section sources**
- [routes/auth.php:49-52](file://routes/auth.php#L49-L52)
- [app/Http/Controllers/Auth/ConfirmablePasswordController.php:26-40](file://app/Http/Controllers/Auth/ConfirmablePasswordController.php#L26-L40)

### Protected Routes and Access Patterns
- Web routes under the auth middleware group are protected:
  - Dashboard and multiple resource routes.
- Auth routes:
  - Guest group: register, login, forgot-password, reset-password.
  - Auth group: verify-email, resend verification-notification, confirm-password, logout.
- Access pattern:
  - Unauthenticated users are redirected to login/register.
  - Authenticated users can access protected web routes and auth-specific actions.
- Account status validation:
  - EnsureAccountIsActive middleware ensures only active accounts can access protected routes.

```mermaid
flowchart TD
Start(["Incoming Request"]) --> CheckAuth{"Auth Middleware"}
CheckAuth --> |No| GuestRoutes["Guest Routes<br/>register, login, forgot-password, reset-password"]
CheckAuth --> |Yes| CheckActive{"EnsureAccountIsActive"}
CheckActive --> |Inactive| Logout["Logout & Redirect"]
CheckActive --> |Active| ProtectedWeb["Protected Web Routes<br/>dashboard, payroll, salaries, peras, rata, settings"]
ProtectedWeb --> AuthActions["Auth Actions<br/>verify-email, resend-verification, confirm-password, logout"]
GuestRoutes --> End(["Response"])
Logout --> GuestRoutes
AuthActions --> End
```

**Diagram sources**
- [routes/web.php:20-95](file://routes/web.php#L20-L95)
- [routes/auth.php:13-56](file://routes/auth.php#L13-L56)
- [app/Http/Middleware/EnsureAccountIsActive.php:15-29](file://app/Http/Middleware/EnsureAccountIsActive.php#L15-L29)

**Section sources**
- [routes/web.php:20-95](file://routes/web.php#L20-L95)
- [routes/auth.php:13-56](file://routes/auth.php#L13-L56)
- [app/Http/Middleware/EnsureAccountIsActive.php:15-29](file://app/Http/Middleware/EnsureAccountIsActive.php#L15-L29)

## Dependency Analysis
- Controllers depend on:
  - Requests for validation and throttling (LoginRequest with username validation).
  - Facades for authentication, password reset, and rate limiting.
  - Models for persistence (User with username field).
- Routes depend on controllers and middleware.
- Configuration defines guard/provider/password broker.
- Middleware shares authenticated user and flash messages.
- Database migrations define users table with username field.
- EnsureAccountIsActive middleware depends on User model's is_active field.

```mermaid
graph LR
LREQ["LoginRequest.php"] --> SES["AuthenticatedSessionController.php"]
REGC["RegisteredUserController.php"] --> USER["User.php"]
VERF["VerifyEmailController.php"] --> USER
FORG["PasswordResetLinkController.php"] --> PF["Password Facade"]
NEWP["NewPasswordController.php"] --> PF
CONF["ConfirmablePasswordController.php"] --> SESN["Session"]
AUTHCFG["config/auth.php"] --> USER
INERT["HandleInertiaRequests.php"] --> USER
ACT["EnsureAccountIsActive.php"] --> USER
RWEB["routes/web.php"] --> WEBCTRL["Web Controllers"]
RAUTH["routes/auth.php"] --> AUTHCTRL["Auth Controllers"]
USERS["create_users_table.php"] --> USER
USERNAME["update_users_table_add_username_remove_email.php"] --> USER
```

**Diagram sources**
- [app/Http/Requests/Auth/LoginRequest.php:12-86](file://app/Http/Requests/Auth/LoginRequest.php#L12-L86)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:14-52](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L14-L52)
- [app/Http/Controllers/Auth/RegisteredUserController.php:16-50](file://app/Http/Controllers/Auth/RegisteredUserController.php#L16-L50)
- [app/Http/Controllers/Auth/VerifyEmailController.php:10-31](file://app/Http/Controllers/Auth/VerifyEmailController.php#L10-L31)
- [app/Http/Controllers/Auth/PasswordResetLinkController.php:12-42](file://app/Http/Controllers/Auth/PasswordResetLinkController.php#L12-L42)
- [app/Http/Controllers/Auth/NewPasswordController.php:17-70](file://app/Http/Controllers/Auth/NewPasswordController.php#L17-L70)
- [app/Http/Controllers/Auth/ConfirmablePasswordController.php:13-42](file://app/Http/Controllers/Auth/ConfirmablePasswordController.php#L13-L42)
- [config/auth.php:16-116](file://config/auth.php#L16-L116)
- [app/Models/User.php:10-52](file://app/Models/User.php#L10-L52)
- [app/Http/Middleware/HandleInertiaRequests.php:37-55](file://app/Http/Middleware/HandleInertiaRequests.php#L37-L55)
- [app/Http/Middleware/EnsureAccountIsActive.php:15-29](file://app/Http/Middleware/EnsureAccountIsActive.php#L15-L29)
- [routes/web.php:1-99](file://routes/web.php#L1-L99)
- [routes/auth.php:1-57](file://routes/auth.php#L1-L57)
- [database/migrations/0001_01_01_000000_create_users_table.php:1-50](file://database/migrations/0001_01_01_000000_create_users_table.php#L1-L50)
- [database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php:1-34](file://database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php#L1-L34)

**Section sources**
- [app/Http/Requests/Auth/LoginRequest.php:12-86](file://app/Http/Requests/Auth/LoginRequest.php#L12-L86)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:14-52](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L14-L52)
- [app/Http/Controllers/Auth/RegisteredUserController.php:16-50](file://app/Http/Controllers/Auth/RegisteredUserController.php#L16-L50)
- [app/Http/Controllers/Auth/VerifyEmailController.php:10-31](file://app/Http/Controllers/Auth/VerifyEmailController.php#L10-L31)
- [app/Http/Controllers/Auth/PasswordResetLinkController.php:12-42](file://app/Http/Controllers/Auth/PasswordResetLinkController.php#L12-L42)
- [app/Http/Controllers/Auth/NewPasswordController.php:17-70](file://app/Http/Controllers/Auth/NewPasswordController.php#L17-L70)
- [app/Http/Controllers/Auth/ConfirmablePasswordController.php:13-42](file://app/Http/Controllers/Auth/ConfirmablePasswordController.php#L13-L42)
- [config/auth.php:16-116](file://config/auth.php#L16-L116)
- [app/Models/User.php:10-52](file://app/Models/User.php#L10-L52)
- [app/Http/Middleware/HandleInertiaRequests.php:37-55](file://app/Http/Middleware/HandleInertiaRequests.php#L37-L55)
- [app/Http/Middleware/EnsureAccountIsActive.php:15-29](file://app/Http/Middleware/EnsureAccountIsActive.php#L15-L29)
- [routes/web.php:1-99](file://routes/web.php#L1-L99)
- [routes/auth.php:1-57](file://routes/auth.php#L1-L57)
- [database/migrations/0001_01_01_000000_create_users_table.php:1-50](file://database/migrations/0001_01_01_000000_create_users_table.php#L1-L50)
- [database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php:1-34](file://database/migrations/2026_03_23_065831_update_users_table_add_username_remove_email.php#L1-L34)

## Performance Considerations
- Session storage: sessions table supports concurrent logins and IP/user agent tracking.
- Rate limiting: LoginRequest enforces per-IP and per-username throttling to reduce brute force risk.
- Password reset tokens: Short expiry and throttling limit generation frequency.
- Middleware overhead: HandleInertiaRequests shares minimal global data; avoid heavy computations in share().
- Username indexing: Database indexes on username field improve login performance.
- Account status checks: EnsureAccountIsActive middleware adds minimal overhead during request processing.

## Troubleshooting Guide
- Login fails with throttling
  - Cause: Too many failed attempts within the throttle window for the specific username.
  - Resolution: Wait for the throttle cooldown; verify rate limiter key composition uses username+IP.
- Invalid or expired verification link
  - Cause: Signed link expired or tampered; verify signature middleware and throttle settings.
  - Resolution: Resend verification notification; ensure signed URLs are used.
- Password reset token invalid
  - Cause: Token mismatch or expired.
  - Resolution: Re-request reset link; ensure token table and expiration are configured.
- Password confirmation required
  - Cause: Sensitive action requires recent password confirmation.
  - Resolution: Submit confirm-password form; ensure session confirmation timestamp is present.
- Session issues after logout
  - Cause: Session not invalidated or CSRF token not regenerated.
  - Resolution: Ensure logout controller invalidates session and regenerates token.
- Username conflicts during registration
  - Cause: Duplicate username already exists in database.
  - Resolution: Prompt user to choose a different username; ensure unique constraint is enforced.
- Account inactive error
  - Cause: User account is not activated by administrator.
  - Resolution: Contact administrator to activate account; user will receive activation message during registration.
- EnsureAccountIsActive middleware issues
  - Cause: Middleware not properly applied to routes or user model not updated.
  - Resolution: Verify middleware is applied to protected routes and User model has is_active field.

**Section sources**
- [app/Http/Requests/Auth/LoginRequest.php:60-76](file://app/Http/Requests/Auth/LoginRequest.php#L60-L76)
- [routes/auth.php:41-47](file://routes/auth.php#L41-L47)
- [app/Http/Controllers/Auth/PasswordResetLinkController.php:29-40](file://app/Http/Controllers/Auth/PasswordResetLinkController.php#L29-L40)
- [app/Http/Controllers/Auth/ConfirmablePasswordController.php:26-40](file://app/Http/Controllers/Auth/ConfirmablePasswordController.php#L26-L40)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php:42-50](file://app/Http/Controllers/Auth/AuthenticatedSessionController.php#L42-L50)
- [app/Http/Controllers/Auth/RegisteredUserController.php:32-36](file://app/Http/Controllers/Auth/RegisteredUserController.php#L32-L36)
- [app/Http/Middleware/EnsureAccountIsActive.php:17-25](file://app/Http/Middleware/EnsureAccountIsActive.php#L17-L25)

## Conclusion
The authentication system leverages Laravel's session guard, Eloquent provider, and built-in password reset facilities, integrated with Inertia for a seamless SPA-like experience. The system has been updated to use username-based authentication instead of email-based authentication throughout, with enhanced security through the EnsureAccountIsActive middleware that validates user account activation status. It enforces robust security through rate limiting, signed verification links, and secure session management. Protected routes and middleware ensure consistent access control across the application with improved user identification through usernames and account status validation.