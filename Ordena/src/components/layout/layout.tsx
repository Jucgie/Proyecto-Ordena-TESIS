import React from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Sidebar />
            <Topbar />
            <main
                style={{
                    position: "relative",
                    marginLeft: "200px",      // espacio para el sidebar
                    paddingTop: "64px",       // espacio para el topbar
                    width: "calc(100vw - 200px)",
                    minHeight: "calc(100vh - 64px)",
                    background: "#181818",
                    boxSizing: "border-box",
                    overflowX: "auto"
                }}
            >
                {children}
            </main>
        </div>
    );
}