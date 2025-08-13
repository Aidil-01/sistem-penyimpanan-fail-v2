@extends('layouts.app')

@section('title', 'Laporan - Sistem Penyimpanan Fail Tongod')

@section('content')
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2 fw-bold text-primary">
        <i class="fas fa-chart-bar me-2"></i>Laporan
    </h1>
</div>

<!-- Statistics Overview -->
<div class="row mb-4">
    <div class="col-md-6 col-xl-3 mb-4">
        <div class="card stat-card">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-uppercase mb-1">
                            Jumlah Fail
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-white">{{ number_format($stats['total_files']) }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-folder fa-2x text-white opacity-75"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-6 col-xl-3 mb-4">
        <div class="card stat-card-secondary">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-uppercase mb-1">
                            Fail Aktif
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-white">{{ number_format($stats['active_files']) }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-check-circle fa-2x text-white opacity-75"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-6 col-xl-3 mb-4">
        <div class="card stat-card-warning">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-uppercase mb-1">
                            Fail Dipinjam
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-white">{{ number_format($stats['borrowed_files']) }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-handshake fa-2x text-white opacity-75"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-6 col-xl-3 mb-4">
        <div class="card stat-card-danger">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-uppercase mb-1">
                            Overdue
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-white">{{ number_format($stats['overdue_files']) }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-exclamation-triangle fa-2x text-white opacity-75"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Report Categories -->
<div class="row">
    <div class="col-lg-4 mb-4">
        <div class="card h-100">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-folder-open me-2"></i>Laporan Fail
                </h6>
            </div>
            <div class="card-body">
                <p class="card-text text-muted">Laporan mengenai status dan pengurusan fail dalam sistem.</p>
                <div class="d-grid gap-2">
                    <a href="{{ route('reports.active-files') }}" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-file me-1"></i>Fail Aktif/Tidak Aktif
                    </a>
                    <a href="{{ route('reports.borrowed-files') }}" class="btn btn-outline-warning btn-sm">
                        <i class="fas fa-handshake me-1"></i>Fail Dipinjam
                    </a>
                    <a href="{{ route('reports.statistics') }}" class="btn btn-outline-info btn-sm">
                        <i class="fas fa-chart-pie me-1"></i>Statistik Fail
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="col-lg-4 mb-4">
        <div class="card h-100">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-users me-2"></i>Laporan Pengguna
                </h6>
            </div>
            <div class="card-body">
                <p class="card-text text-muted">Laporan aktiviti dan prestasi pengguna sistem.</p>
                <div class="d-grid gap-2">
                    <a href="{{ route('reports.activity-log') }}" class="btn btn-outline-success btn-sm">
                        <i class="fas fa-history me-1"></i>Log Aktiviti
                    </a>
                    <div class="text-muted small">
                        Jumlah Pengguna Aktif: {{ number_format($stats['total_users']) }}
                    </div>
                    <div class="text-muted small">
                        Aktiviti 30 Hari Lepas: {{ number_format($recent_activity_count) }}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-lg-4 mb-4">
        <div class="card h-100">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-download me-2"></i>Export Data
                </h6>
            </div>
            <div class="card-body">
                <p class="card-text text-muted">Muat turun laporan dalam format PDF atau Excel.</p>
                <div class="d-grid gap-2">
                    <a href="{{ route('export.files.pdf') }}" class="btn btn-outline-danger btn-sm">
                        <i class="fas fa-file-pdf me-1"></i>Export Fail (PDF)
                    </a>
                    <a href="{{ route('export.borrowings.pdf') }}" class="btn btn-outline-danger btn-sm">
                        <i class="fas fa-file-pdf me-1"></i>Export Peminjaman (PDF)
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Quick Stats by Department -->
<div class="row mt-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-building me-2"></i>Laporan Mengikut Jabatan
                </h6>
            </div>
            <div class="card-body">
                <div class="row">
                    @php
                        $departments = \App\Models\File::selectRaw('department, count(*) as count')
                            ->groupBy('department')
                            ->orderBy('count', 'desc')
                            ->get();
                    @endphp
                    
                    @foreach($departments as $dept)
                    <div class="col-md-3 mb-3">
                        <div class="text-center">
                            <div class="h4 text-primary mb-1">{{ $dept->count }}</div>
                            <div class="text-muted small">{{ $dept->department }}</div>
                            <a href="{{ route('reports.department', $dept->department) }}" class="btn btn-outline-primary btn-sm mt-2">
                                Lihat Detail
                            </a>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>
    </div>
</div>
@endsection