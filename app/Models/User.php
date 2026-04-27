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

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('super admin') || $this->hasRole('admin');
    }

    public function isEmployee(): bool
    {
        return $this->employee !== null;
    }

    public function isLinkedEmployee(): bool
    {
        return $this->employee !== null && $this->employee->user_id !== null;
    }
}
