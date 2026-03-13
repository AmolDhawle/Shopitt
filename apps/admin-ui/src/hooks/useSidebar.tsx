import { useAtom } from 'jotai';
import { activeSidebarItem } from '../configs/constansts';

const useSidebar = () => {
  const [activeSidebar, setActiveSidebar] = useAtom(activeSidebarItem);
  return { activeSidebar, setActiveSidebar };
};

export default useSidebar;
