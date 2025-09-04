import React from "react";
import { Card, CardContent } from "../ui/Card";
import { useNavigate } from "react-router-dom";

export default function DepartmentCard({ department }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/teams/${department.id}`);
    };

    return (
        <div onClick={handleClick} className="group cursor-pointer">
            <Card className="h-32 hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-1 h-full justify-between">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{department.name}</h3>
                        <div className="text-2xl font-bold text-blue-600">{department.memberCount}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">thành viên</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


