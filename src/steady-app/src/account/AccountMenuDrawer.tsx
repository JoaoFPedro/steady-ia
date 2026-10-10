import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { color, space } from '../theme/nocturne';
import { Avatar } from '../ui/Avatar';
import { AccountMenu } from './AccountMenu';
import { useAccountMenu } from './useAccountMenu';

const HEADER_AVATAR_SIZE = 32;

export type AccountMenuController = ReturnType<typeof useAccountMenu>;

/** Casca única do menu da conta, reutilizada pelas tabs que oferecem o avatar. */
export function AccountMenuDrawer({
  menu,
  children,
}: {
  menu: AccountMenuController;
  children: ReactNode;
}) {
  return (
    <Drawer
      open={menu.open}
      onOpen={() => menu.setOpen(true)}
      onClose={() => menu.setOpen(false)}
      drawerPosition="left"
      drawerType="front"
      drawerStyle={s.drawer}
      renderDrawerContent={() => (
        <AccountMenu
          account={menu.account}
          saindo={menu.saindo}
          falhouAoSair={menu.falhouAoSair}
          onSignOut={menu.sair}
        />
      )}
    >
      {children}
    </Drawer>
  );
}

/** Mesmo gatilho visível e acessível em todas as tabs com menu de conta. */
export function AccountMenuButton({ menu }: { menu: AccountMenuController }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir menu da conta"
      onPress={() => menu.setOpen(true)}
      hitSlop={space[3]}
    >
      <Avatar
        initial={menu.account.initial}
        photoUrl={menu.account.photoUrl}
        size={HEADER_AVATAR_SIZE}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  drawer: { backgroundColor: color.surface, width: '78%' },
});
