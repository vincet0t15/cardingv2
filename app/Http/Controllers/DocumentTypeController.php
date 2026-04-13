<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentTypeController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $documentTypes = DocumentType::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->with('createdBy')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('document-types/index', [
            'documentTypes' => $documentTypes,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:document_types,code',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        DocumentType::create($validated);

        return redirect()->back()->with('success', 'Document type created successfully');
    }

    public function update(Request $request, DocumentType $documentType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:document_types,code,'.$documentType->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $documentType->update($validated);

        return redirect()->back()->with('success', 'Document type updated successfully');
    }

    public function destroy(DocumentType $documentType)
    {
        $documentType->delete();

        return redirect()->back()->with('success', 'Document type deleted successfully');
    }
}
