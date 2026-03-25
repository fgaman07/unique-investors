import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';

const WelcomeLetter = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Error fetching profile', error);
      }
    };
    fetchProfile();
  }, []);

  if (!user) return <div className="p-8 text-center">Loading Letter...</div>;

  return (
    <div className="p-8 bg-white max-w-4xl mx-auto shadow-sm border my-6 relative min-h-[80vh]">
      <div className="text-center mb-10 border-b-2 border-brand-primary pb-6">
        <h1 className="text-3xl font-bold text-[#f6893b] mb-2 uppercase">I & S Buildtech Pvt. Ltd.</h1>
        <p className="text-gray-600 font-medium">102, Dream Plaza, Highway Road, Delhi - 110001</p>
        <p className="text-sm text-gray-500 mt-1">CIN: U70100DL2026PTC000000 | Email: support@isbuildtech.com</p>
      </div>

      <div className="flex justify-between items-end mb-8 text-sm font-semibold">
        <div>
          <p>Ref No: ISB/WL/{new Date().getFullYear()}/{user.userId}</p>
        </div>
        <div>
          <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div className="space-y-6 text-gray-800">
        <h2 className="text-xl font-bold text-center underline mb-8">WELCOME LETTER</h2>
        
        <p>To,</p>
        <p className="font-bold text-lg">{user.name}</p>
        <p>Associate ID: <span className="font-semibold">{user.userId}</span></p>
        <p>Rank: <span className="font-semibold text-brand-primary">{user.rank}</span></p>

        <p className="mt-8">Dear {user.name},</p>
        
        <p className="text-justify leading-relaxed">
          We are immensely pleased to officially welcome you to the <span className="font-bold">I & S Buildtech</span> family. 
          Congratulations on making the decision to join one of India's fastest-growing real estate networks.
        </p>

        <p className="text-justify leading-relaxed">
          This letter confirms your registration as an Independent Business Associate. Your sponsor is 
          <span className="font-semibold"> {user.sponsor?.name || 'Admin'} ({user.sponsor?.userId || 'admin'})</span>.
          We are confident that your association with us will be highly rewarding and prosperous.
        </p>

        <p className="text-justify leading-relaxed">
          Through our robust platform, you now have the opportunity to market premium properties including Plots and Shops 
          in our active projects like "I&S Dream Homes Highway". Our compensation plan is designed to reward your 
          hard work with immediate Direct Sales Incentives and deep Level Incentives.
        </p>

        <p className="mt-12 text-sm italic text-gray-600">
          * Note: Please ensure your KYC documents (PAN and Bank Details) are updated in the system for smooth commission payouts.
        </p>
      </div>

      <div className="absolute bottom-8 right-8 text-center w-48">
        <div className="h-16 border-b border-gray-300 mb-2"></div>
        <p className="font-bold text-sm">Authorized Signatory</p>
        <p className="text-xs text-gray-500 text-center">I & S Buildtech Pvt. Ltd.</p>
      </div>
    </div>
  );
};

export default WelcomeLetter;
