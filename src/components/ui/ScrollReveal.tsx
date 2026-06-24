import { Reveal } from "@/components/motion/Reveal";
import type { ComponentProps } from "react";

type ScrollRevealProps = Omit<ComponentProps<typeof Reveal>, "as"> & {
  /** @deprecated use direction on Reveal */
  direction?: "up" | "left" | "right" | "none";
};

/** Scroll-triggered reveal — animates when section enters viewport. */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const mapped =
    direction === "left"
      ? "left"
      : direction === "right"
        ? "right"
        : direction === "none"
          ? "none"
          : "up";

  return (
    <Reveal className={className} delay={delay} direction={mapped}>
      {children}
    </Reveal>
  );
}
