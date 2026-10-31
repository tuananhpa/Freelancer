import React from 'react';

import { NavLink, Outlet } from 'react-router-dom';

import { User, Palette, Lock, ClipboardList, GraduationCap, BookOpen, Settings, HelpCircle } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

import UserAvatar from '../../components/common/UserAvatar';



import PageHeader from '../../components/ui/PageHeader';
import { UserRound } from 'lucide-react';
const navItems = [

  { to: '/profile', label: 'Hồ sơ cá nhân', icon: User, end: true },

  { to: '/profile/appearance', label: 'Giao diện & Theme', icon: Palette },

  { to: '/profile/security', label: 'Bảo mật', icon: Lock },

  { to: '/profile/history', label: 'Lịch sử hoạt động', icon: ClipboardList },

  { to: '/profile/certificates', label: 'Chứng chỉ', icon: GraduationCap },

];



const roleLabels: Record<string, { label: string; icon: React.ElementType }> = {

  TEACHER: { label: 'Giáo viên', icon: BookOpen },

  STUDENT: { label: 'Học viên', icon: GraduationCap },

  ADMIN: { label: 'Quản trị', icon: Settings },

  UNASSIGNED: { label: 'Chưa chọn vai trò', icon: HelpCircle },

};



const ProfileLayout = () => {

  const { user } = useAuth();

  const role = roleLabels[user?.role || 'UNASSIGNED'];

  const RoleIcon = role.icon;



  return (

    <div className="animate-fade-in">

      <div className="mb-8">

        <PageHeader icon={UserRound} title="Hồ sơ cá nhân" subtitle="Quản lý thông tin tài khoản và cài đặt bảo mật" />

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        <aside className="lg:col-span-1">

          <div className="card !p-0 overflow-hidden sticky top-24">

            <div className="relative px-5 py-6 border-b border-cam/10 dark:border-night-border overflow-hidden">

              <div

                className="absolute inset-0 bg-accent-soft dark:bg-accent-soft pointer-events-none"

                aria-hidden

              />

              <div className="relative flex flex-col items-center text-center">

                <UserAvatar

                  fullName={user?.fullName || 'Người dùng'}

                  avatarUrl={user?.avatarUrl}

                  size="lg"

                />

                <p className="font-bold text-vutru mt-3 truncate w-full">{user?.fullName}</p>

                <p className="text-xs text-vutruNhat truncate w-full">{user?.email}</p>

                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-highlight text-accent-dark">

                  <RoleIcon size={12} strokeWidth={2.5} />

                  {role.label}

                </span>

              </div>

            </div>



            <nav className="py-2">

              {navItems.map((item) => {

                const Icon = item.icon;

                return (

                  <NavLink

                    key={item.to}

                    to={item.to}

                    end={item.end}

                    className={({ isActive }) =>

                      `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${

                        isActive

                          ? 'bg-accent-soft text-accent-dark border-r-4 border-accent-secondary dark:text-accent'

                          : 'text-vutruNhat hover:bg-kem/80 hover:text-accent dark:hover:bg-night-elevated'

                      }`

                    }

                  >

                    <Icon size={18} strokeWidth={2} className="shrink-0" />

                    {item.label}

                  </NavLink>

                );

              })}

            </nav>

          </div>

        </aside>



        <div className="lg:col-span-3">

          <Outlet />

        </div>

      </div>

    </div>

  );

};



export default ProfileLayout;

