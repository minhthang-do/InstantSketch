import React, { useState, useEffect } from 'react';
import type { UserProfile, FriendUser, FriendRequest } from '../types/sketch';
import { 
  getFriends, searchUsers, sendFriendRequest, 
  respondToFriendRequest, getIncomingRequests, 
  getActiveFriendId, setActiveFriendId, 
  subscribeToFriendSync, saveFriends
} from '../services/friendService';
import type { SearchUserResult } from '../services/friendService';
import { 
  X, Search, Users, UserPlus, Bell, Check, 
  Smartphone, Clock, HeartHandshake
} from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  activeFriend: FriendUser | null;
  onActiveFriendChange: (friend: FriendUser | null) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeFriend,
  onActiveFriendChange,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests'>('friends');
  const [friendsList, setFriendsList] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Load data
  const refreshData = () => {
    const friends = getFriends(currentUser.id);
    setFriendsList(friends);

    const reqs = getIncomingRequests(currentUser.id);
    setIncomingRequests(reqs);

    const activeId = getActiveFriendId(currentUser.id);
    const active = friends.find(f => f.id === activeId) || (friends.length > 0 ? friends[0] : null);
    onActiveFriendChange(active);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, currentUser.id]);

  // Subscribe to real-time sync across tabs
  useEffect(() => {
    const unsub = subscribeToFriendSync(() => {
      refreshData();
      if (searchQuery) {
        setSearchResults(searchUsers(searchQuery, currentUser));
      }
    });
    return () => unsub();
  }, [currentUser, searchQuery]);

  // Handle Search Input
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = searchUsers(query, currentUser);
    setSearchResults(results);
  };

  // Handle Send Friend Request
  const handleSendRequest = (targetUser: UserProfile) => {
    const res = sendFriendRequest(currentUser, targetUser);
    setFeedbackMsg({ text: res.message, isError: !res.success });
    setTimeout(() => setFeedbackMsg(null), 3000);
    // Refresh search results
    setSearchResults(searchUsers(searchQuery, currentUser));
  };

  // Handle Accept or Reject
  const handleRespondRequest = (requestId: string, action: 'accept' | 'reject') => {
    const res = respondToFriendRequest(requestId, action, currentUser);
    setFeedbackMsg({ text: res.message, isError: !res.success });
    setTimeout(() => setFeedbackMsg(null), 3000);
    refreshData();
    if (searchQuery) {
      setSearchResults(searchUsers(searchQuery, currentUser));
    }
  };

  // Handle Switch Active Widget Friend
  const handleSelectActiveFriend = (friend: FriendUser) => {
    setActiveFriendId(friend.id);
    onActiveFriendChange(friend);
    setFeedbackMsg({ text: `Đã chọn @${friend.username} làm Widget hiển thị chính!`, isError: false });
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Handle Unfriend
  const handleUnfriend = (friendId: string, username: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với @${username}?`)) {
      const updated = friendsList.filter(f => f.id !== friendId);
      saveFriends(currentUser.id, updated);
      refreshData();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Bạn Bè & Kết Bạn</h2>
              <p className="text-xs text-slate-400">Chỉ gửi và xem hình vẽ khi cả hai đã chấp nhận kết bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className={`px-5 py-2 text-xs font-semibold ${feedbackMsg.isError ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'} border-b border-slate-800`}>
            {feedbackMsg.text}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-5 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
          {/* Friends List Tab */}
          <button
            onClick={() => setActiveTab('friends')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'friends' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Bạn bè ({friendsList.length})</span>
            {activeTab === 'friends' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          {/* Search Strangers Tab */}
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'search' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tìm kiếm (@username)</span>
            {activeTab === 'search' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          {/* Pending Requests Tab */}
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'requests' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Lời mời</span>
            {incomingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
                {incomingRequests.length}
              </span>
            )}
            {activeTab === 'requests' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 1. FRIENDS LIST TAB */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {friendsList.length === 0 ? (
                <div className="py-12 text-center">
                  <UserPlus className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Bạn chưa có người bạn nào</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Hãy chuyển sang tab "Tìm kiếm" để tìm kiếm username của bạn bè và gửi lời mời kết bạn nhé!
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                  >
                    Tìm kiếm bạn bè ngay
                  </button>
                </div>
              ) : (
                friendsList.map((friend) => {
                  const isActive = activeFriend?.id === friend.id;
                  return (
                    <div
                      key={friend.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        isActive 
                          ? 'bg-indigo-950/50 border-indigo-500/60 shadow-lg shadow-indigo-500/10' 
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow">
                          {friend.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 text-sm">{friend.name}</span>
                            {isActive && (
                              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                                <Smartphone className="w-2.5 h-2.5" />
                                <span>Widget hiện tại</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">@{friend.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive ? (
                          <button
                            onClick={() => handleSelectActiveFriend(friend)}
                            className="px-3 py-1.5 bg-slate-700/80 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all"
                            title="Chọn bạn này để hiển thị trên Widget và gửi tranh vẽ"
                          >
                            Chọn vẽ
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleUnfriend(friend.id, friend.username)}
                          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Hủy kết bạn"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. SEARCH STRANGERS TAB */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tìm kiếm theo @username (VD: alex_art, linh_doodle, mai_cute)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Suggestions pill */}
              {!searchQuery && (
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
                  <span className="text-xs text-slate-400 block mb-2 font-medium">Gợi ý người dùng tìm thử:</span>
                  <div className="flex flex-wrap gap-2">
                    {['alex_art', 'linh_doodle', 'hoang_sketch', 'mai_cute'].map((sug) => (
                      <button
                        key={sug}
                        onClick={() => handleSearchChange(sug)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-indigo-300"
                      >
                        @{sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-2.5">
                {searchQuery && searchResults.length === 0 && (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    Không tìm thấy người dùng nào khớp với "<strong>{searchQuery}</strong>"
                  </div>
                )}

                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 text-xs">{user.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{user.username}</div>
                      </div>
                    </div>

                    {/* Relationship Action Button */}
                    <div>
                      {user.relationship === 'self' && (
                        <span className="text-[11px] text-slate-500 font-semibold px-2 py-1">Chính bạn</span>
                      )}

                      {user.relationship === 'friend' && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                          <Check className="w-3 h-3" />
                          <span>Bạn bè</span>
                        </span>
                      )}

                      {user.relationship === 'pending_outgoing' && (
                        <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Đã gửi (Chờ duyệt)</span>
                        </span>
                      )}

                      {user.relationship === 'pending_incoming' && user.requestId && (
                        <button
                          onClick={() => handleRespondRequest(user.requestId!, 'accept')}
                          className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                        >
                          Chấp nhận
                        </button>
                      )}

                      {user.relationship === 'none' && (
                        <button
                          onClick={() => handleSendRequest(user)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Kết bạn</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. PENDING REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {incomingRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Không có lời mời kết bạn nào</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Khi người khác tìm thấy @username của bạn và gửi kết bạn, yêu cầu sẽ xuất hiện tại đây để bạn bấm Chấp nhận!
                  </p>
                </div>
              ) : (
                incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-gradient-to-r from-pink-950/30 to-purple-950/30 border border-pink-500/30 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-2xl shadow">
                        {req.fromUserAvatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 text-xs">{req.fromUserName}</div>
                        <div className="text-[11px] text-pink-300 font-mono">@{req.fromUserUsername}</div>
                        <span className="text-[10px] text-slate-400">Muốn kết nối Widget cùng bạn</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondRequest(req.id, 'accept')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Chấp nhận</span>
                      </button>
                      <button
                        onClick={() => handleRespondRequest(req.id, 'reject')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
