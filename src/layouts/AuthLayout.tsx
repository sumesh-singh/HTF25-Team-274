import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="font-display bg-background-dark text-foreground-dark antialiased">
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-6 lg:grid lg:grid-cols-2">
            <div className="relative hidden h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-secondary p-10 lg:flex">
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm"></div>
                <div className="absolute -left-20 -top-20 h-60 w-60 animate-[spin_20s_linear_infinite] rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -bottom-20 -right-20 h-60 w-60 animate-[spin_20s_linear_infinite_reverse] rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative z-10 flex flex-col items-center text-center text-white">
                    <a className="mb-8 flex items-center gap-3 text-4xl font-bold tracking-tight" href="#">
                        <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="m12 11 4 2"></path>
                            <path d="m12 11-4 2"></path>
                            <path d="m12 11 v4"></path>
                            <path d="m16 13 v4"></path>
                            <path d="m8 13 v4"></path>
                        </svg>
                        SkillSync
                    </a>
                    <h1 className="text-4xl font-bold leading-snug">Unlock Your Potential.</h1>
                    <p className="mt-4 max-w-md text-lg text-indigo-200">Join a community of learners and mentors to share skills and grow together.</p>
                </div>
                <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center text-sm text-indigo-300">
                    <p>© 2025 SkillSync. All rights reserved.</p>
                </div>
            </div>
            <main className="flex w-full items-center justify-center bg-background-dark">
                <Outlet />
            </main>
        </div>
    </div>
  );
};

export default AuthLayout;
