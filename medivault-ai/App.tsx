import React, { useState, useEffect } from 'react';
import { MedicalRecord, MedicalAnalysis, ViewState, Medication } from './types';
import { analyzeMedicalDocument } from './services/geminiService';
import { 
  Camera, 
  Home, 
  FileText, 
  Plus, 
  ChevronLeft, 
  Activity, 
  Pill, 
  Loader2,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  CheckCircle2,
  Eye,
  FileBadge,
  Sparkles,
  Search,
  Droplets,
  Tablets,
  FlaskConical,
  Upload,
  Check,
  Image as ImageIcon
} from 'lucide-react';

// --- Helper Functions ---

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Create canvas for resizing/compression
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024; // Limit width to 1024px
        let width = img.width;
        let height = img.height;

        // Resize logic
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.6 quality
        // This significantly reduces size for localStorage while keeping text readable for AI
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        
        // Return only the base64 data part
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const getDayName = (offset: number) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return days[d.getDay()];
};

const getDayNumber = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.getDate();
};

const getFullDateString = (offset: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

// --- Components ---

const NavButton: React.FC<{ 
  icon: React.ElementType, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${active ? 'text-primary-600 scale-105' : 'text-gray-400 hover:text-gray-500'}`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    {active && <span className="text-[10px] font-bold tracking-wide">{label}</span>}
  </button>
);

const Header: React.FC<{ 
  title: string, 
  subtitle?: string, 
  onBack?: () => void,
  rightAction?: React.ReactNode,
  transparent?: boolean
}> = ({ title, subtitle, onBack, rightAction, transparent = false }) => (
  <div className={`flex items-center justify-between px-6 py-5 sticky top-0 z-30 transition-all ${transparent ? 'bg-transparent' : 'bg-[#fafafa]/90 backdrop-blur-xl border-b border-gray-100'}`}>
    <div className="flex items-center gap-4">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors">
          <ChevronLeft size={24} />
        </button>
      )}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{subtitle}</p>}
      </div>
    </div>
    {rightAction ? rightAction : (
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold shadow-sm border border-white">
        KM
      </div>
    )}
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<Medication & { sourceId?: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(0); // 0 = Today
  
  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('mediVault_records');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load records", e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mediVault_records', JSON.stringify(records));
      // Clear error if save successful
      if (uploadError === "Storage limit reached. Older history might be lost.") {
        setUploadError(null);
      }
    } catch (e) {
      // Handle QuotaExceededError
      console.error("Storage full:", e);
      setUploadError("Storage limit reached. Older history might be lost.");
    }
  }, [records]);

  // Derived state: All medications
  const allMedications = React.useMemo(() => {
    return records.flatMap(record => 
      record.analysis.medications.map(med => ({
        ...med,
        sourceId: record.id,
        sourceDate: record.analysis.date
      }))
    );
  }, [records]);

  // Derived state: All lab reports
  const labReports = React.useMemo(() => {
    return records.filter(r => r.analysis.documentType === 'Lab Report');
  }, [records]);

  // Handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, targetView: ViewState = 'detail') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setUploadError(null);
    
    try {
      const base64 = await fileToBase64(file);
      const tempId = Date.now().toString();
      
      const analysis = await analyzeMedicalDocument(base64);
      
      const newRecord: MedicalRecord = {
        id: tempId,
        createdAt: Date.now(),
        imageUrl: base64,
        analysis: analysis
      };

      setRecords(prev => [newRecord, ...prev]);
      
      // Navigate based on context
      if (targetView === 'meds') {
        setView('meds');
      } else if (targetView === 'tests') {
        setView('tests'); // Stay in tests view or go to detail
        setSelectedRecord(newRecord); // Optional: show detail immediately
        setView('detail');
      } else {
        setSelectedRecord(newRecord);
        setView('detail');
      }

    } catch (err: any) {
      setUploadError(err.message || "Failed to process image");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMedicationProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file || !selectedMedication || !selectedMedication.sourceId) return;

     try {
       const base64 = await fileToBase64(file);
       
       // Update the records state deeply
       setRecords(prevRecords => prevRecords.map(record => {
         if (record.id === selectedMedication.sourceId) {
           return {
             ...record,
             analysis: {
               ...record.analysis,
               medications: record.analysis.medications.map(med => {
                 // Simple name matching - in production use unique IDs for meds
                 if (med.name === selectedMedication.name) {
                   return { ...med, purchaseProofImage: base64 };
                 }
                 return med;
               })
             }
           };
         }
         return record;
       }));

       // Update local selected medication state to reflect change immediately
       setSelectedMedication(prev => prev ? ({ ...prev, purchaseProofImage: base64 }) : null);

     } catch (err) {
       console.error("Failed to upload proof", err);
       setUploadError("Failed to save image");
     }
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
      setView('history');
    }
  };

  // --- Views ---

  const renderHome = () => (
    <div className="p-6 space-y-8 pb-24">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-[2rem] p-8 text-white shadow-xl shadow-primary-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-400/20 rounded-full -ml-10 -mb-10 blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-primary-100 font-medium mb-1">Good Morning,</p>
              <h2 className="text-3xl font-bold tracking-tight">Kathryn</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
              <Activity className="text-white" size={24} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 mb-6 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <FileBadge size={20} />
            </div>
            <div>
              <p className="text-xs text-primary-100 uppercase tracking-wider font-semibold">Latest Update</p>
              <p className="font-semibold text-sm truncate max-w-[180px]">
                {records[0]?.analysis.title || "No records yet"}
              </p>
            </div>
          </div>
          
          <label className="flex items-center justify-center w-full bg-white text-primary-700 font-bold py-4 rounded-xl cursor-pointer hover:bg-primary-50 active:scale-95 transition-all shadow-sm">
            <Camera className="mr-2" size={20} />
            Scan New Document
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, 'detail')}
            />
          </label>
        </div>
      </div>

      {/* Categories / Stats */}
      <div>
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="font-bold text-gray-900 text-lg">Quick Access</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setView('history')}
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-3 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <FileText size={22} />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-gray-900 block">{records.length}</span>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Notebook</span>
            </div>
          </button>

          <button 
            onClick={() => setView('tests')}
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-3 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
              <FlaskConical size={22} />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-gray-900 block">{labReports.length}</span>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Lab Results</span>
            </div>
          </button>
          
          <button 
             onClick={() => setView('meds')}
             className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-3 hover:shadow-md transition-all group col-span-2"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Pill size={22} />
              </div>
              <div className="text-left flex-1">
                <span className="text-2xl font-bold text-gray-900 block">{allMedications.length}</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Active Medicines</span>
              </div>
              <div className="bg-blue-500 text-white p-2 rounded-xl">
                 <ChevronLeft className="rotate-180" size={20} />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent History */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-gray-900 text-lg">Recent History</h3>
          <button onClick={() => setView('history')} className="text-primary-600 text-sm font-semibold hover:text-primary-700">See All</button>
        </div>
        
        <div className="space-y-4">
          {records.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Camera size={24} />
              </div>
              <p className="text-gray-400 font-medium">No records found.<br/>Scan your first document!</p>
            </div>
          ) : (
            records.slice(0, 5).map(record => (
              <div 
                key={record.id}
                onClick={() => { setSelectedRecord(record); setView('detail'); }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all hover:border-primary-100"
              >
                <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-bold
                  ${record.analysis.documentType === 'Prescription' ? 'bg-blue-50 text-blue-600' : 
                    record.analysis.documentType === 'Lab Report' ? 'bg-purple-50 text-purple-600' : 
                    'bg-emerald-50 text-emerald-600'}`}
                >
                  {record.analysis.documentType === 'Prescription' ? 'Rx' : 
                   record.analysis.documentType === 'Lab Report' ? 'Lb' : 'Dx'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate text-base">{record.analysis.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <CalendarIcon size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">{record.analysis.date}</span>
                    <span className="text-[10px] text-gray-300">•</span>
                    <span className="text-xs text-gray-500 font-medium truncate">{record.analysis.doctorName || "Unknown Doctor"}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <ChevronLeft className="rotate-180" size={16} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="p-6 space-y-6 pb-24">
       <Header title="Notebook" subtitle="All Documents" onBack={() => setView('home')} />
       
       <div className="relative group">
         <input 
          type="text" 
          placeholder="Search documents..." 
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm group-hover:shadow-md"
         />
         <div className="absolute left-4 top-4 text-gray-400 group-hover:text-primary-500 transition-colors">
           <Search size={20} />
         </div>
      </div>

      <div className="space-y-4">
        {records.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 text-gray-400">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <FileText size={32} className="text-gray-300" />
             </div>
             <p className="font-medium">Your medical notebook is empty.</p>
           </div>
        ) : (
          records.map(record => (
            <div 
              key={record.id}
              onClick={() => { setSelectedRecord(record); setView('detail'); }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                   <div className={`p-3 rounded-2xl ${
                     record.analysis.documentType === 'Prescription' ? 'bg-blue-100 text-blue-600' : 
                     record.analysis.documentType === 'Lab Report' ? 'bg-purple-100 text-purple-600' :
                     'bg-primary-100 text-primary-600'
                   }`}>
                     {record.analysis.documentType === 'Prescription' ? <Pill size={20} /> : 
                      record.analysis.documentType === 'Lab Report' ? <FlaskConical size={20} /> :
                      <Activity size={20} />}
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-900 text-lg leading-tight">{record.analysis.title}</h3>
                     <p className="text-xs text-gray-500 mt-1 font-medium">{record.analysis.facilityName || record.analysis.doctorName || "Unknown Source"}</p>
                   </div>
                </div>
                <span className="bg-gray-50 px-3 py-1 rounded-full text-xs font-bold text-gray-500 border border-gray-100">
                  {record.analysis.date}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                 <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                   {record.analysis.summary}
                 </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTests = () => (
    <div className="p-6 space-y-6 pb-24">
       <div className="flex justify-between items-center mb-2">
        <Header title="Lab Results" subtitle="Track & Analyze Tests" onBack={() => setView('home')} transparent />
        <label className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
          <Plus size={24} />
          <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, 'tests')}
            />
        </label>
      </div>

      {labReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-300">
            <FlaskConical size={32} />
          </div>
          <p className="font-bold text-gray-600">No lab results yet</p>
          <p className="text-xs text-gray-400 mt-2 max-w-[200px] text-center">Upload a blood test, X-Ray report, or any lab document for AI analysis.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {labReports.map(record => (
            <div 
              key={record.id}
              onClick={() => { setSelectedRecord(record); setView('detail'); }}
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] group"
            >
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                     <FlaskConical size={24} />
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-900 text-lg">{record.analysis.title}</h3>
                     <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md mt-1 inline-block">{record.analysis.date}</span>
                   </div>
                 </div>
                 <ChevronLeft className="rotate-180 text-gray-300" />
               </div>
               
               <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-50">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Sparkles size={12} /> AI Summary
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {record.analysis.summary}
                  </p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMeds = () => (
    <div className="p-6 space-y-6 pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Medicines</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            {allMedications.length} Active Prescriptions
          </p>
        </div>
        <label className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
          <Plus size={24} />
          <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, 'meds')}
            />
        </label>
      </div>

      <div className="relative group">
         <input 
          type="text" 
          placeholder="Search medicines..." 
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
         />
         <div className="absolute left-4 top-4 text-gray-400">
           <Search size={20} />
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {allMedications.length === 0 ? (
          <div className="col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill size={32} />
            </div>
            <p className="text-gray-400 font-medium">No medications found.</p>
            <p className="text-xs text-gray-400 mt-2">Scan a prescription to add meds.</p>
          </div>
        ) : (
          allMedications.map((med, i) => (
            <div 
              key={i}
              onClick={() => { setSelectedMedication(med); setView('medDetail'); }}
              className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] group relative overflow-hidden"
            >
              {med.purchaseProofImage && (
                <div className="absolute top-3 right-3 text-green-500">
                  <CheckCircle2 size={16} fill="currentColor" className="text-green-100" />
                </div>
              )}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center text-blue-500 mb-1 group-hover:scale-110 transition-transform duration-300">
                {med.type?.toLowerCase().includes('syrup') ? <Droplets size={32} /> : 
                 med.type?.toLowerCase().includes('capsule') ? <Pill size={32} /> : 
                 <Tablets size={32} />}
              </div>
              <div className="w-full">
                <h3 className="font-bold text-gray-900 text-lg truncate leading-tight">{med.name}</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1 bg-gray-50 py-1 px-2 rounded-lg inline-block">{med.dosage}</p>
              </div>
              
              {med.purpose && (
                 <div className="w-full border-t border-gray-50 pt-3 mt-1">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Treats</p>
                   <p className="text-xs font-medium text-blue-600 truncate">{med.purpose}</p>
                 </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderMedDetail = () => {
    if (!selectedMedication) return null;

    return (
      <div className="bg-[#f8f9fa] min-h-full pb-24 relative">
        {/* Custom Header with large Image background effect */}
        <div className="relative bg-gradient-to-b from-blue-100 to-[#f8f9fa] pt-8 pb-8 px-6 rounded-b-[3rem]">
          <div className="flex justify-between items-center mb-8 relative z-10">
             <button onClick={() => setView('meds')} className="w-10 h-10 bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 hover:bg-white transition-colors">
               <ChevronLeft size={24} />
             </button>
             <h2 className="font-bold text-gray-700">Medicine Detail</h2>
             <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="flex flex-col items-center relative z-10">
            <div className="w-32 h-32 bg-white rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-center text-blue-500 mb-6 border-4 border-white overflow-hidden">
                {selectedMedication.purchaseProofImage ? (
                  <img src={`data:image/jpeg;base64,${selectedMedication.purchaseProofImage}`} className="w-full h-full object-cover" alt="Medication" />
                ) : (
                  selectedMedication.type?.toLowerCase().includes('syrup') ? <Droplets size={64} /> : 
                  selectedMedication.type?.toLowerCase().includes('capsule') ? <Pill size={64} /> : 
                  <Tablets size={64} />
                )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">{selectedMedication.name}</h1>
            <div className="flex items-center gap-2">
               <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-600 shadow-sm border border-gray-100">
                 {selectedMedication.dosage}
               </span>
               <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm shadow-blue-200">
                 {selectedMedication.type || "Tablet"}
               </span>
            </div>
          </div>
          
          {/* Decorative background circle */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-blue-50 to-transparent rounded-b-full opacity-50 pointer-events-none"></div>
        </div>

        <div className="px-6 space-y-6 -mt-4 relative z-20">
          
          {/* Purchase Proof Section */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedMedication.purchaseProofImage ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                 {selectedMedication.purchaseProofImage ? <Check size={20} /> : <ImageIcon size={20} />}
               </div>
               <div>
                 <h3 className="font-bold text-gray-900 text-sm">Purchase Verified</h3>
                 <p className="text-xs text-gray-500">
                   {selectedMedication.purchaseProofImage ? "Photo uploaded" : "Upload photo of pack"}
                 </p>
               </div>
             </div>
             <label className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-800 transition-colors">
               {selectedMedication.purchaseProofImage ? "Update" : "Upload"}
               <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 onChange={handleMedicationProofUpload}
               />
             </label>
          </div>

          {/* AI Insight Card */}
          <div className="bg-[#fff9e6] border border-[#fde68a] rounded-3xl p-5 shadow-sm">
             <div className="flex items-center gap-2 mb-2 text-[#d97706]">
               <Sparkles size={18} fill="currentColor" className="text-[#fbbf24]" />
               <h3 className="font-bold text-sm uppercase tracking-wide">AI Insight</h3>
             </div>
             <p className="text-gray-800 text-sm leading-relaxed font-medium">
               {selectedMedication.purpose 
                 ? `This medication is primarily used ${selectedMedication.purpose.toLowerCase().startsWith('for') ? '' : 'for '}${selectedMedication.purpose}.` 
                 : "Standard medication extracted from your records."} 
                <br/>
                <span className="text-gray-500 text-xs font-normal mt-1 block">Always follow your doctor's exact instructions.</span>
             </p>
          </div>

          {/* Dosage Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-2 text-lg">Dosage</h3>
             <p className="text-gray-600 text-sm leading-relaxed">
               {selectedMedication.frequency}.
               <span className="block mt-2 text-gray-400 text-xs">
                 Duration: {selectedMedication.duration || "As prescribed"}
               </span>
             </p>
          </div>

          {/* Side Effects Section */}
           {selectedMedication.sideEffects && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Side Effects</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {selectedMedication.sideEffects}
              </p>
            </div>
           )}

        </div>
      </div>
    );
  }

  const renderSchedule = () => (
    <div className="p-6 space-y-6 pb-24 h-full flex flex-col">
       <div className="mb-2">
         <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
         <p className="text-gray-500 text-sm font-medium mt-1">
           {getFullDateString(selectedCalendarDay)}
         </p>
       </div>

       {/* Horizontal Calendar */}
       <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const isSelected = selectedCalendarDay === offset;
            return (
              <button 
                key={offset} 
                onClick={() => setSelectedCalendarDay(offset)}
                className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all min-w-[3.5rem]
                  ${isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-105' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                 <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>
                   {getDayName(offset)}
                 </span>
                 <span className="text-lg font-bold">
                   {getDayNumber(offset)}
                 </span>
                 {offset === 0 && !isSelected && <div className="w-1 h-1 bg-primary-500 rounded-full mt-1"></div>}
              </button>
            )
          })}
       </div>

       <div className="flex-1 space-y-4">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
             <Clock size={18} /> Timeline
          </h3>
          
          {allMedications.length === 0 ? (
            <div className="text-center py-12">
               <p className="text-gray-400">No active medications scheduled.</p>
            </div>
          ) : (
            <>
              {/* Morning Slot */}
              <div className="bg-white p-5 rounded-3xl border-l-4 border-l-orange-300 shadow-sm flex items-start gap-4">
                 <div className="text-center min-w-[3rem]">
                   <span className="block text-sm font-bold text-gray-900">8:00</span>
                   <span className="text-[10px] text-gray-400 font-bold uppercase">AM</span>
                 </div>
                 <div className="flex-1 space-y-3">
                    {allMedications.map((med, i) => (
                      <div key={i} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                         <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                           <Pill size={14} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">{med.name}</p>
                            <p className="text-xs text-gray-500">{med.dosage} • With Breakfast</p>
                         </div>
                         <div className="ml-auto">
                            <input type="checkbox" className="w-5 h-5 rounded-full border-gray-300 text-primary-600 focus:ring-primary-500" />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Evening Slot */}
              <div className="bg-white p-5 rounded-3xl border-l-4 border-l-indigo-400 shadow-sm flex items-start gap-4">
                 <div className="text-center min-w-[3rem]">
                   <span className="block text-sm font-bold text-gray-900">8:00</span>
                   <span className="text-[10px] text-gray-400 font-bold uppercase">PM</span>
                 </div>
                 <div className="flex-1 space-y-3">
                    {allMedications.slice(0, 1).map((med, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                           <Tablets size={14} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">{med.name}</p>
                            <p className="text-xs text-gray-500">{med.dosage} • After Dinner</p>
                         </div>
                         <div className="ml-auto">
                            <input type="checkbox" className="w-5 h-5 rounded-full border-gray-300 text-primary-600 focus:ring-primary-500" />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </>
          )}

       </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedRecord) return null;
    const { analysis } = selectedRecord;

    return (
      <div className="space-y-6 pb-24">
        <Header 
          title="Analysis Report" 
          subtitle={analysis.documentType}
          onBack={() => setView('history')} 
          rightAction={
            <button 
              onClick={() => deleteRecord(selectedRecord.id)}
              className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
            >
              <AlertCircle size={20} />
            </button>
          }
        />
        
        <div className="px-6 space-y-6">
          
          {/* Hero Card */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex items-start justify-between relative z-10">
              <div className="flex gap-4">
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200 
                    ${analysis.documentType === 'Lab Report' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-primary-500 to-primary-600'}`}>
                    {analysis.documentType === 'Lab Report' ? <FlaskConical size={32} /> : <Stethoscope size={32} />}
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{analysis.title}</h2>
                   <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                     <CalendarIcon size={14} />
                     {analysis.date}
                   </div>
                 </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
               <div className="bg-gray-50 rounded-2xl p-4">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">Doctor</span>
                 <p className="font-bold text-gray-800 text-sm truncate">{analysis.doctorName || "Not listed"}</p>
               </div>
               <div className="bg-gray-50 rounded-2xl p-4">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">Facility</span>
                 <p className="font-bold text-gray-800 text-sm truncate">{analysis.facilityName || "Not listed"}</p>
               </div>
            </div>
          </div>

          {/* Smart Summary - Full Width */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                 <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold flex items-center gap-2">
                    <Activity size={12} /> AI Insight
                 </div>
               </div>
               <p className="text-gray-200 leading-relaxed font-light text-sm">
                 {analysis.summary}
               </p>
             </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Diagnosis Tags */}
            <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100">
               <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                 <Activity size={18} /> Diagnosis
               </h3>
               <div className="flex flex-wrap gap-2">
                  {analysis.diagnosis.length > 0 ? analysis.diagnosis.map((d, i) => (
                    <span key={i} className="bg-white text-amber-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border border-amber-100">
                      {d}
                    </span>
                  )) : <span className="text-sm text-amber-700/50 italic">No specific diagnosis extracted</span>}
               </div>
            </div>

            {/* Next Steps / Plan */}
            <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} /> Plan
              </h3>
              <ul className="space-y-3 mb-6">
                {analysis.nextSteps.length > 0 ? analysis.nextSteps.slice(0, 3).map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="min-w-[6px] h-[6px] rounded-full bg-indigo-400 mt-2"></div>
                    <span className="text-sm text-indigo-800 leading-snug">{step}</span>
                  </li>
                )) : <li className="text-sm text-indigo-700/50 italic">No specific instructions</li>}
              </ul>

              {/* Track Test Result Action */}
              <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-indigo-100">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FlaskConical size={20} />
                </div>
                <div className="flex-1">
                   <p className="text-xs font-bold text-gray-900">Recommended Tests?</p>
                   <p className="text-[10px] text-gray-500">Upload results here for analysis</p>
                </div>
                <label className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-700 transition-colors flex items-center gap-1">
                  <Upload size={12} />
                  Upload
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'tests')}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Medications */}
          {analysis.medications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Pill className="text-primary-600" size={20} />
                <h3 className="font-bold text-gray-900">Prescriptions</h3>
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  {analysis.medications.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {analysis.medications.map((med, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4 transition-all hover:shadow-md">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-blue-500">
                      <Pill size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900 text-lg">{med.name}</h4>
                        {med.duration && (
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg uppercase tracking-wider">
                            {med.duration}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                         <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                           <Activity size={12} /> {med.dosage}
                         </div>
                         <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                           <Clock size={12} /> {med.frequency}
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Original Image */}
          <div className="pt-4">
            <button 
              onClick={() => setShowOriginalImage(!showOriginalImage)}
              className="w-full bg-white border border-gray-200 text-gray-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Eye size={18} />
              {showOriginalImage ? "Hide Original Document" : "View Original Document"}
            </button>
            
            {showOriginalImage && (
              <div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                <img 
                  src={`data:image/jpeg;base64,${selectedRecord.imageUrl}`} 
                  alt="Original Document" 
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  const renderLoader = () => (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
       <div className="relative mb-8">
         <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-600" size={48} />
         </div>
         <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg">
           <Activity className="text-primary-500" size={20} />
         </div>
       </div>
       <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing...</h2>
       <p className="text-gray-500 max-w-xs leading-relaxed">
         AI is reading the details, dosages, and notes for you.
       </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-50 flex justify-center">
      {/* Main Container - Constrained Width for Mobile Feel */}
      <div className="w-full max-w-md bg-[#fafafa] h-full relative flex flex-col shadow-2xl overflow-hidden sm:rounded-[2.5rem] sm:my-8 sm:h-[calc(100%-4rem)] sm:border-[8px] sm:border-gray-900 ring-1 ring-gray-900/5">
        
        {/* Loading Overlay */}
        {isAnalyzing && renderLoader()}
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
           {uploadError && (
             <div className="m-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-start gap-3 border border-red-100 shadow-sm">
               <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
               <p className="text-sm font-medium">{uploadError}</p>
             </div>
           )}

           {view === 'home' && renderHome()}
           {view === 'history' && renderHistory()}
           {view === 'detail' && renderDetail()}
           {view === 'meds' && renderMeds()}
           {view === 'medDetail' && renderMedDetail()}
           {view === 'schedule' && renderSchedule()}
           {view === 'tests' && renderTests()}
        </div>

        {/* Bottom Navigation */}
        <div className="flex-none bg-white border-t border-gray-100 px-6 py-2 pb-6 sm:pb-4 flex justify-between items-end z-20">
          <div className="flex-1 flex justify-center">
             <NavButton 
               icon={Home} 
               label="Home" 
               active={view === 'home'} 
               onClick={() => setView('home')} 
             />
          </div>

          <div className="flex-1 flex justify-center">
            <NavButton 
               icon={Pill} 
               label="Meds" 
               active={view === 'meds' || view === 'medDetail'} 
               onClick={() => setView('meds')} 
             />
          </div>
          
          <div className="flex-none -mt-10 mx-2">
             <label className="flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary-600 to-primary-500 rounded-full text-white shadow-lg shadow-primary-200 cursor-pointer hover:shadow-xl hover:scale-105 transition-all ring-4 ring-white">
                <Plus size={32} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'detail')}
                />
             </label>
          </div>

          <div className="flex-1 flex justify-center">
             <NavButton 
               icon={CalendarIcon} 
               label="Schedule" 
               active={view === 'schedule'} 
               onClick={() => setView('schedule')} 
             />
          </div>

          <div className="flex-1 flex justify-center">
            <NavButton 
               icon={FileText} 
               label="History" 
               active={view === 'history' || view === 'detail'} 
               onClick={() => setView('history')} 
             />
          </div>
        </div>
        
      </div>
    </div>
  );
}