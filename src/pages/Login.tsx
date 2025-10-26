import { useState, FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface FormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
}

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isLoading, error, clearError } = useAuth();

  const from = location.state?.from?.pathname || "/";

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!isLogin) {
      if (!formData.firstName) {
        errors.firstName = "First name is required";
      }
      if (!formData.lastName) {
        errors.lastName = "Last name is required";
      }
    }

    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    clearError();

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName!,
          lastName: formData.lastName!,
        });
      }
      navigate(from, { replace: true });
    } catch (error: any) {
      setErrors({
        general:
          error.response?.data?.error?.message ||
          (isLogin ? "Login failed" : "Registration failed"),
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Implement social login logic here
    console.log(`Logging in with ${provider}`);
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="relative">
        <div
          className={`space-y-2 transition-all duration-300 ${
            isLogin ? "opacity-100" : "opacity-0 absolute"
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground-dark">
            Welcome Back!
          </h2>
          <p className="text-muted-dark">
            Log in to continue your learning journey.
          </p>
        </div>
        <div
          className={`space-y-2 transition-all duration-300 ${
            !isLogin ? "opacity-100" : "opacity-0"
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground-dark">
            Create an Account
          </h2>
          <p className="text-muted-dark">
            Start your skill-sharing journey today.
          </p>
        </div>
      </div>

      <div className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-800 p-1.5">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex h-full flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-semibold leading-normal transition-all ${
            isLogin ? "bg-primary text-white" : "text-muted-dark"
          }`}
        >
          <span className="truncate">Login</span>
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex h-full flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-semibold leading-normal transition-all ${
            !isLogin ? "bg-primary text-white" : "text-muted-dark"
          }`}
        >
          <span className="truncate">Sign Up</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <>
            <div className="relative pt-4">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark peer-focus:text-secondary" />
              <input
                className="form-input peer h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-dark bg-transparent pl-10 pr-4 text-base text-foreground-dark placeholder:text-transparent transition-colors duration-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                type="text"
                value={formData.firstName || ""}
                onChange={handleInputChange}
              />
              <label
                className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-base text-muted-dark transition-all duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[1.6rem] peer-focus:scale-75 peer-focus:text-secondary"
                htmlFor="firstName"
              >
                First Name
              </label>
              {errors.firstName && (
                <p className="mt-1 text-sm text-error">{errors.firstName}</p>
              )}
            </div>
            <div className="relative pt-4">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark peer-focus:text-secondary" />
              <input
                className="form-input peer h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-dark bg-transparent pl-10 pr-4 text-base text-foreground-dark placeholder:text-transparent transition-colors duration-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                type="text"
                value={formData.lastName || ""}
                onChange={handleInputChange}
              />
              <label
                className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-base text-muted-dark transition-all duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[1.6rem] peer-focus:scale-75 peer-focus:text-secondary"
                htmlFor="lastName"
              >
                Last Name
              </label>
              {errors.lastName && (
                <p className="mt-1 text-sm text-error">{errors.lastName}</p>
              )}
            </div>
          </>
        )}
        <div className="relative pt-4">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark peer-focus:text-secondary" />
          <input
            className="form-input peer h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-dark bg-transparent pl-10 pr-4 text-base text-foreground-dark placeholder:text-transparent transition-colors duration-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            id="email"
            name="email"
            placeholder="name@example.com"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />
          <label
            className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-base text-muted-dark transition-all duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[1.6rem] peer-focus:scale-75 peer-focus:text-secondary"
            htmlFor="email"
          >
            Email Address
          </label>
          {errors.email && (
            <p className="mt-1 text-sm text-error">{errors.email}</p>
          )}
        </div>
        <div className="relative pt-4">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark peer-focus:text-secondary" />
          <input
            className="form-input peer h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-dark bg-transparent pl-10 pr-10 text-base text-foreground-dark placeholder:text-transparent transition-colors duration-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            id="password"
            name="password"
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange}
          />
          <label
            className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-base text-muted-dark transition-all duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[1.6rem] peer-focus:scale-75 peer-focus:text-secondary"
            htmlFor="password"
          >
            Password
          </label>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark hover:text-foreground-dark"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
          {errors.password && (
            <p className="mt-1 text-sm text-error">{errors.password}</p>
          )}
        </div>
        {isLogin && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-border-dark bg-transparent text-primary focus:ring-2 focus:ring-primary/50"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-muted-dark"
              >
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm font-medium text-secondary hover:text-primary-hover hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        )}

        {/* General error display */}
        {(errors.general || error) && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-500">{errors.general || error}</p>
          </div>
        )}

        <button
          className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-semibold text-white shadow-sm transition-all duration-300 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : isLogin ? (
            "Login"
          ) : (
            "Sign Up"
          )}
        </button>
      </form>

      <div className="relative my-6 flex items-center">
        <div className="flex-grow border-t border-border-dark"></div>
        <span className="mx-4 flex-shrink text-sm font-medium text-muted-dark">
          OR CONTINUE WITH
        </span>
        <div className="flex-grow border-t border-border-dark"></div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => handleSocialLogin("google")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border-dark px-4 py-2.5 text-sm font-medium text-foreground-dark hover:bg-card-light/5 transition-colors"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z"
              fill="#4285F4"
            />
            <path
              d="M12.24 24.0008C15.4764 24.0008 18.2058 22.9382 20.1944 21.1039L16.3274 18.1055C15.2516 18.8375 13.8626 19.252 12.24 19.252C9.0362 19.252 6.3106 17.1399 5.3646 14.3003H1.3916V17.3912C3.37 21.4434 7.4898 24.0008 12.24 24.0008Z"
              fill="#34A853"
            />
            <path
              d="M5.36451 14.3003C4.85051 12.8099 4.85051 11.1961 5.36451 9.70575V6.61481H1.39157C-0.465869 10.0056 -0.465869 14.0004 1.39157 17.3912L5.36451 14.3003Z"
              fill="#FBBC04"
            />
            <path
              d="M12.24 4.74966C13.9508 4.7232 15.6043 5.36697 16.8433 6.54867L20.2694 3.12262C18.0991 1.0855 15.2197 -0.034466 12.24 0.000808666C7.4898 0.000808666 3.37 2.55822 1.3916 6.61481L5.3644 9.70575C6.3104 6.86173 9.0361 4.74966 12.24 4.74966Z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
        <button
          onClick={() => handleSocialLogin("github")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border-dark px-4 py-2.5 text-sm font-medium text-foreground-dark hover:bg-card-light/5 transition-colors"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 0C5.37 0 0 5.37 0 12C0 17.31 3.435 21.795 8.205 23.385C8.805 23.49 9.03 23.13 9.03 22.815C9.03 22.53 9.015 21.585 9.015 20.58C6 21.135 5.22 19.845 4.98 19.17C4.845 18.825 4.26 17.76 3.75 17.475C3.33 17.25 2.73 16.695 3.735 16.68C4.68 16.665 5.355 17.55 5.58 17.91C6.66 19.725 8.385 19.215 9.075 18.9C9.18 18.12 9.495 17.595 9.84 17.295C7.17 16.995 4.38 15.96 4.38 11.37C4.38 10.065 4.845 8.985 5.61 8.145C5.49 7.845 5.07 6.615 5.73 4.965C5.73 4.965 6.735 4.65 9.03 6.195C9.99 5.925 11.01 5.79 12.03 5.79C13.05 5.79 14.07 5.925 15.03 6.195C17.325 4.635 18.33 4.965 18.33 4.965C18.99 6.615 18.57 7.845 18.45 8.145C19.215 8.985 19.68 10.05 19.68 11.37C19.68 15.975 16.875 16.995 14.205 17.295C14.64 17.67 15.015 18.39 15.015 19.515C15.015 21.12 15 22.41 15 22.815C15 23.13 15.225 23.505 15.825 23.385C18.2072 22.5808 20.2773 21.0498 21.7438 19.0074C23.2103 16.9651 23.9994 14.5143 24 12C24 5.37 18.63 0 12 0Z"
              fill="currentColor"
            />
          </svg>
          Continue with GitHub
        </button>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-dark">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            className="font-semibold text-primary hover:text-primary-hover hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
