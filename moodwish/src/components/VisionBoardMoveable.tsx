import { useRef, useState, type MouseEvent } from "react";
import Moveable from "react-moveable";

type WishlistItem = {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  url: string | null;
  image_url: string | null;
  price: string | null;
  notes: string | null;
  vision_x: number | null;
  vision_y: number | null;
  vision_width: number | null;
  vision_height: number | null;
  vision_rotation: number | null;
  vision_z_index: number | null;
  show_label: boolean | null;
  show_price: boolean | null;
  position: number | null;
  created_at: string;
};

type VisionLayoutUpdate = {
  vision_x?: number;
  vision_y?: number;
  vision_width?: number;
  vision_height?: number;
  vision_rotation?: number;
  vision_z_index?: number;
};

type VisionBoardMoveableProps = {
  items: WishlistItem[];
  onUpdateLayout: (itemId: string, layout: VisionLayoutUpdate) => Promise<void>;
  onEdit: (item: WishlistItem) => void;
  onDelete: (itemId: string) => void;
};

function getDefaultX(item: WishlistItem, index: number) {
  return item.vision_x ?? 40 + (index % 4) * 190;
}

function getDefaultY(item: WishlistItem, index: number) {
  return item.vision_y ?? 40 + Math.floor(index / 4) * 190;
}

function getDefaultWidth(item: WishlistItem) {
  return item.vision_width ?? 240;
}

function getDefaultHeight(item: WishlistItem) {
  return item.vision_height ?? 280;
}

function getDefaultRotation(item: WishlistItem) {
  return item.vision_rotation ?? 0;
}

export default function VisionBoardMoveable({
  items,
  onUpdateLayout,
  onEdit,
  onDelete,
}: VisionBoardMoveableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selectedItem = items.find((item) => item.id === selectedId);

  const handleCardClick = (id: string, event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setSelectedId(id);
  };

  const handleCanvasClick = () => {
    setSelectedId(null);
  };

  const handleDrag = (event: any) => {
    if (!selectedId) return;

    const target = targetRefs.current[selectedId];
    if (!target) return;

    target.style.transform = event.transform;
  };

  const handleDragEnd = async (event: any) => {
    if (!selectedId) return;

    const itemIndex = items.findIndex((item) => item.id === selectedId);
    const item = items[itemIndex];
    if (!item) return;

    await onUpdateLayout(selectedId, {
      vision_x: Math.round(event.lastEvent?.translate[0] ?? getDefaultX(item, itemIndex)),
      vision_y: Math.round(event.lastEvent?.translate[1] ?? getDefaultY(item, itemIndex)),
    });
  };

  const handleResize = (event: any) => {
    if (!selectedId) return;

    const target = targetRefs.current[selectedId];
    if (!target) return;

    target.style.width = `${event.width}px`;
    target.style.height = `${event.height}px`;
    target.style.transform = event.drag.transform;
  };

  const handleResizeEnd = async (event: any) => {
    if (!selectedId) return;

    const itemIndex = items.findIndex((item) => item.id === selectedId);
    const item = items[itemIndex];
    if (!item) return;

    await onUpdateLayout(selectedId, {
      vision_width: Math.round(event.lastEvent?.width ?? getDefaultWidth(item)),
      vision_height: Math.round(event.lastEvent?.height ?? getDefaultHeight(item)),
      vision_x: Math.round(event.lastEvent?.drag.translate[0] ?? getDefaultX(item, itemIndex)),
      vision_y: Math.round(event.lastEvent?.drag.translate[1] ?? getDefaultY(item, itemIndex)),
    });
  };

  const handleRotate = (event: any) => {
    if (!selectedId) return;

    const target = targetRefs.current[selectedId];
    if (!target) return;

    target.style.transform = event.drag.transform;
  };

  const handleRotateEnd = async (event: any) => {
    if (!selectedId) return;

    const itemIndex = items.findIndex((item) => item.id === selectedId);
    const item = items[itemIndex];
    if (!item) return;

    await onUpdateLayout(selectedId, {
      vision_rotation: Math.round(event.lastEvent?.rotate ?? getDefaultRotation(item)),
      vision_x: Math.round(event.lastEvent?.drag.translate[0] ?? getDefaultX(item, itemIndex)),
      vision_y: Math.round(event.lastEvent?.drag.translate[1] ?? getDefaultY(item, itemIndex)),
    });
  };

  const handleOpenClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  const handleEditClick = (item: WishlistItem, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onEdit(item);
  };

  const handleDeleteClick = (itemId: string, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete(itemId);
  };

  return (
    <div className="moveable-board-container">
      <div className="moveable-board-canvas" onClick={handleCanvasClick}>
        {items.map((item, index) => {
          const x = getDefaultX(item, index);
          const y = getDefaultY(item, index);
          const width = getDefaultWidth(item);
          const height = getDefaultHeight(item);
          const rotation = getDefaultRotation(item);
          const zIndex = item.vision_z_index ?? index;
          const isSelected = selectedId === item.id;

          return (
            <div
              key={item.id}
              ref={(element) => {
                targetRefs.current[item.id] = element;
              }}
              className={`moveable-board-item ${
                isSelected ? "moveable-board-item-selected" : ""
              }`}
              onClick={(event) => handleCardClick(item.id, event)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: `${width}px`,
                height: `${height}px`,
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                zIndex: isSelected ? 9999 : zIndex,
              }}
            >
              <div className="moveable-board-item-content">
                <div className="moveable-board-card-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} draggable={false} />
                  ) : (
                    <div className="moveable-board-placeholder">
                      {item.title.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="moveable-board-card-content">
                  {item.show_label !== false && (
                    <h3 className="moveable-board-card-title">{item.title}</h3>
                  )}

                  {item.show_price !== false && item.price && (
                    <p className="moveable-board-card-price">{item.price}</p>
                  )}

                  {item.notes && (
                    <p className="moveable-board-card-notes">{item.notes}</p>
                  )}

                  <div className="moveable-board-controls">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleOpenClick}
                      >
                        Open
                      </a>
                    )}

                    <button onClick={(event) => handleEditClick(item, event)}>
                      Edit
                    </button>

                    <button onClick={(event) => handleDeleteClick(item.id, event)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {selectedId && selectedItem && targetRefs.current[selectedId] && (
          <Moveable
            target={targetRefs.current[selectedId]}
            draggable={true}
            resizable={true}
            rotatable={true}
            keepRatio={false}
            throttleDrag={0}
            throttleResize={0}
            throttleRotate={0}
            origin={false}
            padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onRotate={handleRotate}
            onRotateEnd={handleRotateEnd}
          />
        )}
      </div>
    </div>
  );
}