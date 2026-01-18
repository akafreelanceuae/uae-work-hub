/**
 * Socket.IO Service
 * Real-time communication for video conferencing, meetings, and collaboration
 */

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getSession } from './redis-client.js';

// Socket event types
export enum SocketEvent {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  
  // Meeting events
  MEETING_JOIN = 'meeting:join',
  MEETING_LEAVE = 'meeting:leave',
  MEETING_START = 'meeting:start',
  MEETING_END = 'meeting:end',
  MEETING_UPDATE = 'meeting:update',
  
  // Video conferencing events
  VIDEO_OFFER = 'video:offer',
  VIDEO_ANSWER = 'video:answer',
  VIDEO_ICE_CANDIDATE = 'video:ice-candidate',
  VIDEO_TOGGLE = 'video:toggle',
  AUDIO_TOGGLE = 'audio:toggle',
  SCREEN_SHARE_START = 'screen:share:start',
  SCREEN_SHARE_STOP = 'screen:share:stop',
  
  // Transcription events
  TRANSCRIPTION_START = 'transcription:start',
  TRANSCRIPTION_STOP = 'transcription:stop',
  TRANSCRIPTION_SEGMENT = 'transcription:segment',
  TRANSCRIPTION_FINAL = 'transcription:final',
  
  // Chat events
  CHAT_MESSAGE = 'chat:message',
  CHAT_TYPING = 'chat:typing',
  CHAT_STOP_TYPING = 'chat:stop_typing',
  
  // Cultural events
  PRAYER_TIME_ALERT = 'cultural:prayer_alert',
  RAMADAN_REMINDER = 'cultural:ramadan_reminder',
  
  // Collaboration events
  CURSOR_POSITION = 'collab:cursor',
  DOCUMENT_EDIT = 'collab:edit',
  WHITEBOARD_DRAW = 'whiteboard:draw',
  
  // System events
  USER_PRESENCE = 'user:presence',
  NOTIFICATION = 'notification'
}

// Interface for authenticated socket
interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
  sessionId?: string;
  meetingRooms?: Set<string>;
}

// Meeting room state
interface MeetingRoom {
  id: string;
  participants: Map<string, {
    userId: string;
    socketId: string;
    name: string;
    isHost: boolean;
    videoEnabled: boolean;
    audioEnabled: boolean;
    screenSharing: boolean;
    joinedAt: Date;
    culturalPreferences?: any;
  }>;
  isRecording: boolean;
  transcriptionEnabled: boolean;
  currentLanguage: 'ar' | 'en';
  prayerTimeAlerts: boolean;
}

// Store active meeting rooms
const meetingRooms = new Map<string, MeetingRoom>();
const userConnections = new Map<string, string>(); // userId -> socketId

/**
 * Configure Socket.IO event handlers
 */
