import React, { useEffect, useState } from "react";
import { FaEnvelope, FaBuilding, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/ui/Avatar.jsx";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { userService } from "@/features/profile/api/userService";
import Skeleton from "@/components/ui/Skeleton";
import ImageCropModal from "@/components/ui/ImageCropModal";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { textColors, borderColors, buttonColors, cn } from "@/theme/colors";

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

	if (showSkeleton) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-1/3" />
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					<div className="lg:col-span-4 space-y-4">
						<Skeleton className="h-64 w-full rounded-xl" />
					</div>
					<div className="lg:col-span-8 space-y-4">
						<Skeleton className="h-12 w-1/3" />
						{Array.from({ length: 6 }).map((_, idx) => (
							<Skeleton key={idx} className="h-16 w-full rounded-lg" />
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
				<div className="lg:col-span-4 space-y-6">
					<Card className="p-6 flex flex-col items-center text-center">
						<div className="relative group mb-4">
							<Avatar user={profile} size="2xl" className="ring-4 ring-indigo-500/10" />
							<label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
								<FaEdit className="h-6 w-6" />
								<input type="file" accept="image/*" className="hidden" onChange={handlePickAvatar} />
							</label>
							{avatarUploading && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
									<div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</div>

						<h2 className={cn("text-2xl font-bold", textColors.primary)}>{fullName}</h2>
						<p className={cn("text-sm mb-4", textColors.muted)}>
							@{profile?.userName || profile?.email?.split("@")[0]}
						</p>
						<div className="mb-6">
							<PremiumBadge
								subscriptionType={subscriptionType}
								premiumUntil={premiumUntil}
								showExpiry
								size="md"
							/>
						</div>

						<div className="w-full space-y-4 text-left">
							<div className="flex items-center gap-3 text-sm">
								<FaEnvelope className="h-4 w-4 text-gray-400" />
								<span className={textColors.secondary}>{profile?.email}</span>
							</div>
							<div className="flex items-center gap-3 text-sm">
								<FaBuilding className="h-4 w-4 text-gray-400" />
								<span className={textColors.secondary}>{profile?.role || "Thành viên"}</span>
							</div>
						</div>

						<div className={cn("w-full mt-8 pt-6 border-t", borderColors.default)}>
							<div className={cn("flex items-center justify-between text-xs", textColors.muted)}>
								<span>{t("profile.fields.lastUpdated")}</span>
								<span>{profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : ""}</span>
							</div>
						</div>
					</Card>
				</div>

				<div className="lg:col-span-8">
					<Card className="p-8">
						<div className="flex items-center justify-between mb-8">
							<h3 className={cn("text-2xl font-semibold", textColors.primary)}>
								{t("profile.detailInfo")}
							</h3>
							{!isEditing ? (
								<Button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-base px-6 py-3">
									<FaEdit className="h-5 w-5" />
									{t("profile.actions.edit")}
								</Button>
							) : (
								<div className="flex gap-3">
									<Button onClick={handleSave} className={cn("flex items-center gap-2 text-base px-6 py-3", buttonColors.success)}>
										<FaSave className="h-5 w-5" />
										{t("profile.actions.save")}
									</Button>
									<Button onClick={handleCancel} variant="outline" className="flex items-center gap-2 text-base px-6 py-3">
										<FaTimes className="h-5 w-5" />
										{t("profile.actions.cancel")}
									</Button>
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
							<div>
								<label className={cn("block text-sm font-medium mb-2", textColors.secondary)}>{t("profile.fields.fullName")}</label>
								<p className={cn("text-lg font-medium", textColors.primary)}>{fullName}</p>
							</div>
							<div>
								<label className={cn("block text-sm font-medium mb-2", textColors.secondary)}>{t("profile.fields.email")}</label>
								<p className={cn("text-lg", textColors.primary)}>{formData.email}</p>
							</div>
							<div>
								<label className={cn("block text-sm font-medium mb-2", textColors.secondary)}>{t("profile.fields.phone")}</label>
								{isEditing ? (
									<Input
										value={formData.phone}
										onChange={(e) => handleInputChange("phone", e.target.value)}
										placeholder={t("profile.placeholders.enterPhone")}
										className="text-base"
									/>
								) : (
									<p className={cn("text-lg", textColors.primary)}>{formData.phone || "-"}</p>
								)}
							</div>
							<div>
								<label className={cn("block text-sm font-medium mb-2", textColors.secondary)}>{t("profile.fields.address")}</label>
								{isEditing ? (
									<Input
										value={formData.address}
										onChange={(e) => handleInputChange("address", e.target.value)}
										placeholder={t("profile.placeholders.enterAddress")}
										className="text-base"
									/>
								) : (
									<p className={cn("text-lg", textColors.primary)}>{formData.address || "-"}</p>
								)}
							</div>
							<div>
								<label className={cn("block text-sm font-medium mb-2", textColors.secondary)}>{t("profile.fields.dob")}</label>
								<p className={cn("text-lg", textColors.primary)}>{profile?.dob ? new Date(profile.dob).toLocaleDateString() : "-"}</p>
							</div>
							<div>
								<label className={cn("block text-sm font-medium mb-2", textColors.secondary)}>{t("profile.fields.gender")}</label>
								<p className={cn("text-lg", textColors.primary)}>
									{profile?.gender === "MALE"
										? t("profile.gender.male")
										: profile?.gender === "FEMALE"
											? t("profile.gender.female")
											: profile?.gender || "-"}
								</p>
							</div>
						</div>

						{error && <p className="mt-6 text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}
						{success && <p className="mt-6 text-sm text-green-600 dark:text-green-400 font-medium">{success}</p>}
					</Card>
				</div>
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
