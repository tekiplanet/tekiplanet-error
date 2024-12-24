import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Search,
  ChevronRight, 
  User, 
  Building2, 
  Briefcase,
  Shield, 
  Bell, 
  Settings as SettingsIcon,
  Moon,
  Sun,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { apiClient } from '@/lib/axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { NIGERIA_STATES } from '@/lib/constants/nigeria-states';
import { StateSelect } from "@/components/ui/state-selector";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { EXPERTISE_AREAS, LANGUAGES } from "@/lib/constants/professional";

// Animation variants
const pageTransition = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 }
};

interface SettingsGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  items: SettingsItem[];
  show?: boolean;
}

interface SettingsItem {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

const accountFormSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

const businessFormSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  business_email: z.string().email("Invalid business email"),
  phone_number: z.string().min(10, "Phone number must be at least 10 characters"),
  registration_number: z.string().optional(),
  tax_number: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal('')),
  description: z.string().max(500, "Description must be less than 500 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  country: z.literal('Nigeria'),
  logo: z.any().optional()
});

const professionalFormSchema = z.object({
  title: z.string().min(2, "Professional title must be at least 2 characters"),
  specialization: z.string().min(2, "Specialization must be at least 2 characters"),
  expertise_areas: z.array(z.string()).min(1, "Select at least one area of expertise"),
  bio: z.string().max(500, "Bio must be less than 500 characters"),
  certifications: z.array(z.string()).optional(),
  linkedin_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
  github_url: z.string().url("Invalid GitHub URL").optional().or(z.literal('')),
  portfolio_url: z.string().url("Invalid Portfolio URL").optional().or(z.literal('')),
  preferred_contact_method: z.enum(['email', 'phone', 'whatsapp', 'platform']),
  languages: z.array(z.string()).min(1, "Select at least one language"),
});

const securityFormSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

const notificationsFormSchema = z.object({
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  marketing_notifications: z.boolean(),
  profile_visibility: z.enum(['public', 'private', 'friends']),
  data_collection: z.boolean(),
});

