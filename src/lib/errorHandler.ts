// Error sanitization utility to prevent information leakage
export const sanitizeError = (error: unknown): string => {
  // Known safe errors to pass through (user-facing messages)
  const safeErrors = [
    'Invalid login credentials',
    'User already registered',
    'Email not confirmed',
    'Password should be at least 6 characters',
    'Email rate limit exceeded',
    'User not found',
    'Invalid email or password',
    'بيانات تسجيل الدخول غير صحيحة',
    'المستخدم مسجل بالفعل',
    'البريد الإلكتروني غير مؤكد',
  ];

  const errorMessage = typeof error === 'string' 
    ? error 
    : (error as { message?: string })?.message || '';

  // Check if it's a known safe error
  if (safeErrors.some(safe => errorMessage.includes(safe))) {
    return errorMessage;
  }

  // Map database/RLS errors to generic messages
  if (errorMessage.includes('row-level security') || errorMessage.includes('policy')) {
    return 'ليس لديك صلاحية للقيام بهذا الإجراء';
  }

  if (errorMessage.includes('violates') || errorMessage.includes('constraint')) {
    return 'البيانات المدخلة غير صالحة';
  }

  if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
    return 'هذا العنصر موجود بالفعل';
  }

  if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
    return 'العنصر المطلوب غير موجود';
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
    return 'خطأ في الاتصال، يرجى المحاولة مرة أخرى';
  }

  // Default generic error
  return 'حدث خطأ، يرجى المحاولة مرة أخرى';
};

export const sanitizeErrorEn = (error: unknown): string => {
  const errorMessage = typeof error === 'string' 
    ? error 
    : (error as { message?: string })?.message || '';

  const safeErrors = [
    'Invalid login credentials',
    'User already registered',
    'Email not confirmed',
    'Password should be at least 6 characters',
    'Email rate limit exceeded',
    'User not found',
    'Invalid email or password',
  ];

  if (safeErrors.some(safe => errorMessage.includes(safe))) {
    return errorMessage;
  }

  if (errorMessage.includes('row-level security') || errorMessage.includes('policy')) {
    return 'You do not have permission to perform this action';
  }

  if (errorMessage.includes('violates') || errorMessage.includes('constraint')) {
    return 'Invalid data provided';
  }

  if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
    return 'This item already exists';
  }

  if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
    return 'The requested item was not found';
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
    return 'Connection error, please try again';
  }

  return 'An error occurred. Please try again';
};
