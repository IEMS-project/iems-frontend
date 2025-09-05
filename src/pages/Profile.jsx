import React, { useState } from "react";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaProjectDiagram, FaTasks, FaTrophy, FaChartLine, FaClock, FaUsers } from "react-icons/fa";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import { Card } from "../components/ui/Card";
import PageHeader from "../components/common/PageHeader";
import StatsCard from "../components/ui/StatsCard";

export default function Profile() {
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		name: "Nguyễn Văn A",
		email: "nguyenvana@example.com",
		phone: "0123456789",
		position: "Quản lý dự án",
		department: "Phòng Công nghệ thông tin",
		location: "Hà Nội, Việt Nam",
		bio: "Chuyên viên quản lý dự án với 5 năm kinh nghiệm trong lĩnh vực công nghệ thông tin. Đam mê tạo ra những sản phẩm chất lượng cao và đóng góp vào sự phát triển của tổ chức.",
		joinDate: "15/01/2020",
		lastActive: "Hôm nay"
	});

	// Mock data for statistics
	const userStats = {
		projectsCompleted: 24,
		tasksCompleted: 156,
		departmentsJoined: 3,
		hoursWorked: 1840
	};

	const handleInputChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleSave = () => {
		// Xử lý lưu thông tin
		console.log("Lưu thông tin:", formData);
		setIsEditing(false);
	};

	const handleCancel = () => {
		// Reset form về trạng thái ban đầu
		setIsEditing(false);
	};

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
									src={null} 
									name={formData.name} 
									size={24} 
									className="mx-auto"
								/>
								{isEditing && (
									<button className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
										<FaEdit className="h-5 w-5" />
									</button>
								)}
							</div>
							<h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
								{formData.name}
							</h2>
							<p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
								{formData.position}
							</p>
							<p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
								Tham gia từ {formData.joinDate}
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
								<span className="text-gray-600 dark:text-gray-300">{formData.location}</span>
							</div>
							<div className="flex items-center gap-4 text-base">
								<FaBuilding className="h-5 w-5 text-gray-400" />
								<span className="text-gray-600 dark:text-gray-300">{formData.department}</span>
							</div>
						</div>

						<div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
								<span>Hoạt động cuối</span>
								<span>{formData.lastActive}</span>
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
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
										Họ và tên
									</label>
									{isEditing ? (
										<Input
											value={formData.name}
											onChange={(e) => handleInputChange('name', e.target.value)}
											placeholder="Nhập họ và tên"
											className="text-base py-3"
										/>
									) : (
										<p className="text-lg text-gray-900 dark:text-gray-100">{formData.name}</p>
									)}
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
										Email
									</label>
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
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
										Vị trí
									</label>
									{isEditing ? (
										<Input
											value={formData.position}
											onChange={(e) => handleInputChange('position', e.target.value)}
											placeholder="Nhập vị trí"
											className="text-base py-3"
										/>
									) : (
										<p className="text-lg text-gray-900 dark:text-gray-100">{formData.position}</p>
									)}
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
										Phòng ban
									</label>
									{isEditing ? (
										<Input
											value={formData.department}
											onChange={(e) => handleInputChange('department', e.target.value)}
											placeholder="Nhập phòng ban"
											className="text-base py-3"
										/>
									) : (
										<p className="text-lg text-gray-900 dark:text-gray-100">{formData.department}</p>
									)}
								</div>

								<div>
									<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
										Địa chỉ
									</label>
									{isEditing ? (
										<Input
											value={formData.location}
											onChange={(e) => handleInputChange('location', e.target.value)}
											placeholder="Nhập địa chỉ"
											className="text-base py-3"
										/>
									) : (
										<p className="text-lg text-gray-900 dark:text-gray-100">{formData.location}</p>
									)}
								</div>
							</div>

							<div>
								<label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
									Giới thiệu bản thân
								</label>
								{isEditing ? (
									<Textarea
										value={formData.bio}
										onChange={(e) => handleInputChange('bio', e.target.value)}
										placeholder="Nhập giới thiệu về bản thân"
										rows={5}
										className="text-base py-3"
									/>
								) : (
									<p className="text-lg text-gray-900 dark:text-gray-100 leading-relaxed">{formData.bio}</p>
								)}
							</div>
						</div>
					</Card>
				</div>
			</div>

		</div>
	);
}
