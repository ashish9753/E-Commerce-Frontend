import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * "Continue with Google" button used on both Login and Register pages.
 *
 *  - Existing account → log in and route by role.
 *  - New account     → either invoke `onNeedsRegistration({idToken, profile})`
 *                       if the parent wants to handle it inline (RegisterPage
 *                       fills its form), or stash in sessionStorage and route
 *                       to /register (LoginPage path — Google is the only way
 *                       to create a new account, so we send them there).
 */
export default function GoogleAuthButton({ text = 'continue_with', onNeedsRegistration }) {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
  const toast = useToast();

  const handleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) { toast('Google sign-in failed', 'error'); return; }

    const result = await googleLogin(idToken);
    if (!result.success) { toast(result.error || 'Google sign-in failed', 'error'); return; }

    if (result.needsRegistration) {
      const payload = { idToken: result.idToken, profile: result.profile };
      if (onNeedsRegistration) {
        onNeedsRegistration(payload);
      } else {
        // LoginPage path: persist briefly and bounce to /register, which
        // reads sessionStorage on mount and pre-fills its form.
        sessionStorage.setItem('pendingGoogleSignup', JSON.stringify(payload));
        toast('Email verified — finish creating your account', 'info');
        navigate('/register');
      }
      return;
    }

    toast(`Welcome, ${result.user.name.split(' ')[0]}!`);
    const role = result.user.role;
    if (role === 'admin') navigate('/admin');
    else if (role === 'employee') navigate('/employee');
    else navigate('/');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast('Google sign-in was cancelled', 'error')}
        text={text}                  // "continue_with" | "signup_with" | "signin_with"
        shape="rectangular"
        size="large"
        width="340"
        useOneTap={false}
      />
    </div>
  );
}
