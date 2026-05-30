import StatusBadge from "@/components/ui/StatusBadge";
import ProjectAvatar from "@/features/projects/components/ProjectAvatar";

export default function ProjectOverviewTable({
    projects,
    labels,
    formatStatus,
    formatDate,
    onProjectClick,
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
                <table className="min-w-full text-[13px]">
                    <thead className="bg-muted/50 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2.5 font-semibold">{labels.project}</th>
                            <th className="px-3 py-2.5 font-semibold">{labels.status}</th>
                            <th className="px-3 py-2.5 font-semibold">{labels.deadline}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {projects.map((project) => {
                            const projectId = project.id || project.projectId;

                            return (
                                <tr
                                    key={projectId}
                                    onClick={() => onProjectClick(projectId)}
                                    className="group cursor-pointer transition-colors hover:bg-muted/45"
                                >
                                    <td className="min-w-64 px-3 py-2.5">
                                        <div className="flex items-center gap-3">
                                            <ProjectAvatar project={project} size="sm" />
                                            <div className="min-w-0">
                                                <div className="truncate font-semibold text-foreground group-hover:text-primary">
                                                    {project.name || project.title || labels.na}
                                                </div>
                                                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                                    {project.projectKey || labels.project}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5">
                                        <StatusBadge status={formatStatus(project.status)} />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                                        {formatDate(project.endDate || project.dueDate || project.due)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
