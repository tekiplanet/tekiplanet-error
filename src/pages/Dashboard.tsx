import { useState, useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Home, BookOpen, Briefcase, ShoppingBag, Wallet, Settings, LogOut, UserCircle2, GraduationCap, Menu, ArrowLeft, Bell, ChevronDown, ShoppingCart, Package, BrainCircuit, Calendar, Building2, LayoutDashboard, CreditCard, Users } from "lucide-react"
import { useNavigate, Routes, Route, useLocation, Outlet } from "react-router-dom"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import useAuthStore from '@/store/useAuthStore';
import StudentDashboard from "@/components/dashboard/StudentDashboard"
import BusinessDashboard from "@/components/dashboard/BusinessDashboard"
import ProfessionalDashboard from "@/components/dashboard/ProfessionalDashboard"
import Academy from "./Academy"
import WalletDashboard from "@/components/wallet/WalletDashboard"
import CourseDetails from "@/components/academy/CourseDetails"
import MyCourses from "@/pages/MyCourses"
import CourseManagement from "@/pages/CourseManagement"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Header from '../components/Header';
import SettingsPage from "./Settings"
import ServicesPage from "./Services"
import ServiceQuoteRequestPage from "./ServiceQuoteRequest"
import SoftwareEngineeringQuote from "./SoftwareEngineeringQuote"
import CyberSecurityQuote from "./CyberSecurityQuote"
import { FileText, Server } from "lucide-react"
import QuoteRequestsListPage from "./QuoteRequestsList"
import QuoteDetailsPage from "./QuoteDetails"
import ProjectsListPage from "./ProjectsList"
import ProjectDetailsPage from "./ProjectDetails"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import ThemeToggle from '@/components/ThemeToggle'
import PaymentConfirmation from "@/pages/PaymentConfirmation";
import TransactionDetails from "@/pages/TransactionDetails";
import Store from "./Store";
import Cart from "./Cart";
import ProductDetails from "./ProductDetails";
import Checkout from "./Checkout";
import Orders from "./Orders";
import OrderTracking from "./OrderTracking";
import Products from "./Products";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storeService } from '@/services/storeService';
import ITConsulting from "./ITConsulting";
import ConsultingBookings from "./ConsultingBookings";
import ConsultingBookingDetails from "./ConsultingBookingDetails";
import PullToRefresh from 'react-simple-pull-to-refresh';
import { Loader2 } from "lucide-react";
import { businessService } from '@/services/businessService';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  submenu?: MenuItem[];
  show?: boolean;
}