export function configureSocketHandlers(io: Server): void {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Verify session in Redis
      const sessionData = await getSession(decoded.sessionId);
      if (!sessionData) {
        return next(new Error('Invalid or expired session'));
      }
      
      // Get user from database
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }
      
      // Attach user data to socket
      socket.userId = user._id.toString();
      socket.user = user;
      socket.sessionId = decoded.sessionId;
      socket.meetingRooms = new Set();
      
      console.log(`🔌 Socket authenticated: ${user.email} (${socket.id})`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });
  
  // Handle connections
  io.on(SocketEvent.CONNECTION, (socket: AuthenticatedSocket) => {
    console.log(`✅ User connected: ${socket.user?.email} (${socket.id})`);
    
    // Store user connection
    userConnections.set(socket.userId!, socket.id);
    
    // Set user online status
    socket.broadcast.emit(SocketEvent.USER_PRESENCE, {
      userId: socket.userId,
      status: 'online',
      timestamp: new Date().toISOString()
    });
    
    // Handle meeting join
    socket.on(SocketEvent.MEETING_JOIN, async (data: {
      meetingId: string;
      isHost?: boolean;
      videoEnabled?: boolean;
      audioEnabled?: boolean;
    }) => {
      try {
        await handleMeetingJoin(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join meeting', error });
      }
    });
    
    // Handle meeting leave
    socket.on(SocketEvent.MEETING_LEAVE, async (data: { meetingId: string }) => {
      try {
        await handleMeetingLeave(socket, data.meetingId);
      } catch (error) {
        socket.emit('error', { message: 'Failed to leave meeting', error });
      }
    });
    
    // Handle video/audio controls
    socket.on(SocketEvent.VIDEO_TOGGLE, (data: { meetingId: string; enabled: boolean }) => {
      handleVideoToggle(socket, data);
    });
    
    socket.on(SocketEvent.AUDIO_TOGGLE, (data: { meetingId: string; enabled: boolean }) => {
      handleAudioToggle(socket, data);
    });
    
    // Handle WebRTC signaling
    socket.on(SocketEvent.VIDEO_OFFER, (data: { meetingId: string; to: string; offer: any }) => {
      handleWebRTCSignaling(socket, SocketEvent.VIDEO_OFFER, data);
    });
    
    socket.on(SocketEvent.VIDEO_ANSWER, (data: { meetingId: string; to: string; answer: any }) => {
      handleWebRTCSignaling(socket, SocketEvent.VIDEO_ANSWER, data);
    });
    
    socket.on(SocketEvent.VIDEO_ICE_CANDIDATE, (data: { meetingId: string; to: string; candidate: any }) => {
      handleWebRTCSignaling(socket, SocketEvent.VIDEO_ICE_CANDIDATE, data);
    });
    
    // Handle screen sharing
    socket.on(SocketEvent.SCREEN_SHARE_START, (data: { meetingId: string }) => {
      handleScreenShare(socket, data.meetingId, true);
    });
    
    socket.on(SocketEvent.SCREEN_SHARE_STOP, (data: { meetingId: string }) => {
      handleScreenShare(socket, data.meetingId, false);
    });
    
    // Handle transcription
    socket.on(SocketEvent.TRANSCRIPTION_START, (data: { meetingId: string; language: 'ar' | 'en' }) => {
      handleTranscriptionStart(socket, data);
    });
    
    socket.on(SocketEvent.TRANSCRIPTION_STOP, (data: { meetingId: string }) => {
      handleTranscriptionStop(socket, data.meetingId);
    });
    
    socket.on(SocketEvent.TRANSCRIPTION_SEGMENT, (data: { meetingId: string; segment: any }) => {
      handleTranscriptionSegment(socket, data);
    });
    
    // Handle chat messages
    socket.on(SocketEvent.CHAT_MESSAGE, (data: {
      meetingId: string;
      message: string;
      language?: 'ar' | 'en';
      timestamp?: string;
    }) => {
      handleChatMessage(socket, data);
    });
    
    socket.on(SocketEvent.CHAT_TYPING, (data: { meetingId: string; isTyping: boolean }) => {
      handleChatTyping(socket, data);
    });
    
    // Handle collaboration features
    socket.on(SocketEvent.CURSOR_POSITION, (data: { meetingId: string; x: number; y: number }) => {
      handleCursorPosition(socket, data);
    });
    
    socket.on(SocketEvent.WHITEBOARD_DRAW, (data: { meetingId: string; drawingData: any }) => {
      handleWhiteboardDraw(socket, data);
    });
    
    // Handle cultural features
    socket.on(SocketEvent.PRAYER_TIME_ALERT, (data: { meetingId: string; prayerTime: string }) => {
      handlePrayerTimeAlert(socket, data);
    });
    
    // Handle disconnection
    socket.on(SocketEvent.DISCONNECT, () => {
      handleDisconnect(socket);
    });
  });
}

/**
 * Handle user joining a meeting
 */
