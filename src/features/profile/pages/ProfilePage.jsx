import React, { useEffect, useState } from "react";
import {
	FaAt,
	FaBuilding,
	FaCalendarAlt,
	FaEdit,
	FaIdBadge,
	FaMapMarkerAlt,
	FaPhone,
	FaSave,
	FaTimes,
	FaUser,
	FaVenusMars,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/ui/Avatar.jsx";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { userService } from "@/features/profile/api/userService";
import Skeleton from "@/components/ui/Skeleton";
import ImageCropModal from "@/components/ui/ImageCropModal";
import { cn, textColors } from "@/theme/colors";

function formatDate(value) {
	if (!value) return "-";
	return new Date(value).toLocaleDateString("vi-VN");
}

function formatDateTime(value) {
	if (!value) return "";
	return new Date(value).toLocaleString("vi-VN");
}

const profileLayoutStyles = `
	.profile-page-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
	}

	.profile-page-sidebar,
	.profile-page-content {
		min-width: 0;
	}

	@media (min-width: 768px) {
		.profile-page-layout {
			grid-template-columns: minmax(0, 40%) minmax(0, 60%);
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

function ActionButtons({ isEditing, loading, onEdit, onSave, onCancel, t }) {
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
			<Button onClick={onSave} disabled={loading} className="w-full justify-center">
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

function SubscriptionCard({ subscriptionType, premiumUntil, isPremium }) {
	return null;
	const expiresAt = formatDateTime(premiumUntil);
	const planName = isPremium ? subscriptionType || "PREMIUM" : "FREE";

	return (
		<Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
			<div className="p-5">
				<div className="flex items-start justify-between gap-4">
					<div className="flex min-w-0 items-start gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
							<FaIdBadge className="h-4 w-4" />
						</div>

						<div className="min-w-0">
							<h3 className={cn("text-base font-semibold", textColors.primary)}>Gói hiện tại</h3>
							<p className={cn("mt-1 text-xs", textColors.muted)}>
								{isPremium && expiresAt ? (
									<>
										Hết hạn: <span className="font-semibold">{expiresAt}</span>
									</>
								) : (
									"Bạn đang dùng gói miễn phí"
								)}
							</p>
						</div>
					</div>

					<PremiumBadge
						subscriptionType={planName}
						premiumUntil={premiumUntil}
						size="md"
					/>
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

function DetailInfoGrid({ formData, profile, isEditing, onInputChange }) {
	const username = profile?.userName || profile?.email?.split("@")[0] || "-";
	const role = profile?.role || "Thành viên";
	const genderText =
		profile?.gender === "MALE"
			? "Male"
			: profile?.gender === "FEMALE"
				? "Female"
				: profile?.gender || "-";

	return (
		<Card className="rounded-3xl border-border/70 shadow-sm">
			<div className="p-5 sm:p-6">
				<div className="mb-5">
					<h3 className={cn("text-xl font-semibold tracking-tight", textColors.primary)}>
						Thông tin tài khoản
					</h3>
				</div>

				<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
					<InfoItem
						icon={<FaUser className="h-4 w-4" />}
						label="Họ và tên"
						value={`${formData.firstName || ""} ${formData.lastName || ""}`.trim()}
					/>

					<InfoItem
						icon={<FaAt className="h-4 w-4" />}
						label="Username"
						value={`@${username}`}
					/>

					<InfoItem
						icon={<FaAt className="h-4 w-4" />}
						label="Email"
						value={formData.email}
					/>

					<InfoItem
						icon={<FaBuilding className="h-4 w-4" />}
						label="Vai trò"
						value={role}
					/>

					<InfoItem icon={<FaPhone className="h-4 w-4" />} label="Số điện thoại">
						{isEditing ? (
							<Input
								value={formData.phone}
								onChange={(e) => onInputChange("phone", e.target.value)}
								placeholder="Nhập số điện thoại"
								className="mt-2 h-10 text-sm"
							/>
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

					<InfoItem
						icon={<FaCalendarAlt className="h-4 w-4" />}
						label="Ngày sinh"
						value={formatDate(profile?.dob)}
					/>

					<InfoItem
						icon={<FaVenusMars className="h-4 w-4" />}
						label="Giới tính"
						value={genderText}
					/>
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
	const [cropModalOpen, setCropModalOpen] = useState(false);
	const [imageSrcForCrop, setImageSrcForCrop] = useState(null);

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
	};

	const handleSave = async () => {
		try {
			setLoading(true);
			setError("");
			setSuccess("");

			const payload = {
				address: formData.address,
				phone: formData.phone,
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
		setFormData((prev) => ({
			...prev,
			phone: profile?.phone || "",
			address: profile?.address || "",
		}));
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
					/>

					<SubscriptionCard
						subscriptionType={subscriptionType}
						premiumUntil={premiumUntil}
						isPremium={isPremium}
					/>
				</aside>

				<main className="profile-page-content space-y-4">
					<DetailInfoGrid
						formData={formData}
						profile={profile}
						isEditing={isEditing}
						onInputChange={handleInputChange}
					/>

					{error && (
						<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
							{error}
						</div>
					)}

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
