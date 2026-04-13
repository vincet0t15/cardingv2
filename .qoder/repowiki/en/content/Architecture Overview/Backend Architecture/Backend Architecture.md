# Backend Architecture

<cite>
**Referenced Files in This Document**
- [bootstrap/app.php](file://bootstrap/app.php)
- [bootstrap/providers.php](file://bootstrap/providers.php)
- [public/index.php](file://public/index.php)
- [config/app.php](file://config/app.php)
- [config/auth.php](file://config/auth.php)
- [app/Http/Middleware/HandleInertiaRequests.php](file://app/Http/Middleware/HandleInertiaRequests.php)
- [app/Http/Controllers/Controller.php](file://app/Http/Controllers/Controller.php)
- [app/Http/Controllers/PayrollController.php](file://app/Http/Controllers/PayrollController.php)
- [app/Http/Controllers/EmployeeController.php](file://app/Http/Controllers/EmployeeController.php)
- [app/Http/Controllers/ManageEmployeeController.php](file://app/Http/Controllers/ManageEmployeeController.php)
- [app/Http/Controllers/EmployeeManage.php](file://app/Http/Controllers/EmployeeManage.php)
- [app/Models/User.php](file://app/Models/User.php)
- [app/Models/Employee.php](file://app/Models/Employee.php)
- [app/Models/DeductionType.php](file://app/Models/DeductionType.php)
- [app/Models/EmployeeDeduction.php](file://app/Models/EmployeeDeduction.php)
- [app/Providers/AppServiceProvider.php](file://app/Providers/AppServiceProvider.php)
- [routes/web.php](file://routes/web.php)
- [composer.json](file://composer.json)
- [database/migrations/2026_03_22_115112_create_employee_deductions_table.php](file://database/migrations/2026_03_22_115112_create_employee_deductions_table.php)
- [resources/js/pages/Employees/Manage/Manage.tsx](file://resources/js/pages/Employees/Manage/Manage.tsx)
- [resources/js/pages/Employees/Manage/Compensation.tsx](file://resources/js/pages/Employees/Manage/Compensation.tsx)
- [resources/js/pages/Employees/Manage/Settings.tsx](file://resources/js/pages/Employees/Manage/Settings.tsx)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for the new ManageEmployeeController replacing the legacy EmployeeManage controller
- Updated controller organization section to reflect the enhanced employee management capabilities
- Added detailed analysis of the new deduction management functionality
- Updated routing architecture to include the new manage employee endpoints
- Enhanced data access layer documentation with EmployeeDeduction model integration
- Updated frontend integration documentation showing the complete employee management interface

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
This document describes the backend architecture of a Laravel payroll management system. It explains how the MVC pattern is implemented, how controllers are organized, how middleware is configured, and how service providers are registered. It also documents the application bootstrapping process, the dependency injection container usage, configuration management, routing architecture, route model binding, the request lifecycle, middleware pipeline configuration, CORS handling, and security middleware. Additionally, it covers the service layer architecture, repository pattern implementation, and data access layers, along with namespace organization and autoloading strategy. Finally, it provides insights into Laravel's architectural decisions and best practices for building robust payroll systems.

**Updated** The system now features a comprehensive employee management controller with advanced data loading and validation capabilities, replacing the previous simplified EmployeeManage controller.

## Project Structure
The backend follows Laravel's conventional structure with clear separation of concerns:
- Public entry point: public/index.php
- Bootstrap: bootstrap/app.php and bootstrap/providers.php
- Configuration: config/*.php
- HTTP layer: app/Http/* (Controllers, Middleware, Requests)
- Domain models: app/Models/*
- Service providers: app/Providers/*
- Routing: routes/*.php
- Database: database/migrations, seeds
- Autoloading: composer.json PSR-4 namespaces

```mermaid
graph TB
A["public/index.php"] --> B["bootstrap/app.php"]
B --> C["routes/web.php"]
B --> D["config/app.php"]
B --> E["config/auth.php"]
B --> F["app/Providers/AppServiceProvider.php"]
C --> G["app/Http/Controllers/PayrollController.php"]
C --> H["app/Http/Controllers/EmployeeController.php"]
C --> I["app/Http/Controllers/ManageEmployeeController.php"]
C --> J["app/Http/Controllers/EmployeeManage.php"]
G --> K["app/Models/Employee.php"]
H --> K
I --> K
J --> K
K --> L["app/Models/User.php"]
I --> M["app/Models/DeductionType.php"]
I --> N["app/Models/EmployeeDeduction.php"]
B --> O["app/Http/Middleware/HandleInertiaRequests.php"]
```

**Diagram sources**
- [public/index.php:1-18](file://public/index.php#L1-L18)
- [bootstrap/app.php:1-24](file://bootstrap/app.php#L1-L24)
- [routes/web.php:1-110](file://routes/web.php#L1-L110)
- [config/app.php:1-127](file://config/app.php#L1-L127)
- [config/auth.php:1-116](file://config/auth.php#L1-L116)
- [app/Providers/AppServiceProvider.php:1-25](file://app/Providers/AppServiceProvider.php#L1-L25)
- [app/Http/Controllers/PayrollController.php:1-125](file://app/Http/Controllers/PayrollController.php#L1-L125)
- [app/Http/Controllers/EmployeeController.php:1-119](file://app/Http/Controllers/EmployeeController.php#L1-L119)
- [app/Http/Controllers/ManageEmployeeController.php:1-86](file://app/Http/Controllers/ManageEmployeeController.php#L1-L86)
- [app/Http/Controllers/EmployeeManage.php:1-42](file://app/Http/Controllers/EmployeeManage.php#L1-L42)
- [app/Models/Employee.php:1-104](file://app/Models/Employee.php#L1-L104)
- [app/Models/User.php:1-49](file://app/Models/User.php#L1-L49)
- [app/Models/DeductionType.php:1-33](file://app/Models/DeductionType.php#L1-L33)
- [app/Models/EmployeeDeduction.php:1-59](file://app/Models/EmployeeDeduction.php#L1-L59)
- [app/Http/Middleware/HandleInertiaRequests.php:1-55](file://app/Http/Middleware/HandleInertiaRequests.php#L1-L55)

**Section sources**
- [public/index.php:1-18](file://public/index.php#L1-L18)
- [bootstrap/app.php:1-24](file://bootstrap/app.php#L1-L24)
- [routes/web.php:1-110](file://routes/web.php#L1-L110)
- [composer.json:27-38](file://composer.json#L27-L38)

## Core Components
- Bootstrapping: The application initializes via bootstrap/app.php, registering routes, middleware, and providers, then creates the Application instance.
- HTTP Layer:
  - Controllers: Action classes under app/Http/Controllers implement request handling and orchestrate domain logic.
  - Middleware: Global and group middleware are configured in bootstrap/app.php; HandleInertiaRequests integrates Inertia.js sharing and root template.
  - Requests: Form requests live under app/Http/Requests for validation.
- Models: Eloquent models in app/Models define relationships and business attributes.
- Providers: app/Providers/AppServiceProvider registers and boots application services.
- Configuration: config/*.php centralizes environment-driven settings.

Key implementation references:
- Bootstrapping and middleware registration: [bootstrap/app.php:9-23](file://bootstrap/app.php#L9-L23)
- Provider registration: [bootstrap/providers.php:3-5](file://bootstrap/providers.php#L3-L5)
- Inertia middleware: [app/Http/Middleware/HandleInertiaRequests.php:9-54](file://app/Http/Middleware/HandleInertiaRequests.php#L9-L54)
- Base controller: [app/Http/Controllers/Controller.php:5-8](file://app/Http/Controllers/Controller.php#L5-L8)
- App service provider: [app/Providers/AppServiceProvider.php:7-24](file://app/Providers/AppServiceProvider.php#L7-L24)

**Section sources**
- [bootstrap/app.php:9-23](file://bootstrap/app.php#L9-L23)
- [bootstrap/providers.php:3-5](file://bootstrap/providers.php#L3-L5)
- [app/Http/Middleware/HandleInertiaRequests.php:9-54](file://app/Http/Middleware/HandleInertiaRequests.php#L9-L54)
- [app/Http/Controllers/Controller.php:5-8](file://app/Http/Controllers/Controller.php#L5-L8)
- [app/Providers/AppServiceProvider.php:7-24](file://app/Providers/AppServiceProvider.php#L7-L24)

## Architecture Overview
The backend uses a layered architecture aligned with Laravel conventions:
- Presentation: Inertia.js renders pages server-side; controllers return Inertia::render with shared data.
- Application: Controllers coordinate requests, apply validation, and delegate to domain logic.
- Domain: Eloquent models encapsulate entity state and relationships; boot hooks and accessors enrich behavior.
- Infrastructure: Config files and service providers wire framework services.

```mermaid
graph TB
subgraph "Presentation"
INR["Inertia Middleware<br/>HandleInertiaRequests"]
ENDPOINTS["Employee Management UI<br/>Manage.tsx, Settings.tsx, Compensation.tsx"]
end
subgraph "Application"
CTRL["Controllers<br/>PayrollController, EmployeeController<br/>ManageEmployeeController, EmployeeManage"]
ENDPOINTS
end
subgraph "Domain"
EMOD["Employee Model"]
UMOD["User Model"]
DDTYPE["DeductionType Model"]
EDMOD["EmployeeDeduction Model"]
ENDPOINTS
end
subgraph "Infrastructure"
BOOT["Bootstrap<br/>app.php"]
CONF["Config<br/>app.php, auth.php"]
PROV["AppServiceProvider"]
ENDPOINTS
end
INR --> CTRL
CTRL --> EMOD
CTRL --> DEDUCTIONS["Deduction Management"]
EMOD --> UMOD
DDTYPE --> EDMOD
BOOT --> INR
BOOT --> CONF
BOOT --> PROV
```

**Diagram sources**
- [app/Http/Middleware/HandleInertiaRequests.php:9-54](file://app/Http/Middleware/HandleInertiaRequests.php#L9-L54)
- [app/Http/Controllers/PayrollController.php:11-124](file://app/Http/Controllers/PayrollController.php#L11-L124)
- [app/Http/Controllers/EmployeeController.php:12-118](file://app/Http/Controllers/EmployeeController.php#L12-L118)
- [app/Http/Controllers/ManageEmployeeController.php:14-86](file://app/Http/Controllers/ManageEmployeeController.php#L14-L86)
- [app/Http/Controllers/EmployeeManage.php:11-42](file://app/Http/Controllers/EmployeeManage.php#L11-L42)
- [app/Models/Employee.php:10-103](file://app/Models/Employee.php#L10-L103)
- [app/Models/User.php:10-48](file://app/Models/User.php#L10-L48)
- [app/Models/DeductionType.php:7-33](file://app/Models/DeductionType.php#L7-L33)
- [app/Models/EmployeeDeduction.php:8-59](file://app/Models/EmployeeDeduction.php#L8-L59)
- [bootstrap/app.php:9-23](file://bootstrap/app.php#L9-L23)
- [config/app.php:3-126](file://config/app.php#L3-L126)
- [config/auth.php:3-115](file://config/auth.php#L3-L115)
- [app/Providers/AppServiceProvider.php:7-24](file://app/Providers/AppServiceProvider.php#L7-L24)
- [resources/js/pages/Employees/Manage/Manage.tsx:27-120](file://resources/js/pages/Employees/Manage/Manage.tsx#L27-L120)
- [resources/js/pages/Employees/Manage/Settings.tsx:21-265](file://resources/js/pages/Employees/Manage/Settings.tsx#L21-L265)
- [resources/js/pages/Employees/Manage/Compensation.tsx:13-42](file://resources/js/pages/Employees/Manage/Compensation.tsx#L13-L42)

## Detailed Component Analysis

### MVC Pattern Implementation
- Model: Employee and User models define relationships and attributes. Employee uses soft deletes and boot hooks to set created_by automatically. Accessors compute derived image URLs.
- View: Controllers render Inertia pages with shared data from middleware.
- Controller: Controllers implement actions for payroll, salaries, PERA/RATA histories, deductions, and employee CRUD. They use Eloquent queries with eager loading and computed aggregates.

**Updated** The new ManageEmployeeController introduces comprehensive employee management with advanced data loading and validation capabilities, including deduction management functionality.

```mermaid
classDiagram
class Employee {
+int id
+string first_name
+string last_name
+boolean is_rata_eligible
+employmentStatus()
+office()
+salaries()
+peras()
+ratas()
+deductions()
+latestSalary()
+latestPera()
+latestRata()
}
class User {
+int id
+string name
+string email
+hidden[]
+casts[]
}
class DeductionType {
+int id
+string name
+string code
+string description
+boolean is_active
+employeeDeductions()
+scopeActive()
}
class EmployeeDeduction {
+int id
+int employee_id
+int deduction_type_id
+decimal amount
+int pay_period_month
+int pay_period_year
+string notes
+int created_by
+employee()
+deductionType()
+createdBy()
+scopeForPeriod()
}
class PayrollController {
+index(request)
+show(request, employee)
}
class EmployeeController {
+index(request)
+store(request)
+show(request, employee)
+update(request, employee)
}
class ManageEmployeeController {
+index(request, employee)
+storeDeduction(request, employee)
+loadEmployeeData()
+validateDeductions()
}
class EmployeeManage {
+show(request, employee)
}
Employee --> User : "created_by"
Employee --> DeductionType : "deductions"
EmployeeDeduction --> DeductionType : "deduction_type_id"
PayrollController --> Employee : "queries"
EmployeeController --> Employee : "CRUD"
ManageEmployeeController --> Employee : "comprehensive management"
EmployeeManage --> Employee : "legacy management"
```

**Diagram sources**
- [app/Models/Employee.php:10-103](file://app/Models/Employee.php#L10-L103)
- [app/Models/User.php:10-48](file://app/Models/User.php#L10-L48)
- [app/Models/DeductionType.php:7-33](file://app/Models/DeductionType.php#L7-L33)
- [app/Models/EmployeeDeduction.php:8-59](file://app/Models/EmployeeDeduction.php#L8-L59)
- [app/Http/Controllers/PayrollController.php:11-124](file://app/Http/Controllers/PayrollController.php#L11-L124)
- [app/Http/Controllers/EmployeeController.php:12-118](file://app/Http/Controllers/EmployeeController.php#L12-L118)
- [app/Http/Controllers/ManageEmployeeController.php:14-86](file://app/Http/Controllers/ManageEmployeeController.php#L14-L86)
- [app/Http/Controllers/EmployeeManage.php:11-42](file://app/Http/Controllers/EmployeeManage.php#L11-L42)

**Section sources**
- [app/Models/Employee.php:10-103](file://app/Models/Employee.php#L10-L103)
- [app/Models/User.php:10-48](file://app/Models/User.php#L10-L48)
- [app/Models/DeductionType.php:7-33](file://app/Models/DeductionType.php#L7-L33)
- [app/Models/EmployeeDeduction.php:8-59](file://app/Models/EmployeeDeduction.php#L8-L59)
- [app/Http/Controllers/PayrollController.php:11-124](file://app/Http/Controllers/PayrollController.php#L11-L124)
- [app/Http/Controllers/EmployeeController.php:12-118](file://app/Http/Controllers/EmployeeController.php#L12-L118)
- [app/Http/Controllers/ManageEmployeeController.php:14-86](file://app/Http/Controllers/ManageEmployeeController.php#L14-L86)
- [app/Http/Controllers/EmployeeManage.php:11-42](file://app/Http/Controllers/EmployeeManage.php#L11-L42)

### Controller Organization and Responsibilities
- PayrollController: Implements index and show actions to compute gross pay, total deductions, and net pay, and to present employee payroll history.
- EmployeeController: Implements index, store, show, and update actions with validation and photo upload handling.
- **Updated** ManageEmployeeController: Comprehensive employee management with advanced data loading, deduction creation/update, and validation.
- **Updated** EmployeeManage: Legacy controller with basic employee viewing capabilities.

**Updated** The ManageEmployeeController now serves as the primary employee management interface, handling complex data loading with eager relationships and providing deduction management functionality.

```mermaid
sequenceDiagram
participant Client as "Browser"
participant Router as "Routes/web.php"
participant Ctrl as "ManageEmployeeController@index"
participant Emp as "Employee Model"
participant DedType as "DeductionType Model"
participant View as "Inertia Render"
Client->>Router : GET /manage/employees/{employee}
Router->>Ctrl : Dispatch to index
Ctrl->>Emp : Load with office, employmentStatus, latestSalary, latestPera, latestRata, salaries, peras, ratas, deductions
Emp-->>Ctrl : Employee with loaded relations
Ctrl->>DedType : Get active deduction types
DedType-->>Ctrl : Collection of active deduction types
Ctrl->>View : Inertia : : render("Employees/Manage/Manage", data)
View-->>Client : HTML payload with comprehensive employee data
```

**Diagram sources**
- [routes/web.php:77-81](file://routes/web.php#L77-L81)
- [app/Http/Controllers/ManageEmployeeController.php:16-50](file://app/Http/Controllers/ManageEmployeeController.php#L16-L50)
- [app/Models/Employee.php:46-64](file://app/Models/Employee.php#L46-L64)
- [app/Models/DeductionType.php:28-31](file://app/Models/DeductionType.php#L28-L31)

**Section sources**
- [routes/web.php:77-81](file://routes/web.php#L77-L81)
- [app/Http/Controllers/ManageEmployeeController.php:16-50](file://app/Http/Controllers/ManageEmployeeController.php#L16-L50)
- [app/Http/Controllers/EmployeeManage.php:13-40](file://app/Http/Controllers/EmployeeManage.php#L13-L40)

### Middleware Stack Configuration
- Global web middleware includes HandleInertiaRequests and asset preloading header middleware.
- Route groups apply auth middleware around payroll, settings, and CRUD endpoints.

```mermaid
flowchart TD
Start(["HTTP Request"]) --> Boot["Bootstrap app.php"]
Boot --> MWGlobal["Apply global web middleware"]
MWGlobal --> MWGroup["Apply group middleware (auth)"]
MWGroup --> Routes["Match route in routes/web.php"]
Routes --> Controller["Dispatch to Controller action"]
Controller --> Model["Eloquent model access"]
Model --> Response["Inertia response"]
Response --> End(["HTTP Response"])
```

**Diagram sources**
- [bootstrap/app.php:15-20](file://bootstrap/app.php#L15-L20)
- [routes/web.php:22-106](file://routes/web.php#L22-L106)
- [app/Http/Middleware/HandleInertiaRequests.php:9-54](file://app/Http/Middleware/HandleInertiaRequests.php#L9-L54)

**Section sources**
- [bootstrap/app.php:15-20](file://bootstrap/app.php#L15-L20)
- [routes/web.php:22-106](file://routes/web.php#L22-L106)
- [app/Http/Middleware/HandleInertiaRequests.php:9-54](file://app/Http/Middleware/HandleInertiaRequests.php#L9-L54)

### Service Provider Registration
- AppServiceProvider is registered during bootstrap and can be extended for binding interfaces, singletons, and cross-cutting concerns.

**Section sources**
- [bootstrap/providers.php:3-5](file://bootstrap/providers.php#L3-L5)
- [app/Providers/AppServiceProvider.php:7-24](file://app/Providers/AppServiceProvider.php#L7-L24)

### Application Bootstrapping and Request Lifecycle
- public/index.php captures the request and delegates to the Application instance created by bootstrap/app.php.
- The Application configures routing, middleware, and exceptions, then handles the request.

```mermaid
sequenceDiagram
participant Entry as "public/index.php"
participant Boot as "bootstrap/app.php"
participant Kernel as "Application"
participant Router as "routes/web.php"
participant Ctrl as "Controller"
participant Model as "Eloquent Model"
Entry->>Boot : require bootstrap/app.php
Boot->>Kernel : Application : : configure()->create()
Kernel->>Router : Load routes
Kernel->>Ctrl : Dispatch request
Ctrl->>Model : Query/Eloquent operations
Model-->>Ctrl : Results
Ctrl-->>Kernel : Inertia response
Kernel-->>Entry : HTTP response
```

**Diagram sources**
- [public/index.php:15-17](file://public/index.php#L15-L17)
- [bootstrap/app.php:9-23](file://bootstrap/app.php#L9-L23)
- [routes/web.php:1-110](file://routes/web.php#L1-L110)
- [app/Http/Controllers/PayrollController.php:13-81](file://app/Http/Controllers/PayrollController.php#L13-L81)

**Section sources**
- [public/index.php:15-17](file://public/index.php#L15-L17)
- [bootstrap/app.php:9-23](file://bootstrap/app.php#L9-L23)

### Dependency Injection Container Usage
- Controllers receive Request instances via method signature type hints.
- Models are resolved by Eloquent relationship methods and query builders.
- Service providers bind and register application services.

**Section sources**
- [app/Http/Controllers/PayrollController.php:13-81](file://app/Http/Controllers/PayrollController.php#L13-L81)
- [app/Http/Controllers/EmployeeController.php:45-118](file://app/Http/Controllers/EmployeeController.php#L45-L118)
- [app/Http/Controllers/ManageEmployeeController.php:16-86](file://app/Http/Controllers/ManageEmployeeController.php#L16-L86)
- [app/Models/Employee.php:46-64](file://app/Models/Employee.php#L46-L64)
- [app/Providers/AppServiceProvider.php:12-23](file://app/Providers/AppServiceProvider.php#L12-L23)

### Configuration Management
- config/app.php centralizes application metadata, locale, encryption, and maintenance settings.
- config/auth.php defines guards, providers, and password reset policies.

**Section sources**
- [config/app.php:3-126](file://config/app.php#L3-L126)
- [config/auth.php:3-115](file://config/auth.php#L3-L115)

### Routing Architecture and Route Model Binding
- Routes are grouped under auth middleware and prefixed for payroll, salaries, PERA, RATA, deduction types, employee deductions, and settings.
- Route model binding is leveraged in controllers (e.g., PayrollController@show receives Employee model by ID).
- **Updated** New manage employee routes provide comprehensive employee management endpoints.

**Updated** The routing architecture now includes dedicated endpoints for employee management with advanced data loading and deduction management capabilities.

```mermaid
flowchart TD
RStart["Route match in routes/web.php"] --> RB["Route model binding resolves Employee"]
RB --> CtrlCall["Controller action called"]
CtrlCall --> Qry["Eager load relations and filters"]
Qry --> Deduction["Process deductions if applicable"]
Deduction --> Resp["Inertia render"]
Resp --> REnd["Response"]
```

**Diagram sources**
- [routes/web.php:77-81](file://routes/web.php#L77-L81)
- [app/Http/Controllers/ManageEmployeeController.php:82-84](file://app/Http/Controllers/ManageEmployeeController.php#L82-L84)

**Section sources**
- [routes/web.php:77-81](file://routes/web.php#L77-L81)
- [app/Http/Controllers/ManageEmployeeController.php:82-84](file://app/Http/Controllers/ManageEmployeeController.php#L82-L84)

### Middleware Pipeline, CORS, and Security
- Web middleware stack includes HandleInertiaRequests and asset preloading headers.
- Security is enforced via the auth middleware applied to protected routes.
- CORS handling is not explicitly configured in the provided files; consider adding a dedicated CORS middleware if cross-origin requests are required.

**Section sources**
- [bootstrap/app.php:15-20](file://bootstrap/app.php#L15-L20)
- [routes/web.php:22-106](file://routes/web.php#L22-L106)

### Service Layer Architecture and Repository Pattern
- Current implementation uses Eloquent models directly within controllers, which is acceptable for small to medium systems.
- To evolve toward a repository pattern:
  - Define interfaces for data access (e.g., EmployeeRepositoryInterface).
  - Implement repositories (e.g., EloquentEmployeeRepository) that encapsulate Eloquent queries.
  - Bind interfaces to implementations in a service provider.
  - Inject repository interfaces into controllers instead of models.

Benefits:
- Decouples controllers from Eloquent specifics.
- Enables mocking for testing.
- Centralizes query logic and reuse.

[No sources needed since this section provides general guidance]

### Data Access Layers
- Eloquent models encapsulate persistence and relationships.
- Migrations define schema and constraints (e.g., unique composite key for employee deductions).
- **Updated** EmployeeDeduction model provides comprehensive deduction tracking with created_by audit trail.

**Updated** The data access layer now includes sophisticated deduction management with validation, batch processing, and audit capabilities.

```mermaid
erDiagram
USERS {
int id PK
string name
string email
string password
}
EMPLOYEES {
int id PK
string first_name
string last_name
boolean is_rata_eligible
int employment_status_id FK
int office_id FK
int created_by FK
string image_path
}
DEDUCTION_TYPES {
int id PK
string name
string code
string description
boolean is_active
}
EMPLOYEE_DEDUCTIONS {
int id PK
int employee_id FK
int deduction_type_id FK
decimal amount
tinyint pay_period_month
smallint pay_period_year
text notes
int created_by FK
}
USERS ||--o{ EMPLOYEES : "created_by"
EMPLOYEES ||--o{ EMPLOYEE_DEDUCTIONS : "employee_id"
DEDUCTION_TYPES ||--o{ EMPLOYEE_DEDUCTIONS : "deduction_type_id"
USERS ||--o{ EMPLOYEE_DEDUCTIONS : "created_by"
```

**Diagram sources**
- [app/Models/User.php:10-48](file://app/Models/User.php#L10-L48)
- [app/Models/Employee.php:10-103](file://app/Models/Employee.php#L10-L103)
- [app/Models/DeductionType.php:7-33](file://app/Models/DeductionType.php#L7-L33)
- [app/Models/EmployeeDeduction.php:8-59](file://app/Models/EmployeeDeduction.php#L8-L59)
- [database/migrations/2026_03_22_115112_create_employee_deductions_table.php:14-27](file://database/migrations/2026_03_22_115112_create_employee_deductions_table.php#L14-L27)

**Section sources**
- [app/Models/User.php:10-48](file://app/Models/User.php#L10-L48)
- [app/Models/Employee.php:10-103](file://app/Models/Employee.php#L10-L103)
- [app/Models/DeductionType.php:7-33](file://app/Models/DeductionType.php#L7-L33)
- [app/Models/EmployeeDeduction.php:8-59](file://app/Models/EmployeeDeduction.php#L8-L59)
- [database/migrations/2026_03_22_115112_create_employee_deductions_table.php:14-27](file://database/migrations/2026_03_22_115112_create_employee_deductions_table.php#L14-L27)

### Namespace Organization and Autoloading Strategy
- PSR-4 autoload configuration maps App, Database\Factories, Database\Seeders, and Tests namespaces to their respective directories.
- Controllers, Models, Middleware, and Providers follow the App namespace hierarchy.

**Section sources**
- [composer.json:27-38](file://composer.json#L27-L38)

### Frontend Integration and User Interface
- **Updated** The employee management interface consists of three main components: Manage.tsx (main page), Settings.tsx (employee information editing), and Compensation.tsx (compensation management).
- **Updated** The interface supports tabbed navigation with Overview, Compensation, Reports, and Settings sections.
- **Updated** Advanced features include photo upload with preview, real-time form validation, and comprehensive employee data visualization.

**Updated** The frontend components work seamlessly with the backend controllers to provide a comprehensive employee management experience with real-time data loading and validation.

**Section sources**
- [resources/js/pages/Employees/Manage/Manage.tsx:27-120](file://resources/js/pages/Employees/Manage/Manage.tsx#L27-L120)
- [resources/js/pages/Employees/Manage/Settings.tsx:21-265](file://resources/js/pages/Employees/Manage/Settings.tsx#L21-L265)
- [resources/js/pages/Employees/Manage/Compensation.tsx:13-42](file://resources/js/pages/Employees/Manage/Compensation.tsx#L13-L42)

## Dependency Analysis
The following diagram highlights key dependencies among major components:

```mermaid
graph LR
PUB["public/index.php"] --> APP["bootstrap/app.php"]
APP --> WEB["routes/web.php"]
WEB --> PC["PayrollController"]
WEB --> EC["EmployeeController"]
WEB --> MEC["ManageEmployeeController"]
WEB --> EMC["EmployeeManage"]
PC --> EM["Employee Model"]
EC --> EM
MEC --> EM
EMC --> EM
EM --> UM["User Model"]
MEC --> DT["DeductionType Model"]
MEC --> ED["EmployeeDeduction Model"]
APP --> CONF1["config/app.php"]
APP --> CONF2["config/auth.php"]
APP --> SP["AppServiceProvider"]
APP --> MID["HandleInertiaRequests"]
```

**Diagram sources**
- [public/index.php:15-17](file://public/index.php#L15-L17)
- [bootstrap/app.php:9-23](file://bootstrap/app.php#L9-L23)
- [routes/web.php:1-110](file://routes/web.php#L1-L110)
- [app/Http/Controllers/PayrollController.php:11-124](file://app/Http/Controllers/PayrollController.php#L11-L124)
- [app/Http/Controllers/EmployeeController.php:12-118](file://app/Http/Controllers/EmployeeController.php#L12-L118)
- [app/Http/Controllers/ManageEmployeeController.php:14-86](file://app/Http/Controllers/ManageEmployeeController.php#L14-L86)
- [app/Http/Controllers/EmployeeManage.php:11-42](file://app/Http/Controllers/EmployeeManage.php#L11-L42)
- [app/Models/Employee.php:10-103](file://app/Models/Employee.php#L10-L103)
- [app/Models/User.php:10-48](file://app/Models/User.php#L10-L48)
- [app/Models/DeductionType.php:7-33](file://app/Models/DeductionType.php#L7-L33)
- [app/Models/EmployeeDeduction.php:8-59](file://app/Models/EmployeeDeduction.php#L8-L59)
- [config/app.php:3-126](file://config/app.php#L3-L126)
- [config/auth.php:3-115](file://config/auth.php#L3-L115)
- [app/Providers/AppServiceProvider.php:7-24](file://app/Providers/AppServiceProvider.php#L7-L24)
- [app/Http/Middleware/HandleInertiaRequests.php:9-54](file://app/Http/Middleware/HandleInertiaRequests.php#L9-L54)

**Section sources**
- [routes/web.php:1-110](file://routes/web.php#L1-L110)
- [app/Http/Controllers/PayrollController.php:11-124](file://app/Http/Controllers/PayrollController.php#L11-L124)
- [app/Http/Controllers/EmployeeController.php:12-118](file://app/Http/Controllers/EmployeeController.php#L12-L118)
- [app/Http/Controllers/ManageEmployeeController.php:14-86](file://app/Http/Controllers/ManageEmployeeController.php#L14-L86)
- [app/Http/Controllers/EmployeeManage.php:11-42](file://app/Http/Controllers/EmployeeManage.php#L11-L42)
- [app/Models/Employee.php:10-103](file://app/Models/Employee.php#L10-L103)
- [app/Models/User.php:10-48](file://app/Models/User.php#L10-L48)
- [app/Models/DeductionType.php:7-33](file://app/Models/DeductionType.php#L7-L33)
- [app/Models/EmployeeDeduction.php:8-59](file://app/Models/EmployeeDeduction.php#L8-L59)
- [bootstrap/app.php:9-23](file://bootstrap/app.php#L9-L23)
- [config/app.php:3-126](file://config/app.php#L3-L126)
- [config/auth.php:3-115](file://config/auth.php#L3-L115)
- [app/Providers/AppServiceProvider.php:7-24](file://app/Providers/AppServiceProvider.php#L7-L24)
- [app/Http/Middleware/HandleInertiaRequests.php:9-54](file://app/Http/Middleware/HandleInertiaRequests.php#L9-L54)

## Performance Considerations
- Use eager loading (with) to avoid N+1 queries in controllers.
- Apply pagination for large datasets (already used in PayrollController and EmployeeController).
- **Updated** The ManageEmployeeController uses optimized eager loading with specific relationship ordering for better performance.
- **Updated** Deduction processing uses batch operations with updateOrCreate for efficient database writes.
- Minimize heavy computations in controllers; move to dedicated services or repositories.
- Leverage database indexes on frequently filtered columns (e.g., office_id, effective_date).
- Consider caching computed aggregates if appropriate for payroll summaries.

**Updated** Performance optimizations in the new ManageEmployeeController include selective eager loading, optimized relationship queries, and efficient deduction batch processing.

## Troubleshooting Guide
- Authentication failures: Verify guards and providers in config/auth.php and ensure auth middleware is applied to protected routes.
- Inertia rendering issues: Confirm HandleInertiaRequests root view and shared data configuration.
- Middleware ordering: Ensure web middleware order aligns with intended request processing.
- Model binding errors: Confirm route model binding keys match controller parameters.
- **Updated** Deduction validation errors: Check the storeDeduction method validation rules and error handling.
- **Updated** Employee management interface issues: Verify frontend components are properly integrated with backend controllers.

**Section sources**
- [config/auth.php:38-72](file://config/auth.php#L38-L72)
- [routes/web.php:22-106](file://routes/web.php#L22-L106)
- [app/Http/Middleware/HandleInertiaRequests.php:18-53](file://app/Http/Middleware/HandleInertiaRequests.php#L18-L53)
- [app/Http/Controllers/ManageEmployeeController.php:54-84](file://app/Http/Controllers/ManageEmployeeController.php#L54-L84)

## Conclusion
This Laravel payroll system demonstrates a clean MVC implementation with Inertia.js for a modern frontend experience. The bootstrapping process, middleware stack, and routing are configured to support authenticated, paginated, and relation-heavy payroll views. 

**Updated** The introduction of the ManageEmployeeController significantly enhances the system's capabilities by providing comprehensive employee management with advanced data loading, deduction management, and validation. The controller implements sophisticated relationship loading, batch deduction processing, and comprehensive validation rules, making it a powerful tool for HR and payroll administration.

While the current design uses Eloquent directly in controllers, adopting a repository pattern and service layer would further improve testability and maintainability. The new controller architecture provides a solid foundation for future enhancements while maintaining the system's performance and scalability. Configuration is environment-driven and centralized, supporting secure and flexible deployments. Following the outlined best practices will help scale the system while preserving clarity and performance.