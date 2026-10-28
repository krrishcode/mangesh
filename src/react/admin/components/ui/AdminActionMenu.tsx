import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { DropdownMenu } from "radix-ui";
import { AdminIcon } from "./AdminIcon";
import { useAdminTheme } from "./admin-theme-context";

function menuItems(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{
      children?: ReactNode;
      disabled?: boolean;
      className?: string;
      onClick?: () => void;
    }>;
    if (element.type === "button" || element.type === "a")
      return (
        <DropdownMenu.Item asChild disabled={element.props.disabled}>
          {element}
        </DropdownMenu.Item>
      );
    if (typeof element.type !== "string" && element.type !== Fragment)
      return element;
    return cloneElement(element, {
      children: menuItems(element.props.children),
    });
  });
}
export function AdminActionMenu({
  label,
  children,
  trigger,
  side = "bottom",
}: {
  label: string;
  children: ReactNode;
  trigger?: ReactElement;
  side?: "top" | "bottom";
}) {
  const { portal } = useAdminTheme();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerInside = useRef(false);
  const keyboard = useRef(false);
  const hoverOpened = useRef(false);
  const pinned = useRef(false);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const leave = () => {
    clear();
    timer.current = setTimeout(() => {
      if (!pointerInside.current && !keyboard.current && !pinned.current)
        setOpen(false);
    }, 220);
  };
  useEffect(() => () => clear(), []);
  return (
    <DropdownMenu.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          keyboard.current = false;
          hoverOpened.current = false;
          pinned.current = false;
          clear();
        }
      }}
      modal={false}
    >
      <DropdownMenu.Trigger
        asChild
        onKeyDown={() => {
          keyboard.current = true;
        }}
        onPointerEnter={(event) => {
          pointerInside.current = true;
          clear();
          if (event.pointerType === "mouse" && !open) {
            hoverOpened.current = true;
            setOpen(true);
          }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          pinned.current = true;
          clear();
          if (hoverOpened.current) {
            event.preventDefault();
            hoverOpened.current = false;
            setOpen(true);
          }
        }}
        onPointerLeave={() => {
          pointerInside.current = false;
          leave();
        }}
      >
        {trigger ?? (
          <button
            type="button"
            className="admin-icon-button admin-action-trigger"
            aria-label={label}
          >
            <AdminIcon name="more" />
          </button>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={portal}>
        <DropdownMenu.Content
          className="admin-action-menu-content"
          align="end"
          side={side}
          sideOffset={5}
          collisionPadding={12}
          onPointerEnter={() => {
            pointerInside.current = true;
            clear();
          }}
          onPointerLeave={() => {
            pointerInside.current = false;
            leave();
          }}
          onKeyDown={() => {
            keyboard.current = true;
          }}
        >
          {menuItems(children)}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
