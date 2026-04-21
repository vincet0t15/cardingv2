<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Email verification is disabled for username-based auth.
     * Redirect to dashboard as already verified.
     */
    public function store(Request $request): RedirectResponse
    {
        return redirect()->intended(route('dashboard', absolute: false));
    }
}
