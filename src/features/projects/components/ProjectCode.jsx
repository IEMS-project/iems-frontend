import React from "react";
import { Routes, Route } from "react-router-dom";
import RepositoryList from "./code/RepositoryList";
import RepositoryCodeViewer from "./code/RepositoryCodeViewer";

export default function ProjectCode() {
    return (
        <Routes>
            <Route index element={<RepositoryList />} />
            <Route path=":repoId" element={<RepositoryCodeViewer />} />
        </Routes>
    );
}
