import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from '@/lib/axios';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Dashboard from "@/pages/Dashboard";


import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { 
  BookOpen, Clock, Star, Users, Search, 
  GraduationCap, Filter, ChevronRight, User 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number | string;
  instructor: string;
  duration_hours: number;
  image_url?: string;
}

interface Settings {
  currency_symbol: string;
  default_currency: string;
}

const fetchCourses = async (): Promise<Course[]> => {
  try {
    const response = await apiClient.get('/courses');
    return response.data.courses || [];
  } catch (error) {
    console.error("Failed to fetch courses", error);
    return [];
  }
};

const fetchSettings = async (): Promise<Settings> => {
  try {
    const response = await apiClient.get('/settings');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch settings", error);
    return { currency_symbol: '₦', default_currency: 'NGN' }; // Fallback to default
  }
};

export default function Academy() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const settingsQuery = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const coursesQuery = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    placeholderData: [] // Provide a default empty array
  });

  if (coursesQuery.isLoading || settingsQuery.isLoading) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
          </div>
        </div>
    );
  }

  if (coursesQuery.error || settingsQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        Failed to load courses or settings. Please try again later.
      </div>
    );
  }

  const courses = coursesQuery.data || [];
  const settings = settingsQuery.data || { currency_symbol: '₦', default_currency: 'NGN' };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = selectedLevel === "all" || course.level.toLowerCase() === selectedLevel
    const matchesCategory = selectedCategory === "all" || course.category.toLowerCase() === selectedCategory
    return matchesSearch && matchesLevel && matchesCategory
  })

  const formatPrice = (price: number | string) => {
    return Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-primary/5 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Discover Your Next Skill
            </h1>
            <p className="text-muted-foreground mb-6">
              Explore our wide range of courses and start your learning journey today
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="web development">Web Development</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card 
              key={course.id} 
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-background to-muted/50"
            >
              <CardContent className="p-0">
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={course.image_url || '/placeholder-course.jpg'} 
                    alt={course.title}
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <Badge 
                      className="mb-2"
                      variant={
                        course.level === "Beginner" ? "default" :
                        course.level === "Intermediate" ? "secondary" : 
                        "destructive"
                      }
                    >
                      {course.level}
                    </Badge>
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">{course.title}</h3>
                    <div className="flex items-center gap-3 text-white/90">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">{course.duration_hours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400" />
                        <span className="text-xs">4.5</span>
                      </div>
                      <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                        {course.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span>{course.instructor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Course Fee</p>
                      <div className="text-lg font-bold text-primary">
                        {settings.currency_symbol}{formatPrice(course.price)}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/dashboard/academy/${course.id}`)}
                      className="rounded-full px-4 gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      View Course
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}