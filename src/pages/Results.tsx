import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ScoreRing";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Lightbulb, BookOpen, Briefcase, AlertTriangle, Download } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Analysis = Tables<"resume_analyses">;

export default function Results() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAnalysis = async () => {
      const { data } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("id", id)
        .single();
      setAnalysis(data);
      setLoading(false);
    };

    fetchAnalysis();

    // Poll if still processing
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setAnalysis(data);
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Analysis not found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (analysis.status === "processing" || analysis.status === "pending") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 animate-fade-in">
        <div className="relative">
          <div className="h-20 w-20 rounded-full gradient-primary opacity-20 animate-pulse-ring" />
          <Loader2 className="absolute inset-0 m-auto h-10 w-10 animate-spin text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 text-foreground">Analyzing Your Resume</h2>
          <p className="text-muted-foreground">Our AI is reviewing your resume against the job description...</p>
        </div>
      </div>
    );
  }

  if (analysis.status === "failed") {
    return (
      <div className="container max-w-lg py-12 text-center animate-fade-in">
        <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2 text-foreground">Analysis Failed</h2>
        <p className="text-muted-foreground mb-6">Something went wrong. Please try again.</p>
        <Button variant="hero" asChild>
          <Link to="/analyze">Try Again</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{analysis.file_name}</h1>
          {analysis.job_title && <p className="text-muted-foreground">Target: {analysis.job_title}</p>}
        </div>
      </div>

      {/* Scores */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="shadow-card flex items-center justify-center py-8">
          <ScoreRing score={analysis.ats_score ?? 0} label="ATS Score" size={140} />
        </Card>
        <Card className="shadow-card flex items-center justify-center py-8">
          <ScoreRing score={analysis.keyword_match_percentage ?? 0} label="Keyword Match" size={140} />
        </Card>
        <Card className="shadow-card p-6 flex flex-col justify-center">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{analysis.experience_years ?? "N/A"}</p>
            <p className="text-sm text-muted-foreground mt-1">Years Experience Detected</p>
          </div>
        </Card>
      </div>

      {/* Summary */}
      {analysis.resume_summary && (
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Resume Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{analysis.resume_summary}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Matched Keywords */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-score-excellent" />
              Matched Keywords ({analysis.matched_keywords?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analysis.matched_keywords?.map((kw) => (
              <Badge key={kw} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                {kw}
              </Badge>
            ))}
            {(!analysis.matched_keywords || analysis.matched_keywords.length === 0) && (
              <p className="text-sm text-muted-foreground">No keywords matched</p>
            )}
          </CardContent>
        </Card>

        {/* Missing Skills */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <XCircle className="h-5 w-5 text-destructive" />
              Missing Skills ({analysis.missing_skills?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analysis.missing_skills?.map((skill) => (
              <Badge key={skill} variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                {skill}
              </Badge>
            ))}
            {(!analysis.missing_skills || analysis.missing_skills.length === 0) && (
              <p className="text-sm text-muted-foreground">No missing skills detected</p>
            )}
          </CardContent>
        </Card>

        {/* Skills Found */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              Skills Found ({analysis.skills_found?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analysis.skills_found?.map((skill) => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </CardContent>
        </Card>

        {/* Weak Sections */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-score-good" />
              Weak Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weak_sections?.map((section, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-score-good mt-0.5 shrink-0" />
                  {section}
                </li>
              ))}
              {(!analysis.weak_sections || analysis.weak_sections.length === 0) && (
                <p className="text-sm text-muted-foreground">No weak sections detected</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <Card className="shadow-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-score-good" />
              Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {analysis.suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed">{suggestion}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Industry Suggestions */}
      {analysis.industry_suggestions && analysis.industry_suggestions.length > 0 && (
        <Card className="shadow-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              Industry-Specific Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.industry_suggestions.map((tip, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
