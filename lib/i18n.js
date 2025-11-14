"use client"
// i18n.js
// Simple i18n context/provider for IDN/ENG
import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  id: {
    attendanceSystem: 'Sistem Absensi',
    dashboard: 'Dasbor',
    logout: 'Keluar',
    admin: 'Admin',
    loading: 'Memuat...',
    backToDashboard: 'Kembali ke Dasbor',
    employeeList: 'Daftar Pegawai',
    addEmployee: 'Tambah Pegawai',
    name: 'Nama',
    email: 'Email',
    phone: 'No. HP',
    role: 'Role',
    status: 'Status',
    action: 'Aksi',
    employee: 'pegawai',
    active: 'Aktif',
    inactive: 'Nonaktif',
    save: 'Simpan',
    cancel: 'Batal',
    edit: 'Edit',
    delete: 'Hapus',
    deleteEmployeeTitle: 'Hapus Pegawai?',
    deleteEmployeeDesc: 'Apakah Anda yakin ingin menghapus pegawai ini? Tindakan ini tidak dapat dibatalkan.',
    confirmDelete: 'Konfirmasi Hapus',
    success: 'Berhasil',
    error: 'Gagal',
    employeeUpdated: 'Data pegawai diperbarui.',
    employeeDeleted: 'Pegawai dihapus.',
    employeeUpdateFailed: 'Gagal update pegawai',
    employeeDeleteFailed: 'Gagal menghapus pegawai',
  },
  en: {
    attendanceSystem: 'Attendance System',
    dashboard: 'Dashboard',
    logout: 'Logout',
    admin: 'Admin',
    loading: 'Loading...',
    backToDashboard: 'Back to Dashboard',
    employeeList: 'Employee List',
    addEmployee: 'Add Employee',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    status: 'Status',
    action: 'Action',
    employee: 'employee',
    active: 'Active',
    inactive: 'Inactive',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    deleteEmployeeTitle: 'Delete Employee?',
    deleteEmployeeDesc: 'Are you sure you want to delete this employee? This action cannot be undone.',
    confirmDelete: 'Confirm Delete',
    success: 'Success',
    error: 'Error',
    employeeUpdated: 'Employee data updated.',
    employeeDeleted: 'Employee deleted.',
    employeeUpdateFailed: 'Failed to update employee',
    employeeDeleteFailed: 'Failed to delete employee',
  },
};

const I18nContext = createContext({
  lang: 'id',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('id');

  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('lang');
    if (stored && (stored === 'id' || stored === 'en')) setLang(stored);
  }, []);

  const setLangPersist = (l) => {
    setLang(l);
    if (typeof window !== 'undefined') localStorage.setItem('lang', l);
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <I18nContext.Provider value={{ lang, setLang: setLangPersist, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
