import React from "react";
import ProjectDetails from "../components/project/ProjectDetails";
import Members from "../components/project/Members";
import Tasks from "../components/project/Tasks";
import Schedule from "../components/project/Schedule";
import ProjectRoles from "../components/project/ProjectRoles";
import PageHeader from "../components/common/PageHeader";

export default function Project() {
    return (
        <div className="space-y-6">
            <PageHeader
                breadcrumbs={[
                    { label: "Dự án", to: "/projects" },
                    { label: "Chi tiết dự án" },
                ]}
            />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <ProjectDetails />
                    <Tasks />
                </div>
                <div className="space-y-6">
                    <Members />
                    <Schedule />
                    <ProjectRoles />
                </div>
            </div>
        </div>
    );
}