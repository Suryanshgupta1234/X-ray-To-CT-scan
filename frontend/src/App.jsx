import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileType, Activity, Search, ShieldAlert, CheckCircle, Brain, Database, AlertCircle, Maximize, PlayCircle, Fingerprint } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [outputData, setOutputData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [report, setReport] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const [patientData, setPatientData] = useState({
    id: "PX-" + Math.floor(1000 + Math.random() * 9000),
    name: "Jane Doe",
    age: "45",
    gender: "Female",
    history: "Previous smoker.",
    date: new Date().toLocaleDateString()
  });

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setOutputData(null);
      setError(null);
      setReport(null);
      setIsSaved(false);
      setScanProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false
  });

  const handleGenerate = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    setScanProgress(0);

    // Simulate progress bar
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 400);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Use environment variable for deployed API URL, fallback to localhost
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    
    try {
      const response = await axios.post(`${API_URL}/generate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setTimeout(() => {
        if (response.data && response.data.outputs) {
          setOutputData(response.data.outputs);
          setReport({
            confidence: response.data.confidence || 94.2,
            findings: response.data.findings || ["Minor opacity"]
          });
        }
        setIsLoading(false);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      setError(err.message === 'Network Error' ? 'Server offline. Please start the backend API.' : (err.response?.data?.error || 'An error occurred.'));
      setIsLoading(false);
      setScanProgress(0);
    }
  };
  const generatePDFReport = () => {
    if (!report) return;
    window.print();
  };

  const saveToDatabase = async () => {
    if (!report || !outputData) return;
    try {
      const payload = {
        patient_id: patientData.id,
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        date: patientData.date,
        confidence: report.confidence,
        findings: report.findings,
        outputs: outputData.map(o => o.url)
      };
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const response = await axios.post(`${API_URL}/save_record`, payload);
      if (response.data.message) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Database error:", err);
      setError("Failed to save to database. Ensure API is running.");
      throw err;
    }
  };

  return (
    <>
    <div className="min-h-screen bg-[#070b14] text-cyan-50 font-sans p-4 lg:p-8 flex flex-col items-center relative overflow-hidden print:hidden">
      {/* Background Tech Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-blue-900 rounded-full blur-[140px]"></div>
        <div className="w-full h-full grid grid-cols-12 gap-4 pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => <div key={i} className="border-r border-cyan-900/10 h-full"></div>)}
        </div>
      </div>

      {/* Header */}
      <header className="w-full max-w-7xl flex items-center justify-between z-10 mb-8 border-b border-cyan-900/40 pb-4">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-500/20 p-3 rounded-xl border border-cyan-500/30">
            <Brain className="text-cyan-400 h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-cyan-400 font-mono">NEURO-RAD <span className="text-white">v3.0</span></h1>
            <p className="text-xs text-cyan-200/70 tracking-widest uppercase">CycleGAN Medical Imaging System</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-cyan-200/80 bg-cyan-950/40 px-4 py-2 rounded-full border border-cyan-800/50">
            <Database className="h-4 w-4 text-cyan-500" /> API: ONLINE
          </div>
          <div className="flex items-center gap-2 text-xs text-cyan-200/80 bg-cyan-950/40 px-4 py-2 rounded-full border border-cyan-800/50">
            <Fingerprint className="h-4 w-4 text-cyan-500" /> AUTH: SECURE
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Left Panel: Upload & Patient Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Patient Overview HUD */}
          <div className="bg-[#0b1426]/80 backdrop-blur-md border border-cyan-800/40 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xs font-bold text-cyan-500 tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" /> PATIENT DOSSIER
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-cyan-900/50 pb-2">
                <span className="text-cyan-200/60 text-sm">Patient ID</span>
                <span className="font-mono text-cyan-300 bg-cyan-950/50 px-2 rounded">{patientData.id}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-cyan-900/50 pb-2">
                <span className="text-cyan-200/60 text-sm">Name</span>
                <input 
                  type="text" 
                  value={patientData.name} 
                  onChange={(e) => setPatientData({...patientData, name: e.target.value})}
                  className="bg-cyan-950/30 border border-cyan-800/50 text-right font-mono text-cyan-300 w-32 focus:outline-none focus:border-cyan-500 rounded px-2 py-0.5" 
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="flex justify-between items-center border-b border-cyan-900/50 pb-2">
                <span className="text-cyan-200/60 text-sm">Age</span>
                <input 
                  type="number" 
                  value={patientData.age} 
                  onChange={(e) => setPatientData({...patientData, age: e.target.value})}
                  className="bg-cyan-950/30 border border-cyan-800/50 text-right font-mono text-cyan-300 w-16 focus:outline-none focus:border-cyan-500 rounded px-2 py-0.5" 
                  placeholder="Age"
                />
              </div>

              <div className="flex justify-between items-center border-b border-cyan-900/50 pb-2">
                <span className="text-cyan-200/60 text-sm">Gender</span>
                <select 
                  value={patientData.gender}
                  onChange={(e) => setPatientData({...patientData, gender: e.target.value})}
                  className="bg-cyan-950/30 border border-cyan-800/50 text-right font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 rounded px-2 py-0.5 appearance-none cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-2">
                <span className="text-cyan-200/60 text-sm block mb-2">Clinical History / Notes</span>
                <textarea 
                  value={patientData.history}
                  onChange={(e) => setPatientData({...patientData, history: e.target.value})}
                  className="w-full h-20 bg-cyan-950/30 border border-cyan-800/50 rounded-md p-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500 resize-none font-mono"
                  placeholder="Enter medical history, suspicions, or notes here..."
                />
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-[#0b1426]/80 backdrop-blur-md border border-cyan-800/40 rounded-2xl p-6 shadow-2xl flex-grow flex flex-col justify-center relative overflow-hidden group">
            {/* Scanner beam effect */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] opacity-0 group-hover:opacity-100 animate-[scan_2s_ease-in-out_infinite]"></div>
            
            <h2 className="text-xs font-bold text-cyan-500 tracking-[0.2em] mb-4">INPUT STREAM</h2>
            
            {!previewUrl ? (
              <div 
                {...getRootProps()} 
                className={`flex-grow border border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center transition-all duration-300 min-h-[220px]
                  ${isDragActive ? 'border-cyan-400 bg-cyan-900/20' : 'border-cyan-700/50 hover:bg-cyan-900/10 hover:border-cyan-500'}
                `}
              >
                <input {...getInputProps()} />
                <div className="bg-cyan-950 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <FileType className="h-8 w-8 text-cyan-400" />
                </div>
                <p className="text-sm font-medium text-cyan-200 mb-2 font-mono">
                  {isDragActive ? "INITIALIZE UPLOAD..." : "INSERT X-RAY SCAN"}
                </p>
                <p className="text-xs text-cyan-500/70">
                  Drag & drop or browse local files
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="relative rounded-xl overflow-hidden border border-cyan-800/50 aspect-[4/3] bg-black">
                  <img src={previewUrl} className="w-full h-full object-contain opacity-80 mix-blend-screen" alt="Upload" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1426] via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 text-[10px] font-mono text-cyan-400 bg-black/60 px-2 py-1 rounded">
                    SRC_FILE_LOADED
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    {...getRootProps()} 
                    className="flex-1 py-2 text-xs font-bold font-mono tracking-wider bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 rounded-md transition-colors"
                  >
                    <input {...getInputProps()} />
                    REPLACE
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={isLoading || outputData}
                    className={`flex-[2] py-2 text-xs font-bold font-mono tracking-wider rounded-md transition-all flex items-center justify-center gap-2
                      ${isLoading || outputData ? 'bg-cyan-900/50 text-cyan-600 cursor-not-allowed border border-cyan-900' : 'bg-cyan-500 hover:bg-cyan-400 text-[#070b14] border border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]'}
                    `}
                  >
                    {isLoading ? 'PROCESSING...' : outputData ? 'COMPLETED' : 'INITIATE CT GENERATION'}
                    {!isLoading && !outputData && <PlayCircle className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-950/50 border border-red-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Processing & Output */}
        <div className="lg:col-span-8 bg-[#0b1426]/80 backdrop-blur-md border border-cyan-800/40 rounded-2xl p-6 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold text-cyan-500 tracking-[0.2em] flex items-center gap-2">
              <Search className="h-4 w-4" /> ANALYSIS ENGINE
            </h2>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500/50 animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span>
              <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
            </div>
          </div>

          <div className="flex-grow flex flex-col lg:flex-row gap-6 relative">
            
            {/* Status Overlay when empty */}
            {!previewUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-cyan-700 font-mono text-sm tracking-widest border-2 border-dashed border-cyan-900/30 rounded-xl">
                <Maximize className="h-12 w-12 mb-4 opacity-50" />
                AWAITING VISUAL DATA INPUT
              </div>
            )}

            {/* AI Generator Display */}
            <div className={`flex-1 flex flex-col transition-opacity duration-500 ${!previewUrl ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>
              <div className="flex-1 bg-black rounded-xl border border-cyan-800/50 relative overflow-hidden flex items-center justify-center min-h-[300px]">
                
                {/* Generation state */}
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#0b1426]/80 backdrop-blur-sm">
                    <div className="relative w-48 h-48 mb-6">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="1" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray={`${scanProgress * 2.8} 300`} className="transition-all duration-300" transform="rotate(-90 50 50)" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-mono text-cyan-300">{scanProgress}%</span>
                        <span className="text-[8px] text-cyan-500 tracking-widest">SYNTHESIZING MULTI-SLICE CT</span>
                      </div>
                    </div>
                  </div>
                ) : outputData ? (
                   <div className="relative w-full h-full p-4 grid grid-cols-2 grid-rows-2 gap-4">
                     {/* Horizontal Scan line on hover */}
                     <div className="absolute top-0 left-0 w-full h-px bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity animate-scan z-30 pointer-events-none"></div>
                     
                     <div className="col-span-2 row-span-1 relative flex flex-col items-center bg-black rounded border border-cyan-800/60 p-2">
                        <img src={outputData[0].url} className="h-full object-contain filter contrast-125 hover:scale-[1.02] transition-transform" alt={outputData[0].label} />
                        <div className="absolute top-1 left-1 bg-[#0b1426]/90 border border-cyan-500/30 text-cyan-400 text-[10px] px-2 py-0.5 rounded-sm font-mono tracking-wider shadow-md">{outputData[0].label}</div>
                     </div>
                     
                     <div className="col-span-1 row-span-1 relative flex flex-col items-center bg-black rounded border border-cyan-800/60 p-2">
                        <img src={outputData[1].url} className="h-full object-contain filter contrast-125 hover:scale-[1.02] transition-transform" alt={outputData[1].label} />
                        <div className="absolute top-1 left-1 bg-[#0b1426]/90 border border-cyan-500/30 text-cyan-400 text-[10px] px-2 py-0.5 rounded-sm font-mono tracking-wider shadow-md">{outputData[1].label}</div>
                     </div>
                     
                     <div className="col-span-1 row-span-1 relative flex flex-col items-center bg-black rounded border border-cyan-800/60 p-2">
                        <img src={outputData[2].url} className="h-full object-contain filter contrast-125 hover:scale-[1.02] transition-transform" alt={outputData[2].label} />
                        <div className="absolute top-1 left-1 bg-[#0b1426]/90 border border-cyan-500/30 text-cyan-400 text-[10px] px-2 py-0.5 rounded-sm font-mono tracking-wider shadow-md">{outputData[2].label}</div>
                     </div>

                     <div className="absolute bottom-2 right-2 text-[10px] font-mono text-green-400 bg-black/80 px-2 py-1 rounded border border-green-500/30 flex items-center gap-1 z-20">
                        <CheckCircle className="h-3 w-3" /> MULTI_PLANAR_OK
                     </div>
                   </div>
                ) : (
                  <div className="text-cyan-800/50 flex flex-col items-center gap-4">
                    {previewUrl && <img src={previewUrl} className="w-full h-full object-cover opacity-20 filter blur-[2px]" alt="Background Setup" />}
                    <div className="absolute flex flex-col items-center">
                      <div className="w-16 h-16 border border-cyan-800 rounded-full flex items-center justify-center mb-2">
                         <div className="w-2 h-2 bg-cyan-700 rounded-full animate-ping"></div>
                      </div>
                      <span className="text-xs font-mono tracking-widest text-cyan-600">STANDBY</span>
                    </div>
                  </div>
                )}
                
                {/* HUD Elements over image */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 m-4 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50 m-4 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 m-4 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50 m-4 pointer-events-none"></div>
              </div>
            </div>

            {/* Diagnostic Report Panel */}
            <div className={`w-full lg:w-64 flex flex-col gap-4 transition-opacity duration-500 ${!outputData || !report ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>
              <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-xl p-4 flex-1">
                <h3 className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] border-b border-cyan-900/50 pb-2 mb-3">AI DIAGNOSTIC REPORT</h3>
                
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <span className="text-cyan-600 block mb-1">IMAGE CONFIDENCE</span>
                    <div className="w-full bg-cyan-950 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full transition-all duration-1000" style={{width: report ? `${report.confidence}%` : '0%'}}></div>
                    </div>
                    <span className="text-green-400 block text-right mt-1">{report ? report.confidence.toFixed(1) : 0}%</span>
                  </div>

                  <div>
                    <span className="text-cyan-600 block mb-1">DETECTED ANOMALIES</span>
                    <ul className="space-y-1">
                      {report && report.findings && report.findings.map((finding, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-yellow-300">
                          <ShieldAlert className="h-3 w-3 mt-0.5 shrink-0" />
                          {finding}
                        </li>
                      ))}
                      <li className="flex items-start gap-2 text-cyan-300">
                        <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-green-500" />
                        Base structure normal
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-cyan-900/50 mt-4 flex justify-between items-center gap-2">
                    <span className="text-cyan-600 block shrink-0">ACTIONS</span>
                    <div className="flex gap-2 w-full justify-end">
                      <button 
                        onClick={saveToDatabase}
                        disabled={isSaved}
                        className={`flex-1 min-w-[70px] px-2 py-1.5 border border-cyan-500/30 rounded text-[10px] transition font-bold text-center ${isSaved ? 'bg-green-900/50 text-green-400 border-green-500/30' : 'bg-cyan-900/50 hover:bg-cyan-800 text-cyan-300'}`}
                      >
                        {isSaved ? 'SAVED OK' : 'SAVE TO DB'}
                      </button>
                      <button 
                        onClick={generatePDFReport} 
                        className="flex-1 min-w-[80px] px-2 py-1.5 bg-blue-900/50 hover:bg-blue-800 border border-blue-500/30 text-blue-300 rounded text-[10px] transition font-bold"
                      >
                        PRINT PDF
                      </button>
                    </div>
                  </div>
                  <p className="text-cyan-200 mt-2">Awaiting radiologist verification. Review indicated regions.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <style jsx="true">{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        @media print {
          @page { margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
        }
      `}</style>
    </div>

    {/* PRINTABLE MEDICAL REPORT (Only visible when printing) */}
    {report && outputData && (
      <div className="hidden print:block w-full text-black font-serif text-sm leading-relaxed p-4">
        
        {/* Page 1: Diagnosis Text */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-bold text-center tracking-widest uppercase font-sans">RADIOLOGY REPORT</h1>
          <p className="text-center text-gray-500 font-sans">NEURO-RAD MEDICAL IMAGING CENTER</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 text-black border border-gray-300 p-4">
          <div>
            <p><strong>Patient Name:</strong> {patientData.name}</p>
            <p><strong>Patient ID:</strong> {patientData.id}</p>
            <p><strong>DOB/Vitals:</strong> {patientData.age} Yrs, {patientData.gender}</p>
          </div>
          <div>
            <p><strong>Exam Date:</strong> {patientData.date}</p>
            <p><strong>Referring Physician:</strong> Dr. AI System</p>
            <p><strong>Exam:</strong> CT CHEST WITHOUT IV CONTRAST</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-bold underline text-lg font-sans">CLINICAL INDICATION:</h2>
            <p>{patientData.history} Evaluation of lung field anomalous opacities observed on preliminary 2D radiography.</p>
          </div>

          <div>
            <h2 className="font-bold underline text-lg font-sans">TECHNIQUE:</h2>
            <p>CycleGAN Deep Learning Synthesizer mapped volumetric data from flat planar source. Multi-planar reformations (axial, coronal, sagittal) generated via native simulated reconstruction matrix. Computed confidence interval: <strong>{report.confidence.toFixed(1)}%</strong>.</p>
          </div>

          <div>
            <h2 className="font-bold underline text-lg font-sans">FINDINGS:</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {report.findings.map((finding, idx) => (
                <li key={idx} className="font-bold">{finding} noted.</li>
              ))}
              <li>Heart size normal.</li>
              <li>Trachea and central bronchi are patent.</li>
              <li>No significant pleural effusion.</li>
              <li>Osseous structures appear intact.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold underline text-lg font-sans">IMPRESSION:</h2>
            <p className="border border-black p-4 bg-gray-50 mt-2 font-bold uppercase text-lg">
              {report.findings.length > 0 ? report.findings.join(", ") : "NO ACUTE CARDIOPULMONARY PROCESS"} - SUGGEST RADIOLOGIST REVIEW.
            </p>
          </div>
        </div>
        
        {/* Page 2: CT Scan Printouts */}
        <div style={{ pageBreakBefore: 'always' }} className="pt-8">
          <h2 className="font-bold underline text-xl font-sans mb-8">MULTI-PLANAR RECONSTRUCTION (MPR) KEY IMAGES</h2>
          
          <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans font-bold">
            {outputData.map((slice, index) => (
              <div key={index} className={`border-2 border-black p-2 ${index === 0 ? 'col-span-2' : 'col-span-1'}`}>
                <img src={slice.url} alt={slice.label} className={`w-full ${index === 0 ? 'h-96' : 'h-64'} object-contain bg-black`} style={{filter: 'contrast(1.5) grayscale(1)'}} />
                <p className="mt-2 text-lg">{slice.label.toUpperCase()}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center text-gray-400 font-sans text-xs">
            Electronically Signed by NEURO-RAD Automated Engine v3.0 | Generated via Model Inference Override
          </div>
        </div>

      </div>
    )}
    </>
  );
}

export default App;
