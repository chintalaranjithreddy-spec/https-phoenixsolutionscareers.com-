import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Trash2, Edit, Check, X } from "lucide-react";
import { Session, User } from "@supabase/supabase-js";

interface Review {
  id: string;
  name: string;
  email: string;
  company: string | null;
  rating: number;
  review_text: string;
  is_approved: boolean;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    review_text: "",
    rating: 5,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          setTimeout(() => {
            navigate("/auth");
          }, 0);
        } else {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
        fetchReviews();
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
  };

  const handleApprove = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: !currentStatus })
      .eq("id", id);

    if (!error) {
      toast({
        title: "Success",
        description: `Review ${!currentStatus ? "approved" : "unapproved"}`,
      });
      fetchReviews();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (!error) {
      toast({
        title: "Success",
        description: "Review deleted",
      });
      fetchReviews();
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditForm({
      name: review.name,
      review_text: review.review_text,
      rating: review.rating,
    });
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from("reviews")
      .update(editForm)
      .eq("id", id);

    if (!error) {
      toast({
        title: "Success",
        description: "Review updated",
      });
      setEditingId(null);
      fetchReviews();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className={review.is_approved ? "border-primary" : ""}>
                  <CardContent className="pt-6">
                    {editingId === review.id ? (
                      <div className="space-y-4">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Name"
                        />
                        <Textarea
                          value={editForm.review_text}
                          onChange={(e) =>
                            setEditForm({ ...editForm, review_text: e.target.value })
                          }
                          placeholder="Review"
                        />
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, rating: star })}
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= editForm.rating
                                    ? "fill-primary text-primary"
                                    : "text-muted"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleUpdate(review.id)} size="sm">
                            <Check className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingId(null)}
                            variant="outline"
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="font-bold">{review.name}</div>
                            <div className="text-sm text-muted-foreground">{review.email}</div>
                            {review.company && (
                              <div className="text-sm text-muted-foreground">{review.company}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(review.id, review.is_approved)}
                              variant={review.is_approved ? "outline" : "default"}
                              size="sm"
                            >
                              {review.is_approved ? "Unapprove" : "Approve"}
                            </Button>
                            <Button
                              onClick={() => startEdit(review)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(review.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "fill-primary text-primary" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-muted-foreground italic">"{review.review_text}"</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
