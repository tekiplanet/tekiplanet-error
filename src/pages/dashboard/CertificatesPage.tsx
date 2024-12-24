import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Download, Search, Award, Share2, Calendar,
  CheckCircle, Trophy, Medal, Star, Sparkles,
  GraduationCap, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificateService, type Certificate } from "@/services/certificateService";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function CertificatesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState<"all" | "featured">("all");
  const queryClient = useQueryClient();

  // Fetch certificates
  const { data, isLoading, error } = useQuery({
    queryKey: ['certificates'],
    queryFn: certificateService.getUserCertificates
  });

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: certificateService.toggleFeatured,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Certificate featured status updated');
    },
    onError: () => {
      toast.error('Failed to update certificate status');
    }
  });

  // Download certificate mutation
  const downloadMutation = useMutation({
    mutationFn: certificateService.downloadCertificate,
    onSuccess: (data, id) => {
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded successfully');
    },
    onError: () => {
      toast.error('Failed to download certificate');
    }
  });

  const handleShare = async (certificate: Certificate) => {
    try {
      await navigator.share({
        title: certificate.title,
        text: `Check out my certificate in ${certificate.title}!`,
        url: window.location.href
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share certificate');
      }
    }
  };

  const filteredCertificates = React.useMemo(() => {
    if (!data?.certificates) return [];
    
    return data.certificates
      .filter(cert => 
        cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.instructor.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(cert => selectedFilter === "all" || cert.featured);
  }, [data?.certificates, searchQuery, selectedFilter]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md mx-auto"
        >
          <div className="bg-destructive/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Failed to load certificates</h2>
          <p className="text-muted-foreground">Please try again later</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
            size="lg"
          >
            Refresh Page
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 px-4 py-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 mb-12"
          >
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="relative">
                <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
              </div>
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Your Achievements
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base">
              Showcase your learning journey with verified certificates from completed courses.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { icon: <GraduationCap className="h-5 w-5" />, label: "Total Certificates", value: data?.stats.total ?? 0 },
              { icon: <Star className="h-5 w-5" />, label: "Featured", value: data?.stats.featured ?? 0 },
              { icon: <Trophy className="h-5 w-5" />, label: "Top Grades", value: data?.stats.top_grades ?? 0 },
              { icon: <BookOpen className="h-5 w-5" />, label: "Skills Earned", value: data?.stats.total_skills ?? 0 }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-none bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors h-full">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 w-fit">
                        {stat.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">{stat.label}</p>
                        {isLoading ? (
                          <Skeleton className="h-7 md:h-8 w-16" />
                        ) : (
                          <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-0 z-10 bg-background/80 backdrop-blur-lg p-4 -mx-4 md:-mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                className="pl-9 bg-card/50 border-none h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                onClick={() => setSelectedFilter("all")}
                className="rounded-lg h-12 px-6"
              >
                All Certificates
              </Button>
              <Button
                variant={selectedFilter === "featured" ? "default" : "outline"}
                onClick={() => setSelectedFilter("featured")}
                className="rounded-lg h-12 px-6"
              >
                <Star className="h-4 w-4 mr-2" />
                Featured
              </Button>
            </div>
          </div>

          {/* Certificates Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <AnimatePresence mode="wait">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 4 }).map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Skeleton className="h-[400px] rounded-xl" />
                  </motion.div>
                ))
              ) : filteredCertificates.length === 0 ? (
                // Empty state
                <motion.div 
                  className="col-span-2 text-center py-16"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
                  <h3 className="text-2xl font-semibold mb-3">No Certificates Found</h3>
                  <p className="text-muted-foreground text-lg">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Complete courses to earn certificates"}
                  </p>
                </motion.div>
              ) : (
                // Certificate cards
                filteredCertificates.map((certificate, index) => (
                  <motion.div
                    key={certificate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="group overflow-hidden border-none hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
                      <div className="relative aspect-[2/1.4]">
                        <img
                          src={certificate.image || "/placeholder-certificate.jpg"}
                          alt={certificate.title}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent backdrop-blur-[2px] group-hover:backdrop-blur-0 transition-all duration-300" />
                        
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <Badge 
                            className={cn(
                              "cursor-pointer transition-all duration-300 backdrop-blur-md",
                              certificate.featured
                                ? "bg-primary/90 hover:bg-primary"
                                : "bg-muted/80 hover:bg-muted text-muted-foreground"
                            )}
                            onClick={() => toggleFeaturedMutation.mutate(certificate.id)}
                          >
                            <Star className={cn(
                              "h-3.5 w-3.5 mr-1.5 transition-transform",
                              certificate.featured && "text-yellow-300"
                            )} />
                            Featured
                          </Badge>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="h-8 w-8 p-0 backdrop-blur-md bg-muted/80 hover:bg-muted border-none"
                              onClick={() => handleShare(certificate)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="h-8 w-8 p-0 backdrop-blur-md bg-muted/80 hover:bg-muted border-none"
                              onClick={() => downloadMutation.mutate(certificate.id)}
                              disabled={downloadMutation.isPending}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="absolute inset-x-6 bottom-6 text-white">
                          <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {certificate.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-white/90">
                            <Calendar className="h-4 w-4" />
                            <span>Issued {new Date(certificate.issue_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Instructor</p>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-primary" />
                              </div>
                              <p className="font-medium line-clamp-1">{certificate.instructor}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-right">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Grade</p>
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Trophy className="h-4 w-4 text-primary" />
                              </div>
                              <p className="text-lg font-bold text-primary">{certificate.grade}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Skills Earned</p>
                            <Badge variant="outline" className="rounded-md">
                              {certificate.skills.length} Skills
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {certificate.skills.map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-2.5 py-0.5 text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <p className="text-xs text-muted-foreground font-medium">
                              Verified Certificate
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">
                            ID: {certificate.credential_id}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
} 