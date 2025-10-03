import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import PageHeader from "../components/common/PageHeader";

export default function PermissionDenied() {
    const navigate = useNavigate();

    const handleGoBack = () => navigate("/projects");
    const handleGoHome = () => navigate("/dashboard");

    return (
        <div className="p-6">
            <PageHeader
                breadcrumbs={[
                    { label: "Lỗi", to: "/dashboard" },
                    { label: "Không có quyền truy cập" },
                ]}
            />

            <Card className="text-center mt-6">
                <div className="p-8">
                    {/* Icon */}
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
                        <svg
                            className="h-12 w-12 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Không có quyền truy cập
                    </h1>

                    {/* Description */}
                    <p className="text-gray-600 mb-8">
                        Xin lỗi, bạn không có quyền truy cập vào trang này.
                        Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button variant="outline" onClick={handleGoBack}>
                            Quay lại
                        </Button>
                        <Button onClick={handleGoHome}>
                            Về trang chủ
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}


