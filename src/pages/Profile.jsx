import React, { useEffect, useState } from "react";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaProjectDiagram, FaTasks, FaTrophy, FaChartLine, FaClock, FaUsers } from "react-icons/fa";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import { Card } from "../components/ui/Card";
import PageHeader from "../components/common/PageHeader";
import StatsCard from "../components/ui/StatsCard";
import { userService } from "../services/userService";

export default function Profile() {
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
		bankAccountNumber: "",
		bankName: "",
	});

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
					bankAccountNumber: data?.bankAccountNumber || "",
					bankName: data?.bankName || "",
				});
			} catch (e) {
				setError(e?.message || "Tải hồ sơ thất bại");
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
				bankAccountNumber: formData.bankAccountNumber,
				bankName: formData.bankName,
			};
			const updated = await userService.updateMyProfile(payload);
			setProfile(updated);
			setSuccess("Cập nhật hồ sơ thành công");
			setIsEditing(false);
		} catch (e) {
			setError(e?.message || "Cập nhật thất bại");
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
		try {
			setAvatarUploading(true);
			setError("");
			setSuccess("");
			await userService.uploadAvatar(file);
			const fresh = await userService.getMyProfile();
			setProfile(fresh);
			setSuccess("Cập nhật ảnh đại diện thành công");
		} catch (e) {
			setError(e?.message || "Tải ảnh thất bại");
		} finally {
			setAvatarUploading(false);
		}
	};

	const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Người dùng";

	return (
		<div className="space-y-6">
			<PageHeader
				title="Hồ sơ cá nhân"
				subtitle="Quản lý thông tin tài khoản của bạn"
			/>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatsCard
					title="Dự án hoàn thành"
					value={userStats.projectsCompleted}
					icon={<FaProjectDiagram className="h-6 w-6" />}
					trend="+12%"
					trendUp={true}
				/>
				<StatsCard
					title="Nhiệm vụ hoàn thành"
					value={userStats.tasksCompleted}
					icon={<FaTasks className="h-6 w-6" />}
					trend="+8%"
					trendUp={true}
				/>
				<StatsCard
					title="Phòng ban tham gia"
					value={userStats.departmentsJoined}
					icon={<FaBuilding className="h-6 w-6" />}
					trend="+1"
					trendUp={true}
				/>
				<StatsCard
					title="Giờ làm việc"
					value={userStats.hoursWorked}
					icon={<FaClock className="h-6 w-6" />}
					trend="+15%"
					trendUp={true}
				/>
			</div>

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
								<label className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
									<FaEdit className="h-5 w-5" />
									<input type="file" accept="image/*" className="hidden" onChange={handlePickAvatar} disabled={avatarUploading} />
								</label>
							</div>
							<h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
								{fullName}
							</h2>
							<p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
								{profile?.role || ""}
							</p>
							<p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
								{profile?.startDate ? `Tham gia từ ${new Date(profile.startDate).toLocaleDateString()}` : null}
							</p>
						</div>

						<div className="mt-8 space-y-4">
							<div className="flex items-center gap-4 text-base">
								<FaEnvelope className="h-5 w-5 text-gray-400" />
								<span className="text-gray-600 dark:text-gray-300">{formData.email}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaPhone className="h-5 w-5 text-gray-400" />
								<span className="text-gray-600 dark:text-gray-300">{formData.phone}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
								<span className="text-gray-600 dark:text-gray-300">{formData.address}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaCalendarAlt className="h-5 w-5 text-gray-400" />
								<span className="text-gray-600 dark:text-gray-300">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : ""}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaUsers className="h-5 w-5 text-gray-400" />
								<span className="text-gray-600 dark:text-gray-300">{profile?.gender === 'MALE' ? 'Nam' : profile?.gender === 'FEMALE' ? 'Nữ' : (profile?.gender || '')}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaBuilding className="h-5 w-5 text-gray-400" />
								<span className="text-gray-600 dark:text-gray-300">{
									profile?.contractType === 'FULLTIME' ? 'Toàn thời gian' :
										profile?.contractType === 'PARTTIME' ? 'Bán thời gian' :
											profile?.contractType === 'CONTRACT' ? 'Hợp đồng' : (profile?.contractType || '')
								}</span>
							</div>
						</div>

						<div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
								<span>Cập nhật lần cuối</span>
								<span>{profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : ""}</span>
							</div>
						</div>
					</Card>
				</div>

				{/* Chi tiết thông tin - Chiếm 8/12 cột */}
				<div className="lg:col-span-8">
					<Card className="p-8 h-full">
						<div className="flex items-center justify-between mb-8">
							<h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
								Thông tin chi tiết
							</h3>
							{!isEditing ? (
								<Button
									onClick={() => setIsEditing(true)}
									className="flex items-center gap-2 text-base px-6 py-3"
								>
									<FaEdit className="h-5 w-5" />
									Chỉnh sửa
								</Button>
							) : (
								<div className="flex gap-3">
									<Button
										onClick={handleSave}
										className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-base px-6 py-3"
									>
										<FaSave className="h-5 w-5" />
										Lưu
									</Button>
									<Button
										onClick={handleCancel}
										variant="outline"
										className="flex items-center gap-2 text-base px-6 py-3"
									>
										<FaTimes className="h-5 w-5" />
										Hủy
									</Button>
								</div>
							)}
						</div>

						<div className="space-y-8">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Họ và tên</label>
									<p className="text-lg text-gray-900 dark:text-gray-100">{formData.firstName} {formData.lastName}</p>
								</div>


								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Email</label>
									{isEditing ? (
										<Input
											type="email"
											value={formData.email}
											onChange={(e) => handleInputChange('email', e.target.value)}
											placeholder="Nhập email"
											className="text-base py-3"
										/>
									) : (
										<p className="text-lg text-gray-900 dark:text-gray-100">{formData.email}</p>
									)}
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
										Số điện thoại
									</label>
									{isEditing ? (
										<Input
											value={formData.phone}
											onChange={(e) => handleInputChange('phone', e.target.value)}
											placeholder="Nhập số điện thoại"
											className="text-base py-3"
										/>
									) : (
										<p className="text-lg text-gray-900 dark:text-gray-100">{formData.phone}</p>
									)}
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">CMND/CCCD</label>
									<p className="text-lg text-gray-900 dark:text-gray-100">{profile?.personalID || ''}</p>
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Số tài khoản</label>
									{isEditing ? (
										<Input
											value={formData.bankAccountNumber}
											onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
											placeholder="Nhập số tài khoản"
											className="text-base py-3"
										/>
									) : (
										<p className="text-lg text-gray-900 dark:text-gray-100">{formData.bankAccountNumber}</p>
									)}
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Ngân hàng</label>
									{isEditing ? (
										<Input
											value={formData.bankName}
											onChange={(e) => handleInputChange('bankName', e.target.value)}
											placeholder="Nhập ngân hàng"
											className="text-base py-3"
										/>
									) : (
										<p className="text-lg text-gray-900 dark:text-gray-100">{formData.bankName}</p>
									)}
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
										Địa chỉ
									</label>
									{isEditing ? (
										<Input
											value={formData.address}
											onChange={(e) => handleInputChange('address', e.target.value)}
											placeholder="Nhập địa chỉ"
											className="text-base py-3"
										/>
									) : (
										<p className="text-lg text-gray-900 dark:text-gray-100">{formData.address}</p>
									)}
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Ngày sinh</label>
									<p className="text-lg text-gray-900 dark:text-gray-100">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : ''}</p>
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Giới tính</label>
									<p className="text-lg text-gray-900 dark:text-gray-100">{profile?.gender === 'MALE' ? 'Nam' : profile?.gender === 'FEMALE' ? 'Nữ' : (profile?.gender || '')}</p>
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Loại hợp đồng</label>
									<p className="text-lg text-gray-900 dark:text-gray-100">{
										profile?.contractType === 'FULLTIME' ? 'Toàn thời gian' :
											profile?.contractType === 'PARTTIME' ? 'Bán thời gian' :
												profile?.contractType === 'CONTRACT' ? 'Hợp đồng' : (profile?.contractType || '')
									}</p>
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Ngày bắt đầu</label>
									<p className="text-lg text-gray-900 dark:text-gray-100">{profile?.startDate ? new Date(profile.startDate).toLocaleDateString() : ''}</p>
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Chức vụ</label>
									<p className="text-lg text-gray-900 dark:text-gray-100">{profile?.role || ''}</p>
								</div>
							</div>

							{/* Removed Giới thiệu bản thân section as requested */}
						</div>
					</Card>
				</div>
			</div>

			{(loading || avatarUploading) && (
				<p className="text-sm text-gray-500">Đang xử lý...</p>
			)}
			{error && (
				<p className="text-sm text-red-600">{error}</p>
			)}
			{success && (
				<p className="text-sm text-green-600">{success}</p>
			)}
		</div>
	);
}