const Dashboard = ({ children }: { children?: React.ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, updateUserType } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    
    toast.success("Logged out successfully");
    navigate("/login");
  }

  const { data: cartCount = 0 } = useQuery({
    queryKey: ['cartCount'],
    queryFn: storeService.getCartCount,
    initialData: 0
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['business-profile'],
    queryFn: businessService.checkProfile,
    retry: false,
    enabled: true,
    onSuccess: (data) => {
      console.log('Business Profile Data:', data);
    },
    onError: (error) => {
      console.log('Business Profile Error:', error);
    }
  });

  const handleProfileSwitch = async (type: 'student' | 'business' | 'professional') => {
    try {
      await updateUserType(type);
      
      // Close any open menus/sheets
      setIsSheetOpen(false);
      
      // Show success message
      toast.success(`Switched to ${type} profile`);
      
      // Refresh the page to update the dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to switch profile:', error);
      toast.error('Failed to switch profile');
    }
  };

  const renderDashboard = () => {
    if (!user) {
      return <div>Loading dashboard...</div>;
    }

    console.log('Render Dashboard:', {
      accountType: user.account_type,
      user
    });

    switch (user.account_type) {
      case "student":
        return <StudentDashboard />;
      case "business":
        return <BusinessDashboard />;
      case "professional":
        return <ProfessionalDashboard />;
      default:
        return <div>Loading dashboard...</div>;
    }
  }

  const getPageTitle = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return "Dashboard";
    return segments[1].charAt(0).toUpperCase() + segments[1].slice(1);
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsSheetOpen(false); // Close the sheet when menu item is clicked
  };

  const handleFundWallet = async () => {
    try {
      console.log('Fund Wallet Clicked', { amount: 1000, paymentMethod: 'bank-transfer' });
      console.log('Navigating to payment confirmation page...');
      
      if (!1000) {
        toast.error('Please enter an amount');
        return;
      }

      navigate('/dashboard/payment-confirmation', { 
        state: { 
          amount: 1000, 
          paymentMethod: 'bank-transfer'.toLowerCase() 
        } 
      });
      console.log('Navigation successful');
    } catch (error) {
      console.error('Fund Wallet Error:', error);
      toast.error('Failed to process wallet funding');
    }
  };

  const menuItems: MenuItem[] = [
    // MAIN NAVIGATION
    {
      label: "Wallet",
      path: "/dashboard/wallet",
      icon: <Wallet className="w-4 h-4" />
    },
    {
      label: "Services",
      path: "/dashboard/services",
      icon: <Briefcase className="w-4 h-4" />
    },
    {
      label: 'IT Consulting',
      path: '/dashboard/it-consulting',
      icon: <BrainCircuit className="h-5 w-5" />
    },
    {
      label: "Quotes",
      path: "/dashboard/quotes",
      icon: <FileText className="w-4 h-4" />
    },

    // LEARNING
    {
      label: "Academy",
      path: "/dashboard/academy",
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      label: "My Courses",
      path: "/dashboard/academy/my-courses",
      icon: <GraduationCap className="w-4 h-4" />
    },

    // BUSINESS
    {
      path: '/dashboard/business/customers',
      label: 'Customers',
      icon: <Users className="h-5 w-5" />,
      show: user?.account_type === 'business'
    },
    {
      label: "Projects",
      path: "/dashboard/projects",
      icon: <Server className="w-4 h-4" />
    },

    // PROFESSIONAL
    {
      path: '/dashboard/workstation/plans',
      label: 'Workstation',
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      label: "Hustles",
      path: "/dashboard/hustles",
      icon: <Briefcase className="h-4 w-4" />,
      badge: "New"
    },

    // SHOP
    {
      label: "Store",
      path: "/dashboard/store",
      icon: <ShoppingBag className="w-4 h-4" />
    },
    {
      label: "Cart",
      path: "/dashboard/cart",
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: cartCount > 0 ? cartCount.toString() : undefined
    },
    {
      label: "Orders",
      path: "/dashboard/orders",
      icon: <Package className="w-4 h-4" />
    }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        // User & Auth
        queryClient.invalidateQueries({ queryKey: ['user'] }),
        queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['professional-profile'] }),
        
        // Wallet & Transactions
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        
        // Store & Cart
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
        queryClient.invalidateQueries({ queryKey: ['cartCount'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        
        // Courses & Academy
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['enrolled-courses'] }),
        queryClient.invalidateQueries({ queryKey: ['course-details'] }),
        queryClient.invalidateQueries({ queryKey: ['course-modules'] }),
        queryClient.invalidateQueries({ queryKey: ['course-progress'] }),
        
        // Business
        queryClient.invalidateQueries({ queryKey: ['business-customers'] }),
        queryClient.invalidateQueries({ queryKey: ['business-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['business-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['business-profile'] }),
        
        // Hustles
        queryClient.invalidateQueries({ queryKey: ['hustles'] }),
        queryClient.invalidateQueries({ queryKey: ['my-applications'] }),
        
        // Services & Quotes
        queryClient.invalidateQueries({ queryKey: ['service-quotes'] }),
        queryClient.invalidateQueries({ queryKey: ['quote-requests'] }),
        
        // Settings
        queryClient.invalidateQueries({ queryKey: ['settings'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),

        // Course Management
        queryClient.invalidateQueries({ queryKey: ['course-enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['course-notices'] }),
        queryClient.invalidateQueries({ queryKey: ['course-exams'] }),
        queryClient.invalidateQueries({ queryKey: ['user-courses'] }),
        queryClient.invalidateQueries({ queryKey: ['learning-stats'] }),

        // Business Dashboard
        queryClient.invalidateQueries({ queryKey: ['business-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['business-activities'] }),
        queryClient.invalidateQueries({ queryKey: ['business-revenue'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-transactions'] }),

        // Consulting
        queryClient.invalidateQueries({ queryKey: ['consulting-bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-slots'] }),
        queryClient.invalidateQueries({ queryKey: ['available-consultants'] }),
        queryClient.invalidateQueries({ queryKey: ['consulting-services'] }),
        queryClient.invalidateQueries({ queryKey: ['consultation-history'] }),

        // Workstation
        queryClient.invalidateQueries({ queryKey: ['workstation-plans'] }),
        queryClient.invalidateQueries({ queryKey: ['active-subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['workspace-usage'] }),

        // Quote Requests
        queryClient.invalidateQueries({ queryKey: ['quote-requests-list'] }),

        // Force refresh user data
        useAuthStore.getState().refreshToken()
      ]);

      toast.success("Content refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  console.log('Menu Rendering Check:', {
    hasProfile: !!profileData,
    status: profileData?.status,
    shouldShow: profileData && profileData.status === 'active'
  });

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col border-r">
          <div className="flex flex-col h-full">
            {/* Fixed Header - User Profile Section */}
            <div className="border-b px-6 py-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                    <AvatarImage 
                      src={user?.avatar} 
                      alt={user?.username || `${user?.first_name} ${user?.last_name}`} 
                    />
                    <AvatarFallback>
                      {user?.username 
                        ? user.username.charAt(0).toUpperCase() 
                        : (user?.first_name 
                          ? user.first_name.charAt(0).toUpperCase() 
                          : '?')
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="truncate text-sm font-medium">
                    {user?.username || 
                     (user?.first_name && user?.last_name 
                       ? `${user.first_name} ${user.last_name}` 
                       : user?.first_name || 
                         user?.last_name || 
                         user?.email || 
                         'User')}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email || 'No email'}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="flex-1 space-y-1 px-4 py-2 overflow-y-auto">
                {/* Main Navigation */}
                {menuItems.slice(0, 4).map((item) => (
                  <Button
                    key={item.path}
                    variant={location.pathname === item.path ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-11 gap-3",
                      "transition-all duration-200",
                      location.pathname === item.path ? 
                        "bg-primary/10 hover:bg-primary/15" : 
                        "hover:bg-muted/50",
                      "rounded-lg"
                    )}
                    onClick={() => {
                      navigate(item.path);
                      setIsSheetOpen(false);
                    }}
                  >
                    <div className={cn(
                      "p-1.5 rounded-md",
                      location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                    )}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}

                {/* Learning */}
                {user?.account_type === 'student' && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">Learning</h4>
                    {menuItems.slice(4, 6).map((item) => (
                      <Button
                        key={item.path}
                        variant={location.pathname === item.path ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-11 gap-3",
                          "transition-all duration-200",
                          location.pathname === item.path ? 
                            "bg-primary/10 hover:bg-primary/15" : 
                            "hover:bg-muted/50",
                          "rounded-lg"
                        )}
                        onClick={() => {
                          navigate(item.path);
                          setIsSheetOpen(false);
                        }}
                      >
                        <div className={cn(
                          "p-1.5 rounded-md",
                          location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                        )}>
                          {item.icon}
                        </div>
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Business - Shows only if user has active business profile */}
                {profileData?.has_profile && profileData?.profile?.status === 'active' && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">Business</h4>
                    {menuItems.slice(6, 8).map((item) => (
                      <Button
                        key={item.path}
                        variant={location.pathname === item.path ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-11 gap-3",
                          "transition-all duration-200",
                          location.pathname === item.path ? 
                            "bg-primary/10 hover:bg-primary/15" : 
                            "hover:bg-muted/50",
                          "rounded-lg"
                        )}
                        onClick={() => {
                          navigate(item.path);
                          setIsSheetOpen(false);
                        }}
                      >
                        <div className={cn(
                          "p-1.5 rounded-md",
                          location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                        )}>
                          {item.icon}
                        </div>
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Professional */}
                {user?.account_type === 'professional' && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">Professional</h4>
                    {menuItems.slice(8, 10).map((item) => (
                      <Button
                        key={item.path}
                        variant={location.pathname === item.path ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-11 gap-3",
                          "transition-all duration-200",
                          location.pathname === item.path ? 
                            "bg-primary/10 hover:bg-primary/15" : 
                            "hover:bg-muted/50",
                          "rounded-lg"
                        )}
                        onClick={() => {
                          navigate(item.path);
                          setIsSheetOpen(false);
                        }}
                      >
                        <div className={cn(
                          "p-1.5 rounded-md",
                          location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                        )}>
                          {item.icon}
                        </div>
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Shop */}
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">Shop</h4>
                  {menuItems.slice(10).map((item) => (
                    <Button
                      key={item.path}
                      variant={location.pathname === item.path ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-11 gap-3",
                        "transition-all duration-200",
                        location.pathname === item.path ? 
                          "bg-primary/10 hover:bg-primary/15" : 
                          "hover:bg-muted/50",
                        "rounded-lg"
                      )}
                      onClick={() => {
                        navigate(item.path);
                        setIsSheetOpen(false);
                      }}
                    >
                      <div className={cn(
                        "p-1.5 rounded-md",
                        location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                      )}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </nav>
            </div>

            {/* Fixed Bottom Section */}
            <div className="border-t p-3 space-y-2 shrink-0">
              {/* Profile Type Switcher */}
              <div className="px-3 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="capitalize">{user?.account_type || 'Select Profile'}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem onClick={() => handleProfileSwitch('student')}>
                      Student Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProfileSwitch('business')}>
                      Business Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProfileSwitch('professional')}>
                      Professional Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between px-3 py-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Theme
                </h4>
                <ThemeToggle />
              </div>

              {/* Settings & Logout */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => navigate('/dashboard/settings')}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-red-500 hover:text-red-500 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Header and Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className={cn(
            "flex h-16 items-center gap-4 border-b border-border/30 bg-background/30 backdrop-blur-[12px] px-4 md:hidden",
            location.pathname === "/dashboard/settings" && "hidden"
          )}>
            <div className="flex-1 flex items-center gap-3">
              {location.pathname === "/dashboard" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user?.avatar} 
                          alt={user?.username || `${user?.first_name} ${user?.last_name}`} 
                        />
                        <AvatarFallback>
                          {user?.username 
                            ? user.username.charAt(0).toUpperCase() 
                            : (user?.first_name 
                              ? user.first_name.charAt(0).toUpperCase() 
                              : '?')
                            }
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="flex items-center gap-2 p-2 border-b">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.username || 
                         (user?.first_name && user?.last_name 
                           ? `${user.first_name} ${user.last_name}` 
                           : user?.first_name || 
                             user?.last_name || 
                             user?.email || 
                             'User')}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || 'No email'}</p>
                      </div>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent align="end" className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Recent Notifications</h4>
                    <div className="space-y-3">
                      {[
                        {
                          title: "New Course Available",
                          desc: "Advanced React Patterns course is now live",
                          time: "2 hours ago"
                        },
                        {
                          title: "Assignment Due",
                          desc: "Web Development Basics assignment due in 24 hours",
                          time: "5 hours ago"
                        },
                        {
                          title: "Wallet Funded",
                          desc: "Your wallet has been credited with ₦50,000",
                          time: "1 day ago"
                        }
                      ].map((notification, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {notification.desc}
                            </p>
                            <p className="text-xs text-primary">{notification.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-primary text-sm">
                      View All Notifications
                    </Button>
                  </div>
                </HoverCardContent>
              </HoverCard>

              {/* Cart Icon */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/dashboard/cart')}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Profile Menu - Last for non-dashboard pages */}
              {location.pathname !== "/dashboard" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user?.avatar} 
                          alt={user?.username || `${user?.first_name} ${user?.last_name}`} 
                        />
                        <AvatarFallback>
                          {user?.username 
                            ? user.username.charAt(0).toUpperCase() 
                            : (user?.first_name 
                              ? user.first_name.charAt(0).toUpperCase() 
                              : '?')
                            }
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2 border-b">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.username || 
                         (user?.first_name && user?.last_name 
                           ? `${user.first_name} ${user.last_name}` 
                           : user?.first_name || 
                             user?.last_name || 
                             user?.email || 
                             'User')}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || 'No email'}</p>
                      </div>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
            <PullToRefresh
              onRefresh={handleRefresh}
              pullingContent={
                <div className="flex items-center justify-center py-1 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm">
                  Pull down to refresh...
                </div>
              }
              refreshingContent={
                <div className="flex items-center justify-center gap-2 py-1 text-sm bg-background/50 backdrop-blur-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              }
              resistance={2}
              maxPullDownDistance={200}
              pullDownThreshold={67}
              className="h-full"
            >
              <main className="h-full">
                <div className="container mx-auto px-3 py-0.5 md:px-4 md:py-1 max-w-7xl">
                  <Outlet />
                </div>
              </main>
            </PullToRefresh>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 border-t border-border/40 bg-background/80 backdrop-blur-sm md:hidden">
            <div className="flex items-center justify-around h-16">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full",
                      "transition-all duration-200 ease-in-out",
                      "hover:bg-primary/5 active:scale-95",
                      isSheetOpen && "text-primary"
                    )}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85%] p-0 border-r shadow-2xl">
                  <div className="flex flex-col h-full bg-gradient-to-b from-background to-background/95">
                    {/* Profile Header Section */}
                    <div className="relative px-4 pt-12 pb-6">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                      <div className="relative flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-14 w-14 ring-4 ring-background">
                            <AvatarImage 
                              src={user?.avatar} 
                              alt={user?.username || `${user?.first_name} ${user?.last_name}`} 
                            />
                            <AvatarFallback>
                              {user?.username 
                                ? user.username.charAt(0).toUpperCase() 
                                : (user?.first_name 
                                  ? user.first_name.charAt(0).toUpperCase() 
                                  : '?')
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate">
                            {user?.username || 
                             (user?.first_name && user?.last_name 
                               ? `${user.first_name} ${user.last_name}` 
                               : user?.first_name || 
                                 user?.last_name || 
                                 user?.email || 
                                 'User')}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {user?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Profile Type Switcher */}
                    <div className="px-4 pb-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-between gap-2 h-12 rounded-xl bg-primary/5 border-primary/10 hover:bg-primary/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <GraduationCap className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">
                                {user?.account_type === "student" ? "Student Account" : 
                                 user?.account_type === "business" ? "Business Account" : 
                                 "Professional Account"}
                              </span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-primary opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[calc(85vw-2rem)]">
                          <DropdownMenuItem 
                            disabled={user?.account_type === "student"}
                            onClick={() => handleProfileSwitch("student")}
                            className="h-11"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <GraduationCap className="h-4 w-4 text-primary" />
                              </div>
                              Switch to Student Account
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={user?.account_type === "business"}
                            onClick={() => handleProfileSwitch("business")}
                            className="h-11"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              Switch to Business Account
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={user?.account_type === "professional"}
                            onClick={() => handleProfileSwitch("professional")}
                            className="h-11"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Briefcase className="h-4 w-4 text-primary" />
                              </div>
                              Switch to Professional Account
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Menu Categories */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4 space-y-6">
                        {/* Main Navigation - Shows for all */}
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">Main Navigation</h4>
                          {menuItems.slice(0, 4).map((item) => (
                            <Button
                              key={item.path}
                              variant={location.pathname === item.path ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start h-11 gap-3",
                                "transition-all duration-200",
                                location.pathname === item.path ? 
                                  "bg-primary/10 hover:bg-primary/15" : 
                                  "hover:bg-muted/50",
                                "rounded-lg"
                              )}
                              onClick={() => {
                                navigate(item.path);
                                setIsSheetOpen(false);
                              }}
                            >
                              <div className={cn(
                                "p-1.5 rounded-md",
                                location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                              )}>
                                {item.icon}
                              </div>
                              <span className="font-medium">{item.label}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="ml-auto">
                                  {item.badge}
                                </Badge>
                              )}
                            </Button>
                          ))}
                        </div>

                        {/* Learning - Shows only for students */}
                        {user?.account_type === 'student' && (
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">Learning</h4>
                            {menuItems.slice(4, 6).map((item) => (
                              <Button
                                key={item.path}
                                variant={location.pathname === item.path ? "secondary" : "ghost"}
                                className={cn(
                                  "w-full justify-start h-11 gap-3",
                                  "transition-all duration-200",
                                  location.pathname === item.path ? 
                                    "bg-primary/10 hover:bg-primary/15" : 
                                    "hover:bg-muted/50",
                                  "rounded-lg"
                                )}
                                onClick={() => {
                                  navigate(item.path);
                                  setIsSheetOpen(false);
                                }}
                              >
                                <div className={cn(
                                  "p-1.5 rounded-md",
                                  location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                                )}>
                                  {item.icon}
                                </div>
                                <span className="font-medium">{item.label}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="ml-auto">
                                    {item.badge}
                                  </Badge>
                                )}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Business - Shows only if user has active business profile */}
                        {profileData?.has_profile && profileData?.profile?.status === 'active' && (
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">Business</h4>
                            {menuItems.slice(6, 8).map((item) => (
                              <Button
                                key={item.path}
                                variant={location.pathname === item.path ? "secondary" : "ghost"}
                                className={cn(
                                  "w-full justify-start h-11 gap-3",
                                  "transition-all duration-200",
                                  location.pathname === item.path ? 
                                    "bg-primary/10 hover:bg-primary/15" : 
                                    "hover:bg-muted/50",
                                  "rounded-lg"
                                )}
                                onClick={() => {
                                  navigate(item.path);
                                  setIsSheetOpen(false);
                                }}
                              >
                                <div className={cn(
                                  "p-1.5 rounded-md",
                                  location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                                )}>
                                  {item.icon}
                                </div>
                                <span className="font-medium">{item.label}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="ml-auto">
                                    {item.badge}
                                  </Badge>
                                )}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Professional - Shows only for professional accounts */}
                        {user?.account_type === 'professional' && (
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">Professional</h4>
                            {menuItems.slice(8, 10).map((item) => (
                              <Button
                                key={item.path}
                                variant={location.pathname === item.path ? "secondary" : "ghost"}
                                className={cn(
                                  "w-full justify-start h-11 gap-3",
                                  "transition-all duration-200",
                                  location.pathname === item.path ? 
                                    "bg-primary/10 hover:bg-primary/15" : 
                                    "hover:bg-muted/50",
                                  "rounded-lg"
                                )}
                                onClick={() => {
                                  navigate(item.path);
                                  setIsSheetOpen(false);
                                }}
                              >
                                <div className={cn(
                                  "p-1.5 rounded-md",
                                  location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                                )}>
                                  {item.icon}
                                </div>
                                <span className="font-medium">{item.label}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="ml-auto">
                                    {item.badge}
                                  </Badge>
                                )}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Shop - Shows for all */}
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">Shop</h4>
                          {menuItems.slice(10).map((item) => (
                            <Button
                              key={item.path}
                              variant={location.pathname === item.path ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start h-11 gap-3",
                                "transition-all duration-200",
                                location.pathname === item.path ? 
                                  "bg-primary/10 hover:bg-primary/15" : 
                                  "hover:bg-muted/50",
                                "rounded-lg"
                              )}
                              onClick={() => {
                                navigate(item.path);
                                setIsSheetOpen(false);
                              }}
                            >
                              <div className={cn(
                                "p-1.5 rounded-md",
                                location.pathname === item.path ? "bg-primary/10" : "bg-muted"
                              )}>
                                {item.icon}
                              </div>
                              <span className="font-medium">{item.label}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="ml-auto">
                                  {item.badge}
                                </Badge>
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="border-t bg-muted/5 p-4 space-y-4">
                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">Theme</h4>
                        </div>
                        <ThemeToggle />
                      </div>

                      {/* Settings & Logout */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-11 gap-2 rounded-xl bg-background hover:bg-muted/50"
                          onClick={() => {
                            navigate('/dashboard/settings');
                            setIsSheetOpen(false);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/dashboard')}
                className={cn(
                  "w-14 h-14 rounded-full bg-primary/10",
                  "transition-all duration-200 ease-in-out",
                  location.pathname === '/dashboard' && "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110"
                )}
              >
                <Home className="h-6 w-6" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/dashboard/settings')}
                className={cn(
                  "w-12 h-12 rounded-full",
                  "transition-all duration-200 ease-in-out",
                  location.pathname.includes('/settings') && "text-primary"
                )}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;