import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Briefcase, FileText, Target, Users, Mail, MapPin } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import phoenixPattern from "@/assets/phoenix-pattern.jpg";

const Index = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "We'll get back to you soon.",
      });

      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    {
      icon: FileText,
      title: "ATS Resume Building",
      description: "Create applicant tracking system-optimized resumes that get past the bots and land interviews.",
    },
    {
      icon: Users,
      title: "Profile Marketing",
      description: "Market your candidate profile to top companies and hiring managers actively seeking talent.",
    },
    {
      icon: Target,
      title: "Interview Preparation",
      description: "Practice with real interview scenarios and get expert feedback to ace your next interview.",
    },
    {
      icon: Briefcase,
      title: "Career Guidance",
      description: "Get personalized career coaching and strategic guidance to advance your professional journey.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
              <h1 className="text-5xl md:text-7xl font-bold mb-6 relative text-white drop-shadow-lg">
                Phoenix Solutions
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/95 mb-8 max-w-2xl drop-shadow-md">
              Rise from the ashes of job hunting. We help job seekers across the USA land positions at top companies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 bg-white text-primary hover:bg-white/90 shadow-xl" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/20 shadow-xl">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: `url(${phoenixPattern})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive career services designed to transform your job search journey
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10">
                    <service.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">100+</div>
              <div className="text-xl text-muted-foreground">Successful Placements</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-secondary mb-2">95%</div>
              <div className="text-xl text-muted-foreground">Interview Success Rate</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">20+</div>
              <div className="text-xl text-muted-foreground">Partner Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewsSection />

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h2>
            <p className="text-xl text-muted-foreground">
              Ready to take the next step in your career? Let's connect.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <Mail className="w-6 h-6 text-primary mt-1" />
                      <div>
                        <div className="font-semibold mb-1">Email</div>
                        <a href="mailto:hr@phoenixsolutionscareers.com" className="text-muted-foreground hover:text-primary transition-colors">
                          hr@phoenixsolutionscareers.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-primary mt-1" />
                      <div>
                        <div className="font-semibold mb-1">Location</div>
                        <div className="text-muted-foreground">Serving job seekers across the USA</div>
                      </div>
                    </div>
                    <div className="mt-8 p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
                      <p className="text-sm text-muted-foreground mb-2">🔥 Like the Phoenix rising from the ashes</p>
                      <p className="font-medium">We help you transform setbacks into comebacks and build a stronger career.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="Your Phone (Optional)"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Your Message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={5}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Phoenix Solutions. All rights reserved.</p>
          <Link to="/auth" className="text-xs text-muted-foreground/50 hover:text-muted-foreground">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Index;
