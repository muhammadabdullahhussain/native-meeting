import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Star, Download, Sparkles, CheckCircle } from "lucide-react";

// Fetch user profile from the backend
async function getProfile(username: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://bondus-backend.onrender.com/api";

    try {
        const res = await fetch(`${apiUrl}/users/profile/${username}`, {
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error(`Failed to fetch profile: ${res.status}`);
        }

        const json = await res.json();
        return json.data;
    } catch (error) {
        console.error("Profile fetch error:", error);
        return null;
    }
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
    const profile = await getProfile(params.username);

    // If user doesn't exist, Next.js handles the 404 page automatically
    if (!profile) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#080E1D] text-white selection:bg-indigo-500/30 font-sans">

            {/* Background ambient glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

                {/* Profile Card Envelope */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">

                    {/* Hero Banner */}
                    <div className="relative h-48 md:h-64 w-full bg-slate-800">
                        <Image
                            src={profile.banner || "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1200"}
                            alt={`${profile.name} banner`}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080E1D]/90 via-[#080E1D]/40 to-transparent" />
                    </div>

                    {/* Profile Details Container */}
                    <div className="relative px-6 md:px-12 pb-10">

                        {/* Avatar - overlapping the banner */}
                        <div className="relative -mt-20 md:-mt-24 mb-6 flex justify-between items-end">
                            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#080E1D] overflow-hidden bg-slate-800 shadow-2xl">
                                <Image
                                    src={profile.avatar}
                                    alt={profile.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Desktop CTA Action */}
                            <div className="hidden sm:block mb-4">
                                <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-1">
                                    <Download className="w-5 h-5" />
                                    Connect on BondUs
                                </Link>
                            </div>
                        </div>

                        {/* Identity Info */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{profile.name}</h1>
                                {profile.isPremium && (
                                    <div className="flex items-center gap-1 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        <Sparkles className="w-3 h-3" />
                                        Premium
                                    </div>
                                )}
                                {profile.isVerified && (
                                    <CheckCircle className="w-6 h-6 text-blue-400" />
                                )}
                            </div>
                            <p className="text-indigo-400 font-medium text-lg mt-1">@{profile.username}</p>

                            {/* Status Row */}
                            <div className="flex flex-wrap items-center gap-6 mt-5 text-slate-300">
                                {(profile.jobTitle || profile.company) && (
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                                        <Briefcase className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-sm">{profile.jobTitle} {profile.company && `at ${profile.company}`}</span>
                                    </div>
                                )}
                                {profile.city && (
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-sm">{profile.city}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="border-white/10 mb-8" />

                        {/* About & Interests Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                            {/* About Column */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4">About</h3>
                                <p className="text-slate-300 leading-relaxed font-light text-[15px]">
                                    {profile.bio || "This user hasn't written a bio yet, but they're ready to connect!"}
                                </p>

                                {profile.lookingFor && profile.lookingFor.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Looking For</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.lookingFor.map((item: string) => (
                                                <span key={item} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Interests Column */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-fuchsia-400" fill="currentColor" />
                                    Interests
                                </h3>
                                {profile.interests && profile.interests.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests.map((interest: string) => (
                                            <span
                                                key={interest}
                                                className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic font-light text-[15px]">No interests added yet.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Mobile sticky CTA footer mapping to the app */}
                <div className="sm:hidden fixed bottom-6 left-4 right-4 z-50">
                    <Link href="/" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white px-6 py-4 rounded-2xl font-bold shadow-[0_10px_30px_rgba(99,102,241,0.5)] active:scale-95 transition-all">
                        <Download className="w-5 h-5" />
                        Connect on BondUs App
                    </Link>
                </div>

            </main>
        </div>
    );
}
