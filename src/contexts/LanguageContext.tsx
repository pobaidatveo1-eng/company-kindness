import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // App
    'app.name': 'Non Stop',
    'app.tagline': 'أعمالك لا تتوقف',
    
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.fullName': 'الاسم الكامل',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.hasAccount': 'لديك حساب بالفعل؟',
    'auth.loginSuccess': 'تم تسجيل الدخول بنجاح',
    'auth.signupSuccess': 'تم إنشاء الحساب بنجاح',
    'auth.loginError': 'خطأ في تسجيل الدخول',
    'auth.signupError': 'خطأ في إنشاء الحساب',
    'auth.welcome': 'مرحباً بك في Non Stop',
    'auth.welcomeBack': 'مرحباً بعودتك',
    'auth.createAccount': 'أنشئ حسابك الآن',
    
    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.myTasks': 'مهامي اليوم',
    'dashboard.upcomingEvents': 'المواعيد القادمة',
    'dashboard.manualItems': 'البنود اليدوية',
    'dashboard.notifications': 'الإشعارات',
    'dashboard.myAccount': 'حسابي',
    'dashboard.taskDistribution': 'توزيع المهام',
    'dashboard.delayedTasks': 'المهام المتأخرة',
    'dashboard.loadBalance': 'توازن الأحمال',
    'dashboard.alerts': 'التنبيهات',
    'dashboard.teamSettings': 'إعدادات الفريق',
    'dashboard.companyHealth': 'صحة الشركة',
    'dashboard.departmentLoad': 'حمل الأقسام',
    'dashboard.aiInsights': 'رؤى الذكاء الاصطناعي',
    'dashboard.risks': 'المخاطر والتجاوزات',
    'dashboard.companySettings': 'إعدادات الشركة',
    
    // Roles
    'role.employee': 'موظف',
    'role.admin': 'مدير',
    'role.super_admin': 'مدير عام',
    
    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات',
    'common.error': 'حدث خطأ',
    'common.success': 'تم بنجاح',
    'common.confirm': 'تأكيد',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.settings': 'الإعدادات',
    'common.profile': 'الملف الشخصي',
    'common.language': 'اللغة',
    'common.theme': 'المظهر',
    'common.dark': 'داكن',
    'common.light': 'فاتح',
  },
  en: {
    // App
    'app.name': 'Non Stop',
    'app.tagline': 'Your Work Never Stops',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.fullName': 'Full Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.loginSuccess': 'Login successful',
    'auth.signupSuccess': 'Account created successfully',
    'auth.loginError': 'Login error',
    'auth.signupError': 'Signup error',
    'auth.welcome': 'Welcome to Non Stop',
    'auth.welcomeBack': 'Welcome Back',
    'auth.createAccount': 'Create your account',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.myTasks': 'My Tasks Today',
    'dashboard.upcomingEvents': 'Upcoming Events',
    'dashboard.manualItems': 'Manual Items',
    'dashboard.notifications': 'Notifications',
    'dashboard.myAccount': 'My Account',
    'dashboard.taskDistribution': 'Task Distribution',
    'dashboard.delayedTasks': 'Delayed Tasks',
    'dashboard.loadBalance': 'Load Balance',
    'dashboard.alerts': 'Alerts',
    'dashboard.teamSettings': 'Team Settings',
    'dashboard.companyHealth': 'Company Health',
    'dashboard.departmentLoad': 'Department Load',
    'dashboard.aiInsights': 'AI Insights',
    'dashboard.risks': 'Risks & Violations',
    'dashboard.companySettings': 'Company Settings',
    
    // Roles
    'role.employee': 'Employee',
    'role.admin': 'Admin',
    'role.super_admin': 'Super Admin',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
    'common.error': 'Error occurred',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.settings': 'Settings',
    'common.profile': 'Profile',
    'common.language': 'Language',
    'common.theme': 'Theme',
    'common.dark': 'Dark',
    'common.light': 'Light',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nonstop-language');
    return (saved as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nonstop-language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
