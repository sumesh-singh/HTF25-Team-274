import { Edit, Verified, Shield, Award, PlusCircle, ChevronDown, Star, BookOpen, Users, Calendar } from 'lucide-react';

const Profile = () => {
    return (
        <div className="max-w-7xl mx-auto">
            <header className="overflow-hidden rounded-xl bg-card-dark border border-border-dark">
                <div className="relative h-48 bg-gradient-to-r from-cyan-900 to-blue-900">
                    <button className="absolute top-4 right-4 flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50">
                        <Edit className="h-3 w-3" />
                        <span>Edit cover</span>
                    </button>
                </div>
                <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-20 sm:-mt-16">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                            <div className="relative flex-shrink-0">
                                <div className="h-36 w-36 rounded-full bg-cover bg-center ring-4 ring-card-dark shadow-lg" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCyZcwBL4hxm_sRREaaxdtWu0mOw2-rlk9LSteUrg5Zqp8EKicEAW3ndDKa3hiR-MqDTehjccmSIg23QAoQbx1pxSFD5tyKVkmy2PYeuRMNEdRlELa7uNDZFj1ZgT-SN45K3zkJV7G5RZomfcTkQaZk18Po5DCdPfC17jQRVItf3yvKWYv_SfJBqwLJf11aKGsjogJUR_UT1yrrZHVnXd37KYegRDN6EekQHKhIXj4gL9YRkbqg1WQ_Aj5NUBiqJuEbY9m6pfc7J5ep")` }}></div>
                                <button className="absolute bottom-1 right-1 rounded-full bg-slate-800 p-2 shadow-md transition-colors hover:bg-slate-600">
                                    <Edit className="h-4 w-4 text-white" />
                                </button>
                            </div>
                            <div className="flex flex-col justify-center pb-2">
                                <h1 className="text-3xl font-bold leading-tight tracking-[-0.015em] text-white">Alex Doe</h1>
                                <p className="mt-1 text-base font-normal leading-normal text-text-dark-secondary">@alexdoe • San Francisco, CA</p>
                            </div>
                        </div>
                        <div className="mt-4 flex w-full gap-3 sm:mt-0 sm:w-auto">
                            <button className="flex flex-1 items-center justify-center rounded-lg bg-slate-700 px-4 text-sm font-bold leading-normal tracking-[0.015em] text-white transition-colors hover:bg-slate-600 sm:flex-auto">Edit Profile</button>
                            <button className="flex flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold leading-normal tracking-[0.015em] text-white transition-colors hover:bg-primary/90 sm:flex-auto">Share Profile</button>
                        </div>
                    </div>
                </div>
            </header>
            <div className="mt-6 grid grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
                    {/* About Me */}
                    <section className="rounded-xl bg-card-dark border border-border-dark p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">About Me</h2>
                            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-text-dark-secondary hover:text-white transition-colors">
                                <Edit className="h-3 w-3" />
                                <span>Edit</span>
                            </button>
                        </div>
                        <p className="text-text-dark-secondary">Frontend developer with 5+ years of experience specializing in React and TypeScript. I'm passionate about teaching web development and looking to learn mobile app development. In my free time, I contribute to open-source projects and mentor junior developers.</p>
                    </section>

                    {/* Skills & Expertise */}
                    <section className="rounded-xl bg-card-dark border border-border-dark p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Skills & Expertise</h2>
                            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-text-dark-secondary hover:text-white transition-colors">
                                <PlusCircle className="h-3 w-3" />
                                <span>Add Skill</span>
                            </button>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-wrap gap-2">
                                {['React', 'TypeScript', 'Next.js', 'Node.js', 'Tailwind CSS', 'GraphQL'].map((skill, index) => (
                                    <span key={index} className="rounded-full bg-slate-700 px-3 py-1 text-sm font-medium text-white">{skill}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-lg bg-slate-800 p-4">
                                    <h3 className="text-sm font-semibold text-text-dark-secondary">Teaching</h3>
                                    <ul className="mt-2 space-y-2">
                                        {['Frontend Development', 'React Fundamentals', 'TypeScript Basics'].map((item, index) => (
                                            <li key={index} className="flex items-center gap-2 text-sm text-white">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="rounded-lg bg-slate-800 p-4">
                                    <h3 className="text-sm font-semibold text-text-dark-secondary">Learning</h3>
                                    <ul className="mt-2 space-y-2">
                                        {['Mobile Development', 'React Native', 'Swift'].map((item, index) => (
                                            <li key={index} className="flex items-center gap-2 text-sm text-white">
                                                <Users className="h-4 w-4 text-secondary" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Reviews & Ratings */}
                    <section className="rounded-xl bg-card-dark border border-border-dark p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Reviews & Ratings</h2>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                                    <span className="ml-1 text-lg font-bold text-white">4.9</span>
                                </div>
                                <span className="text-sm text-text-dark-secondary">(42 reviews)</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[
                                {
                                    name: "Sarah M.",
                                    rating: 5,
                                    date: "Oct 20, 2025",
                                    comment: "Alex is an incredible teacher! His React course was well-structured and easy to follow. Highly recommend!"
                                },
                                {
                                    name: "John D.",
                                    rating: 5,
                                    date: "Oct 15, 2025",
                                    comment: "Great at explaining complex concepts in simple terms. Really helped me understand TypeScript better."
                                }
                            ].map((review, index) => (
                                <div key={index} className="review-item rounded-lg bg-slate-800 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-700"></div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-white">{review.name}</h4>
                                                <p className="text-xs text-text-dark-secondary">{review.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center" aria-label={`${review.rating} out of 5 stars`}>
                                            {Array(review.rating).fill(0).map((_, i) => (
                                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                            ))}
                                        </div>                                    </div>
                                    <p className="text-sm text-text-dark-secondary">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                        <button className="mt-4 w-full rounded-lg border border-border-dark px-4 py-2 text-sm font-medium text-text-dark-secondary hover:bg-slate-800 transition-colors">
                            View All Reviews
                        </button>
                    </section>
                </div>

                {/* Right Column */}
                <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
                    {/* Stats */}
                    <section className="rounded-xl bg-card-dark border border-border-dark p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Stats</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Sessions", value: "124" },
                                { label: "Teaching Hours", value: "256" },
                                { label: "Students", value: "45" },
                                { label: "Rating", value: "4.9" }
                            ].map((stat, index) => (
                                <div key={index} className="rounded-lg bg-slate-800 p-4">
                                    <p className="text-sm text-text-dark-secondary">{stat.label}</p>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Badges & Certifications */}
                    <section className="rounded-xl bg-card-dark border border-border-dark p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Badges & Certifications</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Award, label: "Top Teacher", description: "Consistently high-rated" },
                                { icon: Shield, label: "Verified Expert", description: "Skills validated" },
                                { icon: Verified, label: "Quick Responder", description: "Fast communication" }
                            ].map((badge, index) => (
                                <div key={index} className="col-span-2 flex items-start gap-3 rounded-lg bg-slate-800 p-4">
                                    <badge.icon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium text-white">{badge.label}</p>
                                        <p className="text-xs text-text-dark-secondary">{badge.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Availability */}
                    <section className="rounded-xl bg-card-dark border border-border-dark p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Availability</h2>
                            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-text-dark-secondary hover:text-white transition-colors">
                                <Edit className="h-3 w-3" />
                                <span>Edit</span>
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <span className="text-sm text-white">Monday - Friday</span>
                                </div>
                                <span className="text-sm text-text-dark-secondary">9 AM - 6 PM</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <span className="text-sm text-white">Saturday</span>
                                </div>
                                <span className="text-sm text-text-dark-secondary">10 AM - 2 PM</span>
                            </div>
                            <div className="rounded-lg bg-slate-800 p-3">
                                <p className="text-sm text-text-dark-secondary">Timezone: Pacific Time (PT)</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Profile;
