import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfessionalFormValues, professionalFormSchema } from '../../schemas/professionalFormSchema';
import { useAuthStore } from '@/store/useAuthStore';
import { Form } from '@/components/ui/form';

const ProfessionalProfileForm = () => {
  const { user } = useAuthStore();
  
  // Add debug logs
  console.log('Professional Profile Form Debug:', {
    fullUser: user,
    professional: user?.professional,
    rawData: {
      title: user?.professional?.title,
      specialization: user?.professional?.specialization,
      expertise_areas: user?.professional?.expertise_areas,
      status: user?.professional?.status
    }
  });

  const defaultValues = {
    title: user?.professional?.title || '',
    specialization: user?.professional?.specialization || '',
    expertise_areas: user?.professional?.expertise_areas || [],
    years_of_experience: user?.professional?.years_of_experience || 0,
    hourly_rate: Number(user?.professional?.hourly_rate) || 0,
    bio: user?.professional?.bio || '',
    certifications: user?.professional?.certifications || [],
    linkedin_url: user?.professional?.linkedin_url || '',
    github_url: user?.professional?.github_url || '',
    portfolio_url: user?.professional?.portfolio_url || '',
    preferred_contact_method: user?.professional?.preferred_contact_method || 'email',
    timezone: user?.professional?.timezone || '',
    languages: user?.professional?.languages || []
  };

  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalFormSchema),
    defaultValues
  });

  // Update form when user data changes
  useEffect(() => {
    if (user?.professional) {
      console.log('Updating form with professional data:', user.professional);
      form.reset(defaultValues);
    }
  }, [user?.professional]);

  return (
    <Form {...form}>
      <pre className="text-xs">
        {JSON.stringify(user?.professional, null, 2)}
      </pre>
      {/* Your form fields here */}
    </Form>
  );
};

export default ProfessionalProfileForm; 