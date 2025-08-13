<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\File;
use App\Models\BorrowingRecord;
use App\Models\Location;
use App\Models\User;
use App\Models\ActivityLog;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('permission:view_reports');
    }

    public function index()
    {
        $stats = [
            'total_files' => File::count(),
            'active_files' => File::whereIn('status', ['tersedia', 'dipinjam'])->count(),
            'borrowed_files' => File::where('status', 'dipinjam')->count(),
            'overdue_files' => BorrowingRecord::overdue()->count(),
            'total_users' => User::where('is_active', true)->count(),
        ];

        $recent_activity_count = ActivityLog::where('created_at', '>=', now()->subDays(30))->count();

        return view('reports.index', compact('stats', 'recent_activity_count'));
    }

    public function activeFiles(Request $request)
    {
        $query = File::with(['location', 'creator'])
            ->whereIn('status', ['tersedia', 'dipinjam'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('document_type')) {
            $query->where('document_type', $request->document_type);
        }

        if ($request->filled('year')) {
            $query->where('document_year', $request->year);
        }

        $files = $query->paginate(50);
        $departments = File::distinct()->pluck('department')->sort();
        $years = File::distinct()->pluck('document_year')->sort()->reverse();

        return view('reports.active-files', compact('files', 'departments', 'years'));
    }

    public function borrowedFiles(Request $request)
    {
        $query = BorrowingRecord::with(['file', 'borrower', 'approver'])
            ->active()
            ->orderBy('borrowed_date', 'desc');

        if ($request->filled('borrower_id')) {
            $query->where('borrower_id', $request->borrower_id);
        }

        if ($request->filled('department')) {
            $query->whereHas('file', function ($q) use ($request) {
                $q->where('department', $request->department);
            });
        }

        if ($request->filled('overdue_only')) {
            $query->where('due_date', '<', now()->toDateString());
        }

        $borrowings = $query->paginate(50);
        $borrowers = User::where('is_active', true)->orderBy('name')->get();
        $departments = File::distinct()->pluck('department')->sort();

        return view('reports.borrowed-files', compact('borrowings', 'borrowers', 'departments'));
    }

    public function departmentFiles(Request $request, $department)
    {
        $files = File::with(['location', 'creator', 'currentBorrowing.borrower'])
            ->where('department', $department)
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return view('reports.department-files', compact('files', 'department'));
    }

    public function activityLog(Request $request)
    {
        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $activities = $query->paginate(50);
        $users = User::where('is_active', true)->orderBy('name')->get();

        $actions = [
            'login' => 'Log Masuk',
            'logout' => 'Log Keluar',
            'file_created' => 'Fail Dicipta',
            'file_updated' => 'Fail Dikemaskini',
            'file_deleted' => 'Fail Dipadam',
            'file_borrowed' => 'Fail Dipinjam',
            'file_returned' => 'Fail Dikembalikan',
            'location_created' => 'Lokasi Dicipta',
            'location_updated' => 'Lokasi Dikemaskini',
            'user_created' => 'Pengguna Dicipta',
        ];

        return view('reports.activity-log', compact('activities', 'users', 'actions'));
    }

    public function statistics()
    {
        $filesByDepartment = File::selectRaw('department, count(*) as count')
            ->groupBy('department')
            ->pluck('count', 'department');

        $filesByType = File::selectRaw('document_type, count(*) as count')
            ->groupBy('document_type')
            ->pluck('count', 'document_type');

        $filesByStatus = File::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $monthlyStats = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $monthlyStats[] = [
                'month' => $date->format('M Y'),
                'files_created' => File::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)->count(),
                'files_borrowed' => BorrowingRecord::whereYear('borrowed_date', $date->year)
                    ->whereMonth('borrowed_date', $date->month)->count(),
            ];
        }

        return view('reports.statistics', compact(
            'filesByDepartment',
            'filesByType', 
            'filesByStatus',
            'monthlyStats'
        ));
    }

    public function exportFilesPdf(Request $request)
    {
        $query = File::with(['location', 'creator']);

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('year')) {
            $query->where('document_year', $request->year);
        }

        $files = $query->orderBy('created_at', 'desc')->get();

        $pdf = Pdf::loadView('reports.pdf.files', compact('files'));
        
        return $pdf->download('laporan-fail-' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportBorrowingsPdf(Request $request)
    {
        $query = BorrowingRecord::with(['file', 'borrower', 'approver']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('borrowed_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('borrowed_date', '<=', $request->date_to);
        }

        $borrowings = $query->orderBy('borrowed_date', 'desc')->get();

        $pdf = Pdf::loadView('reports.pdf.borrowings', compact('borrowings'));
        
        return $pdf->download('laporan-peminjaman-' . now()->format('Y-m-d') . '.pdf');
    }
}