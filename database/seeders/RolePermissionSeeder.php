<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User Management
            'manage_users',
            'view_users',
            'create_users',
            'edit_users',
            'delete_users',
            
            // File Management
            'manage_files',
            'view_files',
            'create_files',
            'edit_files',
            'delete_files',
            'download_files',
            
            // Location Management
            'manage_locations',
            'view_locations',
            'create_locations',
            'edit_locations',
            'delete_locations',
            
            // File Borrowing
            'borrow_files',
            'approve_borrowing',
            'return_files',
            'view_borrowing_history',
            
            // Reporting
            'view_reports',
            'export_reports',
            'view_analytics',
            
            // System Settings
            'manage_settings',
            'view_activity_logs',
            'backup_system',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions
        
        // Admin - Full access
        $adminRole = Role::create(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());
        
        // Pegawai Jabatan - Department staff with high privileges
        $pegawaiRole = Role::create(['name' => 'staff_jabatan']);
        $pegawaiRole->givePermissionTo([
            'view_users',
            'manage_files',
            'view_files',
            'create_files',
            'edit_files',
            'download_files',
            'view_locations',
            'create_locations',
            'edit_locations',
            'borrow_files',
            'approve_borrowing',
            'return_files',
            'view_borrowing_history',
            'view_reports',
            'export_reports',
            'view_analytics',
            'view_activity_logs',
        ]);
        
        // Pembantu Tadbir - Administrative assistant
        $pembantuRole = Role::create(['name' => 'staff_pembantu']);
        $pembantuRole->givePermissionTo([
            'view_files',
            'create_files',
            'edit_files',
            'download_files',
            'view_locations',
            'borrow_files',
            'return_files',
            'view_borrowing_history',
        ]);
        
        // Pengguna Lihat Sahaja - View only user
        $viewerRole = Role::create(['name' => 'user_view']);
        $viewerRole->givePermissionTo([
            'view_files',
            'download_files',
            'view_locations',
            'view_borrowing_history',
        ]);
    }
}