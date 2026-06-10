import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

// Restrict self-service signup to the company domain. This is a client-side
// guard for UX only; for hard enforcement add a Supabase "Before User Created"
// auth hook (or a trigger on auth.users) that rejects other domains. Set to ''
// to allow any email domain.
const ALLOWED_EMAIL_DOMAIN = '@triumph.com';
const MIN_PASSWORD_LENGTH = 8;

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (ALLOWED_EMAIL_DOMAIN && !normalizedEmail.endsWith(ALLOWED_EMAIL_DOMAIN)) {
      setError(`Use your ${ALLOWED_EMAIL_DOMAIN} email address.`);
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const { error, needsConfirmation } = await signUp(normalizedEmail, password);
    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else if (needsConfirmation) {
      setSent(true);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-lg border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="md" showName={true} />
          </div>
          <CardTitle className="tracking-tight">{sent ? 'Check your email' : 'Create account'}</CardTitle>
          <CardDescription>
            {sent
              ? 'We sent a confirmation link to your inbox. Open it to activate your account, then sign in.'
              : 'Sign up with your work email to get started'}
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Back to sign in
            </Button>
          </CardFooter>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div
                  id="signup-error"
                  role="alert"
                  className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
                >
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={ALLOWED_EMAIL_DOMAIN ? `you${ALLOWED_EMAIL_DOMAIN}` : 'you@example.com'}
                  required
                  aria-required="true"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'signup-error' : undefined}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  required
                  aria-required="true"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'signup-error' : undefined}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                  Confirm password <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  aria-required="true"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'signup-error' : undefined}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-foreground underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Signup;
