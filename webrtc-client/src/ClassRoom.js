import React, { useEffect, useRef, useState, useMemo } from "react";
import io from "socket.io-client";

// --- HOOK: DETECT ACTIVE SPEAKER ---
const useAudioActivity = (stream, isAudioEnabled = true) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || !isAudioEnabled || stream.getAudioTracks().length === 0) {
      setIsSpeaking(false);
      return;
    }

    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      javascriptNode.onaudioprocess = () => {
        if (!isAudioEnabled) return;
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;
        const length = array.length;
        for (let i = 0; i < length; i++) values += array[i];
        const average = values / length;
        setIsSpeaking(average > 10);
      };
    } catch (e) {
      console.error("Audio Context Error:", e);
    }

    return () => {
      if (javascriptNode) javascriptNode.disconnect();
      if (analyser) analyser.disconnect();
      if (microphone) microphone.disconnect();
      if (audioContext && audioContext.state !== "closed") audioContext.close();
    };
  }, [stream, isAudioEnabled]);

  return isSpeaking;
};

// --- WHITEBOARD (GIỮ NGUYÊN) ---
const Whiteboard = ({ socket }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [slideImage, setSlideImage] = useState(null);
  const [color, setColor] = useState("#000000");
  const lastPos = useRef({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.offsetWidth;
        canvas.height = containerRef.current.offsetHeight;
        socket.emit("request_whiteboard");
      }
    };
    const drawLine = (d, emit) => {
      ctx.beginPath();
      ctx.moveTo(d.x0, d.y0);
      ctx.lineTo(d.x1, d.y1);
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
      if (emit) socket.emit("draw", d);
    };
    socket.on("draw", (d) => drawLine(d, false));
    socket.on("clear_board", () =>
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    );
    socket.on("whiteboard_history", (h) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      h.forEach((d) => drawLine(d, false));
    });
    socket.on("slide_change", (img) => setSlideImage(img));
    resize();
    window.addEventListener("resize", resize);
    return () => {
      socket.off("draw");
      socket.off("clear_board");
      socket.off("whiteboard_history");
      socket.off("slide_change");
      window.removeEventListener("resize", resize);
    };
  }, [socket]);
  const start = (e) => {
    setIsDrawing(true);
    const r = canvasRef.current.getBoundingClientRect();
    lastPos.current = {
      x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left,
      y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top,
    };
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const r = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left,
      y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    socket.emit("draw", {
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: x,
      y1: y,
      color,
      width: 3,
    });
    lastPos.current = { x, y };
  };
  return (
    <div className="relative w-full h-full bg-white flex flex-col rounded-xl overflow-hidden">
      <div className="h-10 bg-gray-200 flex items-center px-4 gap-2 border-b">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button
          onClick={() => socket.emit("clear_board")}
          className="bg-red-500 text-white text-xs px-2 py-1 rounded"
        >
          Clear
        </button>
        <label className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded cursor-pointer">
          Slide{" "}
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const r = new FileReader();
              r.onload = (ev) => {
                setSlideImage(ev.target.result);
                socket.emit("change_slide", ev.target.result);
              };
              if (e.target.files[0]) r.readAsDataURL(e.target.files[0]);
            }}
          />
        </label>
      </div>
      <div className="flex-1 relative bg-gray-100" ref={containerRef}>
        {slideImage && (
          <img
            src={slideImage}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 cursor-crosshair touch-none"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={() => setIsDrawing(false)}
        />
      </div>
    </div>
  );
};