const AccountSettingsForm = () => {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get the full avatar URL
  const avatarUrl = user?.avatar || null;
  
  console.log('Avatar details:', {
    userObject: user,
    avatarUrl: avatarUrl,
    baseUrl: import.meta.env.VITE_API_URL,
    fullUrl: avatarUrl
  });

  const form = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof accountFormSchema>) => {
    const loadingToast = toast.loading('Updating your profile...');

    try {
      const response = await apiClient.put('/settings/profile', values);
      await updateUser(response.data.user);

      toast.dismiss(loadingToast);
      toast.success('Your profile has been updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      toast.dismiss(loadingToast);
      
      // Show the first validation error message if it exists
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        // Fallback to the general error message
        toast.error(
          error.response?.data?.message || 
          'Unable to update your profile. Please try again.'
        );
      }
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or JPG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('Image size should not exceed 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    const loadingToast = toast.loading('Uploading avatar...');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/settings/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Avatar update response:', response.data);
      
      await updateUser(response.data.user);
      
      console.log('User after update:', user);

      toast.dismiss(loadingToast);
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Avatar update error:', error);
      toast.dismiss(loadingToast);
      toast.error(
        error.response?.data?.message || 
        'Failed to update avatar. Please try again.'
      );
      // Reset preview on error
      setPreviewUrl(null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center space-x-4">
                    <Avatar className="h-24 w-24">
            <AvatarImage 
              src={previewUrl || avatarUrl || ''} 
              alt={`${user?.first_name} ${user?.last_name}`}
              onError={(e) => {
                console.error('Avatar image failed to load:', e);
                const img = e.target as HTMLImageElement;
                console.log('Failed URL:', img.src);
                // Try to fetch the URL directly to see the response
                fetch(img.src)
                  .then(response => {
                    console.log('Avatar fetch response:', {
                      status: response.status,
                      statusText: response.statusText,
                      headers: Object.fromEntries(response.headers),
                      url: response.url
                    });
                  })
                  .catch(error => {
                    console.error('Avatar fetch error:', error);
                  });
              }}
            />
            <AvatarFallback>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </AvatarFallback>
                    </Avatar>
                      <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleAvatarChange}
            />
            <div className="flex flex-col gap-2">
              <Button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Avatar
              </Button>
                      </div>
            <p className="text-sm text-muted-foreground">
              JPG, PNG. Maximum size 2MB.
            </p>
                      </div>
                    </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                    </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

                    <div className="space-y-2">
            <Label>Username</Label>
            <Input 
              value={user?.username || ''} 
              disabled 
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Username cannot be changed
            </p>
                    </div>
                    </div>

        <Button 
          type="submit" 
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
};

const BusinessProfileForm = () => {
  const { user, updateUser } = useAuthStore();
  // Fix: Use camelCase to access businessProfile
  const businessProfile = user?.businessProfile;

  // Add debug logging
  console.log('BusinessProfileForm Debug:', {
    user,
    businessProfile,
    status: businessProfile?.status,
    hasProfile: Boolean(businessProfile),
    isActive: businessProfile?.status === 'active'
  });

  if (!businessProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Business Profile</h3>
        <p className="text-muted-foreground mb-4">
          You don't have a business profile yet. Create one to access business features.
        </p>
        <Button asChild>
          <Link to="/business/setup">Create Business Profile</Link>
        </Button>
      </div>
    );
  }

  if (businessProfile.status !== 'active') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Inactive Business Profile</h3>
        <p className="text-muted-foreground mb-4">
          Your business profile is currently inactive. Please complete the setup process.
        </p>
        <Button asChild>
          <Link to="/business/setup">Complete Setup</Link>
        </Button>
      </div>
    );
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or JPG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('Image size should not exceed 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    const loadingToast = toast.loading('Uploading logo...');

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await apiClient.post('/settings/business/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Logo update response:', response.data);
      
      await updateUser(response.data.user);
      
      console.log('User after update:', user);

      toast.dismiss(loadingToast);
      toast.success('Logo updated successfully');
    } catch (error: any) {
      console.error('Logo update error:', error);
      toast.dismiss(loadingToast);
      toast.error(
        error.response?.data?.message || 
        'Failed to update logo. Please try again.'
      );
      // Reset preview on error
      setPreviewUrl(null);
    }
  };

  const form = useForm<z.infer<typeof businessFormSchema>>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      business_name: businessProfile?.business_name || "",
      business_email: businessProfile?.business_email || "",
      phone_number: businessProfile?.phone_number || "",
      registration_number: businessProfile?.registration_number || "",
      tax_number: businessProfile?.tax_number || "",
      website: businessProfile?.website || "",
      description: businessProfile?.description || "",
      address: businessProfile?.address || "",
      city: businessProfile?.city || "",
      state: businessProfile?.state || "",
      country: "Nigeria"
    },
  });

  const onSubmit = async (values: z.infer<typeof businessFormSchema>) => {
    const loadingToast = toast.loading('Updating business profile...');

    try {
      const response = await apiClient.put('/settings/business/profile', values);
      
      // Fix: Only update the businessProfile field, not the entire user object
      await updateUser({
        ...user,
        businessProfile: response.data.business_profile || response.data.businessProfile
      });

      toast.dismiss(loadingToast);
      toast.success('Business profile updated successfully');
    } catch (error: any) {
      console.error('Business profile update error:', error);
      
      toast.dismiss(loadingToast);
      
      // Show the first validation error message if it exists
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        // Fallback to the general error message
        toast.error(
          error.response?.data?.message || 
          'Failed to update business profile. Please try again.'
        );
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-24 w-24 relative rounded-lg border overflow-hidden">
            <img 
              src={previewUrl || businessProfile?.logo_url || '/placeholder-logo.png'} 
              alt="Business Logo"
              className="h-full w-full object-cover"
              onError={(e) => {
                console.error('Logo image failed to load:', e);
                const img = e.target as HTMLImageElement;
                console.log('Failed URL:', img.src);
                // Try to fetch the URL directly to see the response
                fetch(img.src)
                  .then(response => {
                    console.log('Logo fetch response:', {
                      status: response.status,
                      statusText: response.statusText,
                      headers: Object.fromEntries(response.headers),
                      url: response.url
                    });
                  })
                  .catch(error => {
                    console.error('Logo fetch error:', error);
                  });
                img.src = '/placeholder-logo.png';
              }}
            />
                    </div>
                    <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleLogoChange}
            />
            <div className="flex flex-col gap-2">
              <Button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Logo
              </Button>
                    </div>
                        <p className="text-sm text-muted-foreground">
              JPG, PNG. Maximum size 2MB.
                        </p>
                      </div>
                    </div>

        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="business_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                  </div>

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="registration_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tax_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input {...field} type="url" placeholder="https://" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your business..."
                    className="resize-none"
                    {...field}
                    rows={4}  // Set a reasonable default height
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                      </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <StateSelect 
                      value={field.value} 
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} disabled value="Nigeria" className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
                      />
                    </div>
        </div>

        <Button 
          type="submit" 
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
};

