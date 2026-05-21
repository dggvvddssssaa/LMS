import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useWebRTC from '../hooks/useWebRTC';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, Users, MessageSquare } from 'lucide-react';

const ROLE_LABELS = {
    admin: { text: 'Admin', color: 'bg-red-500' },
    instructor: { text: 'GV', color: 'bg-purple-500' },
    teacher: { text: 'GV', color: 'bg-purple-500' },
    student: { text: 'HV', color: 'bg-blue-500' },
};

const Classroom = () => {
    const { id: roomId } = useParams();
    const navigate = useNavigate();
    const auth = useAuthStore();
    const user = auth?.user || { role: 'student', name: 'Guest' };

    const isTeacher = user.role === 'teacher' || user.role === 'instructor' || user.role === 'admin';
    const { isJoined, initWebRTC, localStream, localScreenStream, peers, toggleVideo, toggleAudio, toggleScreenShare, isCamOn, isMicOn, isScreenSharing, error, connectionState, messages, sendMessage } = useWebRTC(roomId, isTeacher);
    const [chatInput, setChatInput] = useState('');
    const [activeTab, setActiveTab] = useState('chat');

    const activeScreenShare = localScreenStream || peers.find(p => p.screenStream && p.screenStream.getTracks().length > 0)?.screenStream;

    const handleSendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        sendMessage(chatInput, user.name);
        setChatInput('');
    };

    const getRoleBadge = (role) => {
        const info = ROLE_LABELS[role] || ROLE_LABELS.student;
        return (
            <span className={`${info.color} text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase`}>
                {info.text}
            </span>
        );
    };

    if (!isJoined) {
        return (
            <div className="bg-slate-900 min-h-screen text-slate-100 p-4 flex flex-col items-center justify-center font-sans">
                <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700/50 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-primary/30">
                        <Video size={32} />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">Lớp học trực tuyến</h1>
                    <p className="text-slate-400 mb-8 font-medium">Mã lớp: {roomId}</p>

                    {error && (
                        <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={initWebRTC}
                        className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-95 text-lg"
                    >
                        Tham gia lớp học
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full mt-4 bg-transparent hover:bg-slate-700/50 text-slate-300 font-medium py-3 px-6 rounded-xl transition-all"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const participantCount = 1 + peers.length; // self + remote peers

    return (
        <div className="bg-slate-900 min-h-screen text-slate-100 p-4 flex flex-col font-sans">
            <header className="flex justify-between items-center mb-4 p-4 bg-slate-800 rounded-2xl shadow-lg border border-slate-700/50">
                <h1 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50"></span>
                    Lớp học trực tuyến
                </h1>
                <div className="flex gap-4 items-center">
                    <span className="flex items-center gap-2 px-4 py-1.5 bg-slate-700/50 border border-slate-600 rounded-full text-sm text-slate-200 font-medium">
                        <Users size={14} />
                        {participantCount}
                    </span>
                    <span className="px-4 py-1.5 bg-slate-700/50 border border-slate-600 rounded-full text-sm text-slate-200 font-medium flex items-center gap-2">
                        {user?.name} {getRoleBadge(user.role)}
                    </span>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-1.5 rounded-full text-sm font-bold hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center gap-2"
                    >
                        <PhoneOff size={16} /> Rời khỏi
                    </button>
                </div>
            </header>

            {/* Connection state indicator */}
            {connectionState === 'connecting' && (
                <div className="mb-4 bg-blue-500/20 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-xl mx-auto max-w-2xl text-center flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></span>
                    Đang kết nối media...
                </div>
            )}
            {connectionState === 'reconnecting' && (
                <div className="mb-4 bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-xl mx-auto max-w-2xl text-center flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></span>
                    Mất kết nối, đang thử kết nối lại...
                </div>
            )}
            {connectionState === 'failed' && (
                <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mx-auto max-w-2xl text-center">
                    ⚠️ Kết nối media thất bại. Kiểm tra mạng hoặc thử tải lại trang.
                </div>
            )}

            {error && (
                <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mx-auto max-w-2xl text-center">
                    {error}
                </div>
            )}

            <div className={`flex-1 grid gap-4 ${activeScreenShare ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-4'}`}>
                {/* Main Stage */}
                <div className={`${activeScreenShare ? 'lg:col-span-3 flex flex-col gap-4' : 'md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr'}`}>

                    {/* Screen Share Stage */}
                    {activeScreenShare && (
                        <div className="relative bg-slate-800 rounded-2xl overflow-hidden aspect-video border-2 border-primary shadow-xl w-full">
                            <video
                                autoPlay
                                playsInline
                                ref={video => {
                                    if (video && video.srcObject !== activeScreenShare) {
                                        video.srcObject = activeScreenShare;
                                        video.play().catch(e => console.error("Play prevented", e));
                                    }
                                }}
                                className="w-full h-full object-contain bg-black"
                            />
                            <div className="absolute bottom-4 left-4 bg-slate-900/80 px-4 py-2 rounded-xl text-sm font-bold text-primary border border-primary/30 flex items-center gap-2">
                                <MonitorUp size={16} /> Đang chia sẻ màn hình
                            </div>
                        </div>
                    )}

                    {/* Cameras Container */}
                    <div className={activeScreenShare ? "flex gap-4 overflow-x-auto pb-4 custom-scrollbar" : "contents"}>

                        {/* Local Video */}
                        <div className={`relative bg-slate-800 rounded-2xl overflow-hidden aspect-video border-2 ${isTeacher ? 'border-purple-500/50' : 'border-slate-600'} shadow-md flex-shrink-0 ${activeScreenShare ? 'w-48 sm:w-64' : ''}`}>
                            {localStream && isCamOn ? (
                                <video
                                    autoPlay
                                    playsInline
                                    muted
                                    ref={video => {
                                        if (video && video.srcObject !== localStream) {
                                            video.srcObject = localStream;
                                            video.play().catch(e => console.error("Play prevented", e));
                                        }
                                    }}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500 mb-2 shadow-inner">
                                        {user?.name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">Camera đang tắt</span>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-md px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-slate-700/50">
                                Bạn {getRoleBadge(user.role)}
                                {!isMicOn && <MicOff size={12} className="text-red-400" />}
                            </div>
                        </div>

                        {/* Remote Peers */}
                        {peers.map(peer => {
                            const peerRole = peer.role || 'student';
                            const peerIsTeacher = peer.isTeacher;
                            const hasVideoTrack = peer.camStream && peer.camStream.getVideoTracks().length > 0;
                            const hasAudioTrack = peer.camStream && peer.camStream.getAudioTracks().length > 0;

                            return (
                                <div key={peer.peerId} className={`relative bg-slate-800 rounded-2xl overflow-hidden aspect-video border ${peerIsTeacher ? 'border-purple-500/50' : 'border-slate-700'} shadow-md flex-shrink-0 ${activeScreenShare ? 'w-48 sm:w-64' : ''}`}>

                                    {/* Video — only render when peer actually has video tracks */}
                                    {hasVideoTrack ? (
                                        <video
                                            autoPlay
                                            playsInline
                                            ref={video => {
                                                if (video) {
                                                    // Only set video tracks to avoid audio echo
                                                    const videoOnly = new MediaStream(peer.camStream.getVideoTracks());
                                                    if (video.srcObject !== videoOnly) {
                                                        video.srcObject = videoOnly;
                                                        video.play().catch(() => {});
                                                    }
                                                }
                                            }}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-inner ${peerIsTeacher ? 'bg-purple-700/50 text-purple-200' : 'bg-slate-700 text-slate-500'}`}>
                                                {(peer.userName || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-slate-400 text-sm font-medium">Camera đang tắt</span>
                                        </div>
                                    )}

                                    {/* Separate audio element — always render for audio playback */}
                                    {hasAudioTrack && (
                                        <audio
                                            autoPlay
                                            ref={audio => {
                                                if (audio) {
                                                    const audioOnly = new MediaStream(peer.camStream.getAudioTracks());
                                                    if (audio.srcObject !== audioOnly) {
                                                        audio.srcObject = audioOnly;
                                                        audio.play().catch(e => {
                                                            console.warn('Audio autoplay blocked:', e);
                                                        });
                                                    }
                                                }
                                            }}
                                        />
                                    )}

                                    <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-md px-2 py-1 rounded-md text-xs font-semibold truncate max-w-[80%] border border-slate-700/50 flex items-center gap-1.5">
                                        {peer.userName || 'Thành viên'} {getRoleBadge(peerRole)}
                                        {!hasAudioTrack && <MicOff size={12} className="text-red-400" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="bg-slate-800 rounded-2xl p-0 flex flex-col border border-slate-700/50 shadow-lg overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-700">
                        <button
                            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'chat' ? 'bg-slate-800 text-primary border-b-2 border-primary' : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            <MessageSquare size={14} /> Thảo luận
                        </button>
                        <button
                            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'participants' ? 'bg-slate-800 text-green-400 border-b-2 border-green-500' : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
                            onClick={() => setActiveTab('participants')}
                        >
                            <Users size={14} /> Thành viên ({participantCount})
                        </button>
                    </div>

                    {/* Chat Tab */}
                    <div className={`p-4 flex-1 flex flex-col h-[400px] sm:h-auto ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
                        <div className="flex-1 bg-slate-900/50 rounded-xl p-4 mb-4 overflow-y-auto border border-slate-800 inset-shadow space-y-3 custom-scrollbar">
                            <div className="text-xs text-slate-500 italic text-center mb-4 bg-slate-800/80 rounded-full py-1.5 mx-8 border border-slate-700/50">Chào mừng bạn đến với lớp học trực tuyến!</div>
                            {messages?.map((msg, index) => (
                                <div key={index} className="flex flex-col">
                                    <span className="font-bold text-xs mb-0.5 flex items-center gap-1.5">
                                        <span className={msg.senderRole === 'instructor' || msg.senderRole === 'admin' ? 'text-purple-400' : 'text-primary'}>{msg.senderName}</span>
                                        {msg.senderRole && getRoleBadge(msg.senderRole)}
                                    </span>
                                    <span className="text-sm text-slate-200 bg-slate-800 px-3 py-2 rounded-r-xl rounded-bl-xl inline-block w-fit border border-slate-700/30 shadow-sm">{msg.text}</span>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendChat} className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Nhập nội dung tương tác..."
                                className="flex-1 bg-slate-900/70 border border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500 text-slate-100"
                            />
                            <button type="submit" className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-md shadow-primary/20 active:scale-95">Gửi</button>
                        </form>
                    </div>

                    {/* Participants Tab */}
                    <div className={`p-4 flex-1 flex flex-col h-[400px] sm:h-auto ${activeTab === 'participants' ? 'block' : 'hidden'}`}>
                        <div className="flex-1 bg-slate-900/50 rounded-xl p-3 overflow-y-auto border border-slate-800 space-y-1 custom-scrollbar">
                            {/* Self */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                    {user?.name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-200 truncate">{user?.name || 'Bạn'}</span>
                                        {getRoleBadge(user.role)}
                                        <span className="text-[10px] text-slate-500">(Bạn)</span>
                                    </div>
                                </div>
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
                            </div>

                            {/* Remote peers */}
                            {peers.map(peer => (
                                <div key={peer.peerId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/30 transition">
                                    <div className={`w-9 h-9 rounded-full ${peer.isTeacher ? 'bg-purple-600' : 'bg-slate-600'} flex items-center justify-center text-white font-bold text-sm`}>
                                        {(peer.userName || '?').charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-200 truncate">{peer.userName || 'Thành viên'}</span>
                                            {getRoleBadge(peer.role || 'student')}
                                        </div>
                                    </div>
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
                                </div>
                            ))}

                            {peers.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    Chưa có ai khác trong phòng
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="mt-6 mb-2 flex justify-center gap-4">
                <button
                    onClick={toggleAudio}
                    className={`p-4 rounded-full transition-all duration-300 shadow-lg ${isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50'}`}
                >
                    {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-all duration-300 shadow-lg ${isCamOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50'}`}
                >
                    {isCamOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
                <button
                    onClick={toggleScreenShare}
                    className={`p-4 rounded-full transition-all duration-300 shadow-lg ${isScreenSharing ? 'bg-primary hover:bg-blue-600 text-white shadow-primary/30' : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'}`}
                >
                    <MonitorUp size={24} />
                </button>
            </div>
        </div>
    );
};

export default Classroom;
