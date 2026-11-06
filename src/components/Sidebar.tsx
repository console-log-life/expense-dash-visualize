import React from 'react';
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart, Wallet, FileText, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'transactions', label: 'Transactions', icon: FileText },
  { id: 'categories', label: 'Categories', icon: PieChart },
  { id: 'budgets', label: 'Budgets', icon: Wallet },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  return (
    <div className="w-64 shrink-0 bg-white/80 backdrop-blur-sm border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 flex-1">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Dashboard</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant={active ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  active ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
      <div className="p-6 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
        <p className="text-xs text-gray-500 truncate mb-3">{user?.email}</p>
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