const ProfessionalProfileForm = () => {
  const { user, updateUser } = useAuthStore();
  // Fix: Access professional profile directly from user
  const professionalProfile = user?.professional;

  console.log('Professional Profile Data:', {
    user,
    professionalProfile,
    title: professionalProfile?.title,
    specialization: professionalProfile?.specialization,
    bio: professionalProfile?.bio,
    expertise_areas: professionalProfile?.expertise_areas,
    certifications: professionalProfile?.certifications,
    linkedin_url: professionalProfile?.linkedin_url,
    github_url: professionalProfile?.github_url,
    portfolio_url: professionalProfile?.portfolio_url,
  });

  const form = useForm<z.infer<typeof professionalFormSchema>>({
    resolver: zodResolver(professionalFormSchema),
    values: {
      title: professionalProfile?.title || "",
      specialization: professionalProfile?.specialization || "",
      expertise_areas: professionalProfile?.expertise_areas || [],
      bio: professionalProfile?.bio || "",
      certifications: professionalProfile?.certifications || [],
      linkedin_url: professionalProfile?.linkedin_url || "",
      github_url: professionalProfile?.github_url || "",
      portfolio_url: professionalProfile?.portfolio_url || "",
      preferred_contact_method: professionalProfile?.preferred_contact_method || "email",
      languages: professionalProfile?.languages || ["English"],
    },
  });

  const onSubmit = async (values: z.infer<typeof professionalFormSchema>) => {
    const loadingToast = toast.loading('Updating professional profile...');

    // Add debug logging
    console.log('Professional Profile Form Values:', {
      values,
      schema: professionalFormSchema,
    });

    try {
      // Include the existing read-only values in the request
      const requestData = {
        ...values,
        years_of_experience: professionalProfile?.years_of_experience,
        hourly_rate: professionalProfile?.hourly_rate,
        timezone: professionalProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        // Ensure preferred_contact_method is a string
        preferred_contact_method: String(values.preferred_contact_method)
      };

      console.log('Sending data to API:', requestData);

      const response = await apiClient.put('/settings/professional/profile', requestData);
      await updateUser(response.data.user);

      toast.dismiss(loadingToast);
      toast.success('Professional profile updated successfully');
    } catch (error: any) {
      console.error('Professional profile update error:', error);
      console.log('Error response data:', error.response?.data);
      toast.dismiss(loadingToast);
      toast.error(
        error.response?.data?.message || 
        'Failed to update professional profile. Please try again.'
      );
    }
  };

  // Show read-only experience info
  const experienceInfo = (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="space-y-2">
        <Label>Years of Experience</Label>
        <div className="p-2 bg-muted rounded-md">
          {professionalProfile?.years_of_experience || 0} years
        </div>
      </div>
      <div className="space-y-2">
        <Label>Hourly Rate</Label>
        <div className="p-2 bg-muted rounded-md">
          ₦{professionalProfile?.hourly_rate || 0}/hr
        </div>
      </div>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Professional Title
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Frontend Development" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Experience Info (Read-only) */}
          {experienceInfo}

          {/* Bio */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professional Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us about your professional background and expertise..." 
                    className="resize-none"
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expertise Areas */}
          <FormField
            control={form.control}
            name="expertise_areas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Areas of Expertise</FormLabel>
                <FormControl>
                  <TagInput
                    placeholder="Add expertise (press enter)"
                    tags={field.value}
                    className="sm:min-h-[120px]"
                    onTagsChange={(tags) => field.onChange(tags)}
                  />
                </FormControl>
                <FormDescription>
                  Enter your key areas of expertise (e.g., React, Node.js, AWS)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Languages */}
          <FormField
            control={form.control}
            name="languages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Languages</FormLabel>
                <FormControl>
                  <TagInput
                    placeholder="Add languages (press enter)"
                    tags={field.value}
                    className="sm:min-h-[120px]"
                    onTagsChange={(tags) => field.onChange(tags)}
                  />
                </FormControl>
                <FormDescription>
                  Enter languages you can communicate in (e.g., English, French, Yoruba)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Certifications */}
          <FormField
            control={form.control}
            name="certifications"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certifications</FormLabel>
                <FormControl>
                  <TagInput
                    placeholder="Add certifications (press enter)"
                    tags={field.value}
                    className="sm:min-h-[120px]"
                    onTagsChange={(tags) => field.onChange(tags)}
                  />
                </FormControl>
                <FormDescription>
                  Enter any relevant certifications you hold
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Professional Links */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="github_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Profile</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="portfolio_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact Preference */}
          <FormField
            control={form.control}
            name="preferred_contact_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Contact Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="platform">Platform Messages</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Update Profile</Button>
      </form>
    </Form>
  );
};

