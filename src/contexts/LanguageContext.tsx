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
    'dashboard.allTasks': 'جميع المهام',
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
    
    // Team Management
    'team.management': 'إدارة الفريق',
    'team.managementDesc': 'إدارة جميع أعضاء الفريق والصلاحيات',
    'team.addUser': 'إضافة مستخدم',
    'team.addEmployee': 'إضافة موظف',
    'team.totalMembers': 'إجمالي الأعضاء',
    'team.admins': 'المديرون',
    'team.employees': 'الموظفون',
    'team.employeesDesc': 'عرض وإدارة موظفي الفريق',
    'team.activeUsers': 'المستخدمون النشطون',
    'team.allMembers': 'جميع الأعضاء',
    'team.name': 'الاسم',
    'team.role': 'الدور',
    'team.department': 'القسم',
    'team.phone': 'الهاتف',
    'team.status': 'الحالة',
    'team.active': 'نشط',
    'team.inactive': 'غير نشط',
    'team.changeRole': 'تغيير الدور',
    'team.changeRoleFor': 'تغيير دور',
    'team.newRole': 'الدور الجديد',
    'team.deactivate': 'إلغاء التفعيل',
    'team.activate': 'تفعيل',
    'team.deleteUser': 'حذف المستخدم',
    'team.deleteUserConfirm': 'هل أنت متأكد من حذف',
    'team.fullName': 'الاسم الكامل',
    'team.fullNameAr': 'الاسم بالعربية',
    'team.selectDepartment': 'اختر القسم',
    'team.userCreated': 'تم إنشاء المستخدم',
    'team.userCreatedDesc': 'تم إنشاء المستخدم بنجاح',
    'team.roleUpdated': 'تم تحديث الدور',
    'team.roleUpdatedDesc': 'تم تحديث دور المستخدم بنجاح',
    'team.statusUpdated': 'تم تحديث الحالة',
    'team.statusUpdatedDesc': 'تم تحديث حالة المستخدم بنجاح',
    'team.userDeleted': 'تم حذف المستخدم',
    'team.userDeletedDesc': 'تم حذف المستخدم بنجاح',
    'team.performance': 'الأداء',
    'team.totalEmployees': 'إجمالي الموظفين',
    'team.activeEmployees': 'الموظفون النشطون',
    'team.employeesList': 'قائمة الموظفين',
    'team.noEmployees': 'لا يوجد موظفون',
    
    // Tasks
    'tasks.total': 'الإجمالي',
    'tasks.completed': 'مكتمل',
    'tasks.inProgress': 'قيد التنفيذ',
    'tasks.overdue': 'متأخر',
    
    // Departments
    'departments.operations': 'العمليات',
    'departments.marketing': 'التسويق',
    'departments.hr': 'الموارد البشرية',
    'departments.finance': 'المالية',
    'departments.it': 'تقنية المعلومات',
    'departments.sales': 'المبيعات',
    'departments.legal': 'القانونية',
    'departments.other': 'أخرى',
    'departments.design': 'التصميم',
    'departments.content': 'المحتوى',
    'departments.social_media': 'التواصل الاجتماعي',
    'departments.video': 'الفيديو',
    
    // Navigation
    'nav.clients': 'العملاء',
    'nav.contracts': 'العقود',
    'nav.departments': 'الأقسام',
    
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
    'common.actions': 'الإجراءات',
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
    'dashboard.allTasks': 'All Tasks',
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
    
    // Team Management
    'team.management': 'Team Management',
    'team.managementDesc': 'Manage all team members and permissions',
    'team.addUser': 'Add User',
    'team.addEmployee': 'Add Employee',
    'team.totalMembers': 'Total Members',
    'team.admins': 'Admins',
    'team.employees': 'Employees',
    'team.employeesDesc': 'View and manage team employees',
    'team.activeUsers': 'Active Users',
    'team.allMembers': 'All Members',
    'team.name': 'Name',
    'team.role': 'Role',
    'team.department': 'Department',
    'team.phone': 'Phone',
    'team.status': 'Status',
    'team.active': 'Active',
    'team.inactive': 'Inactive',
    'team.changeRole': 'Change Role',
    'team.changeRoleFor': 'Change role for',
    'team.newRole': 'New Role',
    'team.deactivate': 'Deactivate',
    'team.activate': 'Activate',
    'team.deleteUser': 'Delete User',
    'team.deleteUserConfirm': 'Are you sure you want to delete',
    'team.fullName': 'Full Name',
    'team.fullNameAr': 'Arabic Name',
    'team.selectDepartment': 'Select Department',
    'team.userCreated': 'User Created',
    'team.userCreatedDesc': 'User created successfully',
    'team.roleUpdated': 'Role Updated',
    'team.roleUpdatedDesc': 'User role updated successfully',
    'team.statusUpdated': 'Status Updated',
    'team.statusUpdatedDesc': 'User status updated successfully',
    'team.userDeleted': 'User Deleted',
    'team.userDeletedDesc': 'User deleted successfully',
    'team.performance': 'Performance',
    'team.totalEmployees': 'Total Employees',
    'team.activeEmployees': 'Active Employees',
    'team.employeesList': 'Employees List',
    'team.noEmployees': 'No employees',
    
    // Tasks
    'tasks.total': 'Total',
    'tasks.completed': 'Completed',
    'tasks.inProgress': 'In Progress',
    'tasks.overdue': 'Overdue',
    
    // Departments
    'departments.operations': 'Operations',
    'departments.marketing': 'Marketing',
    'departments.hr': 'Human Resources',
    'departments.finance': 'Finance',
    'departments.it': 'IT',
    'departments.sales': 'Sales',
    'departments.legal': 'Legal',
    'departments.other': 'Other',
    'departments.design': 'Design',
    'departments.content': 'Content',
    'departments.social_media': 'Social Media',
    'departments.video': 'Video',
    
    // Navigation
    'nav.clients': 'Clients',
    'nav.contracts': 'Contracts',
    'nav.departments': 'Departments',
    
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
    'common.actions': 'Actions',
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
