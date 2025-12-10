import { SignUp } from "@stackframe/stack";
import { Link } from "wouter";

export default function Signup() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary cursor-pointer">
              Nexus
            </h1>
          </Link>
          <p className="text-muted-foreground mt-2">Create your gamer profile</p>
        </div>
        
        <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-xl">
          <SignUp />
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
