import React, { useState, ReactNode } from "react";
import clsx from "clsx";
import { usePopper } from "react-popper";
import { createPortal } from "react-dom";

interface ClickToViewProps {
  openNode: ReactNode;
  closeNode: ReactNode;
  cellContents: ReactNode;
}

function ClickToView({ openNode, closeNode, cellContents }: ClickToViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reference, setReference] = useState<HTMLDivElement | null>(null);
  const [popper, setPopper] = useState<HTMLDivElement | null>(null);
  const { styles } = usePopper(reference, popper, {
    placement: "bottom-start",
    modifiers: [{ name: "offset", options: { offset: [0, 10] } }],
  });

  const clickToViewClasses = clsx(
    "flex justify-between h-full items-center flex-col",
  );

  const actionButtonClasses = clsx("flex-1 text-center");

  function toggle() {
    setIsOpen(!isOpen);
  }

  return (
    <div className={clickToViewClasses}>
      <div ref={setReference} className={actionButtonClasses} onClick={toggle}>
        {isOpen ? closeNode : openNode}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={setPopper}
            className="max-w-full bg-white border p-5"
            style={styles.popper}
          >
            <span>{cellContents}</span>
          </div>,
          document.body,
        )}
    </div>
  );
}

export function ClickToViewFormatter({
  openNode,
  closeNode,
  cellContents,
}: ClickToViewProps) {
  return (
    <ClickToView
      openNode={openNode}
      closeNode={closeNode}
      cellContents={cellContents}
    />
  );
}
