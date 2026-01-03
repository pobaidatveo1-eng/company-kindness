import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { 
  Zap, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2,
  Users,
  BarChart3,
  Brain,
  Shield
} from 'lucide-react';

const Index = () => {
  const { t, language, dir } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: language === 'ar' ? 'إدارة الفرق' : 'Team Management',
      description: language === 'ar' 
        ? 'وزّع المهام وتابع أداء فريقك بسهولة' 
        : 'Distribute tasks and track team performance easily',
    },
    {
      icon: BarChart3,
      title: language === 'ar' ? 'تحليلات ذكية' : 'Smart Analytics',
      description: language === 'ar'
        ? 'راقب صحة شركتك بلوحات تحكم تفاعلية'
        : 'Monitor company health with interactive dashboards',
    },
    {
      icon: Brain,
      title: language === 'ar' ? 'ذكاء اصطناعي' : 'AI Insights',
      description: language === 'ar'
        ? 'اكتشف المخاطر والفرص قبل حدوثها'
        : 'Discover risks and opportunities before they happen',
    },
    {
      icon: Shield,
      title: language === 'ar' ? 'أمان متقدم' : 'Advanced Security',
      description: language === 'ar'
        ? 'بياناتك محمية بأحدث تقنيات الأمان'
        : 'Your data is protected with the latest security',
    },
  ];

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center animate-pulse-orange">
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
          {user ? (
            <Button onClick={() => navigate('/dashboard')}>
              {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')}>
              {t('auth.login')}
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary mb-6 animate-fade-in">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">
              {language === 'ar' ? 'منصة إدارة الشركات الذكية' : 'Smart Company Management Platform'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            <span className="text-foreground">
              {language === 'ar' ? 'أعمالك' : 'Your Work'}
            </span>
            <br />
            <span className="text-primary">
              {language === 'ar' ? 'لا تتوقف' : 'Never Stops'}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            {language === 'ar'
              ? 'منصة متكاملة لإدارة فرق التسويق ووكالات السوشيال ميديا. وزّع المهام، تابع الأداء، واكتشف الفرص بالذكاء الاصطناعي.'
              : 'A complete platform for managing marketing teams and social media agencies. Distribute tasks, track performance, and discover opportunities with AI.'}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => navigate('/auth')}
            >
              {language === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}
              <ArrowIcon className="h-5 w-5 ms-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto"
            >
              {language === 'ar' ? 'شاهد العرض' : 'Watch Demo'}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {language === 'ar' ? 'كل ما تحتاجه في مكان واحد' : 'Everything You Need in One Place'}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {language === 'ar' ? 'جاهز للبدء؟' : 'Ready to Start?'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {language === 'ar'
              ? 'انضم لمئات الشركات التي تدير أعمالها بذكاء'
              : 'Join hundreds of companies managing their work smartly'}
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            {language === 'ar' ? 'سجّل الآن' : 'Sign Up Now'}
            <CheckCircle2 className="h-5 w-5 ms-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground border-t border-border">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-bold">Non Stop</span>
        </div>
        © 2026 Non Stop. {t('app.tagline')}
      </footer>
    </div>
  );
};

export default Index;
