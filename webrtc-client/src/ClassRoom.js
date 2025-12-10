import React, { useEffect, useRef, useState, useMemo } from "react";
import io from "socket.io-client";

// --- WHITEBOARD (GIỮ NGUYÊN) ---
const Whiteboard = ({ socket }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [slideImage, setSlideImage] = useState(null);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.offsetWidth;
        canvas.height = containerRef.current.offsetHeight;
        socket.emit("request_whiteboard");
      }
    };
    const drawLine = ({ x0, y0, x1, y1, color, width, emit }) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.closePath();
      if (emit) socket.emit("draw", { x0, y0, x1, y1, color, width });
    };
    socket.on("draw", (data) => drawLine({ ...data, emit: false }));
    socket.on("clear_board", () =>
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    );
    socket.on("whiteboard_history", (history) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      history.forEach((item) => drawLine({ ...item, emit: false }));
    });
    socket.on("slide_change", (imgData) => setSlideImage(imgData));
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      socket.off("draw");
      socket.off("clear_board");
      socket.off("whiteboard_history");
      socket.off("slide_change");
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [socket]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches)
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const startDrawing = (e) => {
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.closePath();
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
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setSlideImage(evt.target.result);
        socket.emit("change_slide", evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="relative w-full h-full bg-white flex flex-col rounded-xl overflow-hidden shadow-2xl">
      <div className="h-12 bg-gray-200 flex items-center px-4 gap-4 border-b border-gray-300 z-20">
        <span className="font-bold text-gray-700">✏️ Draw:</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="cursor-pointer h-8 w-8"
        />
        <button
          onClick={() => socket.emit("clear_board")}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Clear
        </button>
        <label className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm cursor-pointer">
          🖼️ Slide{" "}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      </div>
      <div
        className="flex-1 relative bg-gray-100 overflow-hidden"
        ref={containerRef}
      >
        {slideImage && (
          <img
            src={slideImage}
            alt="Slide"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
          />
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onTouchStart={startDrawing}
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
  const shouldShowVideo =
    isScreenSharing || (mediaStatus ? mediaStatus.video : true);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream, shouldShowVideo]);

  return (
    <div
      onClick={onClick}
      className={`relative bg-gray-800 rounded-xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 group ${
        isPinned ? "ring-4 ring-blue-500" : "hover:ring-2 hover:ring-gray-500"
      } ${
        isMainStage ? "w-full h-full bg-black" : "w-full h-full aspect-video"
      }`}
    >
      {shouldShowVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // QUAN TRỌNG: Local luôn mute để tránh vọng âm
          className={`w-full h-full ${
            isMainStage || isScreenSharing ? "object-contain" : "object-cover"
          }`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {username ? username.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
      )}
      <div
        className={`absolute left-2 flex items-center gap-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm ${
          isMainStage ? "bottom-4 text-base" : "bottom-2 text-xs"
        }`}
      >
        {!isScreenSharing && (
          <div
            className={`rounded-full ${
              mediaStatus?.audio ? "bg-green-500 animate-pulse" : "bg-red-500"
            } w-2 h-2`}
          ></div>
        )}
        <span className="text-white font-medium truncate max-w-[150px]">
          {username} {isLocal && "(You)"}
        </span>
        {isScreenSharing && (
          <span className="bg-white text-blue-600 text-[10px] px-1 rounded font-bold">
            SCREEN
          </span>
        )}
      </div>
    </div>
  );
};

const stunServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// --- COMPONENT CHÍNH ---
const ClassRoom = ({ user, courseId, onLeave }) => {
  const [joined, setJoined] = useState(false);
  const username = user.name;
  const roomId = `course-${courseId}`;

  const [peers, setPeers] = useState([]);
  const [userStream, setUserStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  const [pinnedPeerID, setPinnedPeerID] = useState(null);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

  // State mic/cam
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const socketRef = useRef();
  const peersRef = useRef([]);
  const userStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    joinRoom();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (userStreamRef.current)
        userStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current)
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line
  }, []);

  const joinRoom = () => {
    if (socketRef.current) socketRef.current.disconnect();

    socketRef.current = io.connect("http://localhost:3001");

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
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
          if (!item && payload.isScreen) {
            item = peersRef.current.find(
              (p) => p.peerID === payload.id + "_screen_sender"
            );
          }
          if (item) handleSignal(item.peer, payload.signal);
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

        socketRef.current.on("user_stopped_screen", (userId) => {
          const screenID = userId + "_screen";
          const p = peersRef.current.find((x) => x.peerID === screenID);
          if (p) p.peer.close();
          peersRef.current = peersRef.current.filter(
            (p) => p.peerID !== screenID
          );
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
      if (!isScreen) {
        setPeers((prev) =>
          prev.map((p) =>
            p.peerID === userToSignal ? { ...p, stream: e.streams[0] } : p
          )
        );
      }
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
    if (signal.type === "sdp") {
      if (signal.sdp.type === "answer") {
        if (peer.signalingState === "stable") return;
      }
      await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      while (peer.iceQueue.length > 0)
        await peer.addIceCandidate(new RTCIceCandidate(peer.iceQueue.shift()));
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
  };

  // --- FIX: TOGGLE MIC/CAM TRIỆT ĐỂ ---
  const toggleMic = () => {
    if (userStreamRef.current) {
      const newStatus = !isMicOn;
      // Duyệt qua TẤT CẢ các track audio để tắt
      userStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = newStatus;
      });
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
      // Duyệt qua TẤT CẢ các track video để tắt
      userStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = newStatus;
      });
      setIsCameraOn(newStatus);
      socketRef.current.emit("media_status_change", {
        video: newStatus,
        audio: isMicOn,
      });
    }
  };

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          cursor: true,
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
        stream.getVideoTracks()[0].onended = stopScreenShare;
      } catch (e) {
        console.error(e);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current)
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    setPinnedPeerID(null);
    peersRef.current.forEach((p) => {
      if (p.isSender) p.peer.close();
    });
    peersRef.current = peersRef.current.filter((p) => !p.isSender);
    if (socketRef.current) socketRef.current.emit("stop_screen_share");
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
          onClick={onLeave}
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full font-bold ml-4 shadow-lg transition"
        >
          Rời lớp
        </button>
      </div>
    </div>
  );
};

export default ClassRoom;
