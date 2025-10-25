import React from 'react';
import { Edit, Verified, Shield, Award, PlusCircle, ChevronDown, Star } from 'lucide-react';

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
            {/* ... rest of the profile page content */}
        </div>
    );
};

export default Profile;
