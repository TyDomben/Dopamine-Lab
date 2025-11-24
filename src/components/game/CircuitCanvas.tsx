import React, { useState, useRef } from 'react';
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
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleNodeDragStart = (nodeId: string, e: React.DragEvent) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggedNode(nodeId);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    });
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    onNodeMove(draggedNode, x, y);
    setDraggedNode(null);
  };

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

      const controlX = midX - dy * offset / Math.hypot(dx, dy);
      const controlY = midY + dx * offset / Math.hypot(dx, dy);

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
      className="relative w-full h-full bg-game-bg overflow-hidden"
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
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
          backgroundSize: '40px 40px',
        }}
      />

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

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-600">
            <div className="text-6xl mb-4">🧠</div>
            <div className="text-xl font-bold mb-2">Your Neural Circuit</div>
            <div className="text-sm">Add nodes from the sidebar to begin building</div>
          </div>
        </div>
      )}
    </div>
  );
};
