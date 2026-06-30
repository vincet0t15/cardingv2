<?php

namespace App\Http\Controllers;

use App\Ai\Tools\PayrollQueryTool;
use App\Models\AiSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Laravel\Ai\Models\Conversation;
use Laravel\Ai\Models\ConversationMessage;

class SmartAssistantController extends Controller
{
    public function index()
    {
        $conversations = Conversation::where('user_id', auth()->id())
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('Ai/Assistant', [
            'conversations' => $conversations,
            'settings' => $this->getSettings(),
        ]);
    }

    public function settings()
    {
        return Inertia::render('Ai/Settings', [
            'settings' => $this->getSettings(),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'api_key' => 'nullable|string',
            'api_url' => 'nullable|string',
            'model' => 'required|string',
            'enabled' => 'sometimes|boolean',
        ]);

        // Masked API key: if it's all asterisks, keep the old value
        $apiKey = $request->input('api_key');
        if ($apiKey && str_starts_with($apiKey, '***')) {
            $apiKey = AiSetting::getValue('api_key', '');
        }

        AiSetting::setValue('api_key', $apiKey ?? '');
        AiSetting::setValue('api_url', $request->input('api_url', 'https://opencode.ai/zen/v1'));
        AiSetting::setValue('model', $request->input('model', 'deepseek-v4-flash-free'));
        AiSetting::setValue('enabled', $request->boolean('enabled') ? 'true' : 'false');

        return redirect()->route('ai.settings')->with('success', 'AI Settings updated successfully!');
    }

    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|string|max:36',
        ]);

        // Check if AI is enabled
        if (AiSetting::getValue('enabled', 'true') !== 'true') {
            return response()->json([
                'reply' => '⚠️ AI Assistant is currently disabled. Go to AI Settings to enable it.',
                'conversation_id' => null,
            ], 403);
        }

        // Get settings from database
        $apiKey = AiSetting::getValue('api_key', '');
        $apiUrl = rtrim(AiSetting::getValue('api_url', 'https://opencode.ai/zen/v1'), '/');
        $model = AiSetting::getValue('model', 'deepseek-v4-flash-free');

        if (empty($apiKey)) {
            return response()->json([
                'reply' => '⚠️ No API key configured. Go to AI Settings to set up your API key.',
                'conversation_id' => null,
            ], 400);
        }

        $message = $request->input('message');
        $conversationId = $request->input('conversation_id');
        $user = auth()->user();

        // Create or find conversation
        if (! $conversationId) {
            $conversation = Conversation::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => $user->id,
                'title' => mb_substr($message, 0, 100),
            ]);
            $conversationId = $conversation->id;
        }

        // Get conversation history for context
        $historyMessages = ConversationMessage::where('conversation_id', $conversationId)
            ->latest()
            ->limit(10)
            ->get()
            ->reverse()
            ->map(fn ($msg) => [
                'role' => $msg->role,
                'content' => $msg->content,
            ])
            ->toArray();

        // Save user message
        ConversationMessage::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'conversation_id' => $conversationId,
            'user_id' => $user->id,
            'agent' => 'payroll-assistant',
            'role' => 'user',
            'content' => $message,
            'attachments' => '[]',
            'tool_calls' => '[]',
            'tool_results' => '[]',
            'usage' => '[]',
            'meta' => '[]',
        ]);

        // Build system prompt with tool descriptions
        $systemPrompt = [
            'role' => 'system',
            'content' => 'You are a payroll assistant for a Philippine government agency. Answer questions concisely and accurately. Format currency in PHP peso (₱). When asked "how much" refer to total amounts. When asked for comparisons or analysis, provide clear breakdowns. Be helpful and professional.

IMPORTANT: You have access to payroll data through a query tool. When the user asks about payroll data (salaries, claims, deductions, employees, etc.), respond with a tool call:
TOOL_CALL: query_name

Available queries:
- total_salaries: Total monthly salary expense
- total_pera: Total monthly PERA expense
- total_rata: Total monthly RATA expense
- total_compensation: Total compensation (salary + PERA + RATA)
- employee_count: Total number of employees
- office_count: Total number of offices
- total_claims: Total claims amount and count for current year
- total_deductions: Total deductions amount
- top_claimants: Top 5 employees by total claims
- top_travel_claims: Top 5 employees by travel claims
- claims_by_type: Claims breakdown by claim type
- employees_by_office: Employee count per office
- monthly_payroll_cost: Monthly payroll breakdown

When you need data, say ONLY: TOOL_CALL: query_name
I will execute it and return results for you to summarize.',
        ];

        $apiMessages = array_merge([$systemPrompt], $historyMessages, [
            ['role' => 'user', 'content' => $message],
        ]);

        try {
            $result = $this->callAi($apiKey, $apiUrl, $model, $apiMessages);

            if ($this->hasToolCall($result)) {
                $result = $this->executeToolCall($result, $apiKey, $apiUrl, $model, $apiMessages);
            }

            // Save assistant message
            ConversationMessage::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'conversation_id' => $conversationId,
                'user_id' => $user->id,
                'agent' => 'payroll-assistant',
                'role' => 'assistant',
                'content' => $result,
                'attachments' => '[]',
                'tool_calls' => '[]',
                'tool_results' => '[]',
                'usage' => '[]',
                'meta' => '[]',
            ]);

            // Update conversation timestamp
            $conversation = Conversation::find($conversationId);
            if ($conversation) {
                $conversation->touch();
            }

            return response()->json([
                'reply' => $result,
                'conversation_id' => $conversationId,
            ]);
        } catch (\Exception $e) {
            $error = $e->getMessage();
            $reply = '⚠️ Error: ' . $error;

            $this->saveAssistantMessage($conversationId, $user->id, $reply);

            return response()->json([
                'reply' => $reply,
                'conversation_id' => $conversationId,
            ], 500);
        }
    }

    public function history(Request $request, string $conversationId)
    {
        $messages = ConversationMessage::where('conversation_id', $conversationId)
            ->orderBy('created_at')
            ->get(['role', 'content', 'created_at']);

        return response()->json(['messages' => $messages]);
    }

    /**
     * Get AI settings from database.
     */
    private function getSettings(): array
    {
        return [
            'api_key' => AiSetting::getValue('api_key', ''),
            'api_url' => AiSetting::getValue('api_url', 'https://opencode.ai/zen/v1'),
            'model' => AiSetting::getValue('model', 'deepseek-v4-flash-free'),
            'enabled' => AiSetting::getValue('enabled', 'true'),
        ];
    }

    /**
     * Call the AI API with a chat completions request.
     */
    private function callAi(string $apiKey, string $apiUrl, string $model, array $messages): string
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post($apiUrl . '/chat/completions', [
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => 1024,
            'temperature' => 0.3,
        ]);

        if (! $response->successful()) {
            $body = $response->body();
            $status = $response->status();

            if (str_contains($body, 'CreditsError') || str_contains($body, 'payment')) {
                throw new \Exception('This model requires a payment method. Add billing at https://opencode.ai/workspace/billing');
            }

            throw new \Exception("API returned HTTP $status: " . substr($body, 0, 200));
        }

        $data = $response->json();
        return $data['choices'][0]['message']['content'] ?? '';
    }

    /**
     * Check if the response contains a tool call request.
     */
    private function hasToolCall(string $text): bool
    {
        return preg_match('/TOOL_CALL:\s*(\w+)/', $text) === 1;
    }

    /**
     * Execute a payroll query tool call and get AI summary.
     */
    private function executeToolCall(string $responseText, string $apiKey, string $apiUrl, string $model, array $messages): string
    {
        preg_match('/TOOL_CALL:\s*(\w+)/', $responseText, $matches);
        $queryName = $matches[1] ?? '';

        // Execute the query using the PayrollQueryTool
        $tool = new PayrollQueryTool();
        $result = $tool->handle(new \Laravel\Ai\Tools\Request(['query' => $queryName]));
        $result = trim((string) $result);

        // Send the result back to the AI for interpretation
        $toolMessages = array_merge($messages, [
            ['role' => 'assistant', 'content' => $responseText],
            ['role' => 'system', 'content' => "Here are the query results:\n\n$result\n\nPlease summarize these results in a clear, professional manner in Filipino or English as appropriate."],
        ]);

        try {
            return $this->callAi($apiKey, $apiUrl, $model, $toolMessages);
        } catch (\Exception $e) {
            return "Query results for $queryName:\n\n$result";
        }
    }

    /**
     * Save an assistant message to the database.
     */
    private function saveAssistantMessage(string $conversationId, int $userId, string $content): void
    {
        ConversationMessage::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'conversation_id' => $conversationId,
            'user_id' => $userId,
            'agent' => 'payroll-assistant',
            'role' => 'assistant',
            'content' => $content,
            'attachments' => '[]',
            'tool_calls' => '[]',
            'tool_results' => '[]',
            'usage' => '[]',
            'meta' => '[]',
        ]);
    }
}
