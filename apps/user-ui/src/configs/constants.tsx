export const navItems: NavItemsTypes[] = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Products',
    href: '/products',
  },
  {
    title: 'Shops',
    href: '/shops',
  },
  {
    title: 'Offers',
    href: '/offers',
  },
  {
    title: 'Become a seller',
    href: `${process.env.NEXT_PUBLIC_SELLER_SERVER_URI}/signup`,
  },
];
