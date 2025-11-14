"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowLeft } from "lucide-react";
import { set } from "date-fns";

export default function EmployeesPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [editing, setEditing] = useState(null); // id of employee being edited
    const [editForm, setEditForm] = useState({});
    const [deleting, setDeleting] = useState(null); // id of employee being deleted
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }
        const role = user.user_metadata?.role || "employee";
        if (role !== "admin") {
            router.push("/employee");
            return;
        }
        setUser(user);
        await fetchEmployees();
        setLoading(false);
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/employees");
            const json = await res.json();
            setEmployees(json.employees || []);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        }
    };

    const startEdit = (emp) => {
        setEditing(emp.id);
        setEditForm({
            name: emp.name,
            email: emp.email,
            phone: emp.phone || "",
            department_id: emp.department_id || "",
            is_active: emp.is_active,
            role: emp.role,
        });
    };

    const cancelEdit = () => {
        setEditing(null);
        setEditForm({});
    };

    const saveEdit = async (id) => {
        try {
            const res = await fetch(`/api/employees/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Gagal update pegawai");
            toast({
                title: "Berhasil",
                description: "Data pegawai diperbarui.",
            });
            setEditing(null);
            setEditForm({});
            await fetchEmployees();
        } catch (err) {
            toast({
                title: "Gagal",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    const doDelete = async (id) => {
        try {
            const res = await fetch(`/api/employees/${id}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (!res.ok)
                throw new Error(json?.error || "Gagal menghapus pegawai");
            toast({ title: "Berhasil", description: "Pegawai dihapus." });
            setDeleting(null);
            await fetchEmployees();
        } catch (err) {
            toast({
                title: "Gagal",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar user={user} />
            <div className="container mx-auto px-4 py-8 max-w-8xl">
                <div>
                    <Button
                        onClick={() => router.push("/admin")}
                        variant="ghost"
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
                <Card className="mx-auto">
                    <CardHeader>
                        <CardTitle>Daftar Pegawai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex">
                            <Button
                                onClick={() => router.push("/admin/add-employee")}
                                size="lg"
                                className="h-10 mb-4 ml-auto"
                            >
                                <Users className="mr-2 h-6 w-6" />
                                Add Employee
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border text-sm">
                                <thead>
                                    <tr className="bg-muted">
                                        <th className="p-2 border">Nama</th>
                                        <th className="p-2 border">Email</th>
                                        <th className="p-2 border">No. HP</th>
                                        <th className="p-2 border">Role</th>
                                        <th className="p-2 border">Status</th>
                                        <th className="p-2 border">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp) => (
                                        <tr
                                            key={emp.id}
                                            className={
                                                editing === emp.id
                                                    ? "bg-blue-50"
                                                    : ""
                                            }
                                        >
                                            <td className="p-2 border">
                                                {editing === emp.id ? (
                                                    <Input
                                                        value={editForm.name}
                                                        onChange={(e) =>
                                                            setEditForm(
                                                                (f) => ({
                                                                    ...f,
                                                                    name: e.target.value,
                                                                })
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    emp.name
                                                )}
                                            </td>
                                            <td className="p-2 border">
                                                {editing === emp.id ? (
                                                    <Input
                                                        value={editForm.email}
                                                        onChange={(e) =>
                                                            setEditForm(
                                                                (f) => ({
                                                                    ...f,
                                                                    email: e.target.value,
                                                                })
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    emp.email
                                                )}
                                            </td>
                                            <td className="p-2 border">
                                                {editing === emp.id ? (
                                                    <Input
                                                        value={editForm.phone}
                                                        onChange={(e) =>
                                                            setEditForm(
                                                                (f) => ({
                                                                    ...f,
                                                                    phone: e.target.value,
                                                                })
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    emp.phone || "-"
                                                )}
                                            </td>
                                            <td className="p-2 border">
                                                {editing === emp.id ? (
                                                    <select
                                                        value={editForm.role}
                                                        onChange={(e) =>
                                                            setEditForm(
                                                                (f) => ({
                                                                    ...f,
                                                                    role: e.target.value,
                                                                })
                                                            )
                                                        }
                                                        className="border rounded px-2 py-1"
                                                    >
                                                        <option value="employee">
                                                            employee
                                                        </option>
                                                        <option value="admin">
                                                            admin
                                                        </option>
                                                    </select>
                                                ) : (
                                                    emp.role
                                                )}
                                            </td>
                                            <td className="p-2 border">
                                                {editing === emp.id ? (
                                                    <select
                                                        value={editForm.is_active ? "active" : "inactive"}
                                                        onChange={(e) =>
                                                            setEditForm(
                                                                (f) => ({
                                                                    ...f,
                                                                    is_active: e.target.value === "active",
                                                                })
                                                            )
                                                        }
                                                        className="border rounded px-2 py-1"
                                                    >
                                                        <option value="active">
                                                            Aktif
                                                        </option>
                                                        <option value="inactive">
                                                            Nonaktif
                                                        </option>
                                                    </select>
                                                ) : emp.is_active ? (
                                                    "Aktif"
                                                ) : (
                                                    "Nonaktif"
                                                )}
                                            </td>
                                            <td className="p-2 border space-x-2">
                                                {editing === emp.id ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => saveEdit(emp.id)}
                                                            disabled={loading}
                                                        >
                                                            Simpan
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={cancelEdit}
                                                        >
                                                            Batal
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => startEdit(emp)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => setDeleting(emp.id)}
                                                        >
                                                            Hapus
                                                        </Button>
                                                        {deleting === emp.id && (
                                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                                                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                                                                    <h2 className="text-lg font-semibold mb-2">Hapus Pegawai?</h2>
                                                                    <p className="text-sm text-gray-600 mb-4">Apakah Anda yakin ingin menghapus pegawai ini? Tindakan ini tidak dapat dibatalkan.</p>
                                                                    <div className="flex justify-end space-x-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => setDeleting(null)}
                                                                        >
                                                                            Batal
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            onClick={() => doDelete(emp.id)}
                                                                        >
                                                                            Konfirmasi Hapus
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
