"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, BarChart3, Shield, Gamepad2, X } from "lucide-react";

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    description: "Landing page with 3D Earth",
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    description: "Mission control center",
  },
  {
    name: "Impact Simulator",
    href: "/impact-simulator",
    icon: BarChart3,
    description: "Calculate asteroid impacts",
  },
  {
    name: "Mitigation Center",
    href: "/deflection",
    icon: Shield,
    description: "Plan deflection missions",
  },
];

export function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Asteroid Odyssey logo"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-white font-bold text-lg hidden sm:block">
              Asteroid Odyssey
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`text-white hover:text-white hover:bg-white/10 ${
                      isActive ? "bg-white/20" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 bg-slate-900 border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs opacity-70">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <div className="text-xs text-slate-400 text-center">
                  NASA Asteroid Defense System
                  <br />
                  Protecting Earth from cosmic threats
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
