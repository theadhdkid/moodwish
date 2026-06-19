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

type VisionBoardMoveableProps = {
  items: WishlistItem[];
  onUpdateLayout: (
    itemId: string,
    layout: {
      vision_x?: number;
      vision_y?: number;
      vision_width?: number;
      vision_height?: number;
      vision_rotation?: number;
      vision_z_index?: number;
    }
  ) => Promise<void>;
  onEdit: (item: WishlistItem) => void;
  onDelete: (itemId: string) => void;
};

export default function VisionBoardMoveable({
  items,
  onUpdateLayout,
  onEdit,
  onDelete,
}: VisionBoardMoveableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const targetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleCardClick = (id: string, event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setSelectedId(id);
  };

  const handleCanvasClick = () => {
    setSelectedId(null);
  };

  const handleDrag = (e: any) => {
    if (!selectedId) return;
    const target = targetRefs.current[selectedId];
    if (!target) return;
    
    target.style.transform = e.transform;
  };

  const handleDragEnd = async (e: any) => {
    if (!selectedId) return;
    
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;

    const newX = e.lastEvent?.translate[0] ?? item.vision_x ?? 0;
    const newY = e.lastEvent?.translate[1] ?? item.vision_y ?? 0;

    await onUpdateLayout(selectedId, {
      vision_x: Math.round(newX),
      vision_y: Math.round(newY),
    });
  };

  const handleResize = (e: any) => {
    if (!selectedId) return;
    const target = targetRefs.current[selectedId];
    if (!target) return;

    target.style.width = `${e.width}px`;
    target.style.height = `${e.height}px`;
    target.style.transform = e.drag.transform;
  };

  const handleResizeEnd = async (e: any) => {
    if (!selectedId) return;

    const item = items.find((i) => i.id === selectedId);
    if (!item) return;

    await onUpdateLayout(selectedId, {
      vision_width: Math.round(e.lastEvent?.width ?? item.vision_width ?? 220),
      vision_height: Math.round(e.lastEvent?.height ?? item.vision_height ?? 220),
      vision_x: Math.round(e.lastEvent?.drag.translate[0] ?? item.vision_x ?? 0),
      vision_y: Math.round(e.lastEvent?.drag.translate[1] ?? item.vision_y ?? 0),
    });
  };

  const handleRotate = (e: any) => {
    if (!selectedId) return;
    const target = targetRefs.current[selectedId];
    if (!target) return;

    target.style.transform = e.drag.transform;
  };

  const handleRotateEnd = async (e: any) => {
    if (!selectedId) return;

    const item = items.find((i) => i.id === selectedId);
    if (!item) return;

    await onUpdateLayout(selectedId, {
      vision_rotation: Math.round(e.lastEvent?.rotate ?? item.vision_rotation ?? 0),
      vision_x: Math.round(e.lastEvent?.drag.translate[0] ?? item.vision_x ?? 0),
      vision_y: Math.round(e.lastEvent?.drag.translate[1] ?? item.vision_y ?? 0),
    });
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
      <div 
        className="moveable-board-canvas"
        onClick={handleCanvasClick}
      >
        {items.map((item, index) => {
          const x = item.vision_x ?? 40 + (index % 4) * 190;
          const y = item.vision_y ?? 40 + Math.floor(index / 4) * 190;
          const width = item.vision_width ?? 220;
          const height = item.vision_height ?? 220;
          const rotation = item.vision_rotation ?? 0;
          const zIndex = item.vision_z_index ?? index;

          return (
            <div
              key={item.id}
              ref={(el) => {
                targetRefs.current[item.id] = el;
              }}
              className={`moveable-board-item ${
                selectedId === item.id ? "moveable-board-item-selected" : ""
              }`}
              onClick={(e) => handleCardClick(item.id, e)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: `${width}px`,
                height: `${height}px`,
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                zIndex: selectedId === item.id ? 9999 : zIndex,
              }}
            >
              <div className="moveable-board-item-content">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} />
                    ) : (
                      <div className="moveable-board-placeholder">
                        {item.title.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </a>
                ) : item.image_url ? (
                  <img src={item.image_url} alt={item.title} />
                ) : (
                  <div className="moveable-board-placeholder">
                    {item.title.slice(0, 1).toUpperCase()}
                  </div>
                )}

                {item.show_label !== false && (
                  <div className="moveable-board-label">
                    <span>{item.title}</span>
                  </div>
                )}

                <div className="moveable-board-controls">
                  <button onClick={(e) => handleEditClick(item, e)}>Edit</button>
                  <button onClick={(e) => handleDeleteClick(item.id, e)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}

        {selectedId && (
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
