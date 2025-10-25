import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="relative">
                <div className={`space-y-2 transition-all duration-300 ${isLogin ? 'opacity-100' : 'opacity-0 absolute'}`}>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground-dark">Welcome Back!</h2>
                    <p className="text-muted-dark">Log in to continue your learning journey.</p>
                </div>
                <div className={`space-y-2 transition-all duration-300 ${!isLogin ? 'opacity-100' : 'opacity-0'}`}>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground-dark">Create an Account</h2>
                    <p className="text-muted-dark">Start your skill-sharing journey today.</p>
                </div>
            </div>

            <div className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-800 p-1.5">
                <button onClick={() => setIsLogin(true)} className={`flex h-full flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-semibold leading-normal transition-all ${isLogin ? 'bg-primary text-white' : 'text-muted-dark'}`}>
                    <span className="truncate">Login</span>
                </button>
                <button onClick={() => setIsLogin(false)} className={`flex h-full flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-semibold leading-normal transition-all ${!isLogin ? 'bg-primary text-white' : 'text-muted-dark'}`}>
                    <span className="truncate">Sign Up</span>
                </button>
            </div>

            <form className="flex flex-col gap-4">
                <div className="relative pt-4">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark peer-focus:text-secondary" />
                    <input className="form-input peer h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-dark bg-transparent pl-10 pr-4 text-base text-foreground-dark placeholder:text-transparent transition-colors duration-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20" id="email" name="email" placeholder="name@example.com" type="email" />
                    <label className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-base text-muted-dark transition-all duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[1.6rem] peer-focus:scale-75 peer-focus:text-secondary" htmlFor="email">Email Address</label>
                </div>
                <div className="relative pt-4">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark peer-focus:text-secondary" />
                    <input className="form-input peer h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-dark bg-transparent pl-10 pr-10 text-base text-foreground-dark placeholder:text-transparent transition-colors duration-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20" id="password" name="password" placeholder="Enter your password" type={showPassword ? 'text' : 'password'} />
                    <label className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-base text-muted-dark transition-all duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[1.6rem] peer-focus:scale-75 peer-focus:text-secondary" htmlFor="password">Password</label>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark hover:text-foreground-dark" type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                {isLogin && (
                    <div className="flex items-center justify-between mt-2">
                        <div></div>
                        <a className="text-sm font-medium text-secondary hover:text-primary-hover hover:underline" href="#">Forgot Password?</a>
                    </div>
                )}
                <button className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-semibold text-white shadow-sm transition-all duration-300 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark active:scale-95" type="submit">
                    {isLogin ? 'Login' : 'Sign Up'}
                </button>
            </form>

            <div className="relative my-2 flex items-center">
                <div className="flex-grow border-t border-border-dark"></div>
                <span className="mx-4 flex-shrink text-sm font-medium text-muted-dark">OR CONTINUE WITH</span>
                <div className="flex-grow border-t border-border-dark"></div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                {/* Social Login Buttons can be added here */}
            </div>

            <div className="text-center">
                <p className="text-sm text-muted-dark">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button className="font-semibold text-primary hover:text-primary-hover hover:underline" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
