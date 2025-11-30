import React, { useState, useRef, useEffect } from 'react';
import type { Node, Connection } from '../../types/game';
import { NodeComponent } from './NodeComponent';

interface CircuitCanvasProps {
  nodes: Node[];
  connections: Connection[];
  selectedNode: string | null;
  hoveredNode: string | null;
  awarenessMode: boolean;
  onSelectNode: (nodeId: string | null) => void;
  onHoverNode: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
  zoom: number;
  panX: number;
  panY: number;
  onPan: (x: number, y: number) => void;
  onZoom?: (newZoom: number) => void;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  nodes,
  connections,
  selectedNode,
  hoveredNode,
  awarenessMode,
  onSelectNode,
  onHoverNode,
  onNodeMove,
  zoom,
  panX,
  panY,
  onPan,
  onZoom,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleNodeDragStart = (nodeId: string, e: React.DragEvent) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggedNode(nodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: (e.clientX - rect.left - panX) / zoom - node.position.x,
      y: (e.clientY - rect.top - panY) / zoom - node.position.y,
    });
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom - dragOffset.x;
    const y = (e.clientY - rect.top - panY) / zoom - dragOffset.y;

    onNodeMove(draggedNode, x, y);
    setDraggedNode(null);
  };

  // Pan controls with middle mouse button
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      onPan(e.clientX - panStart.x, e.clientY - panStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!onZoom) return;

    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3.0, zoom * zoomDelta));
    onZoom(newZoom);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderConnections = () => {
    return connections.map(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);

      if (!fromNode || !toNode) return null;

      // Calculate connection points (center of nodes)
      const x1 = fromNode.position.x + 80; // Half of node width
      const y1 = fromNode.position.y + 40; // Approximate center
      const x2 = toNode.position.x + 80;
      const y2 = toNode.position.y + 40;

      // Create a curved path
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const offset = 30;

      const controlX = midX - (dy * offset) / Math.hypot(dx, dy);
      const controlY = midY + (dx * offset) / Math.hypot(dx, dy);

      return (
        <g key={connection.id}>
          {/* Connection path */}
          <path
            d={`M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`}
            className={connection.isActive ? 'connection-line-active' : 'connection-line'}
          />

          {/* Animated particle along connection */}
          {connection.isActive && (
            <circle r="3" fill="#00d9ff" className="animate-pulse">
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path={`M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`}
              />
            </circle>
          )}

          {/* Arrow head */}
          <polygon
            points={`${x2},${y2} ${x2 - 8},${y2 - 5} ${x2 - 8},${y2 + 5}`}
            fill="#00d9ff"
            opacity="0.6"
          />
        </g>
      );
    });
  };

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full bg-game-bg overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={(e) => {
        // Deselect node when clicking on empty canvas
        if (e.target === canvasRef.current) {
          onSelectNode(null);
        }
      }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          backgroundPosition: `${panX}px ${panY}px`,
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      />

      {/* Transformable container for zoom and pan */}
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}
      >
        {/* SVG layer for connections */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {renderConnections()}
        </svg>

        {/* Nodes layer */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          {nodes.map(node => (
            <NodeComponent
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              isHovered={hoveredNode === node.id}
              awarenessMode={awarenessMode}
              onSelect={() => onSelectNode(node.id)}
              onHover={(hover) => onHoverNode(hover ? node.id : null)}
              onDragStart={(e) => handleNodeDragStart(node.id, e)}
              onDragEnd={() => setDraggedNode(null)}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-600">
            <div className="text-6xl mb-4">🧠</div>
            <div className="text-xl font-bold mb-2">Your Neural Circuit</div>
            <div className="text-sm">Add nodes from the sidebar to begin building</div>
            <div className="text-xs mt-4 italic">
              Middle-click or Space+drag to pan • Scroll to zoom
            </div>
          </div>
        </div>
      )}

      {/* Pan hint */}
      {isPanning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-game-cyan/90 text-black px-4 py-2 rounded-lg font-bold text-sm">
          🤚 Panning...
        </div>
      )}
    </div>
  );
};
