import React, { useState } from 'react';
import { X, Sparkles, User, Mail, Lock, ShieldCheck, UserCheck, AlertOctagon } from 'lucide-react';
import { ADMIN_CREDENTIALS, isEmailAdmin } from '../initialData';
import { UserAccount } from '../types';
import { auth, db } from '../firebase';
import logoImage from '../assets/images/scarlet_logo_1780370672962.png';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  registeredUsers: UserAccount[];
  onAddNewUser: (newUser: UserAccount) => void;
}

export default function LoginModal({
  onClose,
  onLoginSuccess,
  registeredUsers,
  onAddNewUser
}: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Sign in Fields
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  // Sign up Fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Notifications
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    const emailClean = signinEmail.trim().toLowerCase();
    const passClean = signinPassword;

    try {
      setSuccessText('Connecting to secure cloud database...');
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, emailClean, passClean);
      } catch (authErr: any) {
        // Direct support for credentials defined in initialData to make trial flawless!
        const isAutofillUser = emailClean === ADMIN_CREDENTIALS.email || emailClean === 'demon_slayer@bingo.com' || emailClean === 'otaku_core@yahoo.com';
        if (isAutofillUser && (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/invalid-login-credentials')) {
          setSuccessText('Provisioning test sandbox user...');
          const userCred = await createUserWithEmailAndPassword(auth, emailClean, passClean);
          const user = userCred.user;
          const initialUsername = emailClean === ADMIN_CREDENTIALS.email ? 'ScarletAdmin' : 
                                  emailClean === 'demon_slayer@bingo.com' ? 'TanjiroFan' : 'LeviAckerman';
          
          await updateProfile(user, { displayName: initialUsername });
          
          const profile: UserAccount = {
            id: user.uid,
            email: emailClean,
            username: initialUsername,
            role: isEmailAdmin(emailClean) ? 'admin' : 'user',
            createdAt: new Date().toISOString()
          };
          
          await setDoc(doc(db, 'users', user.uid), profile);
          userCredential = userCred;
        } else {
          throw authErr;
        }
      }

      // Success! Fetch or create profile in Firestore
      const loggedUser = userCredential.user;
      const profileRef = doc(db, 'users', loggedUser.uid);
      const profileSnap = await getDoc(profileRef);
      
      let profileData: UserAccount;
      if (profileSnap.exists()) {
        profileData = profileSnap.data() as UserAccount;
      } else {
        profileData = {
          id: loggedUser.uid,
          email: loggedUser.email || emailClean,
          username: loggedUser.displayName || emailClean.split('@')[0],
          role: isEmailAdmin(emailClean) ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(profileRef, profileData);
      }

      setSuccessText(`Logged in as ${profileData.username}!`);
      setTimeout(() => {
        onLoginSuccess(profileData);
        onClose();
      }, 800);
      
    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to authenticate.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        msg = 'Invalid password or username. (Minimum 6 characters required by Firebase)';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'Account not found. Switch to the Sign Up tab to register!';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'This email address format is invalid.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorText(msg);
      setSuccessText(null);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setSuccessText(null);

    const emailClean = signupEmail.trim().toLowerCase();
    const usernameClean = signupUsername.trim();
    const pass = signupPassword;

    if (!usernameClean || !emailClean || !pass) {
      setErrorText('Please fill out all registration fields.');
      return;
    }

    if (pass.length < 6) {
      setErrorText('Firebase Authentication requires passwords to be at least 6 characters.');
      return;
    }

    try {
      setSuccessText('Creating security cloud credentials...');
      const userCred = await createUserWithEmailAndPassword(auth, emailClean, pass);
      const user = userCred.user;
      
      await updateProfile(user, { displayName: usernameClean });
      
      const newAccount: UserAccount = {
        id: user.uid,
        email: emailClean,
        username: usernameClean,
        role: isEmailAdmin(emailClean) ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), newAccount);
      onAddNewUser(newAccount);
      
      setSuccessText('Account configured successfully! Access granted.');
      setTimeout(() => {
        onLoginSuccess(newAccount);
        onClose();
      }, 1000);

    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to register account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already in use by another subscriber.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password chosen is too weak. Please use at least 6 characters.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorText(msg);
      setSuccessText(null);
    }
  };

  // Preset Auto-fill triggers
  const autofillAdmin = () => {
    setSigninEmail(ADMIN_CREDENTIALS.email);
    setSigninPassword(ADMIN_CREDENTIALS.password);
    setActiveTab('signin');
    setErrorText(null);
  };

  const autofillDemoUser = () => {
    setSigninEmail('demon_slayer@bingo.com');
    setSigninPassword('pass1234');
    setActiveTab('signin');
    setErrorText(null);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      
      {/* Container window */}
      <div 
        className="w-full max-w-md glass rounded-3xl shadow-2xl relative overflow-hidden flex flex-col"
        id="login-modal-panel"
      >
        
        {/* Top visual graphic line */}
        <div className="h-1 bg-gradient-to-r from-[#ff3e3e] via-orange-500 to-[#ff3e3e]" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          id="modal-close-btn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex items-center justify-center">
              <img 
                src={logoImage} 
                alt="Scarlet Sigma Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-display font-medium text-white text-lg tracking-tighter uppercase">SCARLET SIGMA</span>
          </div>
          <p className="text-center text-xs text-zinc-300 opacity-85 px-4">
            Sign in to access premium Japanese anime episodes and local watch-history trackers.
          </p>

          {/* Toggle Tab header */}
          <div className="flex border border-white/15 mt-6 bg-white/5 rounded-full p-1">
            <button
              onClick={() => { setActiveTab('signin'); setErrorText(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold font-display rounded-full transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'signin' 
                  ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              id="tab-toggle-signin"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setErrorText(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold font-display rounded-full transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'signup' 
                  ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              id="tab-toggle-signup"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorText && (
            <div className="mb-4 p-3 bg-[#ff3e3e]/10 border border-[#ff3e3e]/20 text-[#ff3e3e] rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <AlertOctagon className="w-4 h-4 shrink-0 text-[#ff3e3e]" />
              <span>{errorText}</span>
            </div>
          )}

          {successText && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
              <span>{successText}</span>
            </div>
          )}

          {activeTab === 'signin' ? (
            /* SIGN IN FORM */
            <form onSubmit={handleSignInSubmit} className="flex flex-col gap-4" id="signin-html-form">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={signinEmail}
                    onChange={e => setSigninEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ff3e3e]/50 focus:ring-1 focus:ring-[#ff3e3e]/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Secret Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={signinPassword}
                    onChange={e => setSigninPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ff3e3e]/50 focus:ring-1 focus:ring-[#ff3e3e]/30 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#ff3e3e] hover:bg-[#ff5555] active:scale-95 text-white font-bold text-xs rounded-full shadow-lg shadow-[#ff3e3e]/20 transition-all mt-2"
                id="signin-btn-submit"
              >
                Access Premium Library
              </button>
            </form>
          ) : (
            /* SIGN UP FORM (REGISTER) */
            <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-4" id="signup-html-form">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Username / Alias</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={signupUsername}
                    onChange={e => setSignupUsername(e.target.value)}
                    placeholder="e.g. TanjiroFan"
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ff3e3e]/50 focus:ring-1 focus:ring-[#ff3e3e]/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ff3e3e]/50 focus:ring-1 focus:ring-[#ff3e3e]/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ff3e3e]/50 focus:ring-1 focus:ring-[#ff3e3e]/30 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#ff3e3e] hover:bg-[#ff5555] active:scale-95 text-white font-bold text-xs rounded-full shadow-lg shadow-[#ff3e3e]/20 transition-all mt-2"
                id="signup-btn-submit"
              >
                Register Account
              </button>
            </form>
          )}

          {/* Preset Fast Testing panel */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <span className="text-[9px] font-mono text-zinc-400 tracking-widest block mb-2 text-center uppercase">
              PRESET TESTING AUTOFILLS
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={autofillAdmin}
                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-[#ff3e3e]/40 rounded-full text-[10px] font-medium text-zinc-300 hover:text-[#ff3e3e] transition-colors text-center"
              >
                Autofill Admin
              </button>
              <button
                type="button"
                onClick={autofillDemoUser}
                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-[#ff3e3e]/40 rounded-full text-[10px] font-medium text-zinc-300 hover:text-[#ff3e3e] transition-colors text-center"
              >
                Autofill User
              </button>
            </div>
            <p className="text-[10px] text-center text-zinc-400 font-mono mt-3">
              Admin specs: <code className="text-zinc-300">scarlet@gmail.com / shadow61!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
