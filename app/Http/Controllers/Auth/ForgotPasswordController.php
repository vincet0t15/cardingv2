<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ForgotPasswordController extends Controller
{
    /**
     * Show the forgot password page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function sendResetLink(Request $request): RedirectResponse
    {
        $request->validate([
            'username' => 'required|string|exists:users,username',
        ]);

        // Delete existing tokens for this user
        DB::table('password_reset_tokens')->where('email', $request->username)->delete();

        // Create a new token
        $token = Str::random(64);

        DB::table('password_reset_tokens')->insert([
            'email' => $request->username,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Store token in session for display (in production, you'd email this)
        $request->session()->put('reset_token', $token);
        $request->session()->put('reset_username', $request->username);

        // Redirect to reset password page with token and username
        return redirect()->route('password.reset', [
            'token' => $token,
            'username' => $request->username,
        ]);
    }

    /**
     * Show the reset password page.
     */
    public function showResetForm(Request $request): Response|RedirectResponse
    {
        // Get token and username from URL parameters or session
        $token = $request->query('token') ?? $request->session()->get('reset_token');
        $username = $request->query('username') ?? $request->session()->get('reset_username');

        if (!$username || !$token) {
            return $this->redirectWithError('Please request a password reset first.');
        }

        return Inertia::render('auth/reset-password', [
            'username' => $username,
            'token' => $token,
        ]);
    }

    /**
     * Helper method to redirect with error.
     */
    private function redirectWithError(string $message): RedirectResponse
    {
        return redirect()->route('password.request')
            ->withErrors(['username' => $message]);
    }

    /**
     * Handle an incoming new password request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function resetPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'username' => 'required|string',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Find the user
        $user = User::where('username', $request->username)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'username' => ['User not found.'],
            ]);
        }

        // Verify token
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->username)
            ->first();

        if (!$resetRecord || !Hash::check($request->token, $resetRecord->token)) {
            throw ValidationException::withMessages([
                'token' => ['Invalid reset token.'],
            ]);
        }

        // Check if token is expired (60 minutes)
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            throw ValidationException::withMessages([
                'token' => ['Reset token has expired.'],
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Delete the token
        DB::table('password_reset_tokens')->where('email', $request->username)->delete();

        // Clear session
        $request->session()->forget(['reset_token', 'reset_username']);

        event(new PasswordReset($user));

        return redirect()->route('login')
            ->with('status', 'Your password has been reset successfully. You can now log in.');
    }
}
