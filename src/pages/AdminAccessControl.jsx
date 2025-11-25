import React, { useEffect, useMemo, useState } from "react";
import { Shield, Key, Users, Plus, RefreshCw, Trash2, PencilLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Badge from "@/components/ui/Badge";
import StatsCard from "@/components/ui/StatsCard";
import IconActionButton from "@/components/ui/IconActionButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { iamService } from "@/services/iamService";
import Skeleton from "@/components/ui/skeleton";

const emptyRoleForm = { code: "", name: "", description: "" };
const emptyPermissionForm = { code: "", name: "" };

export default function AdminAccessControl() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");
  const [permissionsError, setPermissionsError] = useState("");

  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedRoleDetail, setSelectedRoleDetail] = useState(null);
  const [rolePermissionsLoading, setRolePermissionsLoading] = useState(false);
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState(new Set());
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");

  const [roleModal, setRoleModal] = useState({ open: false, mode: "create", role: null });
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [roleFormError, setRoleFormError] = useState("");
  const [roleFormSubmitting, setRoleFormSubmitting] = useState(false);
  const [roleFormLoading, setRoleFormLoading] = useState(false);

  const [permissionModal, setPermissionModal] = useState({ open: false, mode: "create", permission: null });
  const [permissionForm, setPermissionForm] = useState(emptyPermissionForm);
  const [permissionFormError, setPermissionFormError] = useState("");
  const [permissionFormSubmitting, setPermissionFormSubmitting] = useState(false);

  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [deletingPermissionId, setDeletingPermissionId] = useState(null);

  useEffect(() => {
    let active = true;
    const loadRoles = async () => {
      setRolesLoading(true);
      setRolesError("");
      try {
        const data = await iamService.getRoles();
        if (!active) return;
        setRoles(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) setRolesError(error?.message || "Không tải được danh sách role");
      } finally {
        if (active) setRolesLoading(false);
      }
    };
    loadRoles();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPermissions = async () => {
      setPermissionsLoading(true);
      setPermissionsError("");
      try {
        const data = await iamService.getPermissions();
        if (!active) return;
        setPermissions(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) setPermissionsError(error?.message || "Không tải được danh sách permission");
      } finally {
        if (active) setPermissionsLoading(false);
      }
    };
    loadPermissions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      handleSelectRole(roles[0].id);
      return;
    }
    if (selectedRoleId && !roles.find((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(null);
      setSelectedRoleDetail(null);
      setSelectedPermissionCodes(new Set());
    }
  }, [roles, selectedRoleId]);

  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter(
      (role) =>
        role?.name?.toLowerCase().includes(q) ||
        role?.code?.toLowerCase().includes(q)
    );
  }, [roles, roleSearch]);

  const filteredPermissions = useMemo(() => {
    if (!permissionSearch.trim()) return permissions;
    const q = permissionSearch.toLowerCase();
    return permissions.filter(
      (permission) =>
        permission?.name?.toLowerCase().includes(q) ||
        permission?.code?.toLowerCase().includes(q)
    );
  }, [permissions, permissionSearch]);

  const assignablePermissions = useMemo(() => {
    if (!assignmentFilter.trim()) return permissions;
    const q = assignmentFilter.toLowerCase();
    return permissions.filter(
      (permission) =>
        permission?.name?.toLowerCase().includes(q) ||
        permission?.code?.toLowerCase().includes(q)
    );
  }, [permissions, assignmentFilter]);

  const totalPermissionsAttached = useMemo(() => {
    if (!Array.isArray(roles) || roles.length === 0) return 0;
    return roles.reduce((sum, role) => sum + (role.permissions?.length || 0), 0);
  }, [roles]);

  const avgPermissionsPerRole = roles.length
    ? (totalPermissionsAttached / roles.length).toFixed(1)
    : "0.0";

  const handleSelectRole = (roleId) => {
    if (!roleId) return;
    setSelectedRoleId(roleId);
    setAssignmentError("");
    setAssignmentSuccess("");
    fetchRolePermissions(roleId);
  };

  const fetchRolePermissions = async (roleId) => {
    setRolePermissionsLoading(true);
    try {
      const detail = await iamService.getRolePermissions(roleId);
      setSelectedRoleDetail(detail);
      setSelectedPermissionCodes(new Set(detail?.permissions || []));
    } catch (error) {
      setAssignmentError(error?.message || "Không lấy được permission của role");
      setSelectedRoleDetail(null);
      setSelectedPermissionCodes(new Set());
    } finally {
      setRolePermissionsLoading(false);
    }
  };

  const openRoleModal = (mode, role = null) => {
    setRoleFormLoading(false);
    setRoleFormError("");
    setRoleModal({ open: true, mode, role });
    if (mode === "create") {
      setRoleForm(emptyRoleForm);
      return;
    }
    if (!role) return;
    const fillForm = async () => {
      setRoleFormLoading(true);
      try {
        if (selectedRoleDetail && selectedRoleDetail.roleId === role.id) {
          setRoleForm({
            code: selectedRoleDetail.roleCode || role.code,
            name: selectedRoleDetail.roleName || role.name,
            description: selectedRoleDetail.description || "",
          });
          return;
        }
        const detail = await iamService.getRolePermissions(role.id);
        setRoleForm({
          code: detail?.roleCode || role.code,
          name: detail?.roleName || role.name,
          description: detail?.description || "",
        });
      } catch {
        setRoleForm({
          code: role.code,
          name: role.name,
          description: "",
        });
      } finally {
        setRoleFormLoading(false);
      }
    };
    fillForm();
  };

  const closeRoleModal = () => {
    setRoleModal({ open: false, mode: "create", role: null });
    setRoleForm(emptyRoleForm);
    setRoleFormError("");
    setRoleFormLoading(false);
  };

  const handleSubmitRole = async () => {
    setRoleFormError("");
    const trimmedName = roleForm.name.trim();
    const trimmedCode = roleForm.code.trim();
    if (!trimmedName || (roleModal.mode === "create" && !trimmedCode)) {
      setRoleFormError("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    try {
      setRoleFormSubmitting(true);
      if (roleModal.mode === "create") {
        const created = await iamService.createRole({
          code: trimmedCode,
          name: trimmedName,
          description: roleForm.description?.trim() || undefined,
        });
        setRoles((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
        closeRoleModal();
      } else if (roleModal.role) {
        const updated = await iamService.updateRole(roleModal.role.id, {
          name: trimmedName,
          description: roleForm.description?.trim() || undefined,
        });
        setRoles((prev) =>
          (Array.isArray(prev) ? prev : []).map((role) =>
            role.id === updated.id
              ? { ...role, name: updated.name, permissions: updated.permissions }
              : role
          )
        );
        if (selectedRoleId === updated.id) {
          setSelectedRoleDetail((detail) =>
            detail
              ? {
                ...detail,
                roleName: trimmedName,
                description: roleForm.description?.trim() || "",
              }
              : detail
          );
        }
        closeRoleModal();
      }
    } catch (error) {
      setRoleFormError(error?.message || "Không lưu được role");
    } finally {
      setRoleFormSubmitting(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (!role || !window.confirm(`Xóa role ${role.name}?`)) return;
    try {
      setDeletingRoleId(role.id);
      await iamService.deleteRole(role.id);
      setRoles((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== role.id) : []));
      if (selectedRoleId === role.id) {
        setSelectedRoleId(null);
        setSelectedRoleDetail(null);
        setSelectedPermissionCodes(new Set());
      }
    } catch (error) {
      setRolesError(error?.message || "Không xóa được role");
    } finally {
      setDeletingRoleId(null);
    }
  };

  const openPermissionModal = (mode, permission = null) => {
    setPermissionFormError("");
    setPermissionModal({ open: true, mode, permission });
    if (mode === "create" || !permission) {
      setPermissionForm(emptyPermissionForm);
      return;
    }
    setPermissionForm({
      code: permission.code,
      name: permission.name,
    });
  };

  const closePermissionModal = () => {
    setPermissionModal({ open: false, mode: "create", permission: null });
    setPermissionForm(emptyPermissionForm);
    setPermissionFormError("");
  };

  const handleSubmitPermission = async () => {
    setPermissionFormError("");
    const trimmedName = permissionForm.name.trim();
    const trimmedCode = permissionForm.code.trim();
    if (!trimmedName || (permissionModal.mode === "create" && !trimmedCode)) {
      setPermissionFormError("Vui lòng nhập code và tên permission");
      return;
    }
    try {
      setPermissionFormSubmitting(true);
      if (permissionModal.mode === "create") {
        const created = await iamService.createPermission({
          code: trimmedCode,
          name: trimmedName,
        });
        setPermissions((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      } else if (permissionModal.permission) {
        const updated = await iamService.updatePermission(permissionModal.permission.id, {
          name: trimmedName,
        });
        setPermissions((prev) =>
          (Array.isArray(prev) ? prev : []).map((p) =>
            p.id === updated.id ? { ...p, name: updated.name } : p
          )
        );
      }
      closePermissionModal();
    } catch (error) {
      setPermissionFormError(error?.message || "Không lưu được permission");
    } finally {
      setPermissionFormSubmitting(false);
    }
  };

  const handleDeletePermission = async (permission) => {
    if (!permission || !window.confirm(`Xóa permission ${permission.name}?`)) return;
    try {
      setDeletingPermissionId(permission.id);
      await iamService.deletePermission(permission.id);
      setPermissions((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== permission.id) : []));
      setSelectedPermissionCodes((prev) => {
        const next = new Set(prev);
        next.delete(permission.code);
        return next;
      });
      setRoles((prev) =>
        (Array.isArray(prev) ? prev : []).map((role) =>
          role.permissions?.includes(permission.code)
            ? {
              ...role,
              permissions: role.permissions.filter((code) => code !== permission.code),
            }
            : role
        )
      );
      if (selectedRoleDetail?.permissions?.includes(permission.code)) {
        setSelectedRoleDetail((detail) =>
          detail
            ? {
              ...detail,
              permissions: detail.permissions.filter((code) => code !== permission.code),
            }
            : detail
        );
      }
    } catch (error) {
      setPermissionsError(error?.message || "Không xóa được permission");
    } finally {
      setDeletingPermissionId(null);
    }
  };

  const togglePermissionSelection = (code) => {
    setSelectedPermissionCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
    setAssignmentSuccess("");
  };

  const handleSaveAssignments = async () => {
    if (!selectedRoleId) return;
    if (selectedPermissionCodes.size === 0) {
      setAssignmentError("Role phải có ít nhất một permission");
      return;
    }
    try {
      setSavingAssignments(true);
      setAssignmentError("");
      const updated = await iamService.assignPermissions(
        selectedRoleId,
        Array.from(selectedPermissionCodes)
      );
      setRoles((prev) =>
        (Array.isArray(prev) ? prev : []).map((role) =>
          role.id === updated.id ? { ...role, permissions: updated.permissions } : role
        )
      );
      setSelectedRoleDetail((detail) =>
        detail
          ? {
            ...detail,
            permissions: updated.permissions,
          }
          : detail
      );
      setAssignmentSuccess("Đã cập nhật permission cho role");
    } catch (error) {
      setAssignmentError(error?.message || "Không cập nhật được permission cho role");
    } finally {
      setSavingAssignments(false);
    }
  };

  const selectAllPermissions = () => {
    setSelectedPermissionCodes(new Set(permissions.map((p) => p.code)));
    setAssignmentSuccess("");
  };

  const clearAllPermissions = () => {
    setSelectedPermissionCodes(new Set());
    setAssignmentSuccess("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatsCard
          title="Tổng số role"
          value={roles.length}
          helper="Vai trò đang hoạt động"
          icon={<Shield className="h-5 w-5" />}
          accent="indigo"
        />
        <StatsCard
          title="Tổng permission"
          value={permissions.length}
          helper="Quyền khả dụng trong hệ thống"
          icon={<Key className="h-5 w-5" />}
          accent="purple"
        />
        <StatsCard
          title="Quyền/role trung bình"
          value={avgPermissionsPerRole}
          helper={`${totalPermissionsAttached} quyền đang được gán`}
          icon={<Users className="h-5 w-5" />}
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Danh sách role</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quản lý các nhóm quyền truy cập
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => fetchRolePermissions(selectedRoleId)} disabled={!selectedRoleId || rolePermissionsLoading}>
                <RefreshCw className={`h-4 w-4 ${rolePermissionsLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => openRoleModal("create")} size="sm">
                <Plus className="h-4 w-4" />
                Thêm role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between gap-3">
              <Input
                placeholder="Tìm theo tên hoặc code..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
              />
            </div>
            {rolesError && <p className="mb-3 text-sm text-red-600">{rolesError}</p>}
            <div className="rounded-md border">
              {rolesLoading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Không có role nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Số permission</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => {
                      const isActive = selectedRoleId === role.id;
                      return (
                        <TableRow
                          key={role.id}
                          onClick={() => handleSelectRole(role.id)}
                          className={`cursor-pointer ${isActive ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}
                        >
                          <TableCell>
                            <div className="font-medium">{role.name}</div>
                            <div className="text-xs text-muted-foreground">{role.code}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="blue">{role.permissions?.length || 0} quyền</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <IconActionButton
                                icon={PencilLine}
                                label="Chỉnh sửa role"
                                variant="edit"
                                className="text-black dark:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRoleModal("edit", role);
                                }}
                              />
                              <IconActionButton
                                icon={Trash2}
                                label="Xóa role"
                                variant="danger"
                                disabled={deletingRoleId === role.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRole(role);
                                }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Danh sách permission</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quy định chi tiết quyền thao tác
              </p>
            </div>
            <Button onClick={() => openPermissionModal("create")} size="sm">
              <Plus className="h-4 w-4" />
              Thêm permission
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Tìm permission..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
              />
            </div>
            {permissionsError && <p className="mb-3 text-sm text-red-600">{permissionsError}</p>}
            <div className="rounded-md border">
              {permissionsLoading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : filteredPermissions.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Không có permission nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-xs text-muted-foreground">{permission.code}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <IconActionButton
                              icon={PencilLine}
                              label="Chỉnh sửa permission"
                              variant="edit"
                              className="text-black dark:text-white"
                              onClick={() => openPermissionModal("edit", permission)}
                            />
                            <IconActionButton
                              icon={Trash2}
                              label="Xóa permission"
                              variant="danger"
                              disabled={deletingPermissionId === permission.id}
                              onClick={() => handleDeletePermission(permission)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Permission theo role</CardTitle>
            {selectedRoleDetail && (
              <p className="text-sm text-muted-foreground">
                {selectedRoleDetail.roleName} · {selectedRoleDetail.roleCode}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearAllPermissions}>
              Bỏ chọn
            </Button>
            <Button variant="outline" size="sm" onClick={selectAllPermissions}>
              Chọn tất cả
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAssignments}
              disabled={!selectedRoleId || savingAssignments || selectedPermissionCodes.size === 0}
            >
              {savingAssignments ? "Đang lưu..." : "Lưu phân quyền"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedRoleId ? (
            <p className="text-sm text-muted-foreground">
              Chọn một role ở bảng bên trái để cấu hình permission
            </p>
          ) : rolePermissionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ) : (
            <>
              {assignmentError && (
                <p className="mb-3 text-sm text-red-600">{assignmentError}</p>
              )}
              {assignmentSuccess && (
                <p className="mb-3 text-sm text-green-600">{assignmentSuccess}</p>
              )}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-3 rounded-md border p-4">
                  <h4 className="text-sm font-medium">Thông tin role</h4>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Tên: </span>
                    {selectedRoleDetail?.roleName || "—"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Mã: </span>
                    {selectedRoleDetail?.roleCode || "—"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Mô tả: </span>
                    {selectedRoleDetail?.description || "Chưa cập nhật"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Tạo lúc: </span>
                    {selectedRoleDetail?.createdAt
                      ? new Date(selectedRoleDetail.createdAt).toLocaleString()
                      : "—"}
                  </p>
                  <Badge variant="green">
                    {selectedPermissionCodes.size} / {permissions.length} quyền
                  </Badge>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <Input
                    placeholder="Lọc permission theo tên hoặc code..."
                    value={assignmentFilter}
                    onChange={(e) => setAssignmentFilter(e.target.value)}
                  />
                  <div className="rounded-md border">
                    {assignablePermissions.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        Không có permission phù hợp.
                      </div>
                    ) : (
                      <ScrollArea className="h-[360px]">
                        <div className="divide-y">
                          {assignablePermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={selectedPermissionCodes.has(permission.code)}
                                onCheckedChange={() => togglePermissionSelection(permission.code)}
                              />
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {permission.code}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={roleModal.open} onOpenChange={(open) => !open && closeRoleModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {roleModal.mode === "create" ? "Tạo role mới" : "Cập nhật role"}
            </DialogTitle>
          </DialogHeader>
          {roleFormLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mã role</Label>
                <Input
                  value={roleForm.code}
                  disabled={roleModal.mode === "edit"}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="VD: ADMIN"
                />
              </div>
              <div className="space-y-2">
                <Label>Tên role</Label>
                <Input
                  value={roleForm.name}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Tên hiển thị"
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={roleForm.description}
                  rows={4}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ghi chú về vai trò"
                />
              </div>
              {roleFormError && <p className="text-sm text-red-600">{roleFormError}</p>}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeRoleModal}>
              Hủy
            </Button>
            <Button onClick={handleSubmitRole} disabled={roleFormSubmitting || roleFormLoading}>
              {roleFormSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permissionModal.open} onOpenChange={(open) => !open && closePermissionModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {permissionModal.mode === "create" ? "Tạo permission mới" : "Cập nhật permission"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={permissionForm.code}
                disabled={permissionModal.mode === "edit"}
                onChange={(e) =>
                  setPermissionForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="VD: PROJECT_VIEW"
              />
            </div>
            <div className="space-y-2">
              <Label>Tên permission</Label>
              <Input
                value={permissionForm.name}
                onChange={(e) =>
                  setPermissionForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Tên hiển thị"
              />
            </div>
            {permissionFormError && <p className="text-sm text-red-600">{permissionFormError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closePermissionModal}>
              Hủy
            </Button>
            <Button onClick={handleSubmitPermission} disabled={permissionFormSubmitting}>
              {permissionFormSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


