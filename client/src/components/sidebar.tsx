import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { 
  History, 
  CreditCard, 
  UserPlus, 
  Settings, 
  Headphones, 
  Shield, 
  LogOut,
  Star
} from "lucide-react";
import type { User } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDriverMode, setIsDriverMode] = useState(user.isDriverActive || false);

  const toggleDriverStatusMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      return await apiRequest('PATCH', '/api/drivers/status', { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Driver Status Updated",
        description: `Driver mode ${isDriverMode ? 'activated' : 'deactivated'}`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update driver status",
        variant: "destructive",
      });
      // Revert the switch state on error
      setIsDriverMode(!isDriverMode);
    },
  });

  const handleDriverModeToggle = (checked: boolean) => {
    setIsDriverMode(checked);
    toggleDriverStatusMutation.mutate(checked);
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const menuItems = [
    {
      icon: History,
      label: "Trip History",
      path: "/trips",
      testId: "nav-trip-history"
    },
    {
      icon: CreditCard,
      label: "Payment Methods",
      path: "/payment-methods",
      testId: "nav-payment-methods"
    },
    {
      icon: UserPlus,
      label: "Invite Friends",
      path: "/invite",
      testId: "nav-invite-friends"
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
      testId: "nav-settings"
    },
    {
      icon: Headphones,
      label: "Help & Support",
      path: "/support",
      testId: "nav-support"
    },
    {
      icon: Shield,
      label: "Safety",
      path: "/safety",
      testId: "nav-safety"
    },
    {
      icon: LogOut,
      label: "Sign Out",
      path: "logout",
      testId: "nav-logout"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-60" data-testid="sidebar-overlay">
      <div className="flex h-full">
        {/* Overlay */}
        <div 
          className="flex-1 bg-black/50" 
          onClick={onClose}
          data-testid="sidebar-backdrop"
        />
        
        {/* Sidebar Content */}
        <div className="w-80 bg-white shadow-2xl">
          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="User profile"
                  className="w-16 h-16 rounded-full object-cover"
                  data-testid="img-user-profile"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">
                    {user.firstName?.[0] || user.email?.[0] || 'U'}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-brand-dark" data-testid="text-user-name">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email?.split('@')[0] || 'User'
                  }
                </h3>
                <p className="text-gray-medium" data-testid="text-user-email">
                  {user.email || 'No email'}
                </p>
                {user.rating !== undefined && user.rating !== null && user.rating > 0 && (
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-status-warning fill-current" />
                    <span className="text-sm ml-1" data-testid="text-user-rating">
                      {user.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="p-6">
            <nav className="space-y-2">
              {menuItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => item.path === 'logout' ? handleLogout() : handleNavigation(item.path)}
                  className="w-full flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  data-testid={item.testId}
                >
                  <item.icon className="h-6 w-6 text-brand-green" />
                  <span className="font-medium text-brand-dark">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Driver Mode Toggle */}
            <div className="mt-8 p-4 bg-gray-light rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-brand-dark">Driver Mode</p>
                  <p className="text-sm text-gray-medium">
                    {isDriverMode ? 'You are available for rides' : 'Start earning today'}
                  </p>
                </div>
                <Switch
                  checked={isDriverMode}
                  onCheckedChange={handleDriverModeToggle}
                  disabled={toggleDriverStatusMutation.isPending}
                  data-testid="switch-driver-mode"
                />
              </div>
              {user.userType === 'driver' && (
                <Button
                  onClick={() => handleNavigation('/driver')}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  data-testid="button-driver-dashboard"
                >
                  Driver Dashboard
                </Button>
              )}
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
