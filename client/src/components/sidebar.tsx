import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Grid3x3, 
  Download, 
  Settings,
  Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Services", href: "/services", icon: Grid3x3 },
  { name: "Export Data", href: "/export", icon: Download },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Customer Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Client & Payment System</p>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href} className={cn(
                  "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                  isActive 
                    ? "text-primary bg-blue-50" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">System Status</h3>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
