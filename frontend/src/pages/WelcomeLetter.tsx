import { useQuery } from '@tanstack/react-query';
import { api, useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';
import { AdminUserSelector } from '../components/common/AdminUserSelector';

const WelcomeLetter = () => {
    const { user, targetUserId } = useAuth();

    const { data: targetData, isLoading: loadingTarget } = useQuery({
        queryKey: ['welcomeLetterTarget', targetUserId || user?.id],
        queryFn: async () => {
            // Always fetch full profile from API — the AuthContext `user` object
            // only contains {id, name, role, status} and is missing joiningDate,
            // sponsor, mobile, address, which are needed for the letter.
            const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
            const { data } = await api.get(`/auth/me${query}`);
            return data;
        },
        enabled: !!user
    });

    const { data: companyData, isLoading: loadingCompany } = useQuery({
        queryKey: ['companySettings'],
        queryFn: async () => {
            const { data } = await api.get('/settings/company');
            return data;
        },
        enabled: !!user
    });

    const loading = loadingTarget || loadingCompany;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin"></div>
                <div className="text-sm font-bold text-brand-primary uppercase tracking-widest animate-pulse">Loading Letter Details...</div>
            </div>
        );
    }

    if (!targetData || !companyData) {
        return (
            <div className="p-20 text-center">
                <div className="text-brand-danger font-bold uppercase mb-2">Data Unavailable</div>
                <div className="text-sm text-brand-muted">Unable to retrieve letter details. Please try refreshing the page.</div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 min-h-screen font-sans print:p-0 print:bg-white">
            <div className="print:hidden mb-4"><AdminUserSelector /></div>
            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #welcome-letter-printable, #welcome-letter-printable * {
                        visibility: visible;
                    }
                    #welcome-letter-printable {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 15mm !important;
                        border: 10px solid #2E5B9A !important;
                        box-shadow: none !important;
                    }
                    .watermark-print {
                        opacity: 0.04 !important;
                    }
                }
            ` }} />

            {/* Tab Header */}
            <div className="inline-block px-4 py-1.5 bg-white border border-gray-200 border-b-0 rounded-t-sm shadow-sm ml-2 print:hidden">
                <span className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">Welcome Letter</span>
            </div>

            {/* Main Container */}
            <div className="bg-white border border-gray-300 shadow-sm p-4 overflow-y-auto max-h-[90vh] print:max-h-none print:overflow-visible print:border-none print:shadow-none">
                {/* Print Button Area */}
                <div className="mb-4 border border-slate-200 p-2 print:hidden flex justify-between items-center bg-slate-50">
                    <button
                        onClick={() => window.print()}
                        className="bg-white border border-gray-400 text-gray-800 px-4 py-1 text-[12px] font-bold shadow-sm hover:bg-gray-100 transition-colors uppercase"
                    >
                        Print Now
                    </button>
                    <span className="text-[11px] text-slate-500 italic font-medium">Use high-quality print settings for best results</span>
                </div>

                {/* Letter Content with Thick Blue Border */}
                <div id="welcome-letter-printable" className="border-[15px] border-[#2E5B9A] p-8 max-w-[850px] mx-auto bg-white relative shadow-lg print:border-[10px] print:p-6 print:shadow-none">
                    {/* Header: Logo and Company Name */}
                    <div className="flex items-center gap-6 mb-2">
                        {/* Logo Illustration */}
                        <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                            <img
                                src={logo}
                                alt="Unique Investors Logo"
                                className="h-24 object-contain"
                            />
                        </div>

                        <div className="flex flex-col">
                            <h1 className="text-[34px] font-serif font-black text-[#2E5B9A] leading-tight tracking-tight uppercase">
                                {companyData?.companyName || 'UNIQUE INVESTORS PVT. LTD.'}
                            </h1>
                            <p className="text-[#F37021] italic text-[20px] font-serif font-bold tracking-[0.15em] leading-normal uppercase">
                                WHERE DREAMS COME TRUE
                            </p>
                        </div>
                    </div>

                    {/* Blue Title Bar */}
                    <div className="bg-[#A4C2E4] w-full text-center py-0.5 mb-3 shadow-inner">
                        <span className="text-[16px] font-bold text-black uppercase tracking-widest">Welcome Letter</span>
                    </div>

                    {/* Date */}
                    <div className="text-right mb-4">
                        <p className="text-[13px] font-medium text-black">
                            <span className="font-bold">Date :</span> {targetData.joiningDate ? new Date(targetData.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                        </p>
                    </div>

                    {/* Body Text */}
                    <div className="text-[13px] leading-[1.5] mb-6 text-black font-medium text-justify">
                        A warm welcome and lots of good wishes on becoming part of our growing team. Congratulations on being part of the team! The whole company welcomes you, and we look forward to a successful journey with you! Welcome aboard! We are all happy and excited about your inputs and contribution to our company.
                    </div>

                    {/* Sponsor Section */}
                    <div className="mb-8 border-b border-gray-100 pb-2">
                        <p className="text-[13px] font-bold text-black">
                            Sponsor Name : <span className="font-medium">{targetData.sponsor?.name || 'Admin'} ({targetData.sponsor?.userId || 'admin'})</span>
                        </p>
                    </div>

                    {/* Details Box with Branding Watermark */}
                    <div className="relative py-12 mb-8 min-h-[220px] border-y border-gray-100 flex items-center">
                        {/* High-Fidelity Watermark - Using CSS text for simplicity if icons aren't reliable */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.06] pointer-events-none select-none z-0 text-center watermark-print">
                            <span className="text-[80px] font-black leading-none select-none uppercase">{companyData?.companyName || 'UNIQUE INVESTORS PVT. LTD.'}</span>
                        </div>

                        {/* Details Grid */}
                        <div className="relative z-10 w-full max-w-lg mx-auto space-y-3 text-[14px] font-medium text-gray-900 ml-[20%] print:ml-[15%]">
                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                <span className="font-bold">UserId</span>
                                <span>: {targetData.userId}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                <span className="font-bold">Name</span>
                                <span className="text-[#2E5B9A] font-bold uppercase">: {targetData.name}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                <span className="font-bold">Mobile No.</span>
                                <span>: {targetData.mobile}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2 items-start shrink-0">
                                <span className="font-bold">Address</span>
                                <div className="flex shrink-0">
                                    <span className="mr-2">:</span>
                                    <span className="leading-tight">
                                        {targetData.address || 'Not Provided'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Disclaimer */}
                    <div className="text-center text-[13px] font-bold italic mb-6 text-gray-800">
                        This is the Information you shall have to use for all your correspondence with the company.
                    </div>

                    {/* Closing Section */}
                    <div className="text-[13px] leading-[1.5] mb-8 text-black font-medium text-justify">
                        Assuring you of the best services always and wishing you continued success in your journey with {companyData?.companyName || 'Unique Investors Pvt. Ltd.'}. We look forward to a long-term association and prosperous future, together.
                    </div>

                    {/* Best Regards */}
                    <div className="mb-12">
                        <p className="text-[14px] font-bold text-gray-900">Best Regards ,</p>
                        <p className="text-[14px] font-bold text-gray-900 mt-4 tracking-wide uppercase">{companyData?.companyName || 'Unique Investors Pvt. Ltd.'}</p>
                    </div>

                    {/* Office and Legal Footer */}
                    <div className="text-center font-serif text-[11px] space-y-0.5 text-gray-800 border-t border-gray-100 pt-4">
                        <p className="font-bold">Registered Office</p>
                        <p className="whitespace-pre-wrap">{companyData?.address || '12th Floor, KLJ Tower North\nNetaji Subhash Place, Pitampura, New Delhi - 110034'}</p>
                        <p className="font-bold mt-1">Tel. No. : {companyData?.contactNumber || '011-41444649'}</p>
                        <div className="flex justify-center gap-6 mt-2 font-bold text-[#2E5B9A]">
                            <p>Email: {companyData?.supportEmail || 'Info@uniqueinvestors.com'}</p>
                            {companyData?.registrationNo && <p>Reg No: {companyData.registrationNo}</p>}
                        </div>

                        {/* Legal Block */}
                        <div className="border-t border-gray-300 mt-4 pt-3 px-4">
                            <p className="font-sans text-[10px] leading-tight text-gray-600 font-medium tracking-tighter uppercase text-justify">
                                THIS IS A COMPUTER-GENERATED DOCUMENT AND IT DOES NOT REQUIRE A SIGNATURE. THIS DOCUMENT SHALL NOT BE INVALIDATED SOLELY ON THE GROUND THAT IT IS NOT SIGNED.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeLetter;
