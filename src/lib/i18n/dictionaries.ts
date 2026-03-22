export type SiteLocale = 'en' | 'ko' | 'es';

/** Nested string map for i18n; interface avoids TS circular-alias issues with Record. */
export interface Messages {
  [key: string]: string | Messages;
}

export const dictionaries: Record<SiteLocale, Messages> = {
  en: {
    common: {
      back: '← Back',
      language: 'Site language',
      comingSoon: 'Content coming soon.',
    },
    lang: { en: 'EN', ko: '한', es: 'ES' },
    home: {
      tagline: 'Where every patient is understood',
      footer: 'Secure · HIPAA-Compliant · Real-time Translation',
      providerTitle: 'Provider',
      providerDesc: 'Sign in to start a session',
      patientTitle: 'Patient',
      patientDesc: "Join with your provider's code",
    },
    login: {
      title: 'Provider sign in',
      sub: 'Access your dashboard and start a session',
      authFailed: 'Authentication failed. Please try again.',
      google: 'Sign in with Google',
      or: 'or',
      email: 'Email',
      emailPlaceholder: 'you@hospital.org',
      password: 'Password',
      signingIn: 'Signing in...',
      signIn: 'Sign in',
      forgotPassword: 'Forgot password?',
      newSignup: 'New provider signup',
      patientPrompt: 'Are you a patient?',
      joinInstead: 'Join a session instead',
      signInUnavailable:
        'Sign-in is not configured. Add Supabase environment variables.',
    },
    join: {
      title: 'Join a session',
      sub: 'Enter the code from your provider',
      codePlaceholder: 'Enter code',
      name: 'Name',
      namePlaceholder: 'Your name',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      yourLanguage: 'Your language',
      joining: 'Joining...',
      join: 'Join',
      help: 'Your provider will share a 6-digit code at the start of your visit. No account needed.',
      providerPrompt: 'Are you a provider?',
      signInInstead: 'Sign in instead',
      errorGeneric: 'Failed to join session',
    },
    forgot: {
      title: 'Forgot password?',
      description: "Enter the email on your account and we'll send a reset link.",
      email: 'Email',
      emailPlaceholder: 'you@hospital.org',
      send: 'Send reset link',
      backToSignIn: '← Back to sign in',
    },
    signup: {
      title: 'Sign up',
      description: 'Create a provider account for your organization.',
      fullName: 'Full name',
      fullNamePlaceholder: 'Dr. Jane Smith',
      workEmail: 'Work email',
      workEmailPlaceholder: 'you@hospital.org',
      password: 'Password',
      create: 'Create account',
      haveAccount: 'Already registered?',
      signIn: 'Sign in',
    },
    doctor: {
      navAria: 'Doctor navigation',
      appointments: 'Appointments',
      visits: 'Visits',
      startSession: 'Start session',
      live: 'Live',
      settings: 'Settings',
    },
  },
  ko: {
    common: {
      back: '← 뒤로',
      language: '사이트 언어',
      comingSoon: '콘텐츠 준비 중입니다.',
    },
    lang: { en: 'EN', ko: '한', es: 'ES' },
    home: {
      tagline: '모든 환자가 이해받는 곳',
      footer: '안전 · HIPAA 준수 · 실시간 통역',
      providerTitle: '의료진',
      providerDesc: '로그인하면 세션을 시작할 수 있습니다',
      patientTitle: '환자',
      patientDesc: '담당 의료진의 코드로 참여',
    },
    login: {
      title: '의료진 로그인',
      sub: '대시보드에 접속해 세션을 시작하세요',
      authFailed: '인증에 실패했습니다. 다시 시도해 주세요.',
      google: 'Google로 로그인',
      or: '또는',
      email: '이메일',
      emailPlaceholder: 'you@hospital.org',
      password: '비밀번호',
      signingIn: '로그인 중입니다…',
      signIn: '로그인',
      forgotPassword: '비밀번호를 잊으셨나요?',
      newSignup: '신규 의료진 가입',
      patientPrompt: '환자이신가요?',
      joinInstead: '세션 참여하기',
      signInUnavailable:
        '로그인이 설정되지 않았습니다. Supabase 환경 변수를 추가하세요.',
    },
    join: {
      title: '세션 참여',
      sub: '의료진이 알려준 코드를 입력하세요',
      codePlaceholder: '코드 입력',
      name: '이름',
      namePlaceholder: '이름',
      email: '이메일',
      emailPlaceholder: 'your@email.com',
      yourLanguage: '사용 언어',
      joining: '참여 중…',
      join: '참여',
      help: '방문 시작 시 의료진이 6자리 코드를 알려드립니다. 계정이 필요 없습니다.',
      providerPrompt: '의료진이신가요?',
      signInInstead: '로그인으로 이동',
      errorGeneric: '세션 참여에 실패했습니다',
    },
    forgot: {
      title: '비밀번호를 잊으셨나요?',
      description: '계정에 등록된 이메일을 입력하시면 재설정 링크를 보내드립니다.',
      email: '이메일',
      emailPlaceholder: 'you@hospital.org',
      send: '재설정 링크 보내기',
      backToSignIn: '← 로그인으로 돌아가기',
    },
    signup: {
      title: '가입',
      description: '기관용 의료진 계정을 만듭니다.',
      fullName: '이름',
      fullNamePlaceholder: '홍길동',
      workEmail: '직장 이메일',
      workEmailPlaceholder: 'you@hospital.org',
      password: '비밀번호',
      create: '계정 만들기',
      haveAccount: '이미 계정이 있으신가요?',
      signIn: '로그인',
    },
    doctor: {
      navAria: '의료진 메뉴',
      appointments: '예약',
      visits: '방문',
      startSession: '세션 시작',
      live: '실시간',
      settings: '설정',
    },
  },
  es: {
    common: {
      back: '← Volver',
      language: 'Idioma del sitio',
      comingSoon: 'Contenido próximamente.',
    },
    lang: { en: 'EN', ko: '한', es: 'ES' },
    home: {
      tagline: 'Donde cada paciente es comprendido',
      footer: 'Seguro · HIPAA · Traducción en tiempo real',
      providerTitle: 'Profesional',
      providerDesc: 'Inicie sesión para comenzar una sesión',
      patientTitle: 'Paciente',
      patientDesc: 'Únase con el código de su profesional',
    },
    login: {
      title: 'Acceso para profesionales',
      sub: 'Acceda a su panel e inicie una sesión',
      authFailed: 'Error de autenticación. Inténtelo de nuevo.',
      google: 'Iniciar sesión con Google',
      or: 'o',
      email: 'Correo electrónico',
      emailPlaceholder: 'usted@hospital.org',
      password: 'Contraseña',
      signingIn: 'Iniciando sesión…',
      signIn: 'Iniciar sesión',
      forgotPassword: '¿Olvidó su contraseña?',
      newSignup: 'Registro de nuevo profesional',
      patientPrompt: '¿Es usted paciente?',
      joinInstead: 'Unirse a una sesión',
      signInUnavailable:
        'El inicio de sesión no está configurado. Añada las variables de entorno de Supabase.',
    },
    join: {
      title: 'Unirse a una sesión',
      sub: 'Ingrese el código de su profesional',
      codePlaceholder: 'Código',
      name: 'Nombre',
      namePlaceholder: 'Su nombre',
      email: 'Correo electrónico',
      emailPlaceholder: 'su@correo.com',
      yourLanguage: 'Su idioma',
      joining: 'Uniendo…',
      join: 'Unirse',
      help: 'Su profesional le dará un código de 6 dígitos al inicio de la visita. No necesita cuenta.',
      providerPrompt: '¿Es usted profesional?',
      signInInstead: 'Iniciar sesión',
      errorGeneric: 'No se pudo unir a la sesión',
    },
    forgot: {
      title: '¿Olvidó su contraseña?',
      description: 'Ingrese el correo de su cuenta y le enviaremos un enlace para restablecerla.',
      email: 'Correo electrónico',
      emailPlaceholder: 'usted@hospital.org',
      send: 'Enviar enlace',
      backToSignIn: '← Volver al inicio de sesión',
    },
    signup: {
      title: 'Registrarse',
      description: 'Cree una cuenta de profesional para su organización.',
      fullName: 'Nombre completo',
      fullNamePlaceholder: 'Dra. María López',
      workEmail: 'Correo del trabajo',
      workEmailPlaceholder: 'usted@hospital.org',
      password: 'Contraseña',
      create: 'Crear cuenta',
      haveAccount: '¿Ya tiene cuenta?',
      signIn: 'Iniciar sesión',
    },
    doctor: {
      navAria: 'Navegación del profesional',
      appointments: 'Citas',
      visits: 'Visitas',
      startSession: 'Iniciar sesión',
      live: 'En vivo',
      settings: 'Ajustes',
    },
  },
};

function resolveMessage(dict: Messages, path: string): string | undefined {
  const parts = path.split('.');
  let cur: string | Messages | undefined = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = (cur as Record<string, string | Messages>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function translate(locale: SiteLocale, key: string): string {
  const fromLocale = resolveMessage(dictionaries[locale] as Messages, key);
  if (fromLocale) return fromLocale;
  const fallback = resolveMessage(dictionaries.en as Messages, key);
  return fallback ?? key;
}
