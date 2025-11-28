import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <p className="text-2xl text-foreground font-bold mb-2">Page Not Found</p>
          <p className="text-lg text-muted-foreground mb-8">
            Sorry, the page you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/")} size="lg">
            Return to Home
          </Button>
        </div>
      </div>
    </Layout>
  );
}
