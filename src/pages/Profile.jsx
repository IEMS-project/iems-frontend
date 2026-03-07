import React, { useEffect, useState } from "react";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaProjectDiagram, FaTasks, FaTrophy, FaChartLine, FaClock, FaUsers } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Avatar from "../components/ui/Avatar.jsx";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import { Card } from "../components/ui/Card";
import StatsCard from "../components/ui/StatsCard";
import { userService } from "../services/userService";
import Skeleton from "../components/ui/Skeleton";
import ImageCropModal from "../components/ui/ImageCropModal";
import { textColors, borderColors, buttonColors, cn } from "../theme/colors";

export default function Profile() {
	const { t } = useTranslation();
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [profile, setProfile] = useState(null);
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

	// Mock data for statistics
	const userStats = {
		projectsCompleted: 24,
		tasksCompleted: 156,
		departmentsJoined: 3,
		hoursWorked: 1840
	};

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const data = await userService.getMyProfile();
				if (!mounted) return;
				setProfile(data);
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
				setError(e?.message || t('profile.messages.loadFailed'));
			} finally {
				setLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, []);

	const handleInputChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
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
			setSuccess(t('profile.messages.updateSuccess'));
			setIsEditing(false);
		} catch (e) {
			setError(e?.message || t('profile.messages.updateFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		// Reset form về trạng thái ban đầu
		setIsEditing(false);
	};

	const handlePickAvatar = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Read file and show crop modal
		const reader = new FileReader();
		reader.onload = () => {
			setImageSrcForCrop(reader.result);
			setCropModalOpen(true);
		};
		reader.readAsDataURL(file);

		// Reset input
		e.target.value = '';
	};

	const handleCropComplete = async (croppedImageBlob) => {
		try {
			setAvatarUploading(true);
			setError("");
			setSuccess("");
			setCropModalOpen(false);

			// Create File from Blob
			const croppedFile = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });

			await userService.uploadAvatar(croppedFile);
			const fresh = await userService.getMyProfile();
			setProfile(fresh);
			setSuccess(t('profile.messages.avatarUploadSuccess'));
		} catch (e) {
			setError(e?.message || t('profile.messages.avatarUploadFailed'));
		} finally {
			setAvatarUploading(false);
			setImageSrcForCrop(null);
		}
	};

	const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Người dùng";
	const showSkeleton = loading && !profile;

	if (showSkeleton) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-1/3" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, idx) => (
						<Skeleton key={idx} className="h-32 w-full rounded-xl" />
					))}
				</div>
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
			{/* Statistics Cards */}
			{/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatsCard
					title={t('profile.stats.projectsCompleted')}
					value={userStats.projectsCompleted}
					icon={<FaProjectDiagram className="h-5 w-5" />}
					trend="+12%"
					trendUp={true}
					accent="indigo"
				/>
				<StatsCard
					title={t('profile.stats.tasksCompleted')}
					value={userStats.tasksCompleted}
					icon={<FaTasks className="h-5 w-5" />}
					trend="+8%"
					trendUp={true}
					accent="green"
				/>
				<StatsCard
					title={t('profile.stats.departmentsJoined')}
					value={userStats.departmentsJoined}
					icon={<FaBuilding className="h-5 w-5" />}
					trend="+1"
					trendUp={true}
					accent="orange"
				/>
				<StatsCard
					title={t('profile.stats.hoursWorked')}
					value={userStats.hoursWorked}
					icon={<FaClock className="h-5 w-5" />}
					trend="+15%"
					trendUp={true}
					accent="purple"
				/>
			</div> */}

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
				{/* Thông tin cơ bản - Chiếm 4/12 cột */}
				<div className="lg:col-span-4">
					<Card className="p-8 h-full">
						<div className="text-center">
							<div className="relative inline-block">
								<Avatar
									src={profile?.image || null}
									name={fullName}
									size={24}
									className="mx-auto"
								/>
								<label className={cn(
									"absolute bottom-0 right-0 h-10 w-10 rounded-full flex items-center justify-center transition-colors cursor-pointer",
									buttonColors.primary
								)}>
									<FaEdit className="h-5 w-5" />
									<input type="file" accept="image/*" className="hidden" onChange={handlePickAvatar} disabled={avatarUploading} />
								</label>
							</div>
							<h2 className={cn("mt-6 text-2xl font-semibold", textColors.primary)}>
								{fullName}
							</h2>
							{/* Role info removed - now in Account entity */}
							<div className="flex items-center gap-4 text-base">
								<FaEnvelope className={cn("h-5 w-5", textColors.muted)} />
								<span className={textColors.secondary}>{formData.email}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaPhone className={cn("h-5 w-5", textColors.muted)} />
								<span className={textColors.secondary}>{formData.phone}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaMapMarkerAlt className={cn("h-5 w-5", textColors.muted)} />
								<span className={textColors.secondary}>{formData.address}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaCalendarAlt className={cn("h-5 w-5", textColors.muted)} />
								<span className={textColors.secondary}>{profile?.dob ? new Date(profile.dob).toLocaleDateString() : ""}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaUsers className={cn("h-5 w-5", textColors.muted)} />
								<span className={textColors.secondary}>{profile?.gender === 'MALE' ? t('profile.gender.male') : profile?.gender === 'FEMALE' ? t('profile.gender.female') : (profile?.gender || '')}</span>
							</div>
							{/* Contract type removed - not in User entity */}
						</div>

						<div className={cn("mt-8 pt-6 border-t", borderColors.default)}>
							<div className={cn("flex items-center justify-between text-sm", textColors.muted)}>
								<span>{t('profile.fields.lastUpdated')}</span>
								<span>{profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : ""}</span>
							</div>
						</div>
					</Card>
				</div>

				{/* Chi tiết thông tin - Chiếm 8/12 cột */}
				<div className="lg:col-span-8">
		<Card className="p-8 h-full">
			<div className="flex items-center justify-between mb-8">
				<h3 className={cn("text-2xl font-semibold", textColors.primary)}>
					{t('profile.detailInfo')}
				</h3>
				{!isEditing ? (
					<Button
						onClick={() => setIsEditing(true)}
						className="flex items-center gap-2 text-base px-6 py-3"
					>
						<FaEdit className="h-5 w-5" />
						{t('profile.actions.edit')}
					</Button>
				) : (
					<div className="flex gap-3">
						<Button
							onClick={handleSave}
							className={cn("flex items-center gap-2 text-base px-6 py-3", buttonColors.success)}
						>
							<FaSave className="h-5 w-5" />
							{t('profile.actions.save')}
						</Button>
						<Button
							onClick={handleCancel}
							variant="outline"
							className="flex items-center gap-2 text-base px-6 py-3"
						>
							<FaTimes className="h-5 w-5" />
							{t('profile.actions.cancel')}
						</Button>
					</div>
				)}
			</div>
			
			<div className="space-y-8">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className={cn("block text-base font-medium mb-3", textColors.secondary)}>{t('profile.fields.fullName')}</label>
						<p className={cn("text-lg", textColors.primary)}>{formData.firstName} {formData.lastName}</p>
					</div>


					<div>
						<label className={cn("block text-base font-medium mb-3", textColors.secondary)}>{t('profile.fields.email')}</label>
						{isEditing ? (
							<Input
								type="email"
								value={formData.email}
								onChange={(e) => handleInputChange('email', e.target.value)}
								placeholder={t('profile.placeholders.enterEmail')}
								className="text-base py-3"
							/>
						) : (
							<p className={cn("text-lg", textColors.primary)}>{formData.email}</p>
						)}
					</div>							<div>
						<label className={cn("block text-base font-medium mb-3", textColors.secondary)}>
							{t('profile.fields.phone')}
						</label>
						{isEditing ? (
							<Input
								value={formData.phone}
								onChange={(e) => handleInputChange('phone', e.target.value)}
								placeholder={t('profile.placeholders.enterPhone')}
								className="text-base py-3"
							/>
						) : (
							<p className={cn("text-lg", textColors.primary)}>{formData.phone}</p>
						)}
					</div>

					<div>
						<label className={cn("block text-base font-medium mb-3", textColors.secondary)}>{t('profile.fields.personalID')}</label>
						<p className={cn("text-lg", textColors.primary)}>{profile?.personalID || ''}</p>
					</div>

					<div>
						<label className={cn("block text-base font-medium mb-3", textColors.secondary)}>{t('profile.fields.bankAccountNumber')}</label>
						{isEditing ? (
							<Input
								value={formData.bankAccountNumber}
								onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
								placeholder={t('profile.placeholders.enterBankAccount')}
								className="text-base py-3"
							/>
						) : (
							<p className={cn("text-lg", textColors.primary)}>{formData.bankAccountNumber}</p>
						)}
					</div>

					<div>
						<label className={cn("block text-base font-medium mb-3", textColors.secondary)}>{t('profile.fields.bankName')}</label>
						{isEditing ? (
							<Input
								value={formData.bankName}
								onChange={(e) => handleInputChange('bankName', e.target.value)}
								placeholder={t('profile.placeholders.enterBankName')}
								className="text-base py-3"
							/>
						) : (
							<p className={cn("text-lg", textColors.primary)}>{formData.bankName}</p>
						)}
					</div>							<div>
						<label className={cn("block text-base font-medium mb-3", textColors.secondary)}>
							{t('profile.fields.address')}
						</label>
						{isEditing ? (
							<Input
								value={formData.address}
								onChange={(e) => handleInputChange('address', e.target.value)}
								placeholder={t('profile.placeholders.enterAddress')}
								className="text-base py-3"
							/>
						) : (
							<p className={cn("text-lg", textColors.primary)}>{formData.address}</p>
						)}
					</div>

					<div>
						<label className={cn("block text-base font-medium mb-3", textColors.secondary)}>{t('profile.fields.dob')}</label>
						<p className={cn("text-lg", textColors.primary)}>{profile?.dob ? new Date(profile.dob).toLocaleDateString() : ''}</p>
					</div>

					<div>
						<label className={cn("block text-base font-medium mb-3", textColors.secondary)}>{t('profile.fields.gender')}</label>
						<p className={cn("text-lg", textColors.primary)}>{profile?.gender === 'MALE' ? t('profile.gender.male') : profile?.gender === 'FEMALE' ? t('profile.gender.female') : (profile?.gender || '')}</p>
					</div>

					{/* Fields removed: contractType, startDate, role (not in User entity) */}
				</div>
		</div>

		{/* Removed Giới thiệu bản thân section as requested */}
			</Card>
		</div>
	</div>

	{(loading || avatarUploading) && (
		<p className={cn("text-sm", textColors.muted)}>{t('profile.messages.loading')}</p>
	)}
	{error && (
		<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
	)}
	{success && (
		<p className="text-sm text-green-600 dark:text-green-400">{success}</p>
	)}

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
