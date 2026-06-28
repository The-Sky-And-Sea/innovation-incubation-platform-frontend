import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  delayStep?: number;
  as?: ElementType;
}

interface AnimatedChildProps {
  className?: string;
  style?: CSSProperties;
}

export default function AnimatedList({
  children,
  className = "",
  itemClassName = "",
  delayStep = 48,
  as: Wrapper = "div",
}: AnimatedListProps) {
  return (
    <Wrapper className={`rb-animated-list ${className}`.trim()}>
      {Children.toArray(children).map((child, index) => {
        if (!isValidElement<AnimatedChildProps>(child)) return child;

        const classNames = [
          "rb-animated-list-item",
          itemClassName,
          child.props.className,
        ]
          .filter(Boolean)
          .join(" ");

        const style = {
          ...child.props.style,
          "--rb-list-delay": `${index * delayStep}ms`,
        } as CSSProperties;

        return cloneElement(child as ReactElement<AnimatedChildProps>, {
          className: classNames,
          style,
        });
      })}
    </Wrapper>
  );
}
