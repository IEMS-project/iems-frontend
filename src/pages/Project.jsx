import React from "react";
import MainLayout from "../components/layout/MainLayout";
import ProjectHeader from "../components/project/ProjectHeader";
import ProjectDetails from "../components/project/ProjectDetails";
import Members from "../components/project/Members";
import Tasks from "../components/project/Tasks";
import Schedule from "../components/project/Schedule";

export default function Project() {
    return (
        <MainLayout>
            <div className="space-y-6">
                <ProjectHeader />
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <ProjectDetails />
                        <Tasks />
                    </div>
                    <div className="space-y-6">
                        <Members />
                        <Schedule />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}


