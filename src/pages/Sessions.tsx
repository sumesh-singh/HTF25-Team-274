import React from 'react';
import { Video, Clock, X } from 'lucide-react';

const sessions = [
    {
        date: 'TOMORROW, 4:00 PM - 5:00 PM',
        title: 'Advanced Figma Prototyping',
        partner: 'Jane Doe',
        partnerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL_c4oNtC1gNMVnYTXlGFaH8LIU3aLlxLBjhCwm-fJWFfeshcmmTAxj0GRV3nkdR68XZUJe3qr4s2FHojMh4D3L9YoJdk80iJXx553lTUV0KUxh8mtiyclWUj0siQCHob73Sw9xAoGfsLQOfvV67pPbDSh_CgznRmTiK0evHO1wBz8bzEsL1EHKb1bEDOFtfUcTma_FI2YXofTIcmx4Co7eeEMvMB6hW3rnjwjlkaRPIejZ7IUmxkX-8iUJkXyEW4T3mDdYb8XOTWM',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnnhCB3dielCvCFVOH4EPJjJs4x0peUR1yLxwg4tSYY61sR03BEUBAQ36p_WQXc5POz793VKyzrZ22UV-iR9tJZDv-bc8M6nMNFuDNfu0D1ed-jq-9mvohKoukPmYDnxabhiOVJNRNqno8d1wtcKdk_AZ9pUEZ-YhHChCj-UXY34SkNIKqhDaJTiDkDDZYSU3hHS_3QSbMoL1HDNETDyk0KDZ_4ngG8QwfGRGiUfSY1e1CJ78h-3t5M26opQjGZ-QYsIka-1bhVQvi'
    },
    {
        date: 'JUNE 28, 10:00 AM - 11:00 AM',
        title: 'Introduction to Python',
        partner: 'John Smith',
        partnerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYc3rOeOf5vWGJzCv0rF_BW9sxxMneObrnkerXE33lrA5g4OwJIvREHWV8vcLLkob7msUfoTIEj7KlyLJXZxzaHnZteFIOi3iFI--NMWLtXasxM4PTEVL5svzJe9VMj4FK4_cpgKOqUTWiPpokI9Waesa0RkzKpiVXqt8durFw9LXuc1oRToDdOMk0uSnponN6GmI4ROtz_iTvRw_2klviQsXtB05ZgUFwf3spRUv00VX6NvTTightSvbGlWOsbwSrTosNQg6raAY1',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn7r30-TFqIqSzmH7OSJ4PAZCDoYh073UcJ1OP2ogC38vK4wUOpGRqYRUVXrDOzPHH4o6zqs3almL8kEfta8dW_z-dR6IFrYMuzLkVfQju4WZXSwWgl7OC2-5pr1Tr-O_GVMLxSLGfLY6YZcKiWBGqWtB_C_2w5GqPwk5phezzGv4dT-PHKIWJB4tbhvxgs0rlMmh3WH_91yC3wkNPkiRtxOBDQ9KVVjbBiLX-UfhK6aYJqYB_OQsa6NtUfZyxMSCsK7qNwCu_rKwn'
    }
];

const Sessions = () => {
    const [activeTab, setActiveTab] = React.useState('Upcoming');

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-black tracking-[-0.033em] text-text-light-primary dark:text-white p-4">My Sessions</h1>
            <div className="sticky top-[68px] z-10 bg-background-light dark:bg-background-dark pb-3">
                <div className="flex gap-8 border-b border-border-light px-4 dark:border-border-dark">
                    {['Upcoming', 'Past', 'Proposals'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`relative border-b-[3px] py-4 pt-4 text-sm font-bold tracking-[0.015em] ${activeTab === tab ? 'border-primary text-text-light-primary dark:text-white' : 'border-transparent text-text-light-secondary dark:text-slate-400'}`}>
                            {tab}
                            {tab === 'Proposals' && <span className="absolute right-[-10px] top-3 inline-flex h-4 w-4 rounded-full bg-yellow-400"></span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-4">
                {activeTab === 'Upcoming' && sessions.map((session, index) => (
                    <div key={index} className="rounded-lg border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark">
                        <div className="flex flex-col items-stretch justify-between gap-6 sm:flex-row">
                            <div className="flex flex-[2_2_0px] flex-col justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-semibold uppercase leading-normal text-text-light-secondary dark:text-slate-400">{session.date}</p>
                                    <p className="text-xl font-bold leading-tight text-text-light-primary dark:text-white">{session.title}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <img className="h-6 w-6 rounded-full bg-cover bg-center" src={session.partnerAvatar} alt={session.partner} />
                                        <p className="text-sm font-normal leading-normal text-text-light-secondary dark:text-slate-300">with {session.partner}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button className="flex h-9 min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-4 text-sm font-bold leading-normal text-slate-50"><Video size={18} /><span className="truncate">Join Video Call</span></button>
                                    <button className="flex h-9 min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-border-light px-4 text-sm font-medium leading-normal text-text-light-primary dark:bg-border-dark dark:text-slate-300"><Clock size={18} /><span className="truncate">Reschedule</span></button>
                                    <button className="flex h-9 min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-transparent px-4 text-sm font-medium leading-normal text-red-500 hover:bg-red-500/10"><X size={18} /><span className="truncate">Cancel</span></button>
                                </div>
                            </div>
                            <div className="min-w-[150px] flex-1 rounded-lg bg-cover bg-center sm:max-w-[180px] aspect-video sm:aspect-square" style={{ backgroundImage: `url("${session.image}")` }}></div>
                        </div>
                    </div>
                ))}
                {activeTab !== 'Upcoming' && (
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border-light p-10 text-center dark:border-border-dark">
                        <h3 className="text-xl font-bold text-text-light-primary dark:text-white">No {activeTab} Sessions</h3>
                        <p className="max-w-sm text-text-light-secondary dark:text-slate-400">You don't have any {activeTab.toLowerCase()} sessions.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sessions;
