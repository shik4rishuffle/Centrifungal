"use client";
import { useEffect } from "react";
export default function AdminRedirect() {
  useEffect(() => { window.location.replace("/admin/index.html"); }, []);
  return <p style={{ padding: 32 }}>Opening the editor... <a href="/admin/index.html">click here if nothing happens</a>.</p>;
}