async function handleMeetingJoin(
  socket: AuthenticatedSocket, 
  data: { meetingId: string; isHost?: boolean; videoEnabled?: boolean; audioEnabled?: boolean }
): Promise<void> {
  const { meetingId, isHost = false, videoEnabled = true, audioEnabled = true } = data;
  
  // Join the socket room
  await socket.join(meetingId);
  socket.meetingRooms!.add(meetingId);
  
  // Initialize meeting room if it doesn't exist
  if (!meetingRooms.has(meetingId)) {
    meetingRooms.set(meetingId, {
      id: meetingId,
      participants: new Map(),
      isRecording: false,
      transcriptionEnabled: false,
      currentLanguage: socket.user.profile.preferredLanguage || 'en',
      prayerTimeAlerts: socket.user.profile.culturalPreferences?.prayerTimeAlerts || false
    });
  }
  
  const room = meetingRooms.get(meetingId)!;
  
  // Add participant to room
  room.participants.set(socket.userId!, {
    userId: socket.userId!,
    socketId: socket.id,
    name: socket.user.getDisplayName(),
    isHost,
    videoEnabled,
    audioEnabled,
    screenSharing: false,
    joinedAt: new Date(),
    culturalPreferences: socket.user.profile.culturalPreferences
  });
  
  // Notify other participants
  socket.to(meetingId).emit(SocketEvent.MEETING_JOIN, {
    participant: {
      userId: socket.userId,
      name: socket.user.getDisplayName(),
      isHost,
      videoEnabled,
      audioEnabled,
      joinedAt: new Date()
    },
    totalParticipants: room.participants.size
  });
  
  // Send current participants list to new user
  const participantsList = Array.from(room.participants.values()).map(p => ({
    userId: p.userId,
    name: p.name,
    isHost: p.isHost,
    videoEnabled: p.videoEnabled,
    audioEnabled: p.audioEnabled,
    screenSharing: p.screenSharing,
    joinedAt: p.joinedAt
  }));
  
  socket.emit(SocketEvent.MEETING_UPDATE, {
    meetingId,
    participants: participantsList,
    transcriptionEnabled: room.transcriptionEnabled,
    currentLanguage: room.currentLanguage,
    prayerTimeAlerts: room.prayerTimeAlerts
  });
  
  console.log(`👥 User ${socket.user.email} joined meeting ${meetingId}`);
}

/**
 * Handle user leaving a meeting
 */
async function handleMeetingLeave(socket: AuthenticatedSocket, meetingId: string): Promise<void> {
  if (!socket.meetingRooms!.has(meetingId)) {
    return;
  }
  
  // Leave the socket room
  await socket.leave(meetingId);
  socket.meetingRooms!.delete(meetingId);
  
  const room = meetingRooms.get(meetingId);
  if (room) {
    // Remove participant from room
    room.participants.delete(socket.userId!);
    
    // Notify other participants
    socket.to(meetingId).emit(SocketEvent.MEETING_LEAVE, {
      userId: socket.userId,
      totalParticipants: room.participants.size
    });
    
    // Clean up empty rooms
    if (room.participants.size === 0) {
      meetingRooms.delete(meetingId);
      console.log(`🧹 Cleaned up empty meeting room: ${meetingId}`);
    }
  }
  
  console.log(`👋 User ${socket.user.email} left meeting ${meetingId}`);
}

/**
 * Handle video toggle
 */
function handleVideoToggle(socket: AuthenticatedSocket, data: { meetingId: string; enabled: boolean }): void {
  const room = meetingRooms.get(data.meetingId);
  if (room && room.participants.has(socket.userId!)) {
    const participant = room.participants.get(socket.userId!)!;
    participant.videoEnabled = data.enabled;
    
    // Notify other participants
    socket.to(data.meetingId).emit(SocketEvent.VIDEO_TOGGLE, {
      userId: socket.userId,
      enabled: data.enabled
    });
  }
}

/**
 * Handle audio toggle
 */
