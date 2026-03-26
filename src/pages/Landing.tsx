import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Target, Zap, TrendingUp, CheckCircle2, BarChart3, Shield } from "lucide-react";

const features = [
  { icon: Target, title: "ATS Score Analysis", description: "Get your resume scored against Applicant Tracking Systems used by top companies." },
  { icon: Zap, title: "AI-Powered Insights", description: "Advanced AI extracts skills, experience, and education to give precise feedback." },
  { icon: TrendingUp, title: "Improvement Suggestions", description: "Actionable recommendations to boost your resume for your target role." },
  { icon: BarChart3, title: "Keyword Matching", description: "See exactly which keywords match the job description and which are missing." },
  { icon: Shield, title: "Weak Section Detection", description: "Identify and strengthen the weakest parts of your resume." },
  { icon: CheckCircle2, title: "Industry-Specific Tips", description: "Get tailored suggestions based on your target industry and role." },
];

export default function Landing() {
  return (
    <div className="gradient-hero">
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-card animate-fade-in">
            <Zap className="h-4 w-4 text-primary" />
            Powered by Advanced AI
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Land Your Dream Job with{" "}
            <span className="text-gradient">AI Resume Analysis</span>
          </h1>
          <p className="mb-10 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Upload your resume, paste the job description, and get instant AI-powered feedback — ATS score, keyword matches, missing skills, and actionable improvement tips.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="lg" asChild className="text-base px-8 py-6">
              <Link to="/auth?tab=signup">
                <FileText className="mr-2 h-5 w-5" />
                Analyze Your Resume
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-base px-8 py-6">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-20 md:pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Everything You Need to Perfect Your Resume</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Our AI analyzes every aspect of your resume against the job you want.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mb-4 inline-flex rounded-lg gradient-primary p-2.5">
                <feature.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card">
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Optimize Your Resume?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Join thousands of job seekers who improved their resumes with AI-powered analysis.</p>
          <Button variant="hero" size="lg" asChild className="text-base px-8 py-6">
            <Link to="/auth?tab=signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
