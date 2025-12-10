import { SignIn } from "@stackframe/stack";
import { Link } from "wouter";

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary cursor-pointer">
              Nexus
            </h1>
          </Link>
          <p className="text-muted-foreground mt-2">Sign in to connect with gamers</p>
        </div>
        
        <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-xl">
          <SignIn />
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