function handleAudioToggle(socket: AuthenticatedSocket, data: { meetingId: string; enabled: boolean }): void {
  const room = meetingRooms.get(data.meetingId);
  if (room && room.participants.has(socket.userId!)) {
    const participant = room.participants.get(socket.userId!)!;
    participant.audioEnabled = data.enabled;
    
    // Notify other participants
    socket.to(data.meetingId).emit(SocketEvent.AUDIO_TOGGLE, {
      userId: socket.userId,
      enabled: data.enabled
    });
  }
}

/**
 * Handle WebRTC signaling
 */
function handleWebRTCSignaling(
  socket: AuthenticatedSocket, 
  event: SocketEvent, 
  data: { meetingId: string; to: string; offer?: any; answer?: any; candidate?: any }
): void {
  const targetSocketId = userConnections.get(data.to);
  if (targetSocketId) {
    socket.to(targetSocketId).emit(event, {
      from: socket.userId,
      ...data
    });
  }
}

/**
 * Handle screen sharing
 */
function handleScreenShare(socket: AuthenticatedSocket, meetingId: string, isSharing: boolean): void {
  const room = meetingRooms.get(meetingId);
  if (room && room.participants.has(socket.userId!)) {
    const participant = room.participants.get(socket.userId!)!;
    participant.screenSharing = isSharing;
    
    // Notify other participants
    const event = isSharing ? SocketEvent.SCREEN_SHARE_START : SocketEvent.SCREEN_SHARE_STOP;
    socket.to(meetingId).emit(event, {
      userId: socket.userId,
      name: participant.name
    });
  }
}

/**
 * Handle transcription start
 */
function handleTranscriptionStart(socket: AuthenticatedSocket, data: { meetingId: string; language: 'ar' | 'en' }): void {
  const room = meetingRooms.get(data.meetingId);
  if (room) {
    room.transcriptionEnabled = true;
    room.currentLanguage = data.language;
    
    // Notify all participants
    socket.to(data.meetingId).emit(SocketEvent.TRANSCRIPTION_START, {
      language: data.language,
      startedBy: socket.user.getDisplayName()
    });
    
    console.log(`📝 Transcription started for meeting ${data.meetingId} in ${data.language}`);
  }
}

/**
 * Handle transcription stop
 */
function handleTranscriptionStop(socket: AuthenticatedSocket, meetingId: string): void {
  const room = meetingRooms.get(meetingId);
  if (room) {
    room.transcriptionEnabled = false;
    
    // Notify all participants
    socket.to(meetingId).emit(SocketEvent.TRANSCRIPTION_STOP, {
      stoppedBy: socket.user.getDisplayName()
    });
    
    console.log(`📝 Transcription stopped for meeting ${meetingId}`);
  }
}

/**
 * Handle transcription segment
 */
function handleTranscriptionSegment(socket: AuthenticatedSocket, data: { meetingId: string; segment: any }): void {
  // Broadcast transcription segment to all meeting participants
  socket.to(data.meetingId).emit(SocketEvent.TRANSCRIPTION_SEGMENT, {
    segment: data.segment,
    timestamp: new Date().toISOString(),
    speakerId: socket.userId,
    speakerName: socket.user.getDisplayName()
  });
}

/**
 * Handle chat messages
 */
function handleChatMessage(socket: AuthenticatedSocket, data: {
  meetingId: string;
  message: string;
  language?: 'ar' | 'en';
  timestamp?: string;
}): void {
  // Broadcast message to meeting participants
  socket.to(data.meetingId).emit(SocketEvent.CHAT_MESSAGE, {
    id: `msg_${Date.now()}_${socket.userId}`,
    message: data.message,
    language: data.language || 'en',
    timestamp: data.timestamp || new Date().toISOString(),
    sender: {
      id: socket.userId,
      name: socket.user.getDisplayName(),
      avatar: socket.user.profile.avatar
    }
  });
}

/**
 * Handle chat typing indicators
 */
function handleChatTyping(socket: AuthenticatedSocket, data: { meetingId: string; isTyping: boolean }): void {
  const event = data.isTyping ? SocketEvent.CHAT_TYPING : SocketEvent.CHAT_STOP_TYPING;
  socket.to(data.meetingId).emit(event, {
    userId: socket.userId,
    name: socket.user.getDisplayName()
  });
}

