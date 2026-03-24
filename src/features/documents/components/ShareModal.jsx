import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { documentService } from "@/features/documents/api/documentService";
import { userService } from "@/features/profile/api/userService";
import { getStoredTokens } from "@/lib/api";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

export default function ShareModal({
	isOpen,
	onClose,
	shareItem,
	selectedRecipients,
	setSelectedRecipients,
	onShare,
	onUpdateGeneralAccess,
}) {
	const { t } = useTranslation();
	const [query, setQuery] = useState("");
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [sharePermission, setSharePermission] = useState("VIEWER");
	const [copying, setCopying] = useState(false);
	const [sharedUsers, setSharedUsers] = useState([]);
	const [accessLoading, setAccessLoading] = useState(false);
	const [actionLoadingId, setActionLoadingId] = useState(null);
	const [currentUserProfile, setCurrentUserProfile] = useState(null);
	const [generalAccess, setGeneralAccess] = useState("PRIVATE");
	const [generalAccessLoading, setGeneralAccessLoading] = useState(false);

	// Load users when modal opens
	useEffect(() => {
		if (isOpen && shareItem) {
			loadModalData();
			setGeneralAccess(shareItem?.data?.permission || "PRIVATE");
		}
	}, [isOpen, shareItem]);

	const getUserId = (user) => user?.id || user?.userId || user?.uuid || null;
	const getUserName = (user) => {
		const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
		return fullName || user?.fullName || user?.name || user?.username || user?.email || t("documents.fileDetail.unknown");
	};

	const userDirectoryMap = useMemo(() => {
		const map = new Map();
		users.forEach((u) => {
			const id = getUserId(u);
			if (!id) return;
			map.set(String(id), u);
		});
		return map;
	}, [users]);

	async function loadModalData() {
		try {
			setLoading(true);
			setAccessLoading(true);
			const [userData, sharedData, myProfile] = await Promise.all([
				userService.getUsersForSharing(),
				shareItem?.data?.id
					? documentService.getSharedUsers(shareItem.data.id, shareItem.type.toUpperCase())
					: Promise.resolve([]),
				userService.getMyProfile().catch(() => null),
			]);

			setUsers(userData || []);
			setCurrentUserProfile(myProfile || null);
			setSharedUsers(sharedData || []);
		} catch (error) {
			console.error("Error loading share modal data:", error);
			setUsers([]);
			setSharedUsers([]);
		} finally {
			setLoading(false);
			setAccessLoading(false);
		}
	}

	async function reloadSharedUsers() {
		if (!shareItem?.data?.id) return;
		try {
			setAccessLoading(true);
			const sharedData = await documentService.getSharedUsers(shareItem.data.id, shareItem.type.toUpperCase());
			setSharedUsers(sharedData || []);
		} catch (error) {
			console.error("Error loading shared users:", error);
		} finally {
			setAccessLoading(false);
		}
	}

	function toggle(id) {
		if (selectedRecipients.includes(id)) {
			setSelectedRecipients(prev => prev.filter(userId => userId !== id));
		} else {
			setSelectedRecipients(prev => [...prev, id]);
		}
	}

	const filteredUsers = useMemo(() => {
		const keyword = query.trim().toLowerCase();
		if (!keyword) return users;

		return users.filter((user) => {
			const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
			const candidates = [fullName, user.name, user.username, user.email].filter(Boolean);
			return candidates.some((value) => String(value).toLowerCase().includes(keyword));
		});
	}, [users, query]);

	const ownerInfo = useMemo(() => {
		const ownerId = shareItem?.data?.ownerId;
		const fromDirectory = ownerId ? userDirectoryMap.get(String(ownerId)) : null;
		const fromToken = getStoredTokens()?.userInfo || {};

		if (fromDirectory) {
			return {
				id: ownerId,
				name: getUserName(fromDirectory),
				email: fromDirectory.email || "",
				image: fromDirectory.image,
			};
		}

		if (ownerId && currentUserProfile && String(getUserId(currentUserProfile)) === String(ownerId)) {
			return {
				id: ownerId,
				name: getUserName(currentUserProfile),
				email: currentUserProfile.email || fromToken.email || "",
				image: currentUserProfile.image,
			};
		}

		return {
			id: ownerId || "owner",
			name: getUserName({
				firstName: shareItem?.data?.ownerName,
				name: shareItem?.data?.ownerName,
				email: fromToken.email,
			}),
			email: shareItem?.data?.ownerEmail || fromToken.email || "",
			image: undefined,
		};
	}, [shareItem, userDirectoryMap, currentUserProfile]);

	const peopleWithAccess = useMemo(() => {
		const mappedShared = (sharedUsers || []).map((entry) => {
			const entryUserId = entry.userId || entry.sharedWithUserId || entry.id;
			const fallbackUser = entryUserId ? userDirectoryMap.get(String(entryUserId)) : null;
			const merged = {
				id: entryUserId,
				firstName: entry.firstName ?? fallbackUser?.firstName,
				lastName: entry.lastName ?? fallbackUser?.lastName,
				fullName: entry.fullName ?? fallbackUser?.fullName,
				name: entry.name ?? fallbackUser?.name,
				username: entry.username ?? fallbackUser?.username,
				email: entry.email ?? fallbackUser?.email,
				image: entry.image ?? fallbackUser?.image,
			};
			return {
				shareId: entry.shareId || entry.id,
				userId: entryUserId,
				name: getUserName(merged),
				email: merged.email || "",
				image: merged.image,
				permission: entry.permission || "VIEWER",
			};
		});

		return [
			{
				isOwner: true,
				userId: ownerInfo.id,
				name: ownerInfo.name,
				email: ownerInfo.email,
				image: ownerInfo.image,
				permission: "OWNER",
			},
			...mappedShared,
		];
	}, [sharedUsers, ownerInfo, userDirectoryMap]);

	async function handleGeneralAccessChange(value) {
		if (!value || value === generalAccess) return;
		try {
			setGeneralAccessLoading(true);
			await onUpdateGeneralAccess?.(value);
			setGeneralAccess(value);
			toast.success(t("documents.permission.success"));
		} catch (error) {
			console.error("Error updating general access:", error);
			toast.error(error?.message || t("documents.permission.error"));
		} finally {
			setGeneralAccessLoading(false);
		}
	}

	async function handleUpdatePermission(entry, permission) {
		if (!entry?.shareId || entry?.isOwner) return;
		try {
			setActionLoadingId(entry.shareId);
			await documentService.updateSharePermission(entry.shareId, permission);
			toast.success(t("documents.sharedUsers.permissionUpdated"));
			await reloadSharedUsers();
		} catch (error) {
			console.error("Error updating permission:", error);
			toast.error(error?.message || t("documents.sharedUsers.updateError"));
		} finally {
			setActionLoadingId(null);
		}
	}

	async function handleCopyLink() {
		try {
			setCopying(true);
			const itemType = shareItem?.type || "file";
			const id = shareItem?.data?.id;
			const url = `${window.location.origin}/documents?type=${itemType}&id=${encodeURIComponent(id || "")}`;
			await navigator.clipboard.writeText(url);
			toast.success(t("documents.share.linkCopied"));
		} catch (error) {
			console.error("Copy link failed:", error);
			toast.error(t("documents.share.error"));
		} finally {
			setCopying(false);
		}
	}

	async function handleSubmit() {
		if (selectedRecipients.length > 0 && onShare) {
			const success = await onShare(sharePermission);
			if (!success) return;
			setSelectedRecipients([]);
			setQuery("");
			await reloadSharedUsers();
		}
		onClose();
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl border-[#d7dce3] p-0">
				{shareItem && (
					<>
						<DialogHeader className="border-b border-[#e6eaf0] px-6 py-4">
							<DialogTitle className="text-[30px] font-normal leading-tight text-[#202124]">
								{t("documents.share.dialogTitle", {
									name: shareItem.data.name,
								})}
							</DialogTitle>
						</DialogHeader>

						<div className="space-y-5 px-6 py-5 text-[#3c4043]">
							<div className="flex items-center gap-2">
								<Input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder={t("documents.share.searchPlaceholder")}
									className="h-11 border-[#dadce0]"
								/>
								<Select value={sharePermission} onValueChange={setSharePermission}>
									<SelectTrigger className="h-11 w-[130px] border-[#dadce0]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="VIEWER">{t("documents.share.viewer")}</SelectItem>
										<SelectItem value="EDITOR">{t("documents.share.editor")}</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="rounded-xl border border-[#e6eaf0] bg-[#fbfcff]">
								<div className="border-b border-[#e6eaf0] px-4 py-3 text-sm font-medium text-[#202124]">
									{t("documents.share.selected", { count: selectedRecipients.length, total: users.length })}
								</div>
								<div className="max-h-52 overflow-y-auto px-2 py-2">
									{loading ? (
										<div className="px-3 py-2 text-sm text-muted-foreground">{t("documents.sharedUsers.loading")}</div>
									) : filteredUsers.length === 0 ? (
										<div className="px-3 py-2 text-sm text-muted-foreground">{t("documents.share.noUsersFound")}</div>
									) : (
										filteredUsers.map((user) => {
											const id = getUserId(user);
											if (!id) return null;
											const checked = selectedRecipients.includes(id);
											const userName = getUserName(user);
											const secondary = user.email || user.username || "-";
											return (
												<label
													key={id}
													className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#edf3fe]"
												>
													<Checkbox checked={checked} onCheckedChange={() => toggle(id)} />
													<Avatar name={userName} user={user} size="sm" />
													<div className="min-w-0">
														<p className="truncate text-sm text-[#202124]">{userName}</p>
														{secondary && secondary !== userName && (
															<p className="truncate text-xs text-muted-foreground">{secondary}</p>
														)}
													</div>
												</label>
											);
										})
									)}
								</div>
							</div>

							<div>
								<p className="mb-2 text-lg font-medium text-[#202124]">{t("documents.share.accessList")}</p>
								<div className="max-h-64 overflow-y-auto rounded-xl border border-[#e6eaf0]">
									{accessLoading ? (
										<div className="px-4 py-3 text-sm text-muted-foreground">{t("documents.sharedUsers.loading")}</div>
									) : (
										peopleWithAccess.map((entry, index) => (
											<div
												key={`${entry.permission}-${entry.userId || index}-${entry.shareId || "owner"}`}
												className={`flex items-center justify-between gap-3 px-4 py-3 ${index > 0 ? "border-t border-[#e6eaf0]" : ""}`}
											>
												<div className="flex min-w-0 items-center gap-3">
													<Avatar name={entry.name} user={{ image: entry.image }} size="sm" />
													<div className="min-w-0">
														<p className="truncate text-sm text-[#202124]">{entry.name}</p>
														{entry.email && entry.email !== entry.name && (
															<p className="truncate text-xs text-muted-foreground">{entry.email}</p>
														)}
													</div>
												</div>
												{entry.isOwner ? (
													<span className="text-sm text-muted-foreground">{t("documents.share.owner")}</span>
												) : (
													<Select
														value={entry.permission}
														onValueChange={(value) => handleUpdatePermission(entry, value)}
														disabled={actionLoadingId === entry.shareId}
													>
														<SelectTrigger className="h-9 w-[140px] border-[#dadce0]">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="VIEWER">{t("documents.share.viewer")}</SelectItem>
															<SelectItem value="EDITOR">{t("documents.share.editor")}</SelectItem>
														</SelectContent>
													</Select>
												)}
											</div>
										))
									)}
								</div>
							</div>

							<div>
								<p className="mb-2 text-lg font-medium text-[#202124]">{t("documents.share.generalAccess")}</p>
								<div className="rounded-xl border border-[#e6eaf0] px-4 py-3 text-sm">
									<div className="mb-3">
										<Select
											value={generalAccess}
											onValueChange={handleGeneralAccessChange}
											disabled={generalAccessLoading}
										>
											<SelectTrigger className="h-9 w-[260px] border-[#dadce0]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="PRIVATE">{t("documents.share.restricted")}</SelectItem>
												<SelectItem value="PUBLIC">{t("documents.share.anyoneWithLink")}</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="text-muted-foreground">
										{generalAccess === "PUBLIC"
											? t("documents.fileDetail.publicDescription")
											: t("documents.fileDetail.privateDescription")}
									</div>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between border-t border-[#e6eaf0] px-6 py-4">
							<Button variant="outline" onClick={handleCopyLink} disabled={copying} className="gap-2 rounded-full">
								<Link2 className="h-4 w-4" />
								{t("documents.share.copyLink")}
							</Button>
							<Button onClick={handleSubmit} className="rounded-full bg-[#0b57d0] px-6 hover:bg-[#0b57d0]/90">
								{t("documents.share.done")}
							</Button>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
