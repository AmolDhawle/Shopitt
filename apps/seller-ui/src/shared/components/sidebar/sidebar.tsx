'use client';

import useSeller from 'apps/seller-ui/src/hooks/useSeller';
import useSidebar from 'apps/seller-ui/src/hooks/useSidebar';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import Box from '../box';
import { Sidebar } from './sidebar.styles';
import Link from 'next/link';
import SidebarItem from './sidebar.item';
import {
  Bell,
  Calendar,
  CalendarPlus,
  Home,
  ListOrdered,
  LogOut,
  Mail,
  PackageSearch,
  Settings,
  SquarePlus,
  TicketPercent,
  Wallet,
} from 'lucide-react';
import SidebarMenu from './sidebar.menu';
import Logo from '../../../assets/images/image.png';
import Image from 'next/image';

const SidebarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { seller } = useSeller();
  console.log('Seller', seller);

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
            href="/dashboard"
            className="flex flex-col justify-center items-center text-center gap-2"
          >
            <Image src={Logo} alt="Shopitt Logo" width={160} height={160} />

            <Box>
              <h3 className="text-xl font-medium text-[#ecedee]">
                {seller?.shop?.name}
              </h3>
              <h5 className="font-medium text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]">
                {seller?.shop?.address}
              </h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>
      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            title="Dashboard"
            icon={<Home />}
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
            </SidebarMenu>
            <SidebarMenu title="Products">
              <SidebarItem
                title="Create Product"
                isActive={activeSidebar === '/dashboard/create-product'}
                href="/dashboard/create-product"
                icon={
                  <SquarePlus
                    size={24}
                    color={getIconColor('/dashboard/create-product')}
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
            </SidebarMenu>
            <SidebarMenu title="Events">
              <SidebarItem
                isActive={activeSidebar === '/dashboard/create-event'}
                title="Create Event"
                href="/dashboard/create-event"
                icon={
                  <CalendarPlus
                    size={24}
                    color={getIconColor('/dashboard/create-event')}
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
            </SidebarMenu>
            <SidebarMenu title="Controllers">
              <SidebarItem
                isActive={activeSidebar === '/dashboard/inbox'}
                title="Inbox"
                href="/dashboard/inbox"
                icon={
                  <Mail size={24} color={getIconColor('/dashboard/inbox')} />
                }
              />
              <SidebarItem
                title="Settings"
                isActive={activeSidebar === '/dashboard/settings'}
                href="/dashboard/settings"
                icon={
                  <Settings
                    size={24}
                    color={getIconColor('/dashboard/settings')}
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
            <SidebarMenu title="Extras">
              <SidebarItem
                isActive={activeSidebar === '/dashboard/discount-codes'}
                title="Discount Codes"
                href="/dashboard/discount-codes"
                icon={
                  <TicketPercent
                    size={24}
                    color={getIconColor('/dashboard/discount-codes')}
                  />
                }
              />
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