/**
 * Handle cursor position for collaboration
 */
function handleCursorPosition(socket: AuthenticatedSocket, data: { meetingId: string; x: number; y: number }): void {
  socket.to(data.meetingId).emit(SocketEvent.CURSOR_POSITION, {
    userId: socket.userId,
    name: socket.user.getDisplayName(),
    x: data.x,
    y: data.y,
    timestamp: Date.now()
  });
}

/**
 * Handle whiteboard drawing
 */
function handleWhiteboardDraw(socket: AuthenticatedSocket, data: { meetingId: string; drawingData: any }): void {
  socket.to(data.meetingId).emit(SocketEvent.WHITEBOARD_DRAW, {
    userId: socket.userId,
    drawingData: data.drawingData,
    timestamp: Date.now()
  });
}

/**
 * Handle prayer time alerts
 */
function handlePrayerTimeAlert(socket: AuthenticatedSocket, data: { meetingId: string; prayerTime: string }): void {
  const room = meetingRooms.get(data.meetingId);
  if (room && room.prayerTimeAlerts) {
    // Send alert to participants who have prayer time alerts enabled
    room.participants.forEach((participant) => {
      if (participant.culturalPreferences?.prayerTimeAlerts) {
        const targetSocketId = userConnections.get(participant.userId);
        if (targetSocketId) {
          socket.to(targetSocketId).emit(SocketEvent.PRAYER_TIME_ALERT, {
            prayerTime: data.prayerTime,
            message: `Prayer time (${data.prayerTime}) is approaching`,
            messageAr: `حان وقت صلاة ${data.prayerTime}`
          });
        }
      }
    });
  }
}

/**
 * Handle user disconnection
 */
function handleDisconnect(socket: AuthenticatedSocket): void {
  console.log(`❌ User disconnected: ${socket.user?.email} (${socket.id})`);
  
  // Remove user from connection map
  if (socket.userId) {
    userConnections.delete(socket.userId);
  }
  
  // Leave all meeting rooms
  if (socket.meetingRooms) {
    socket.meetingRooms.forEach(meetingId => {
      handleMeetingLeave(socket, meetingId);
    });
  }
  
  // Set user offline status
  socket.broadcast.emit(SocketEvent.USER_PRESENCE, {
    userId: socket.userId,
    status: 'offline',
    timestamp: new Date().toISOString()
  });
}

/**
 * Send notification to specific user
 */
export function sendNotificationToUser(userId: string, notification: any): void {
  const socketId = userConnections.get(userId);
  if (socketId) {
    // Assuming we have access to the io instance
    // In practice, you'd need to store the io instance globally or pass it as parameter
    console.log(`📬 Sending notification to user ${userId}:`, notification);
  }
}

/**
 * Send notification to meeting room
 */
export function sendNotificationToMeeting(meetingId: string, notification: any): void {
  const room = meetingRooms.get(meetingId);
  if (room) {
    console.log(`📬 Sending notification to meeting ${meetingId}:`, notification);
    // In practice, you'd emit to the room
  }
}

/**
 * Get meeting room status
 */
export function getMeetingRoomStatus(meetingId: string) {
  const room = meetingRooms.get(meetingId);
  if (!room) return null;
  
  return {
    id: room.id,
    participantCount: room.participants.size,
    isRecording: room.isRecording,
    transcriptionEnabled: room.transcriptionEnabled,
    currentLanguage: room.currentLanguage,
    prayerTimeAlerts: room.prayerTimeAlerts,
    participants: Array.from(room.participants.values()).map(p => ({
      userId: p.userId,
      name: p.name,
      isHost: p.isHost,
      videoEnabled: p.videoEnabled,
      audioEnabled: p.audioEnabled,
      screenSharing: p.screenSharing,
      joinedAt: p.joinedAt
    }))
  };
}