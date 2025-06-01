import Sidebar from "./sidebar";
import Topbar from "./topbar";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Sidebar />
            <Topbar />
            <div
                style={{
                    marginLeft: "200px", // deja espacio para el sidebar fijo
                    marginTop: "64px",   // deja espacio para el topbar fijo
                    padding: "1rem",
                    minHeight: "calc(100vh - 64px)",
                    boxSizing: "border-box",
                }}
            >
                {children}
            </div>
        </>
    );
}