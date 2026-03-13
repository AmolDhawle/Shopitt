'use client';

import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import Box from '../box';
import { Sidebar } from './sidebar.styles';
import Link from 'next/link';
import SidebarItem from './sidebar.item';
import {
  Bell,
  Calendar,
  FileClock,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  PackageSearch,
  PencilRuler,
  Settings,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import SidebarMenu from './sidebar.menu';
import Logo from '../../../app/assets/images/logo.png';
import Image from 'next/image';
import useSidebar from 'apps/admin-ui/src/hooks/useSidebar';
import useAdmin from 'apps/admin-ui/src/hooks/useAdmin';

const SidebarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { admin } = useAdmin();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const getIconColor = (route: string) =>
    activeSidebar === route ? '#0085ff' : '#969696';

  return (
    <Box
      css={{
        height: '100vh',
        zIndex: 300,
        position: 'sticky',
        padding: '8px',
        top: '0',
        overflowY: 'scroll',
        scrollbarWidth: 'none',
      }}
      className="sidebar-wrapper"
    >
      <Sidebar.Header>
        <Box>
          <Link
            href="/"
            className="flex flex-col justify-center items-center text-center gap-2"
          >
            <Image src={Logo} alt="Shopitt Logo" width={160} height={160} />

            <Box>
              <h3 className="text-xl font-medium text-[#ecedee]">
                {admin?.name}
              </h3>
              <h5 className="font-medium text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]">
                {admin?.email}
              </h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>
      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            title="Dashboard"
            icon={<LayoutDashboard />}
            isActive={activeSidebar === '/dashboard'}
            href="/dashboard"
          />
          <div className="mt-2 block">
            <SidebarMenu title="Main menu">
              <SidebarItem
                title="Orders"
                isActive={activeSidebar === '/dashboard/orders'}
                href="/dashboard/orders"
                icon={
                  <ListOrdered
                    size={24}
                    color={getIconColor('/dashboard/orders')}
                  />
                }
              />
              <SidebarItem
                title="Payments"
                isActive={activeSidebar === '/dashboard/payments'}
                href="/dashboard/payments"
                icon={
                  <Wallet
                    size={24}
                    color={getIconColor('/dashboard/payments')}
                  />
                }
              />
              <SidebarItem
                title="All Products"
                isActive={activeSidebar === '/dashboard/all-products'}
                href="/dashboard/all-products"
                icon={
                  <PackageSearch
                    size={24}
                    color={getIconColor('/dashboard/all-products')}
                  />
                }
              />
              <SidebarItem
                title="All Events"
                isActive={activeSidebar === '/dashboard/events'}
                href="/dashboard/events"
                icon={
                  <Calendar
                    size={24}
                    color={getIconColor('/dashboard/events')}
                  />
                }
              />
              <SidebarItem
                title="Users"
                isActive={activeSidebar === '/dashboard/users'}
                href="/dashboard/users"
                icon={
                  <Users size={24} color={getIconColor('/dashboard/users')} />
                }
              />
              <SidebarItem
                title="Sellers"
                isActive={activeSidebar === '/dashboard/sellers'}
                href="/dashboard/sellers"
                icon={
                  <Store size={24} color={getIconColor('/dashboard/users')} />
                }
              />
            </SidebarMenu>

            <SidebarMenu title="Controllers">
              <SidebarItem
                isActive={activeSidebar === '/dashboard/loggers'}
                title="Loggers"
                href="/dashboard/loggers"
                icon={
                  <FileClock
                    size={24}
                    color={getIconColor('/dashboard/loggers')}
                  />
                }
              />

              <SidebarItem
                title="Management"
                isActive={activeSidebar === '/dashboard/management'}
                href="/dashboard/management"
                icon={
                  <Settings
                    size={24}
                    color={getIconColor('/dashboard/management')}
                  />
                }
              />
              <SidebarItem
                title="Notifications"
                isActive={activeSidebar === '/dashboard/notifications'}
                href="/dashboard/notifications"
                icon={
                  <Bell
                    size={24}
                    color={getIconColor('/dashboard/notifications')}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title="Customization">
              <SidebarItem
                isActive={activeSidebar === '/dashboard/customization'}
                title="All Customization"
                href="/dashboard/customization"
                icon={
                  <PencilRuler
                    size={24}
                    color={getIconColor('/dashboard/customization')}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title="Extras">
              <SidebarItem
                isActive={activeSidebar === '/dashboard/logout'}
                title="Logout"
                href="/dashboard/logout"
                icon={
                  <LogOut size={24} color={getIconColor('/dashboard/logout')} />
                }
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SidebarWrapper;
