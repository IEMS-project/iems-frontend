import React from "react";
import Members from "../../components/project/Members";
import ProjectRoles from "../../components/project/ProjectRoles";

export default function ProjectMembersPage() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Members Section */}
                <Members />

                {/* Roles Section */}
                <ProjectRoles />
            </div>
        </div>
    );
}

