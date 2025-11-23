import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Calendar from "../ui/Calendar";
import { useParams } from "react-router-dom";

export default function Schedule() {
    const { projectId } = useParams();
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Thời gian biểu</CardTitle>
            </CardHeader>
            <CardContent>
                <Calendar projectId={projectId} />
            </CardContent>
        </Card>
    );
}




