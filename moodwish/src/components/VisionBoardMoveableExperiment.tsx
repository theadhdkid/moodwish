import { useRef, useState } from "react";
import Moveable from "react-moveable";

type MockProduct = {
  id: string;
  title: string;
  price: string;
  image_url: string;
  link: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "mock-1",
    title: "Wireless Headphones",
    price: "$199.99",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    link: "https://example.com/headphones",
    x: 40,
    y: 40,
    width: 240,
    height: 280,
    rotation: 0,
  },
  {
    id: "mock-2",
    title: "Smart Watch",
    price: "$349.99",
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    link: "https://example.com/watch",
    x: 320,
    y: 40,
    width: 240,
    height: 280,
    rotation: 0,
  },
  {
    id: "mock-3",
    title: "Camera Lens",
    price: "$899.99",
    image_url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
    link: "https://example.com/lens",
    x: 600,
    y: 40,
    width: 240,
    height: 280,
    rotation: 0,
  },
  {
    id: "mock-4",
    title: "Running Sneakers",
    price: "$129.99",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    link: "https://example.com/sneakers",
    x: 40,
    y: 360,
    width: 240,
    height: 280,
    rotation: 0,
  },
  {
    id: "mock-5",
    title: "Coffee Maker",
    price: "$249.99",
    image_url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=400&fit=crop",
    link: "https://example.com/coffee",
    x: 320,
    y: 360,
    width: 240,
    height: 280,
    rotation: 0,
  },
];

export default function VisionBoardMoveableExperiment() {
  const [products, setProducts] = useState<MockProduct[]>(MOCK_PRODUCTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const targetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const selectedProduct = products.find((p) => p.id === selectedId);

  const handleCardClick = (id: string, event: React.MouseEvent) => {
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

  const handleDragEnd = (e: any) => {
    if (!selectedId) return;
    
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? {
              ...p,
              x: e.lastEvent?.translate[0] ?? p.x,
              y: e.lastEvent?.translate[1] ?? p.y,
            }
          : p
      )
    );
  };

  const handleResize = (e: any) => {
    if (!selectedId) return;
    const target = targetRefs.current[selectedId];
    if (!target) return;

    target.style.width = `${e.width}px`;
    target.style.height = `${e.height}px`;
    target.style.transform = e.drag.transform;
  };

  const handleResizeEnd = (e: any) => {
    if (!selectedId) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? {
              ...p,
              width: e.lastEvent?.width ?? p.width,
              height: e.lastEvent?.height ?? p.height,
              x: e.lastEvent?.drag.translate[0] ?? p.x,
              y: e.lastEvent?.drag.translate[1] ?? p.y,
            }
          : p
      )
    );
  };

  const handleRotate = (e: any) => {
    if (!selectedId) return;
    const target = targetRefs.current[selectedId];
    if (!target) return;

    target.style.transform = e.drag.transform;
  };

  const handleRotateEnd = (e: any) => {
    if (!selectedId) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? {
              ...p,
              rotation: e.lastEvent?.rotate ?? p.rotation,
              x: e.lastEvent?.drag.translate[0] ?? p.x,
              y: e.lastEvent?.drag.translate[1] ?? p.y,
            }
          : p
      )
    );
  };

  return (
    <div className="moveable-experiment-container">
      <div className="moveable-experiment-info">
        <p className="muted">
          React-moveable experiment with mock data. Click a card to select, then drag, resize, or rotate it. Click the background to deselect.
        </p>
      </div>

      <div 
        className="moveable-experiment-canvas"
        onClick={handleCanvasClick}
      >
        {products.map((product) => (
          <div
            key={product.id}
            ref={(el) => {
              targetRefs.current[product.id] = el;
            }}
            className={`moveable-experiment-card ${
              selectedId === product.id ? "moveable-experiment-card-selected" : ""
            }`}
            onClick={(e) => handleCardClick(product.id, e)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${product.width}px`,
              height: `${product.height}px`,
              transform: `translate(${product.x}px, ${product.y}px) rotate(${product.rotation}deg)`,
            }}
          >
            <div className="moveable-experiment-card-image">
              <img src={product.image_url} alt={product.title} />
            </div>
            <div className="moveable-experiment-card-content">
              <h3 className="moveable-experiment-card-title">{product.title}</h3>
              <p className="moveable-experiment-card-price">{product.price}</p>
              <a 
                href={product.link} 
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                View product
              </a>
            </div>
          </div>
        ))}

        {selectedId && selectedProduct && (
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