// --- VIDEO CARD ---
const VideoCard = ({
  isLocal,
  stream,
  username,
  onClick,
  isPinned,
  isMainStage,
  mediaStatus,
  isScreenSharing,
}) => {
  const videoRef = useRef();

  const isAudioEnabled = mediaStatus ? mediaStatus.audio : true;
  const isSpeaking = useAudioActivity(stream, isAudioEnabled);

  const isVideoVisible =
    isScreenSharing || (mediaStatus ? mediaStatus.video : true);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const borderStyle =
    isSpeaking && !isLocal
      ? "ring-4 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)] scale-[1.02]"
      : isPinned
      ? "ring-4 ring-blue-500"
      : "hover:ring-1 hover:ring-gray-500";

  return (
    <div
      onClick={onClick}
      className={`relative bg-gray-900 rounded-xl overflow-hidden shadow-md cursor-pointer transition-all duration-200 group ${borderStyle} ${
        isMainStage ? "w-full h-full" : "w-full h-full aspect-video"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full transition-opacity duration-300 ${
          isMainStage || isScreenSharing ? "object-contain" : "object-cover"
        } ${isVideoVisible ? "opacity-100" : "opacity-0"}`}
      />

      {!isVideoVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg transition-transform duration-100 ${
              isSpeaking ? "bg-green-600 scale-110" : "bg-blue-600"
            }`}
          >
            {username ? username.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
      )}

      <div className="absolute left-2 bottom-2 right-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 overflow-hidden">
          {!isScreenSharing && (
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                mediaStatus?.audio ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
          )}
          <span className="text-white text-xs font-bold truncate">
            {username} {isLocal && "(You)"}
          </span>
        </div>
        <div className="flex gap-2 text-xs">
          {isScreenSharing && (
            <span className="bg-blue-600 text-white px-1.5 rounded font-bold">
              SCREEN
            </span>
          )}
          {!mediaStatus?.audio && <span className="text-red-400">🔇</span>}
        </div>
      </div>
    </div>
  );
};

const stunServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// --- MAIN LOGIC ---
const ClassRoom = ({ user, courseId, onLeave }) => {
  const [joined, setJoined] = useState(false);
  const username = user.name;
  const roomId = `course-${courseId}`;

  const [peers, setPeers] = useState([]);
  const [userStream, setUserStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  const [pinnedPeerID, setPinnedPeerID] = useState(null);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const socketRef = useRef();
  const peersRef = useRef([]);
  const userStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    joinRoom();
    return () => leaveAndCleanup();
    // eslint-disable-next-line
  }, []);

  const leaveAndCleanup = () => {
    if (userStreamRef.current)
      userStreamRef.current.getTracks().forEach((t) => t.stop());
    if (screenStreamRef.current)
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    if (socketRef.current) socketRef.current.disconnect();
    peersRef.current.forEach((p) => p.peer.close());
  };

  const joinRoom = () => {
    if (socketRef.current) socketRef.current.disconnect();
    socketRef.current = io.connect(process.env.REACT_APP_API_URL);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!socketRef.current || !socketRef.current.connected) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        userStreamRef.current = stream;
        setUserStream(stream);
        setJoined(true);

        socketRef.current.emit("join_room", {
          roomId,
          username,
          mediaStatus: { video: true, audio: true },
        });

        socketRef.current.on("all_users", (users) => {
          users.forEach((user) => {
            if (peersRef.current.find((p) => p.peerID === user.id)) return;
            const peer = createPeer(
              user.id,
              socketRef.current.id,
              stream,
              false
            );
            peersRef.current.push({
              peerID: user.id,
              peer,
              username: user.username,
            });
            setPeers((prev) => [
              ...prev,
              {
                peerID: user.id,
                username: user.username,
                stream: null,
                mediaStatus: user.mediaStatus,
                isScreenSharing: false,
              },
            ]);
          });
        });

        socketRef.current.on("user_joined", (payload) => {
          const finalPeerID = payload.isScreen
            ? payload.callerID + "_screen"
            : payload.callerID;
          const finalUsername = payload.isScreen
            ? payload.callerUsername + "'s Screen"
            : payload.callerUsername;
          if (peersRef.current.find((p) => p.peerID === finalPeerID)) return;

          const peer = addPeer(
            payload.signal,
            payload.callerID,
            stream,
            payload.isScreen
          );
          peersRef.current.push({
            peerID: finalPeerID,
            peer,
            username: finalUsername,
          });
          setPeers((prev) => [
            ...prev,
            {
              peerID: finalPeerID,
              username: finalUsername,
              stream: null,
              mediaStatus: payload.mediaStatus,
              isScreenSharing: payload.isScreen,
            },
          ]);

          if (screenStreamRef.current && !payload.isScreen) {
            setTimeout(() => {
              const screenPeer = createPeer(
                payload.callerID,
                socketRef.current.id,
                screenStreamRef.current,
                true
              );
              peersRef.current.push({
                peerID: payload.callerID + "_screen_sender",
                peer: screenPeer,
                isSender: true,
              });
            }, 1000);
          }
        });

        socketRef.current.on("receiving_returned_signal", (payload) => {
          const targetID = payload.isScreen
            ? payload.id + "_screen"
            : payload.id;
          let item = peersRef.current.find((p) => p.peerID === targetID);
          if (!item && payload.isScreen)
            item = peersRef.current.find(
              (p) => p.peerID === payload.id + "_screen_sender"
            );
          if (item)
            handleSignal(item.peer, payload.signal, null, payload.isScreen);
        });

        socketRef.current.on("user_left", (id) => {
          const ids = [id, id + "_screen", id + "_screen_sender"];
          ids.forEach((target) => {
            const p = peersRef.current.find((x) => x.peerID === target);
            if (p) p.peer.close();
          });
          peersRef.current = peersRef.current.filter(
            (p) => !ids.includes(p.peerID)
          );
          setPeers((prev) => prev.filter((p) => !ids.includes(p.peerID)));
        });

        socketRef.current.on("user_media_update", ({ userId, status }) => {
          setPeers((prev) =>
            prev.map((p) =>
              p.peerID === userId ? { ...p, mediaStatus: status } : p
            )
          );
        });

        // --- FIX XÓA MÀN HÌNH ĐEN ---
        socketRef.current.on("user_stopped_screen", (userId) => {
          const screenID = userId + "_screen";
          console.log("Removing screen share from:", screenID);

          const p = peersRef.current.find((x) => x.peerID === screenID);
          if (p) p.peer.close();

          // Cập nhật Refs
          peersRef.current = peersRef.current.filter(
            (p) => p.peerID !== screenID
          );
          // Cập nhật State (Quan trọng để UI render lại và mất khung đen)
          setPeers((prev) => prev.filter((p) => p.peerID !== screenID));
        });
      });
  };

  const createPeer = (userToSignal, callerID, stream, isScreen) => {
    const peer = new RTCPeerConnection(stunServers);
    peer.iceQueue = [];
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.onicecandidate = (e) => {
      if (e.candidate)
        socketRef.current.emit("sending_signal", {
          userToCall: userToSignal,
          callerID,
          signal: { type: "candidate", candidate: e.candidate },
          isScreen,
        });
    };
    peer.ontrack = (e) => {
      if (!isScreen)
        setPeers((prev) =>
          prev.map((p) =>
            p.peerID === userToSignal ? { ...p, stream: e.streams[0] } : p
          )
        );
    };
    peer.onnegotiationneeded = async () => {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current.emit("sending_signal", {
        userToCall: userToSignal,
        callerID,
        signal: { type: "sdp", sdp: peer.localDescription },
        isScreen,
      });
    };
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream, isScreen) => {
    const peer = new RTCPeerConnection(stunServers);
    peer.iceQueue = [];
    if (!isScreen)
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.onicecandidate = (e) => {
      if (e.candidate)
        socketRef.current.emit("returning_signal", {
          signal: { type: "candidate", candidate: e.candidate },
          callerID,
          isScreen,
        });
    };
    peer.ontrack = (e) => {
      const targetID = isScreen ? callerID + "_screen" : callerID;
      setPeers((prev) =>
        prev.map((p) =>
          p.peerID === targetID ? { ...p, stream: e.streams[0] } : p
        )
      );
    };
    handleSignal(peer, incomingSignal, callerID, isScreen);
    return peer;
  };

  const handleSignal = async (peer, signal, callerID, isScreen) => {
    try {
      if (signal.type === "sdp") {
        if (signal.sdp.type === "answer" && peer.signalingState === "stable")
          return;
        await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        while (peer.iceQueue.length > 0)
          await peer.addIceCandidate(
            new RTCIceCandidate(peer.iceQueue.shift())
          );
        if (signal.sdp.type === "offer") {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          if (callerID)
            socketRef.current.emit("returning_signal", {
              signal: { type: "sdp", sdp: peer.localDescription },
              callerID,
              isScreen,
            });
        }
      } else if (signal.type === "candidate") {
        if (peer.remoteDescription)
          await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
        else peer.iceQueue.push(signal.candidate);
      }
    } catch (e) {
      console.error("Signal Error:", e);
    }
  };

  const toggleMic = () => {
    if (userStreamRef.current) {
      const newStatus = !isMicOn;
      userStreamRef.current
        .getAudioTracks()
        .forEach((t) => (t.enabled = newStatus));
      setIsMicOn(newStatus);
      socketRef.current.emit("media_status_change", {
        video: isCameraOn,
        audio: newStatus,
      });
    }
  };

  const toggleCam = () => {
    if (userStreamRef.current) {
      const newStatus = !isCameraOn;
      userStreamRef.current
        .getVideoTracks()
        .forEach((t) => (t.enabled = newStatus));
      setIsCameraOn(newStatus);
      socketRef.current.emit("media_status_change", {
        video: newStatus,
        audio: isMicOn,
      });
    }
  };

  // --- FIX SHARE SCREEN CÓ TIẾNG & TẮT NHANH ---
  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        // Thêm { audio: true } để share cả tiếng hệ thống
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: true,
        });

        setScreenStream(stream);
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        setPinnedPeerID("local_screen");
        setIsWhiteboardOpen(false);

        peersRef.current.forEach((p) => {
          if (!p.peerID.includes("_screen") && !p.isSender) {
            const screenPeer = createPeer(
              p.peerID,
              socketRef.current.id,
              stream,
              true
            );
            peersRef.current.push({
              peerID: p.peerID + "_screen_sender",
              peer: screenPeer,
              isSender: true,
            });
          }
        });

        // Sự kiện khi bấm nút "Stop Sharing" của trình duyệt
        stream.getVideoTracks()[0].onended = stopScreenShare;
      } catch (e) {
        console.error("Screen Share Error:", e);
      }
    } else stopScreenShare();
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current)
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    setPinnedPeerID(null);

    // Đóng kết nối gửi
    peersRef.current.forEach((p) => {
      if (p.isSender) p.peer.close();
    });
    peersRef.current = peersRef.current.filter((p) => !p.isSender);

    // Báo server để xóa bên người nhận
    if (socketRef.current) socketRef.current.emit("stop_screen_share");
  };

  const handleLeaveBtn = () => {
    leaveAndCleanup();
    if (onLeave) onLeave();
    else window.location.reload();
  };

  const displayList = useMemo(() => {
    let list = [];
    if (userStream)
      list.push({
        peerID: "local",
        username: username || "You",
        stream: userStream,
        isLocal: true,
        mediaStatus: { video: isCameraOn, audio: isMicOn },
      });
    if (screenStream)
      list.push({
        peerID: "local_screen",
        username: "Your Screen",
        stream: screenStream,
        isLocal: true,
        isScreenSharing: true,
      });
    return list.concat(peers);
  }, [peers, userStream, screenStream, isCameraOn, isMicOn]);

  const isSidebar = isWhiteboardOpen || pinnedPeerID;

  if (!joined)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p>Đang vào lớp học...</p>
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-white font-sans">
      <div className="h-12 flex items-center justify-between px-4 bg-[#1e1e1e] border-b border-gray-700">
        <div className="font-bold text-lg">Lớp: {roomId}</div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsWhiteboardOpen(!isWhiteboardOpen);
              setPinnedPeerID(null);
            }}
            className="bg-purple-600 px-3 py-1 rounded text-sm hover:bg-purple-700 transition"
          >
            {isWhiteboardOpen ? "Đóng Bảng" : "Bảng Trắng"}
          </button>
          <span className="bg-gray-700 px-3 py-1 rounded text-sm flex items-center">
            👥 {displayList.filter((u) => !u.isScreenSharing).length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-3 gap-3">
        {isSidebar ? (
          <>
            <div className="flex-1 bg-black rounded-xl border border-gray-700 relative flex items-center justify-center overflow-hidden">
              {isWhiteboardOpen ? (
                <Whiteboard socket={socketRef.current} />
              ) : (
                displayList.find((u) => u.peerID === pinnedPeerID) && (
                  <VideoCard
                    {...displayList.find((u) => u.peerID === pinnedPeerID)}
                    isMainStage={true}
                    isPinned={true}
                    onClick={() => setPinnedPeerID(null)}
                  />
                )
              )}
            </div>
            <div className="md:w-56 flex md:flex-col gap-2 overflow-auto">
              {displayList
                .filter((u) => u.peerID !== pinnedPeerID)
                .map((u) => (
                  <div
                    key={u.peerID}
                    className="w-40 md:w-full aspect-video shrink-0"
                  >
                    <VideoCard
                      {...u}
                      onClick={() => {
                        setIsWhiteboardOpen(false);
                        setPinnedPeerID(u.peerID);
                      }}
                    />
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div
            className={`grid gap-3 w-full max-w-6xl mx-auto h-full auto-rows-fr ${
              displayList.length <= 1
                ? "grid-cols-1"
                : displayList.length <= 4
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
          >
            {displayList.map((u) => (
              <VideoCard
                key={u.peerID}
                {...u}
                onClick={() => {
                  setIsWhiteboardOpen(false);
                  setPinnedPeerID(u.peerID);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-16 bg-[#1e1e1e] flex items-center justify-center gap-4 border-t border-gray-700 shrink-0 z-50">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full transition-all ${
            isMicOn
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-500 hover:bg-red-600 animate-pulse"
          }`}
        >
          {isMicOn ? "🎙️" : "🔇"}
        </button>
        <button
          onClick={toggleCam}
          className={`p-3 rounded-full transition-all ${
            isCameraOn
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isCameraOn ? "📹" : "📷"}
        </button>
        <button
          onClick={handleScreenShare}
          className={`p-3 rounded-full transition-all ${
            isScreenSharing
              ? "bg-blue-600 hover:bg-blue-500 ring-2 ring-white"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isScreenSharing ? "❌ Stop Share" : "💻 Share"}
        </button>
        <button
          onClick={handleLeaveBtn}
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full font-bold ml-4 shadow-lg transition"
        >
          Rời lớp
        </button>
      </div>
    </div>
  );
};

export default ClassRoom;
