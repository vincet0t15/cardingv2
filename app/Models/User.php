<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /** List of role names that are considered "admin-level" */
    const ADMIN_ROLES = ['super admin', 'admin', 'vice-super admin'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'password',
        'is_active',
        'last_seen',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_seen' => 'datetime',
        ];
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class)
            ->withPivot('last_read_at')
            ->withTimestamps();
    }

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * Check if the user has any admin-level role.
     * Admin roles are defined in self::ADMIN_ROLES.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole(self::ADMIN_ROLES);
    }

    /**
     * Check if the user is linked to an employee record.
     */
    public function isEmployee(): bool
    {
        return $this->employee()->exists();
    }

    /**
     * Check if the user has ONLY the "employee" role (no admin, no hr, no finance).
     */
    public function isPureEmployee(): bool
    {
        $roleNames = $this->getRoleNames()->map(fn($role) => strtolower(trim($role)));

        return $roleNames->count() === 1 && $roleNames->contains('employee');
    }

    /**
     * Determine if this user should be routed to the Employee Portal
     * instead of the Admin Dashboard.
     *
     * Rules:
     * 1. Admin-level users → NEVER go to employee portal (even if linked)
     * 2. Pure employees (linked) → YES, employee portal
     * 3. Mixed non-admin roles (e.g., employee + hr) → YES, employee portal
     *    (since they're still linked as an employee)
     * 4. Not linked to any employee → NO, not employee portal
     */
    public function shouldUseEmployeePortal(): bool
    {
        // Admin users always see admin dashboard
        if ($this->isAdmin()) {
            return false;
        }

        // Must be linked to an employee record
        if (! $this->isEmployee()) {
            return false;
        }

        // Pure employee OR mixed non-admin roles → employee portal
        return true;
    }
}
