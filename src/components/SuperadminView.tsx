import { useState, useEffect } from 'react';
import { adminService, type AdminUser, type AdminStats } from '../services/storage';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  BookOpen, 
  CheckSquare, 
  PlayCircle, 
  Key, 
  Trash2, 
  Edit, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw,
  UserCheck
} from 'lucide-react';
import clsx from 'clsx';

export function SuperadminView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit user form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled'>('active');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'שגיאה בטעינת נתוני הניהול' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      showNotification('error', 'שם משתמש וסיסמה הם שדות חובה');
      return;
    }

    setCreateLoading(true);
    try {
      await adminService.createUser({
        username: newUsername.trim().toLowerCase(),
        password: newPassword.trim(),
        displayName: newDisplayName.trim() || newUsername.trim(),
        role: newRole
      });
      showNotification('success', `המשתמש ${newUsername} נוצר בהצלחה!`);
      setIsCreateModalOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('user');
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'שגיאה ביצירת המשתמש');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditDisplayName(user.displayName);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditNewPassword('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    try {
      const updates: any = {
        displayName: editDisplayName.trim(),
        role: editRole,
        status: editStatus
      };
      if (editNewPassword.trim()) {
        updates.password = editNewPassword.trim();
      }

      await adminService.updateUser(editingUser.id, updates);
      showNotification('success', `פרטי המשתמש ${editingUser.username} עודכנו בהצלחה`);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'שגיאה בעדכון המשתמש');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await adminService.updateUser(user.id, { status: nextStatus });
      showNotification('success', `סטטוס המשתמש ${user.username} שונה ל-${nextStatus === 'active' ? 'פעיל' : 'מושבת'}`);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'שגיאה בעדכון סטטוס');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.username === 'adicore') {
      showNotification('error', 'לא ניתן למחוק את משתמש ה-Superadmin הראשי!');
      return;
    }

    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק את המשתמש "${user.displayName || user.username}"?\n\nפעולה זו תמחק לצמיתות את כל רשומות היומן (${user.stats.entries}), המשימות (${user.stats.tasks}) וסרטוני המדיה (${user.stats.media}) של דייר זה!`
    );

    if (!confirmed) return;

    try {
      await adminService.deleteUser(user.id);
      showNotification('success', `המשתמש ${user.username} וכל נתוניו נמחקו בהצלחה`);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'שגיאה במחיקת המשתמש');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-accent/15 text-accent">
              <ShieldCheck size={24} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              ניהול מערכת (Superadmin Portal)
            </h1>
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            ניהול מרובה דיירים (Multi-Tenant Architecture), הקצאת משתמשים ומעקב נתונים מבודד
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card text-foreground/70 hover:text-foreground hover:bg-border/30 transition-colors shadow-sm"
            title="רענן נתונים"
          >
            <RefreshCw size={18} className={clsx(loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-sm shadow-md shadow-accent/25 hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <UserPlus size={18} />
            <span>הוסף משתמש חדש</span>
          </button>
        </div>
      </div>

      {/* Notifications Alert */}
      {feedbackMessage && (
        <div className={clsx(
          "p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-medium animate-in fade-in duration-200 border",
          feedbackMessage.type === 'success' 
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400"
        )}>
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="p-1 hover:opacity-75">
            <X size={16} />
          </button>
        </div>
      )}

      {/* System Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-foreground/60 mb-2">
            <span className="text-xs font-semibold">סך הכל משתמשים</span>
            <Users size={18} className="text-accent" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {loading ? '...' : (stats?.totalUsers ?? 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-foreground/60 mb-2">
            <span className="text-xs font-semibold">משתמשים פעילים</span>
            <UserCheck size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {loading ? '...' : (stats?.activeUsers ?? 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-foreground/60 mb-2">
            <span className="text-xs font-semibold">רשומות יומן</span>
            <BookOpen size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {loading ? '...' : (stats?.totalEntries ?? 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-foreground/60 mb-2">
            <span className="text-xs font-semibold">משימות</span>
            <CheckSquare size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {loading ? '...' : (stats?.totalTasks ?? 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-foreground/60 mb-2">
            <span className="text-xs font-semibold">סרטוני מדיה</span>
            <PlayCircle size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {loading ? '...' : (stats?.totalMedia ?? 0)}
          </div>
        </div>
      </div>

      {/* Users Table & Management Section */}
      <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
        
        {/* Table Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-foreground">רשימת דיירים ומשתמשים</h2>
            <p className="text-xs text-foreground/60">ניהול גישה, איפוס סיסמאות ובקרה על משאבי הדייר</p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם או תפקיד..."
              className="w-full ps-9 pe-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <Search size={15} className="absolute inset-y-0 start-0 my-auto ms-3 text-foreground/40 pointer-events-none" />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-border/70">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-background/80 border-b border-border text-foreground/60 font-semibold">
              <tr>
                <th className="py-3 px-3.5 text-start">משתמש</th>
                <th className="py-3 px-3.5 text-start">הרשאה</th>
                <th className="py-3 px-3.5 text-start">סטטוס</th>
                <th className="py-3 px-3.5 text-start">נתוני דייר</th>
                <th className="py-3 px-3.5 text-start">הצטרף ב-</th>
                <th className="py-3 px-3.5 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground/50">
                    לא נמצאו משתמשים התואמים לחיפוש
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-border/20 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent font-bold flex items-center justify-center text-xs">
                          {user.displayName ? user.displayName[0].toUpperCase() : user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <span>{user.displayName}</span>
                            {user.username === 'adicore' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">ראשי</span>
                            )}
                          </div>
                          <div className="text-xs text-foreground/50 font-mono">@{user.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-3.5">
                      <span className={clsx(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                        user.role === 'superadmin' && "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
                        user.role === 'admin' && "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
                        user.role === 'user' && "bg-foreground/10 text-foreground/70 border border-border"
                      )}>
                        {user.role === 'superadmin' ? 'Superadmin' : user.role === 'admin' ? 'מנהל' : 'משתמש'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3.5">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={user.username === 'adicore'}
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                          user.status === 'active'
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                            : "bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25",
                          user.username === 'adicore' && "cursor-not-allowed opacity-80"
                        )}
                        title="לחץ לשינוי סטטוס"
                      >
                        {user.status === 'active' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>פעיל</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>מושבת</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Tenant Stats */}
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2.5 text-xs text-foreground/70">
                        <span title="רשומות יומן" className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border">
                          <BookOpen size={13} className="text-blue-500" />
                          <span className="font-bold">{user.stats?.entries ?? 0}</span>
                        </span>
                        <span title="משימות" className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border">
                          <CheckSquare size={13} className="text-amber-500" />
                          <span className="font-bold">{user.stats?.tasks ?? 0}</span>
                        </span>
                        <span title="סרטונים" className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border">
                          <PlayCircle size={13} className="text-purple-500" />
                          <span className="font-bold">{user.stats?.media ?? 0}</span>
                        </span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-3.5 text-xs text-foreground/60">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('he-IL') : '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 rounded-lg text-foreground/60 hover:text-accent hover:bg-accent/10 transition-colors"
                          title="ערוך משתמש / אפס סיסמה"
                        >
                          <Edit size={16} />
                        </button>
                        {user.username !== 'adicore' && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 rounded-lg text-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="מחק משתמש ונתונים"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* Modal 1: Create User */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <UserPlus className="text-accent" size={20} />
                <h3 className="font-bold text-foreground text-lg">הוספת דייר / משתמש חדש</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-border transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground/70">
                  שם משתמש (באנגלית, ייחודי) *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="לדוגמה: sarah_c"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground/70">
                  סיסמה ראשונית *
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="לדוגמה: Pass1234"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground/70">
                  שם תצוגה
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="לדוגמה: שרה כהן"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground/70">
                  סוג הרשאה
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="user">משתמש רגיל (דייר עצמאי)</option>
                  <option value="admin">מנהל (Admin)</option>
                  <option value="superadmin">מנהל על (Superadmin)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-border text-foreground/70 hover:bg-border/30 text-sm font-semibold transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-white text-sm font-bold shadow-md shadow-accent/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  {createLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>צור משתמש</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal 2: Edit User / Reset Password */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Edit className="text-accent" size={20} />
                <h3 className="font-bold text-foreground text-lg">עריכת משתמש: {editingUser.username}</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-border transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground/70">
                  שם תצוגה
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground/70">
                  הרשאה
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  disabled={editingUser.username === 'adicore'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="user">משתמש רגיל</option>
                  <option value="admin">מנהל (Admin)</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground/70">
                  סטטוס
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  disabled={editingUser.username === 'adicore'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="active">פעיל (Active)</option>
                  <option value="disabled">מושבת (Disabled)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-border space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                  <Key size={14} className="text-accent" />
                  <span>איפוס סיסמה (השאר ריק אם אינך רוצה לשנות)</span>
                </div>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="הזן סיסמה חדשה..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-border text-foreground/70 hover:bg-border/30 text-sm font-semibold transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-white text-sm font-bold shadow-md shadow-accent/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>שמור שינויים</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
