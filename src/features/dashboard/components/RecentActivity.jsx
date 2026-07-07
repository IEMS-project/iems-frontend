import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { projectService } from "@/features/projects/api/projectService";
import Skeleton from "@/components/ui/skeleton";
import SectionHeader from "@/components/ui/SectionHeader";
import ActivityTimeline from "@/features/dashboard/components/ActivityTimeline";

function getActivityContent(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.data?.content)) return response.data.content;
    return [];
}

export default function RecentActivity({ className = "" }) {
    const { t } = useTranslation();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const response = await projectService.getRecentActivities(0, 5);
                setActivities(getActivityContent(response));
            } catch (error) {
                console.error("Failed to load activities:", error);
                setActivities([]);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    return (
        <Card className={`overflow-hidden rounded-2xl border-border bg-card shadow-sm ${className}`}>
            <CardHeader className="pb-3">
                <SectionHeader
                    icon={Activity}
                    title={t("dashboard.recentActivity.title")}
                />
            </CardHeader>
            <CardContent className="pt-0">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="flex items-start gap-3">
                                <Skeleton className="h-8 w-8 shrink-0 rounded-2xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3 w-3/4" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <ActivityTimeline activities={activities} />
                )}
            </CardContent>
        </Card>
    );
}
