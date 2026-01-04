import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Building2, Shield } from 'lucide-react';
import { z } from 'zod';
import { sanitizeError } from '@/lib/errorHandler';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Auth = () => {
  const { t, language, dir } = useLanguage();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            variant: 'destructive',
            title: t('auth.loginError'),
            description: sanitizeError(error),
          });
        } else {
          toast({
            title: t('auth.loginSuccess'),
          });
          navigate('/dashboard');
        }
      } else {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.companyName);
        if (error) {
          toast({
            variant: 'destructive',
            title: t('auth.signupError'),
            description: sanitizeError(error),
          });
        } else {
          toast({
            title: t('auth.signupSuccess'),
          });
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('app.name')}</h1>
            <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? t('auth.login') 
                : (language === 'ar' ? 'سجّل شركتك وابدأ الآن' : 'Register your company and start now')
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {language === 'ar' ? 'اسم الشركة' : 'Company Name'}
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder={language === 'ar' ? 'مثال: شركة التميز للتسويق' : 'e.g., Excellence Marketing Co.'}
                      value={formData.companyName}
                      onChange={handleChange}
                      className={errors.companyName ? 'border-destructive' : ''}
                      disabled={loading}
                    />
                    {errors.companyName && (
                      <p className="text-sm text-destructive">{errors.companyName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder={language === 'ar' ? 'اسمك الكامل' : 'Your full name'}
                      value={formData.fullName}
                      onChange={handleChange}
                      className={errors.fullName ? 'border-destructive' : ''}
                      disabled={loading}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={loading}
                  dir="ltr"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'border-destructive' : ''}
                  disabled={loading}
                  dir="ltr"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                    disabled={loading}
                    dir="ltr"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {!isLogin && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' 
                      ? '✨ ستصبح المدير العام (Super Admin) لشركتك تلقائياً'
                      : '✨ You will automatically become the Super Admin of your company'
                    }
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLogin ? (
                  t('auth.login')
                ) : (
                  language === 'ar' ? 'إنشاء الشركة والحساب' : 'Create Company & Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                <span className="font-semibold">
                  {isLogin ? t('auth.signup') : t('auth.login')}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer with Super Admin Access */}
      <footer className="p-4 border-t border-border">
        <div className="max-w-md mx-auto space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 Non Stop. {t('app.tagline')}
          </p>
          
          {/* Super Admin Quick Access */}
          <div className="pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  email: 'pobaidat@gmail.com',
                  password: '',
                }));
                setIsLogin(true);
                toast({
                  title: language === 'ar' ? 'تم تحديد حساب المدير' : 'Admin account selected',
                  description: language === 'ar' ? 'أدخل كلمة المرور للمتابعة' : 'Enter password to continue',
                });
              }}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield className="h-3 w-3" />
              {language === 'ar' ? 'دخول المدير العام' : 'Super Admin Access'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
