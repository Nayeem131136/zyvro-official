import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";

export interface SortableImage {
  id: string;
  url: string;
}

export function SortableImageGrid({
  items,
  onChange,
  onRemove,
}: {
  items: SortableImage[];
  onChange: (next: SortableImage[]) => void;
  onRemove: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onChange(arrayMove(items, oldIdx, newIdx));
  }

  if (items.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {items.map((img) => (
            <SortableTile key={img.id} img={img} onRemove={() => onRemove(img.id)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableTile({ img, onRemove }: { img: SortableImage; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 0,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square border overflow-hidden group ${
        isDragging ? "border-[color:var(--gold)] shadow-lg" : "border-white/10"
      }`}
    >
      <img src={img.url} alt="" className="h-full w-full object-cover pointer-events-none" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 h-6 w-6 grid place-items-center bg-black/70 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 h-6 w-6 grid place-items-center bg-black/70 opacity-0 group-hover:opacity-100 hover:bg-red-500/80"
        aria-label="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
