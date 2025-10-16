import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Calendar from "../ui/Calendar";

export default function Schedule() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Thời gian biểu</CardTitle>
            </CardHeader>
            <CardContent>
                <Calendar />
            </CardContent>
        </Card>
    );
}