const SecuritySettingsForm = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof securityFormSchema>) => {
    const loadingToast = toast.loading('Updating password...');

    try {
      await apiClient.put('/settings/password', {
        current_password: values.current_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password
      });

      toast.dismiss(loadingToast);
      toast.success('Password updated successfully');
      form.reset();
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.dismiss(loadingToast);
      
      // Show validation errors if they exist
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        // Show general error message
        toast.error(
          error.response?.data?.message || 
          'Failed to update password. Please try again.'
        );
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="current_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showCurrentPassword ? "text" : "password"} 
                    {...field} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showNewPassword ? "text" : "password"} 
                    {...field} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormDescription>
                Password must:
                <ul className="list-disc list-inside text-sm">
                  <li>Be at least 8 characters long</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Include numbers and special characters</li>
                </ul>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    {...field} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </Form>
  );
};

const NotificationsForm = () => {
  const { user, updatePreferences } = useAuthStore();
  const form = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      email_notifications: user?.email_notifications || false,
      push_notifications: user?.push_notifications || false,
      marketing_notifications: user?.marketing_notifications || false,
      profile_visibility: user?.profile_visibility || 'private',
      data_collection: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof notificationsFormSchema>) => {
    const loadingToast = toast.loading('Updating notification preferences...');

    try {
      await updatePreferences(values);
      toast.dismiss(loadingToast);
      toast.success('Notification preferences updated successfully');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to update notification preferences');
    }
  };

  return (
    <Form {...form}>
      <form onChange={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
          <FormField
            control={form.control}
            name="email_notifications"
            render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                    Receive email notifications about important updates
                        </p>
                      </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                    </div>
            )}
          />

          <FormField
            control={form.control}
            name="push_notifications"
            render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                    Receive push notifications on your devices
                        </p>
                      </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                    </div>
            )}
          />

          <FormField
            control={form.control}
            name="marketing_notifications"
            render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                  <Label className="text-base">Marketing Communications</Label>
                        <p className="text-sm text-muted-foreground">
                    Receive updates about new features and promotions
                        </p>
                      </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                    </div>
            )}
          />

          <FormField
            control={form.control}
            name="profile_visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Visibility</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="friends">Friends Only</SelectItem>
                        </SelectContent>
                      </Select>
                <FormMessage />
              </FormItem>
            )}
          />
                    </div>
      </form>
    </Form>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme } = useAuthStore();

  const handleThemeChange = async (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    const loadingToast = toast.loading(`Switching to ${newTheme} mode...`);

    try {
      await setTheme(newTheme);
      toast.dismiss(loadingToast);
      toast.success(`Theme changed to ${newTheme} mode`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to update theme');
    }
  };

  return (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
        <Label className="text-base">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
          {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                        </p>
                      </div>
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={handleThemeChange}
      />
                    </div>
  );
};

const Settings = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { theme, setTheme, user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Add this before the settingsGroups definition
  console.log('Settings Debug (Detailed):', {
    fullUser: user,
    rawBusinessProfile: user?.business_profile,
    camelBusinessProfile: user?.businessProfile,
    businessProfileCheck: {
      snakeCase: Boolean(user?.business_profile?.status === 'active'),
      camelCase: Boolean(user?.businessProfile?.status === 'active'),
      rawStatus: user?.business_profile?.status,
      rawCamelStatus: user?.businessProfile?.status
    },
    showCondition: Boolean(user?.business_profile?.status === 'active')
  });

  // Define settings groups
  const settingsGroups: SettingsGroup[] = [
    {
      id: 'quick',
      title: 'Quick Settings',
      icon: <SettingsIcon className="w-5 h-5" />,
      description: 'Frequently used settings',
      items: [
        {
          id: 'theme',
          title: 'Theme',
          description: 'Toggle between light and dark mode',
          component: <ThemeToggle />
        },
      ]
    },
    {
      id: 'account',
      title: 'Account Settings',
      icon: <User className="w-5 h-5" />,
      description: 'Manage your personal information',
      items: [
        {
          id: 'profile',
          title: 'Personal Information',
          description: 'Update your basic information',
          component: <AccountSettingsForm />
        },
      ]
    },
    {
      id: 'business',
      title: 'Business Profile',
      icon: <Building2 className="w-5 h-5" />,
      description: 'Manage your business information',
      items: [
        {
          id: 'business-info',
          title: 'Business Information',
          description: 'Update your business details',
          component: <BusinessProfileForm />
        }
      ],
      show: Boolean(user?.businessProfile?.status === 'active')
    },
    {
      id: 'professional',
      title: 'Professional Profile',
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Manage your professional profile',
      items: [
        {
          id: 'professional-info',
          title: 'Professional Information',
          description: 'Update your professional details',
          component: <ProfessionalProfileForm />
        }
      ],
      show: Boolean(user?.professional?.status === 'active')
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: <Shield className="w-5 h-5" />,
      description: 'Manage your security settings',
      items: [
        {
          id: 'password',
          title: 'Password',
          description: 'Change your password',
          component: <SecuritySettingsForm />
        },
        {
          id: 'two-factor',
          title: 'Two-Factor Authentication',
          description: 'Add an extra layer of security',
          component: (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                  Protect your account with 2FA
                      </p>
                    </div>
              <Switch 
                checked={false}
                onCheckedChange={() => {
                  toast({
                    title: "Coming Soon",
                    description: "This feature will be available soon.",
                  });
                }}
              />
                  </div>
          )
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      description: 'Manage your notification preferences',
      items: [
        {
          id: 'notification-preferences',
          title: 'Notification Preferences',
          description: 'Control your notification settings',
          component: <NotificationsForm />
        }
      ]
    }
  ];

  // Add debug logs
  console.log('User Data:', {
    user,
    businessProfile: user?.businessProfile,
    professional: user?.professional,
    businessStatus: user?.businessProfile?.status,
    professionalStatus: user?.professional?.status
  });

  // Filter groups based on show condition and search
  const filteredGroups = settingsGroups.filter(group => {
    const showCondition = group.show === undefined || group.show === true;
    const searchCondition = 
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.items.some(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    return showCondition && searchCondition;
  });

  // Handle back navigation
  const handleBack = () => {
    if (activeItem) {
      setActiveItem(null);
    } else if (activeGroup) {
      setActiveGroup(null);
    }
  };

  // Render mobile layout
  if (isMobile) {
  return (
      <div className="min-h-screen bg-background">
        <AnimatePresence mode="wait">
          {!activeGroup ? (
            // Settings Groups List
            <motion.div
              key="groups"
              {...pageTransition}
              className="h-full"
            >
              <div className="sticky top-0 z-10 bg-background p-4 border-b">
                <div className="flex items-center space-x-2 mb-4">
                  <h1 className="text-2xl font-bold">Settings</h1>
      </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search settings..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
                  </div>

              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-4 space-y-4">
                  {filteredGroups.map((group) => (
                    <Card
                      key={group.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => setActiveGroup(group.id)}
                    >
                      <CardContent className="flex items-center p-4">
                        <div className="flex-1 flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-full">
                            {group.icon}
                  </div>
                          <div>
                            <h3 className="font-medium">{group.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {group.description}
                            </p>
                </div>
                </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          ) : (
            // Settings Items List or Item Detail
            <motion.div
              key="items"
              {...pageTransition}
              className="h-full"
            >
              <div className="sticky top-0 z-10 bg-background p-4 border-b">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-xl font-semibold">
                    {settingsGroups.find(g => g.id === activeGroup)?.title}
                  </h2>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-4rem)]">
                <div className="p-4">
                  {activeItem ? (
                    // Render active item component
              <div className="space-y-4">
                      {settingsGroups
                        .find(g => g.id === activeGroup)
                        ?.items.find(i => i.id === activeItem)
                        ?.component}
                </div>
                  ) : (
                    // Render items list
              <div className="space-y-4">
                      {settingsGroups
                        .find(g => g.id === activeGroup)
                        ?.items.map((item) => (
                          <Card
                            key={item.id}
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => setActiveItem(item.id)}
                          >
                            <CardContent className="flex items-center justify-between p-4">
                              <div>
                                <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                                  {item.description}
                    </p>
                  </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
                        ))}
                  </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
                </div>
    );
  }

  // Desktop layout
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <div className="sticky top-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search settings..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                  </div>
                </div>
            <div className="space-y-2">
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveGroup(group.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    activeGroup === group.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {group.icon}
                  <span>{group.title}</span>
                </button>
              ))}
                  </div>
                </div>
                  </div>

        {/* Main Content */}
        <div className="col-span-9">
          <AnimatePresence mode="wait">
            {activeGroup && (
              <motion.div
                key={activeGroup}
                {...pageTransition}
                className="space-y-6"
              >
          <Card>
            <CardHeader>
                    <CardTitle>
                      {settingsGroups.find(g => g.id === activeGroup)?.title}
                    </CardTitle>
            </CardHeader>
                  <CardContent>
                    {settingsGroups
                      .find(g => g.id === activeGroup)
                      ?.items.map((item) => (
                        <div key={item.id} className="mb-8 last:mb-0">
                          <h3 className="text-lg font-semibold mb-4">{item.title}</h3>
                          {item.component}
                  </div>
                      ))}
            </CardContent>
          </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;