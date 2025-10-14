import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { z } from "zod";

interface Review {
  id: string;
  name: string;
  company: string | null;
  rating: number;
  review_text: string;
  created_at: string;
}

export const ReviewsSection = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    rating: 5,
    review_text: "",
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    // Only select necessary columns, excluding email for privacy
    const { data, error } = await supabase
      .from("reviews")
      .select("id, name, company, rating, review_text, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
  };

  const reviewSchema = z.object({
    name: z.string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters"),
    email: z.string()
      .trim()
      .email("Invalid email address")
      .max(255, "Email must be less than 255 characters"),
    company: z.string()
      .trim()
      .max(100, "Company name must be less than 100 characters")
      .optional(),
    rating: z.number()
      .int()
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    review_text: z.string()
      .trim()
      .min(1, "Review is required")
      .max(1000, "Review must be less than 1000 characters"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate input
      const validatedData = reviewSchema.parse(formData);

      // Ensure required fields are present for database insert
      const insertData = {
        name: validatedData.name,
        email: validatedData.email,
        company: validatedData.company || null,
        rating: validatedData.rating,
        review_text: validatedData.review_text,
      };

      const { error } = await supabase.from("reviews").insert([insertData]);

      if (error) throw error;

      toast({
        title: "Review Submitted!",
        description: "Your review is pending approval. Thank you!",
      });

      setFormData({
        name: "",
        email: "",
        company: "",
        rating: 5,
        review_text: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Client Success Stories</h2>
          <p className="text-xl text-muted-foreground">
            Hear from candidates who've transformed their careers with Phoenix Solutions
          </p>
        </div>

        {/* Reviews Display */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating ? "fill-primary text-primary" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">"{review.review_text}"</p>
                <div className="font-semibold">{review.name}</div>
                {review.company && (
                  <div className="text-sm text-muted-foreground">{review.company}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Review Submission Form */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <h3 className="text-2xl font-bold mb-6 text-center">Share Your Experience</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Your Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Your Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Company (Optional)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= formData.rating
                            ? "fill-primary text-primary"
                            : "text-muted hover:text-primary"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Textarea
                  placeholder="Your Review *"
                  value={formData.review_text}
                  onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                  required
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
