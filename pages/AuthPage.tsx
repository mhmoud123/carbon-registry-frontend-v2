import React, { useState } from 'react';
import { frappeLogin, frappeSignup } from '../services/frappe';
import { TextInput } from '../components/ui/Input';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const response = await frappeLogin(email, password);
        
        // Save minimal user info to local storage to persist session state in UI
        const userObj = {
            name: response.full_name || email,
            email: email,
            roles: [] // Ideally, fetch roles from 'frappe.auth.get_logged_user' in a separate call
        };
        localStorage.setItem('frappe_user', JSON.stringify(userObj));
        
        onLoginSuccess();
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        await frappeSignup(email, fullName);
        alert("Account created! Please check your email or sign in.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Panel: Form */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col justify-center px-8 sm:px-14 md:px-20 lg:px-24">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="text-3xl font-bold text-slate-800 tracking-tighter flex items-center gap-2">
                <span className="text-3xl">❁</span> <span>iCR</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isLogin ? "Login" : "Create an account"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <TextInput 
              label="Full Name" 
              placeholder="Your Name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}

          <TextInput 
            label="Email" 
            placeholder="name@company.com" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <TextInput 
            label="Password" 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {!isLogin && (
             <TextInput 
             label="Confirm password" 
             type="password"
             value={confirmPassword}
             onChange={(e) => setConfirmPassword(e.target.value)}
             required
           />
          )}

          {isLogin && (
            <div className="flex justify-end">
              <button type="button" className="text-sm text-slate-500 hover:text-slate-800">
                Forgot password?
              </button>
            </div>
          )}

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#a3e635] hover:bg-[#88cc2b] text-slate-900 font-semibold rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a3e635] disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
          </button>

          <button
            type="button"
            onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
            }}
            className="w-full py-3 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md shadow-sm hover:bg-slate-50 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">or</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4">
             <button className="flex items-center justify-center w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm bg-white hover:bg-slate-50 text-slate-700 font-medium">
                <span className="sr-only">Sign in with Google</span>
                Google
             </button>
             <button className="flex items-center justify-center w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm bg-white hover:bg-slate-50 text-slate-700 font-medium">
                Microsoft
             </button>
             <button className="flex items-center justify-center w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm bg-white hover:bg-slate-50 text-slate-700 font-medium">
                Linkedin
             </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Image */}
      <div className="hidden md:block w-1/2 lg:w-7/12 relative bg-slate-100">
         <img 
           src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80" 
           alt="Mountain Background" 
           className="absolute inset-0 w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-black/10"></div>
      </div>
    </div>
  );
};

export default AuthPage;
