import React, { useEffect, useMemo, useState } from "react";
import {
	FaAt,
	FaBuilding,
	FaCalendarAlt,
	FaEdit,
	FaIdBadge,
	FaMapMarkerAlt,
	FaPhone,
	FaSave,
	FaShieldAlt,
	FaTimes,
	FaUser,
	FaVenusMars,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/ui/Avatar.jsx";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { userService } from "@/features/profile/api/userService";
import Skeleton from "@/components/ui/skeleton";
import ImageCropModal from "@/components/ui/ImageCropModal";
import { cn, textColors } from "@/theme/colors";

function formatDate(value) {
	if (!value) return "-";
	return new Date(value).toLocaleDateString("vi-VN");
}

function toDateInputValue(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toISOString().slice(0, 10);
}

const GENDER_OPTIONS = [
	{ label: "Nam", value: "MALE" },
	{ label: "Nữ", value: "FEMALE" },
	{ label: "Khác", value: "OTHER" },
];

function formatDateTime(value) {
	if (!value) return "";
	return new Date(value).toLocaleString("vi-VN");
}

const profileLayoutStyles = `
	.profile-page-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
	}

	.profile-page-sidebar,
	.profile-page-content {
		min-width: 0;
	}

	@media (min-width: 768px) {
		.profile-page-layout {
			grid-template-columns: minmax(320px, 34%) minmax(0, 66%);
		}

		.profile-page-sidebar {
			position: sticky;
			top: 1.5rem;
			align-self: start;
		}
	}
`;

function ProfileLayoutStyles() {
	return <style>{profileLayoutStyles}</style>;
}

function ActionButtons({ isEditing, loading, onEdit, onSave, onCancel, t, formErrors, canSave }) {
	if (!isEditing) {
		return (
			<Button onClick={onEdit} className="w-full justify-center sm:w-fit">
				<FaEdit className="h-4 w-4" />
				{t("profile.actions.edit")}
			</Button>
		);
	}

	return (
		<div className="flex w-full flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
			<Button onClick={onSave} disabled={loading || !canSave || Object.keys(formErrors).length > 0} className="w-full justify-center">
				<FaSave className="h-4 w-4" />
				{t("profile.actions.save")}
			</Button>
			<Button onClick={onCancel} variant="outline" className="w-full justify-center">
				<FaTimes className="h-4 w-4" />
				{t("profile.actions.cancel")}
			</Button>
		</div>
	);
}

function ProfileSummaryCard({
	profile,
	fullName,
	isPremium,
	subscriptionType,
	premiumUntil,
	isEditing,
	loading,
	avatarUploading,
	onPickAvatar,
	onEdit,
	onSave,
	onCancel,
	t,
	formErrors,
	canSave,
}) {
	const username = profile?.userName || profile?.email?.split("@")[0] || "user";
	const expiresAt = formatDateTime(premiumUntil);
	const planName = isPremium ? subscriptionType || "PREMIUM" : "FREE";

	return (
		<Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
			<div className="space-y-5 p-5">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className={cn("text-2xl font-semibold tracking-tight", textColors.primary)}>
							Hồ sơ cá nhân
						</h1>
						<p className={cn("mt-1 text-sm leading-6", textColors.muted)}>
							Quản lý thông tin tài khoản, hồ sơ và gói sử dụng của bạn.
						</p>
					</div>
					<div className="shrink-0">
						<ActionButtons
							isEditing={isEditing}
							loading={loading}
							onEdit={onEdit}
							onSave={onSave}
							onCancel={onCancel}
							t={t}
							formErrors={formErrors}
							canSave={canSave}
						/>
					</div>
				</div>

				<div className="flex flex-col items-center text-center">
					<div className="relative group mb-4">
						<div className="rounded-full bg-gradient-to-br from-primary/25 via-amber-400/20 to-transparent p-1.5">
							<Avatar
								user={profile}
								premium={isPremium}
								size="2xl"
								className="ring-4 ring-background shadow-md"
							/>
						</div>

						<label className="absolute inset-1.5 flex cursor-pointer items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100">
							<FaEdit className="h-5 w-5" />
							<input
								type="file"
								accept="image/*"
								className="hidden"
								onChange={onPickAvatar}
							/>
						</label>

						{avatarUploading && (
							<div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-black/25">
								<div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
							</div>
						)}
					</div>

					<h2 className={cn("text-2xl font-semibold leading-tight", textColors.primary)}>
						{fullName}
					</h2>
					<p className={cn("mt-1 text-sm font-medium", textColors.muted)}>@{username}</p>
				</div>

				<div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h3 className={cn("text-sm font-semibold", textColors.primary)}>Gói hiện tại</h3>
							{isPremium && expiresAt && (
								<p className={cn("mt-1 text-xs", textColors.muted)}>
									Hết hạn: <span className="font-semibold">{expiresAt}</span>
								</p>
							)}
						</div>
						<PremiumBadge
							subscriptionType={planName}
							premiumUntil={premiumUntil}
							size="md"
						/>
					</div>
				</div>
			</div>
		</Card>
	);
}



function InfoItem({ icon, label, value, children }) {
	return (
		<div className="rounded-2xl border border-border/70 bg-background/60 p-4 transition-colors hover:bg-muted/40">
			<div className="flex items-start gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
					{icon}
				</div>

				<div className="min-w-0 flex-1">
					<div className={cn("text-xs font-semibold uppercase tracking-wide", textColors.muted)}>
						{label}
					</div>

					{children || (
						<div className={cn("mt-1 break-words text-sm font-semibold", textColors.primary)}>
							{value || "-"}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function DetailInfoGrid({ formData, profile, isEditing, onInputChange, formErrors }) {
	const username = profile?.userName || profile?.email?.split("@")[0] || "-";
	const role = profile?.role || "Thành viên";
	const genderText =
		formData.gender === "MALE"
			? "Male"
			: formData.gender === "FEMALE"
				? "Female"
				: formData.gender || "-";

	return (
		<Card className="rounded-3xl border-border/70 shadow-sm">
			<div className="p-5 sm:p-6">
				<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">

					<InfoItem icon={<FaUser className="h-4 w-4" />} label="Tên">
						{isEditing ? (
							<div>
								<Input
									value={formData.firstName}
									onChange={(e) => onInputChange("firstName", e.target.value)}
									placeholder="Nhập tên"
									className={cn("mt-2 h-10 text-sm", formErrors.firstName && "border-red-500")}
								/>
								{formErrors.firstName && (
									<p className="mt-1 text-xs text-red-500">{formErrors.firstName}</p>
								)}
							</div>
						) : (
							<div className={cn("mt-1 break-words text-sm font-semibold", textColors.primary)}>
								{formData.firstName || "-"}
							</div>
						)}
					</InfoItem>

					<InfoItem icon={<FaUser className="h-4 w-4" />} label="Họ">
						{isEditing ? (
							<div>
								<Input
									value={formData.lastName}
									onChange={(e) => onInputChange("lastName", e.target.value)}
									placeholder="Nhập họ"
									className={cn("mt-2 h-10 text-sm", formErrors.lastName && "border-red-500")}
								/>
								{formErrors.lastName && (
									<p className="mt-1 text-xs text-red-500">{formErrors.lastName}</p>
								)}
							</div>
						) : (
							<div className={cn("mt-1 break-words text-sm font-semibold", textColors.primary)}>
								{formData.lastName || "-"}
							</div>
						)}
					</InfoItem>

					<InfoItem
						icon={<FaAt className="h-4 w-4" />}
						label="Username"
						value={`@${username}`}
					/>

					<InfoItem icon={<FaAt className="h-4 w-4" />} label="Email">
						<div className={cn("mt-1 break-words text-sm font-semibold", textColors.primary)}>
							{formData.email || "-"}
						</div>
					</InfoItem>

					<InfoItem
						icon={<FaShieldAlt className="h-4 w-4" />}
						label="Vai trò"
						value={role}
					/>

					<InfoItem icon={<FaPhone className="h-4 w-4" />} label="Số điện thoại">
						{isEditing ? (
							<div>
								<Input
									value={formData.phone}
									onChange={(e) => onInputChange("phone", e.target.value)}
									placeholder="Nhập số điện thoại"
									className={cn("mt-2 h-10 text-sm", formErrors.phone && "border-red-500")}
								/>
								{formErrors.phone && (
									<p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>
								)}
							</div>
						) : (
							<div className={cn("mt-1 break-words text-sm font-semibold", textColors.primary)}>
								{formData.phone || "-"}
							</div>
						)}
					</InfoItem>
					<InfoItem icon={<FaMapMarkerAlt className="h-4 w-4" />} label="Địa chỉ">
						{isEditing ? (
							<Input
								value={formData.address}
								onChange={(e) => onInputChange("address", e.target.value)}
								placeholder="Nhập địa chỉ"
								className="mt-2 h-10 text-sm"
							/>
						) : (
							<div className={cn("mt-1 break-words text-sm font-semibold", textColors.primary)}>
								{formData.address || "-"}
							</div>
						)}
					</InfoItem>

					<InfoItem icon={<FaCalendarAlt className="h-4 w-4" />} label="Ngày sinh">
						{isEditing ? (
							<div>
								<Input
									type="date"
									value={toDateInputValue(formData.dob)}
									onChange={(e) => onInputChange("dob", e.target.value)}
									className={cn("mt-2 h-10 text-sm", formErrors.dob && "border-red-500")}
								/>
								{formErrors.dob && (
									<p className="mt-1 text-xs text-red-500">{formErrors.dob}</p>
								)}
							</div>
						) : (
							<div className={cn("mt-1 break-words text-sm font-semibold", textColors.primary)}>
								{formatDate(formData.dob)}
							</div>
						)}
					</InfoItem>

					<InfoItem icon={<FaVenusMars className="h-4 w-4" />} label="Giới tính">
						{isEditing ? (
							<select
								value={formData.gender || ""}
								onChange={(e) => onInputChange("gender", e.target.value)}
								className="mt-2 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
							>
								<option value="">Chọn giới tính</option>
								{GENDER_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						) : (
							<div className={cn("mt-1 break-words text-sm font-semibold", textColors.primary)}>
								{genderText}
							</div>
						)}
					</InfoItem>
				</div>
			</div>
		</Card>
	);
}

function ProfileSkeleton() {
	return (
		<div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 lg:py-5">
			<ProfileLayoutStyles />
			<div className="profile-page-layout">
				<div className="profile-page-sidebar space-y-4">
					<Skeleton className="h-24 rounded-3xl" />
					<Skeleton className="h-64 rounded-3xl" />
					<Skeleton className="h-28 rounded-3xl" />
				</div>
				<Skeleton className="profile-page-content h-[430px] rounded-3xl" />
			</div>
		</div>
	);
}

export default function Profile() {
	const { t } = useTranslation();
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [profile, setProfile] = useState(null);
	const [subscription, setSubscription] = useState(null);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		address: "",
		dob: "",
		gender: "",
	});
	const [formErrors, setFormErrors] = useState({});
	const [cropModalOpen, setCropModalOpen] = useState(false);
	const [imageSrcForCrop, setImageSrcForCrop] = useState(null);

	const validateField = (field, value) => {
		const newErrors = { ...formErrors };

		switch (field) {
			case "firstName":
				if (!value?.trim()) {
					newErrors.firstName = "Tên không được rỗng";
				} else {
					delete newErrors.firstName;
				}
				break;
			case "lastName":
				if (!value?.trim()) {
					newErrors.lastName = "Họ không được rỗng";
				} else {
					delete newErrors.lastName;
				}
				break;
			case "phone":
				if (value && !/^\d{10,11}$/.test(value)) {
					newErrors.phone = "Số điện thoại phải có 10-11 chữ số";
				} else {
					delete newErrors.phone;
				}
				break;
			case "dob":
				if (value) {
					const dobDate = new Date(value);
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					if (dobDate > today) {
						newErrors.dob = "Ngày sinh không được trong tương lai";
					} else {
						delete newErrors.dob;
					}
				} else {
					delete newErrors.dob;
				}
				break;
			default:
				delete newErrors[field];
		}

		setFormErrors(newErrors);
	};

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				setLoading(true);

				const [data, subscriptionData] = await Promise.all([
					userService.getMyProfile(),
					userService.getMySubscription().catch(() => null),
				]);

				if (!mounted) return;

				setProfile(data);
				setSubscription(subscriptionData);
				setFormData({
					firstName: data?.firstName || "",
					lastName: data?.lastName || "",
					email: data?.email || "",
					phone: data?.phone || "",
					address: data?.address || "",
					dob: data?.dob || "",
					gender: data?.gender || "",
				});
				setFormErrors({});
			} catch (e) {
				setError(e?.message || t("profile.messages.loadFailed"));
			} finally {
				setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [t]);

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		validateField(field, value);
	};

	const validateForm = (data = formData) => {
		const errors = {};
		if (!data.firstName?.trim()) errors.firstName = "Tên không được rỗng";
		if (!data.lastName?.trim()) errors.lastName = "Họ không được rỗng";
		if (data.phone && !/^\d{10,11}$/.test(data.phone)) {
			errors.phone = "Số điện thoại phải có 10-11 chữ số";
		}
		if (data.dob) {
			const dobDate = new Date(data.dob);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			if (dobDate > today) errors.dob = "Ngày sinh không được trong tương lai";
		}
		return errors;
	};

	const normalizedProfileForm = useMemo(() => ({
		firstName: formData.firstName?.trim() || "",
		lastName: formData.lastName?.trim() || "",
		phone: formData.phone || "",
		address: formData.address || "",
		dob: toDateInputValue(formData.dob),
		gender: formData.gender || "",
	}), [formData]);

	const originalProfileForm = useMemo(() => ({
		firstName: profile?.firstName?.trim() || "",
		lastName: profile?.lastName?.trim() || "",
		phone: profile?.phone || "",
		address: profile?.address || "",
		dob: toDateInputValue(profile?.dob),
		gender: profile?.gender || "",
	}), [profile]);

	const isDirty = useMemo(
		() => JSON.stringify(normalizedProfileForm) !== JSON.stringify(originalProfileForm),
		[normalizedProfileForm, originalProfileForm]
	);
	const canSave = isEditing && isDirty && Object.keys(formErrors).length === 0 && Object.keys(validateForm(formData)).length === 0;

	const handleSave = async () => {
		try {
			const nextErrors = validateForm(formData);
			setFormErrors(nextErrors);
			if (Object.keys(nextErrors).length > 0) {
				setError("Please fix the highlighted fields before saving.");
				return;
			}
			if (!isDirty) {
				setError("No changes detected.");
				return;
			}
			setLoading(true);
			setError("");
			setSuccess("");

			const payload = {
				firstName: formData.firstName?.trim(),
				lastName: formData.lastName?.trim(),
				address: formData.address,
				phone: formData.phone,
				dob: formData.dob ? new Date(formData.dob).toISOString() : null,
				gender: formData.gender || null,
			};

			const updated = await userService.updateMyProfile(payload);
			setProfile(updated);
			setSuccess(t("profile.messages.updateSuccess"));
			setIsEditing(false);
		} catch (e) {
			setError(e?.message || t("profile.messages.updateFailed"));
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
		setFormData({
			firstName: profile?.firstName || "",
			lastName: profile?.lastName || "",
			email: profile?.email || "",
			phone: profile?.phone || "",
			address: profile?.address || "",
			dob: profile?.dob || "",
			gender: profile?.gender || "",
		});
		setFormErrors({});
		setError("");
	};

	const handlePickAvatar = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			setImageSrcForCrop(reader.result);
			setCropModalOpen(true);
		};
		reader.readAsDataURL(file);
		e.target.value = "";
	};

	const handleCropComplete = async (croppedImageBlob) => {
		try {
			setAvatarUploading(true);
			setError("");
			setSuccess("");
			setCropModalOpen(false);

			const croppedFile = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" });
			await userService.uploadAvatar(croppedFile);

			const fresh = await userService.getMyProfile();
			setProfile(fresh);
			setSuccess(t("profile.messages.avatarUploadSuccess"));
		} catch (e) {
			setError(e?.message || t("profile.messages.avatarUploadFailed"));
		} finally {
			setAvatarUploading(false);
			setImageSrcForCrop(null);
		}
	};

	const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Người dùng";
	const showSkeleton = loading && !profile;
	const subscriptionType = subscription?.subscriptionType || profile?.subscriptionType || "FREE";
	const premiumUntil = subscription?.premiumUntil || profile?.premiumUntil;
	const isPremium = subscriptionType === "PREMIUM" && (!premiumUntil || new Date(premiumUntil) > new Date());

	if (showSkeleton) return <ProfileSkeleton />;

	return (
		<div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 lg:py-5">
			<ProfileLayoutStyles />
			<div className="profile-page-layout">
				<aside className="profile-page-sidebar space-y-4">
					<Card className="hidden rounded-3xl border-border/70 shadow-sm">
						<div className="space-y-4 p-5">
							<div>
								<h1 className={cn("text-2xl font-semibold tracking-tight", textColors.primary)}>
									Hồ sơ cá nhân
								</h1>
								<p className={cn("mt-1 text-sm leading-6", textColors.muted)}>
									Quản lý thông tin tài khoản, hồ sơ và gói sử dụng của bạn.
								</p>
							</div>

							<ActionButtons
								isEditing={isEditing}
								loading={loading}
								onEdit={() => setIsEditing(true)}
								onSave={handleSave}
								onCancel={handleCancel}
								t={t}
								formErrors={formErrors}
								canSave={canSave}
							/>
						</div>
					</Card>

					<ProfileSummaryCard
						profile={profile}
						fullName={fullName}
						isPremium={isPremium}
						subscriptionType={subscriptionType}
						premiumUntil={premiumUntil}
						isEditing={isEditing}
						loading={loading}
						avatarUploading={avatarUploading}
						onPickAvatar={handlePickAvatar}
						onEdit={() => setIsEditing(true)}
						onSave={handleSave}
						onCancel={handleCancel}
						t={t}
						formErrors={formErrors}
						canSave={canSave}
					/>
				</aside>

				<main className="profile-page-content space-y-4">
					{error && (
						<div className="rounded-2xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
							{error}
						</div>
					)}

					<DetailInfoGrid
						formData={formData}
						profile={profile}
						isEditing={isEditing}
						onInputChange={handleInputChange}
						formErrors={formErrors}
					/>



					{success && (
						<div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
							{success}
						</div>
					)}
				</main>
			</div>

			<ImageCropModal
				isOpen={cropModalOpen}
				onClose={() => {
					setCropModalOpen(false);
					setImageSrcForCrop(null);
				}}
				imageSrc={imageSrcForCrop}
				onCropComplete={handleCropComplete}
			/>
		</div>
	);
}
