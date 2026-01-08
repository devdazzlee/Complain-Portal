"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "../context/AppContext";
import Logo from "./Logo";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Bell,
  Search,
  BarChart3,
  User,
  Settings,
  HelpCircle,
  Users,
  Workflow,
} from "lucide-react";

interface SidebarProps {
  role: "provider" | "admin";
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export default function Sidebar({ role, isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useApp();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth < 768 && isOpen) {
        const target = event.target as HTMLElement;
        if (
          !target.closest("aside") &&
          !target.closest('button[aria-label="Toggle menu"]') &&
          !target.closest('header')
        ) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const providerMenuItems = [
    { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/provider/complaints", label: "My Complaints", icon: FileText },
    {
      href: "/provider/complaints/new",
      label: "New Complaint",
      icon: PlusCircle,
    },
    { href: "/provider/notifications", label: "Notifications", icon: Bell },
    { href: "/provider/search", label: "Advanced Search", icon: Search },
    {
      href: "/provider/reports",
      label: "Reports & Analytics",
      icon: BarChart3,
    },
    { href: "/provider/profile", label: "My Profile", icon: User },
    { href: "/provider/settings", label: "Settings", icon: Settings },
    { href: "/provider/help", label: "Help & Support", icon: HelpCircle },
  ];

  const adminMenuItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/complaints", label: "All Complaints", icon: FileText },
    {
      href: "/admin/complaints/new",
      label: "New Complaint",
      icon: PlusCircle,
    },
    {
      href: "/admin/assignments",
      label: "Assignment Workflow",
      icon: Workflow,
    },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/search", label: "Advanced Search", icon: Search },
    { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
    { href: "/admin/profile", label: "My Profile", icon: User },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const menuItems = role === "provider" ? providerMenuItems : adminMenuItems;

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/provider/dashboard" || href === "/admin/dashboard") {
      return pathname === href;
    }
    if (pathname === href) return true;
    if (href === "/provider/complaints") {
      return (
        pathname.startsWith("/provider/complaints/") &&
        !pathname.startsWith("/provider/complaints/new")
      );
    }
    if (href === "/admin/complaints") {
      return (
        pathname.startsWith("/admin/complaints/") &&
        !pathname.startsWith("/admin/complaints/new")
      );
    }
    return pathname.startsWith(`${href}/`);
  };

  const dashboardPath =
    role === "provider" ? "/provider/dashboard" : "/admin/dashboard";

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out flex flex-col border-r w-[260px] md:w-[280px] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          backgroundColor: "#1F2022",
          borderColor: "#2A2B30",
        }}
      >
        {/* Logo - Mobile and Desktop */}
        <div
          className="flex items-center p-4 sm:p-5 md:p-6 border-b"
          style={{ borderColor: "#2A2B30" }}
        >
          <Link
            href={dashboardPath}
            className="flex items-center gap-2 sm:gap-3"
            onClick={() => setIsOpen(false)}
          >
            <Logo size="md" showText={true} />
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsOpen(false);
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base md:text-lg"
                style={{
                  color: active ? "#FFFFFF" : "#E6E6E6",
                  backgroundColor: active ? "#2AB3EE" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "#2A2B30";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile Section - Always at bottom */}
        <div
          className="p-4 border-t mt-auto"
          style={{ borderColor: "#2A2B30", backgroundColor: "#1F2022" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: "#2AB3EE", color: "#E6E6E6" }}
            >
              {currentUser?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="font-semibold text-sm truncate"
                style={{ color: "#E6E6E6" }}
              >
                {currentUser?.name || "User"}
              </p>
              <p
                className="text-xs truncate capitalize"
                style={{ color: "#E6E6E6", opacity: 0.7 }}
              >
                {currentUser?.role || "provider"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
