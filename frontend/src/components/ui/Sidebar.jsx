import React from "react";
import {
  Search,
  Paperclip,
  Heart,
  Bookmark,
  History,
  Wind,
  Dumbbell,
  BookOpen,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from "lucide-react";

const Sidebar = ({
  setShowModal,
  startNewChat,
  sidebarCollapsed,
  setSidebarCollapsed,
  currentUser,        // ADD THIS PROP
  onLogout            // ADD THIS PROP
}) => {
  const navigation = [
    { label: "New Chat", icon: <Paperclip className="w-5 h-5" />, onClick: startNewChat },
    { label: "Saved Messages", icon: <Bookmark className="w-5 h-5" />, onClick: () => setShowModal("saved") },
    { label: "Chat History", icon: <History className="w-5 h-5" />, onClick: () => setShowModal("history") },
    { label: "Mood Tracker", icon: <Heart className="w-5 h-5" />, onClick: () => setShowModal("mood") },
    { label: "Breathing", icon: <Wind className="w-5 h-5" />, onClick: () => setShowModal("breathing") },
    { label: "Exercise", icon: <Dumbbell className="w-5 h-5" />, onClick: () => setShowModal("exercise") },
    { label: "Resources", icon: <BookOpen className="w-5 h-5" />, onClick: () => setShowModal("resources") },
    { label: "Games", icon: <Gamepad2 className="w-5 h-5" />, onClick: () => setShowModal("games") }
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    if (currentUser?.name) {
      return currentUser.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <aside
      className={sidebarCollapsed
        ? "w-20 bg-white dark:bg-[#181920] min-h-screen flex flex-col border-r border-gray-200 dark:border-gray-700 shadow-sm relative"
        : "w-64 bg-white dark:bg-[#181920] min-h-screen flex flex-col border-r border-gray-200 dark:border-gray-700 shadow-sm relative"
      }
      style={{ transition: "width 0.2s" }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute top-6 right-[-14px] w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#181920] shadow flex items-center justify-center"
        style={{ zIndex: 10 }}
        aria-label="Sidebar toggle"
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ?
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-300" />
          : <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-300" />
        }
      </button>

      {/* Logo and Title */}
      <div className={`flex items-center gap-3 px-6 py-6 ${sidebarCollapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
          <Heart className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && <span className="font-bold text-lg text-gray-800 dark:text-gray-100">NISRA</span>}
      </div>

      {/* Search Bar */}
      {!sidebarCollapsed && (
        <div className="px-6 mb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#22272f] rounded border border-gray-300 dark:border-gray-700">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search chats"
              className="bg-transparent w-full text-sm outline-none text-gray-700 dark:text-gray-200"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`${sidebarCollapsed ? "px-2" : "px-6"} flex-1 pt-2 space-y-2`}>
        {navigation.map(({ label, icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-200 font-medium transition hover:bg-gray-100 dark:hover:bg-[#22272f] rounded-lg`}
            style={{
              fontSize: "16px",
              justifyContent: sidebarCollapsed ? "center" : "flex-start"
            }}
            title={sidebarCollapsed ? label : undefined}
          >
            {icon}
            {!sidebarCollapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Profile Section - UPDATED */}
      <div className={`mt-auto ${sidebarCollapsed ? "px-2 py-6" : "px-6 py-6"} border-t border-gray-200 dark:border-gray-700 space-y-2`}>
        {/* User Info */}
        <div
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#22272f] ${sidebarCollapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center font-bold text-white text-sm">
            {getUserInitials()}
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col text-left flex-1 min-w-0">
              <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {currentUser?.name || currentUser?.email?.split('@')[0] || 'User'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentUser?.email || 'user@example.com'}
              </span>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition ${sidebarCollapsed ? "justify-center" : ""}`}
          title={sidebarCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;