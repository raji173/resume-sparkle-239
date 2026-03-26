import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Analysis = Tables<"resume_analyses">;

export default function Dashboard() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAnalyses = async () => {
      const { data } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setAnalyses(data ?? []);
      setLoading(false);
    };
    fetchAnalyses();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-score-excellent" />;
      case "processing": case "pending": return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 75) return "text-score-excellent";
    if (score >= 50) return "text-score-good";
    return "text-score-poor";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your resume analysis history</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/analyze">
            <Plus className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      {analyses.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No analyses yet</h3>
            <p className="text-muted-foreground mb-6">Upload your first resume to get started.</p>
            <Button variant="hero" asChild>
              <Link to="/analyze">Analyze Your Resume</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyses.map((a) => (
            <Link key={a.id} to={`/results/${a.id}`}>
              <Card className="shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer group">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">{a.file_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {a.job_title && <span>{a.job_title}</span>}
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {a.status === "completed" && (
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getScoreColor(a.ats_score)}`}>
                          {a.ats_score ?? "-"}%
                        </p>
                        <p className="text-xs text-muted-foreground">ATS Score</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(a.status)}
                      <Badge variant="secondary" className="capitalize text-xs">{a.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
